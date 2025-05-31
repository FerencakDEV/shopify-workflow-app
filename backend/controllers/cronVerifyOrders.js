// backend/controllers/cronVerifyOrders.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../../backend/.env') });

const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/Order');
const CronLog = require('../models/CronLog');
const { cleanOrder } = require('./cleanOrder');
const { SHOPIFY_API_URL, HEADERS } = require('../config/constants');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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

const runCronSync = async () => {
  console.log('🔧 CRON skript spustený ✅');
  const now = new Date().toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' });
  console.log(`\n🕒 CRON spustený: ${now}`);

  const url = `${SHOPIFY_API_URL}/orders.json?limit=250&status=any&order=id desc`;
  const added = [], updated = [], unchanged = [];

  try {
    const response = await axios.get(url, { headers: HEADERS });
    const orders = response.data.orders;

    console.log(`🔁 CRON: Kontrola ${orders.length} posledných objednávok`);

    for (const order of orders) {
      const existing = await Order.findOne({ id: order.id });
      await delay(300);

      const metafields = await fetchMetafields(order.id);
      const cleaned = cleanOrder(order, metafields);

      // 🔧 Fulfillment oprav
      if (!cleaned.fulfillment_status || cleaned.fulfillment_status === null) {
        const status = cleaned.custom_status?.toLowerCase() || '';
        if (status.includes('cancelled')) cleaned.fulfillment_status = 'fulfilled';
        else if (status.includes('ready for pickup')) cleaned.fulfillment_status = 'ready for pickup';
        else if (status.includes('onhold')) cleaned.fulfillment_status = 'onhold';
        else cleaned.fulfillment_status = 'unfulfilled';
      }

      if (!existing) {
        await Order.create(cleaned);
        added.push(cleaned.order_number || cleaned.id);
        console.log(`✅ Pridaná objednávka: ${cleaned.order_number}`);
        continue;
      }

      const changed =
        JSON.stringify(existing.assignee) !== JSON.stringify(cleaned.assignee) ||
        JSON.stringify(existing.progress) !== JSON.stringify(cleaned.progress) ||
        existing.order_number !== cleaned.order_number ||
        existing.fulfillment_status !== cleaned.fulfillment_status;

      if (changed) {
        await Order.updateOne({ id: order.id }, { $set: cleaned });
        updated.push(cleaned.order_number || cleaned.id);
        console.log(`🔄 Aktualizovaná objednávka: ${cleaned.order_number}`);
      } else {
        unchanged.push(cleaned.order_number || cleaned.id);
      }
    }

    console.log(`\n📊 Súhrn výsledkov:`);
    console.log(`➕ Pridané: ${added.length}`);
    console.log(`🔄 Aktualizované: ${updated.length}`);
    console.log(`⏭️ Nezmenené: ${unchanged.length}`);

    await CronLog.create({
      timestamp: new Date(),
      added,
      updated,
      unchanged,
      runBy: 'system-cron'
    });
    console.log('📘 CronLog zapísaný.');
  } catch (err) {
    console.error('❌ Chyba pri CRON syncu:', err.message);
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
