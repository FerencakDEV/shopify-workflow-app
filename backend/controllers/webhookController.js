require('dotenv').config();
const axios = require('axios');
const Order = require('../models/Order');
const { cleanOrder } = require('../controllers/cleanOrder');
const PendingUpdate = require('../models/PendingUpdate');

const { SHOPIFY_API_URL, SHOPIFY_TOKEN } = process.env;

const HEADERS = {
  'X-Shopify-Access-Token': SHOPIFY_TOKEN,
  'Content-Type': 'application/json',
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchMetafields = async (orderId) => {
  try {
    const url = `${SHOPIFY_API_URL}/orders/${orderId}/metafields.json`;
    const res = await axios.get(url, { headers: HEADERS });
    return res.data.metafields || [];
  } catch (err) {
    console.warn(`⚠️ Metafields fetch failed for Order ${orderId}: ${err.message}`);
    return [];
  }
};

const fetchMetafieldsWithRetry = async (orderId, attempts = 5, delayMs = 3000) => {
  for (let i = 0; i < attempts; i++) {
    const metafields = await fetchMetafields(orderId);
    if (metafields.length) return metafields;
    console.log(`⏳ Metafields not ready for ${orderId}, attempt ${i + 1}/${attempts}`);
    await delay(delayMs);
  }
  return [];
};

const fetchFullOrder = async (id) => {
  try {
    const url = `${SHOPIFY_API_URL}/orders/${id}.json`;
    const res = await axios.get(url, { headers: HEADERS });
    return res.data.order;
  } catch (err) {
    console.error(`❌ Failed to fetch full order ${id}: ${err.message}`);
    return null;
  }
};

const fetchWithRetry = async (id, maxAttempts = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const fullOrder = await fetchFullOrder(id);
    const metafields = await fetchMetafieldsWithRetry(id);
    if (fullOrder) {
      return { fullOrder, metafields };
    }
    console.log(`⏳ [${attempt}/${maxAttempts}] Waiting for full order data of ${id}...`);
    await delay(delayMs);
  }
  return { fullOrder: null, metafields: [] };
};

const applyFallbackFulfillmentStatus = (cleaned) => {
  if (!cleaned.fulfillment_status) {
    const status = cleaned.custom_status?.toLowerCase() || '';
    if (status.includes('cancelled')) cleaned.fulfillment_status = 'fulfilled';
    else if (status.includes('ready for pickup')) cleaned.fulfillment_status = 'ready for pickup';
    else if (status.includes('on hold')) cleaned.fulfillment_status = 'on hold';
    else cleaned.fulfillment_status = 'unfulfilled';
  }
};

// ✅ CREATE webhook
const orderCreated = async (req, res) => {
  const webhookOrder = req.body;
  console.log('📦 Webhook – CREATE received:', webhookOrder.name || webhookOrder.id);

  try {
    const existing = await Order.findOne({ id: webhookOrder.id });
    if (existing) {
      console.log(`⏭️ CREATE: Order ${webhookOrder.name || webhookOrder.id} already exists – skipping.`);
      return res.status(200).send('Already exists');
    }

    let { fullOrder, metafields } = await fetchWithRetry(webhookOrder.id);
    
    if (!fullOrder || !metafields.length) {
      console.warn(`❗ Delayed retry for webhook order ${webhookOrder.id}`);
      await delay(10000); // dodatočné čakanie pre Flow
      fullOrder = await fetchFullOrder(webhookOrder.id);
      metafields = await fetchMetafields(webhookOrder.id);
    }

    if (!fullOrder) return res.status(500).send('Failed to fetch full order after delay');

    const cleaned = cleanOrder(fullOrder, metafields);
    if (!cleaned.custom_status) {
      console.warn(`⚠️ cleanOrder: custom_status_meta is empty for order ${cleaned.id}`);
    }

    applyFallbackFulfillmentStatus(cleaned);
    await Order.create(cleaned);
    console.log(`✅ CREATE: Order ${cleaned.name || cleaned.id} added.`);
    res.status(200).send('CREATE OK');
  } catch (err) {
    console.error(`❌ CREATE ERROR – ${webhookOrder.name || webhookOrder.id}: ${err.message}`);
    res.status(500).send('CREATE Error');
  }
};

