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
    let { fullOrder, metafields } = await fetchWithRetry(orderId, 5, 3000);

    if (!fullOrder) {
      console.error(`❌ UPDATE: Full order ${orderId} not available`);
      return res.status(500).send('Failed to fetch full order');
    }

    if (!metafields.length) {
      console.warn(`📭 Metafields missing for ${orderId} → deferring`);
      await PendingUpdate.updateOne(
        { orderId },
        { orderId, receivedAt: new Date(), reason: 'empty-metafields' },
        { upsert: true }
      );
      return res.status(200).send('Deferred – metafields missing');
    }

    const cleaned = cleanOrder(fullOrder, metafields);

    if (!cleaned.custom_status || cleaned.custom_status === 'New Order') {
      console.warn(`⚠️ custom_status empty → deferring ${orderId}`);
      await PendingUpdate.updateOne(
        { orderId },
        { orderId, receivedAt: new Date(), reason: 'empty-custom-status' },
        { upsert: true }
      );
      return res.status(200).send('Deferred – custom_status missing');
    }

    const existing = await Order.findOne({ id: cleaned.id });

    if (!existing) {
      await Order.create(cleaned);
      console.log(`✅ UPDATE → new order ${cleaned.name}`);
      return res.status(200).send('Created new');
    }

    await Order.updateOne({ id: cleaned.id }, { $set: cleaned });
    console.log(`✅ UPDATE → modified order ${cleaned.name}`);
    res.status(200).send('Updated existing');
  } catch (err) {
    console.error(`❌ UPDATE ERROR – ${orderId}: ${err.message}`);
    res.status(500).send('Webhook error');
  }
};







module.exports = { orderCreated, orderUpdated };
