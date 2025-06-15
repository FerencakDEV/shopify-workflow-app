require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const axios = require('axios');

const Order = require('../models/Order');
const PendingUpdate = require('../models/PendingUpdate');
const { cleanOrder } = require('../controllers/cleanOrder');

const SHOPIFY_API_URL = process.env.SHOPIFY_API_URL;
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;

const HEADERS = {
  'X-Shopify-Access-Token': SHOPIFY_TOKEN,
  'Content-Type': 'application/json',
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const fetchOrder = async (id) => {
  try {
    const res = await axios.get(`${SHOPIFY_API_URL}/orders/${id}.json`, { headers: HEADERS });
    return res.data.order;
  } catch {
    return null;
  }
};

const fetchMetafieldsWithRetry = async (id, attempts = 5, delayMs = 3000) => {
  for (let i = 0; i < attempts; i++) {
    const res = await axios.get(`${SHOPIFY_API_URL}/orders/${id}/metafields.json`, { headers: HEADERS });
    const metafields = res.data.metafields || [];
    if (metafields.length) return metafields;
    await delay(delayMs);
  }
  return [];
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🚀 Running PendingUpdate sync...');

  const pending = await PendingUpdate.find().limit(20);

  for (const item of pending) {
    const { orderId } = item;

    console.log(`🔁 Retrying ${orderId}`);
    const order = await fetchOrder(orderId);
    const metafields = await fetchMetafieldsWithRetry(orderId);

    if (!order || !metafields.length) {
      console.warn(`❌ Skipping ${orderId}, still incomplete`);
      continue;
    }

    const cleaned = cleanOrder(order, metafields);

    if (!cleaned.custom_status || cleaned.custom_status === 'New Order') {
      console.warn(`⚠️ Skipping ${orderId}, custom_status empty`);
      continue;
    }

    await Order.updateOne({ id: cleaned.id }, { $set: cleaned }, { upsert: true });
    await PendingUpdate.deleteOne({ orderId });
    console.log(`✅ Synced ${cleaned.name}`);
  }

  await mongoose.disconnect();
  console.log('✅ Done');
};

run();