const orderUpdated = async (req, res) => {
  const webhookOrder = req.body;
  const orderId = webhookOrder.id;

  console.log('🔁 Webhook – UPDATE received:', webhookOrder.name || orderId);

  try {
    // ⏳ 1. Prvé fetchovanie s retry logikou (5 pokusov po 3s)
    const { fullOrder, metafields } = await fetchWithRetry(orderId, 5, 3000);

    // ❌ 2. Ak objednávka sa nepodarí načítať ani po retry
    if (!fullOrder) {
      console.error(`❌ UPDATE: Full order ${orderId} not available`);
      return res.status(500).send('Failed to fetch full order');
    }

    // 📭 3. Ak metafields sú stále prázdne → druhý (oneskorený) pokus
    if (metafields.length === 0) {
      console.warn(`📭 Metafields empty for ${orderId}, retrying after 10s...`);
      await delay(10000);
      const retryMetafields = await fetchMetafields(orderId);

      if (retryMetafields.length === 0) {
        console.warn(`📭 Still empty – adding ${orderId} to PendingUpdates`);
        await PendingUpdate.updateOne(
          { orderId },
          { orderId, receivedAt: new Date() },
          { upsert: true }
        );
        return res.status(200).send('UPDATE deferred – metafields missing');
      }

      metafields.push(...retryMetafields); // nahradíme prázdny zoznam
    }

    // ✅ 4. Clean + fallback
    console.log('🧼 Volám cleanOrder...');
    const cleaned = cleanOrder(fullOrder, metafields);

    if (!cleaned.custom_status) {
      console.warn(`⚠️ cleanOrder: custom_status_meta is empty for order ${cleaned.id}`);
    }

    applyFallbackFulfillmentStatus(cleaned);

    // 🧩 5. Záznam v databáze
    const existing = await Order.findOne({ id: cleaned.id });

    if (!existing) {
      await Order.create(cleaned);
      console.log(`✅ UPDATE created new order ${cleaned.name || cleaned.id}`);
      return res.status(200).send('UPDATE → Created new');
    }

    // 🕵️‍♂️ 6. Porovnanie kľúčových polí
    const changedFields = [];

    const compareField = (fieldName) => {
      const existingVal = JSON.stringify(existing[fieldName]);
      const cleanedVal = JSON.stringify(cleaned[fieldName]);
      if (existingVal !== cleanedVal) {
        changedFields.push(fieldName);
        console.log(`🔁 Changed ${fieldName}:`);
        console.log(`   🕒 from:`, existing[fieldName]);
        console.log(`   🆕 to  :`, cleaned[fieldName]);
      }
    };

    [
      'assignee',
      'progress',
      'order_number',
      'fulfillment_status',
      'custom_status',
      'expected_time',
      'note',
      'is_urgent'
    ].forEach(compareField);

    // 💾 7. Uloženie zmien, ak sú
    if (changedFields.length) {
      await Order.updateOne({ id: cleaned.id }, { $set: cleaned });
      console.log(`✅ UPDATE modified order ${cleaned.name || cleaned.id}. Changed: ${changedFields.join(', ')}`);
    } else {
      console.log(`⏭️ UPDATE skipped – no changes for ${cleaned.name || cleaned.id}`);
    }

    res.status(200).send('UPDATE OK');
  } catch (err) {
    console.error(`❌ UPDATE ERROR – ${orderId}: ${err.message}`);
    res.status(500).send('UPDATE Error');
  }
};






module.exports = { orderCreated, orderUpdated };
