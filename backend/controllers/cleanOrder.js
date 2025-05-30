require('dotenv').config();
const axios = require('axios');
const Order = require('../models/Order');
const { cleanOrder } = require('./cleanOrder');

const { SHOPIFY_API_URL, SHOPIFY_TOKEN } = process.env;

const HEADERS = {
  'X-Shopify-Access-Token': SHOPIFY_TOKEN,
  'Content-Type': 'application/json',
};

const fetchMetafields = async (orderId) => {
  try {
    const res = await axios.get(`${SHOPIFY_API_URL}/orders/${orderId}/metafields.json`, { headers: HEADERS });
    return res.data.metafields || [];
  } catch (err) {
    console.warn(`⚠️ Metafields fetch failed for Order ${orderId}: ${err.message}`);
    return [];
  }
};

const fetchFullOrder = async (orderId) => {
  try {
    const res = await axios.get(`${SHOPIFY_API_URL}/orders/${orderId}.json`, { headers: HEADERS });
    return res.data.order;
  } catch (err) {
    console.error(`❌ Failed to fetch full order ${orderId}: ${err.message}`);
    return null;
  }
};

// CREATE Webhook
const orderCreated = async (req, res) => {
  const { id, name } = req.body;
  console.log('📦 Webhook – CREATE prijatý:', name || id);

  try {
    const exists = await Order.findOne({ id });
    if (exists) {
      console.log(`⏭️ CREATE: Objednávka ${name || id} už existuje – preskakuje sa.`);
      return res.status(200).send('Already exists');
    }

    const fullOrder = await fetchFullOrder(id);
    if (!fullOrder) return res.status(500).send('Failed to fetch full order');

    const metafields = await fetchMetafields(id);
    const cleaned = cleanOrder(fullOrder, metafields);

    await Order.create(cleaned);
    console.log(`✅ CREATE: Objednávka ${cleaned.name || cleaned.id} bola pridaná.`);
    res.status(200).send('CREATE OK');
  } catch (err) {
    console.error(`❌ CREATE ERROR – ${name || id}: ${err.message}`);
    res.status(500).send('CREATE Error');
  }
};

// UPDATE Webhook
const orderUpdated = async (req, res) => {
  const { id, name, updated_at } = req.body;
  console.log('🔁 Webhook – UPDATE prijatý:', name || id);

  try {
    const existing = await Order.findOne({ id });
    const apiTime = new Date(updated_at).getTime();

    if (existing) {
      const dbTime = new Date(existing.updated_at).getTime();
      if (dbTime === apiTime) {
        console.log(`⏭️ UPDATE: Objednávka ${name || id} sa nezmenila – preskakuje sa.`);
        return res.status(200).send('No changes');
      }
    }

    const fullOrder = await fetchFullOrder(id);
    if (!fullOrder) return res.status(500).send('Failed to fetch full order');

    const metafields = await fetchMetafields(id);
    const cleaned = cleanOrder(fullOrder, metafields);

    await Order.updateOne({ id: cleaned.id }, { $set: cleaned }, { upsert: true });
    console.log(`✅ UPDATE: Objednávka ${cleaned.name || cleaned.id} bola aktualizovaná.`);
    res.status(200).send('UPDATE OK');
  } catch (err) {
    console.error(`❌ UPDATE ERROR – ${name || id}: ${err.message}`);
    res.status(500).send('UPDATE Error');
  }
};

module.exports = { orderCreated, orderUpdated };
