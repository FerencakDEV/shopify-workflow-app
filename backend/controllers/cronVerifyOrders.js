require('dotenv').config({ path: require('path').resolve(__dirname, '../../backend/.env') });

const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/Order');
const CronLog = require('../models/CronLog');
const { cleanOrder } = require('./cleanOrder');
const { SHOPIFY_API_URL, HEADERS } = require('../config/constants');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const fetchMetafields = async (orderId, retries = 3) => {
  const url = `${SHOPIFY_API_URL}/orders/${orderId}/metafields.json`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(url, { headers: HEADERS });
      return res.data.metafields || [];
    } catch (err) {
      if (err.response && err.response.status === 429) {
        const waitTime = 1000 * attempt;
        console.warn(`⏳ Rate limit hit (429) for Order ${orderId}, retrying in ${waitTime}ms... [attempt ${attempt}/${retries}]`);
        await delay(waitTime);
      } else {
        console.warn(`⚠️ Metafields fetch failed for Order ${orderId}: ${err.message}`);
        return [];
      }
    }
  }

  console.error(`❌ Metafields permanently failed for Order ${orderId} after ${retries} attempts.`);
  return [];
};

const fixInvalidOrders = async () => {
  const orders = await Order.find({ fulfillment_status: null });

  for (const dbOrder of orders) {
    console.log(`🔧 Oprava objednávky ${dbOrder.name || dbOrder.id}`);

    const metafields = await fetchMetafields(dbOrder.id);
    const cleaned = cleanOrder(dbOrder, metafields);

    await Order.updateOne(
      { id: dbOrder.id },
      { $set: cleaned }
    );

    console.log(`✅ Objednávka ${dbOrder.name || dbOrder.id} bola opravená.`);
  }
};

const runCronSync = async () => {
  console.log('🔧 CRON skript spustený ✅');
  const now = new Date().toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' });
  console.log(`\n🕒 CRON spustený: ${now}`);

  const url = `${SHOPIFY_API_URL}/orders.json?limit=250&status=any&order=id desc`;

  const added = [];
  const updated = [];
  const unchanged = [];

  try {
    const response = await axios.get(url, { headers: HEADERS });
    const orders = response.data.orders;

    console.log(`🔁 CRON: Kontrola ${orders.length} posledných objednávok`);

    for (const order of orders) {
      const existing = await Order.findOne({ id: order.id });
      await delay(400); // Globálne spomalenie medzi každou objednávkou

      const metafields = await fetchMetafields(order.id);

      if (!existing) {
        try {
          const cleaned = cleanOrder(order, metafields);
          await Order.create(cleaned);
          added.push(order.name || order.order_number);
          console.log(`✅ Pridaná nová objednávka: ${order.name || order.id}`);
        } catch (err) {
          console.error(`❌ Chyba pri ukladaní novej objednávky ${order.name || order.id}:`, err.message);
        }
        continue;
      }

      const dbTime = new Date(existing.updated_at).getTime();
      const apiTime = new Date(order.updated_at).getTime();

      if (dbTime !== apiTime) {
        console.log(`🔄 Rozdiel v updated_at:\n  DB:  ${existing.updated_at}\n  API: ${order.updated_at}`);
        try {
          const cleaned = cleanOrder(order, metafields);
          await Order.updateOne({ id: order.id }, { $set: cleaned });
          updated.push(order.name || order.order_number);
        } catch (err) {
          console.error(`❌ Chyba pri update objednávky ${order.name || order.id}:`, err.message);
        }
      } else {
        unchanged.push(order.name || order.order_number);
      }
    }

    await fixInvalidOrders();

    console.log(`\n📊 Súhrn výsledkov:`);
    console.log(`➕ Pridané: ${added.length}`);
    console.log(`🔄 Aktualizované: ${updated.length}`);
    console.log(`⏭️ Nezmenené: ${unchanged.length}`);

    try {
      await CronLog.create({ timestamp: new Date(), added, updated, unchanged, runBy: 'system-cron' });
      console.log('📘 CronLog zapísaný.');
    } catch (err) {
      console.error('❌ CronLog ERROR:', err.message);
    }

  } catch (err) {
    console.error('❌ Chyba pri synchronizácii:', err.message);
  }
};

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log('✅ Pripojené k MongoDB');
      await runCronSync();
      mongoose.connection.close();
    })
    .catch(err => {
      console.error('❌ Chyba MongoDB pripojenia:', err.message);
    });
}