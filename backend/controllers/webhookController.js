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

    const hasFulfillment = fullOrder?.fulfillment_status !== null;
    const hasMetafields = metafields?.length > 0;

    if (hasFulfillment && hasMetafields) {
      return { fullOrder, metafields };
    }

    console.log(`⏳ [${attempt}/${maxAttempts}] Čakám na dáta pre ${fullOrder?.name || id}...`);
    await delay(delayMs);
  }

  console.warn(`⚠️ Nepodarilo sa získať kompletné dáta pre objednávku ${id}`);
  return { fullOrder: null, metafields: [] };
};

// CREATE webhook
const orderCreated = async (req, res) => {
  const webhookOrder = req.body;
  console.log('📦 Webhook – CREATE prijatý:', webhookOrder.name || webhookOrder.id);

  try {
    const existing = await Order.findOne({ id: webhookOrder.id });
    if (existing) {
      console.log(`⏭️ CREATE: Objednávka ${webhookOrder.name || webhookOrder.id} už existuje – preskakuje sa.`);
      return res.status(200).send('Already exists');
    }

    const { fullOrder, metafields } = await fetchWithRetry(webhookOrder.id, 3, 2000);
    if (!fullOrder) return res.status(500).send('Failed to fetch full order');

    const cleanedOrder = await cleanOrder(fullOrder, metafields);
    await Order.create(cleanedOrder);

    console.log(`✅ CREATE: Objednávka ${cleanedOrder.name || cleanedOrder.id} bola pridaná.`);
    res.status(200).send('CREATE OK');
  } catch (err) {
    console.error(`❌ CREATE ERROR – ${webhookOrder.name || webhookOrder.id}: ${err.message}`);
    res.status(500).send('CREATE Error');
  }
};

// UPDATE webhook
const orderUpdated = async (req, res) => {
  const webhookOrder = req.body;
  console.log('🔁 Webhook – UPDATE prijatý:', webhookOrder.name || webhookOrder.id);

  try {
    const existing = await Order.findOne({ id: webhookOrder.id });

    if (existing) {
      const dbTime = new Date(existing.updated_at).getTime();
      const apiTime = new Date(webhookOrder.updated_at).getTime();
      if (dbTime === apiTime) {
        console.log(`⏭️ UPDATE: Objednávka ${webhookOrder.name || webhookOrder.id} sa nezmenila – preskakuje sa.`);
        return res.status(200).send('No changes');
      }
    }

    const { fullOrder, metafields } = await fetchWithRetry(webhookOrder.id, 3, 2000);
    if (!fullOrder) return res.status(500).send('Failed to fetch full order');

    const cleanedOrder = await cleanOrder(fullOrder, metafields);
    await Order.updateOne(
      { id: cleanedOrder.id },
      { $set: cleanedOrder },
      { upsert: true }
    );

    console.log(`✅ UPDATE: Objednávka ${cleanedOrder.name || cleanedOrder.id} bola aktualizovaná.`);
    res.status(200).send('UPDATE OK');
  } catch (err) {
    console.error(`❌ UPDATE ERROR – ${webhookOrder.name || webhookOrder.id}: ${err.message}`);
    res.status(500).send('UPDATE Error');
  }
};

module.exports = { orderCreated, orderUpdated };
