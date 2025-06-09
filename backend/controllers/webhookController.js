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

// 🔧 Shared fallback logic
const applyFallbackFulfillmentStatus = (cleaned) => {
  if (!cleaned.fulfillment_status || cleaned.fulfillment_status === 'null') {
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

    const { fullOrder, metafields } = await fetchWithRetry(webhookOrder.id);
    if (!fullOrder) return res.status(500).send('Failed to fetch full order');

    const cleaned = cleanOrder(fullOrder, metafields);
    applyFallbackFulfillmentStatus(cleaned);

    await Order.create(cleaned);
    console.log(`✅ CREATE: Order ${cleaned.name || cleaned.id} added.`);
    res.status(200).send('CREATE OK');
  } catch (err) {
    console.error(`❌ CREATE ERROR – ${webhookOrder.name || webhookOrder.id}: ${err.message}`);
    res.status(500).send('CREATE Error');
  }
};

// 🔁 UPDATE webhook
const orderUpdated = async (req, res) => {
  const webhookOrder = req.body;
  console.log('🔁 Webhook – UPDATE received:', webhookOrder.name || webhookOrder.id);

  try {
    const { fullOrder, metafields } = await fetchWithRetry(webhookOrder.id);
    if (!fullOrder) return res.status(500).send('Failed to fetch full order');

    const cleaned = cleanOrder(fullOrder, metafields);
    applyFallbackFulfillmentStatus(cleaned);

    const existing = await Order.findOne({ id: cleaned.id });

    if (!existing) {
      await Order.create(cleaned);
      console.log(`✅ UPDATE created new order ${cleaned.name || cleaned.id}`);
      return res.status(200).send('UPDATE → Created new');
    }

    const changed =
      JSON.stringify(existing.assignee) !== JSON.stringify(cleaned.assignee) ||
      JSON.stringify(existing.progress) !== JSON.stringify(cleaned.progress) ||
      existing.order_number !== cleaned.order_number ||
      existing.fulfillment_status !== cleaned.fulfillment_status ||
      existing.custom_status !== cleaned.custom_status;

    if (changed) {
      await Order.updateOne({ id: cleaned.id }, { $set: cleaned });
      console.log(`🔄 UPDATE modified order ${cleaned.name || cleaned.id}`);
    } else {
      console.log(`⏭️ UPDATE skipped – no changes for ${cleaned.name || cleaned.id}`);
    }

    res.status(200).send('UPDATE OK');
  } catch (err) {
    console.error(`❌ UPDATE ERROR – ${webhookOrder.name || webhookOrder.id}: ${err.message}`);
    res.status(500).send('UPDATE Error');
  }
};

module.exports = { orderCreated, orderUpdated };
