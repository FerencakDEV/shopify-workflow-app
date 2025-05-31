require('dotenv').config();
const axios = require('axios');
const Order = require('../models/Order');
const { cleanOrder } = require('../controllers/cleanOrder');

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

const fetchWithRetry = async (id, maxAttempts = 3, delayMs = 2000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const fullOrder = await fetchFullOrder(id);
    const metafields = await fetchMetafields(id);

    if (fullOrder) {
      return { fullOrder, metafields };
    }

    console.log(`⏳ [${attempt}/${maxAttempts}] Waiting for full data of ${id}...`);
    await delay(delayMs);
  }

  console.warn(`⚠️ Failed to fetch full order data for ${id}`);
  return { fullOrder: null, metafields: [] };
};

const resolveFallbackFulfillment = (order, cleanedOrder) => {
  if (!cleanedOrder.fulfillment_status || cleanedOrder.fulfillment_status === 'null') {
    const status = cleanedOrder.order_status?.toLowerCase();
    if (status === 'cancelled') {
      cleanedOrder.fulfillment_status = 'fulfilled';
    } else if (['onhold', 'ready for pickup'].includes(status)) {
      cleanedOrder.fulfillment_status = status;
    } else {
      cleanedOrder.fulfillment_status = 'unfulfilled';
    }
  }
};

// CREATE webhook
const orderCreated = async (req, res) => {
  const webhookOrder = req.body;
  console.log('📦 Webhook – CREATE received:', webhookOrder.name || webhookOrder.id);

  try {
    const existing = await Order.findOne({ id: webhookOrder.id });
    if (existing) {
      console.log(`⏭️ CREATE: Order ${webhookOrder.name || webhookOrder.id} already exists – skipping.`);
      return res.status(200).send('Already exists');
    }

    const { fullOrder, metafields } = await fetchWithRetry(webhookOrder.id);
    if (!fullOrder) return res.status(500).send('Failed to fetch full order');

    const cleanedOrder = await cleanOrder(fullOrder, metafields);
    resolveFallbackFulfillment(fullOrder, cleanedOrder);

    await Order.create(cleanedOrder);
    console.log(`✅ CREATE: Order ${cleanedOrder.name || cleanedOrder.id} added.`);
    res.status(200).send('CREATE OK');
  } catch (err) {
    console.error(`❌ CREATE ERROR – ${webhookOrder.name || webhookOrder.id}: ${err.message}`);
    res.status(500).send('CREATE Error');
  }
};

// UPDATE webhook
const orderUpdated = async (req, res) => {
  const webhookOrder = req.body;
  console.log('🔁 Webhook – UPDATE received:', webhookOrder.name || webhookOrder.id);

  try {
    const existing = await Order.findOne({ id: webhookOrder.id });

    if (!existing) {
      console.log(`➕ UPDATE: Order ${webhookOrder.name || webhookOrder.id} not found – creating new.`);
    } else {
      const isDifferent = [
        'order_number',
        'fulfillment_status',
        'assignee_1', 'assignee_2', 'assignee_3', 'assignee_4',
        'progress_1', 'progress_2', 'progress_3', 'progress_4',
      ].some(field => existing[field] !== webhookOrder[field]);

      if (!isDifferent) {
        console.log(`⏭️ UPDATE: Order ${webhookOrder.name || webhookOrder.id} has no relevant changes – skipping.`);
        return res.status(200).send('No changes');
      }
    }

    const { fullOrder, metafields } = await fetchWithRetry(webhookOrder.id);
    if (!fullOrder) return res.status(500).send('Failed to fetch full order');

    const cleanedOrder = await cleanOrder(fullOrder, metafields);
    resolveFallbackFulfillment(fullOrder, cleanedOrder);

    await Order.updateOne(
      { id: cleanedOrder.id },
      { $set: cleanedOrder },
      { upsert: true }
    );

    console.log(`✅ UPDATE: Order ${cleanedOrder.name || cleanedOrder.id} updated.`);
    res.status(200).send('UPDATE OK');
  } catch (err) {
    console.error(`❌ UPDATE ERROR – ${webhookOrder.name || webhookOrder.id}: ${err.message}`);
    res.status(500).send('UPDATE Error');
  }
};

module.exports = { orderCreated, orderUpdated };
