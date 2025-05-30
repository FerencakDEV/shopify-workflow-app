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

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 2500;
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


const getCustomStatus = (fulfillment, assignee, progress) => {
  if (fulfillment === 'fulfilled') return ['Fulfilled'];
  if (fulfillment === 'on_hold') return ['On Hold'];
  if (fulfillment === 'ready_for_pickup') return ['Ready for Pickup'];
  if (['scheduled', 'request_declined'].includes(fulfillment)) return ['Need Attention'];

  const statuses = new Set();

  if (!assignee.length) {
    statuses.add('New Orders - To be assigned');
  } else {
    for (let i = 0; i < assignee.length; i++) {
  const prog = progress[i] || '';
  if (prog === 'Assigned') statuses.add('Assigned Orders - Not Started');
  else if (prog === 'In Progress') statuses.add('In Progress - Design or Print');
  else if (prog === 'Finishing & Binding') statuses.add('Finishing & Binding');
  else if (prog === 'To be Checked') statuses.add('To be Checked');
  else if (prog === 'Ready for Dispatch') statuses.add('Ready for Dispatch');
  else if (prog === 'Ready for Pickup') statuses.add('Ready for Pickup');
  else statuses.add('Need Attention');
}
  }

  return Array.from(statuses);
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
  const orders = await Order.find().sort({ id: 1 }); // zoradené podľa ID (najstaršie prvé)

  console.log(`🚀 Spúšťam dávkové spracovanie ${orders.length} objednávok po ${BATCH_SIZE}.\n`);

  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const batch = orders.slice(i, i + BATCH_SIZE);

    const tasks = batch.map(async (order) => {
      try {
        const metafields = await fetchMetafieldsWithRetry(order.id);
        const mfMap = {};
        metafields.forEach((mf) => (mfMap[mf.key.toLowerCase()] = mf.value));

        const assignee = parseMetafieldList(mfMap["assignee"]);
        const progress = parseMetafieldList(mfMap["progress"]);
        const statusList = getCustomStatus(order.fulfillment_status, assignee, progress);

        order.assignee = assignee;
        order.progress = progress;
        order.custom_status = statusList.join(' | ');
        order.metafields = mfMap;

        await order.save();
      } catch (err) {
        logError(order, err);
        console.warn(`⚠️ Chyba pri objednávke ${order.name}: ${err.message}`);
      }
    });

    for (const order of batch) {
  try {
    const metafields = await fetchMetafieldsWithRetry(order.id);
    const mfMap = {};
    metafields.forEach((mf) => (mfMap[mf.key.toLowerCase()] = mf.value));

    const assignee = parseMetafieldList(mfMap["assignee"]);
    const progress = parseMetafieldList(mfMap["progress"]);
    const statusList = getCustomStatus(order.fulfillment_status, assignee, progress);

    order.assignee = assignee;
    order.progress = progress;
    order.custom_status = statusList.join(' | ');
    order.metafields = mfMap;

    await order.save();
  } catch (err) {
    logError(order, err);
    console.warn(`⚠️ Chyba pri objednávke ${order.name}: ${err.message}`);
  };

    if ((i + BATCH_SIZE) % 500 === 0 || i === 0) {
      console.log(`✅ Spracovaných ${Math.min(i + BATCH_SIZE, orders.length)} objednávok`);
    }

    await delay(DELAY_BETWEEN_BATCHES); // bezpečná pauza
  }

  await mongoose.disconnect();
  console.log('🎉 Dokončené. Chyby nájdeš v errors.log.');
};

runFix();
}