const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Order = require('../models/Order');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { SHOPIFY_API_URL, SHOPIFY_TOKEN, MONGO_URI } = process.env;

const HEADERS = {
  'X-Shopify-Access-Token': SHOPIFY_TOKEN,
  'Content-Type': 'application/json'
};

const DELAY_BETWEEN_ORDERS = 300;
const DELAY_BETWEEN_BATCHES = 500;
const BATCH_SIZE = 10;
const ERROR_LOG_PATH = path.resolve(__dirname, 'errors.log');

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const parseMetafieldList = (val) => {
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const fetchMetafieldsWithRetry = async (orderId, retries = 2) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(`${SHOPIFY_API_URL}/orders/${orderId}/metafields.json`, {
        headers: HEADERS
      });
      return res.data.metafields || [];
    } catch (err) {
      if (err.response?.status === 429 && attempt < retries) {
        console.warn(`⏳ Rate limit pre order ${orderId}, retrying in 2s...`);
        await delay(2000);
      } else {
        throw err;
      }
    }
  }
};

const logError = (order, error) => {
  const entry = `[${new Date().toISOString()}] ❌ Order ${order.name} (${order.id}): ${error.message} (${error.response?.status || 'no status'})\n`;
  fs.appendFileSync(ERROR_LOG_PATH, entry);
};

const runFix = async () => {
  await mongoose.connect(MONGO_URI);
  const orders = await Order.find().sort({ id: 1 });

  console.log(`🚀 Spúšťam metafield sync pre ${orders.length} objednávok.`);

  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const batch = orders.slice(i, i + BATCH_SIZE);

    for (const order of batch) {
      try {
        const metafields = await fetchMetafieldsWithRetry(order.id);
        const mfMap = {};
        metafields.forEach((mf) => (mfMap[mf.key.toLowerCase()] = mf.value));

        order.assignee = parseMetafieldList(mfMap["assignee"]);
        order.progress = parseMetafieldList(mfMap["progress"]);
        order.expected_time = mfMap["expected_time"] || '';
        order.metafields = mfMap;

        await order.save();
        console.log(`✅ ${order.name} – metafields uložené`);
      } catch (err) {
        logError(order, err);
        console.warn(`⚠️ Chyba pri objednávke ${order.name}: ${err.message}`);
      }

      await delay(DELAY_BETWEEN_ORDERS);
    }

    console.log(`🟢 Dávka ${i + BATCH_SIZE} hotová\n`);
    await delay(DELAY_BETWEEN_BATCHES);
  }

  await mongoose.disconnect();
  console.log('🎉 Hotovo. Metafields sú uložené. Pokračuj skriptom `updateCustomStatusFromDB.js`.');
};

module.exports = runFix;
