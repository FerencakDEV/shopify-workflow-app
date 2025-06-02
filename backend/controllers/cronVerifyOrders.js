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
  console.log('🔧 CRON štartuje...');
  const now = new Date().toISOString();

  const lastRunLog = await CronLog.findOne().sort({ timestamp: -1 });
  const lastRunDate = lastRunLog?.timestamp || new Date('2000-01-01');

  console.log(`🔁 Posledný záznam: ${lastRunDate.toISOString()}`);

  let nextUrl = `${SHOPIFY_API_URL}/orders.json?limit=250&status=any&order=created_at desc`;
  const added = [], updated = [], unchanged = [];

  let processedCount = 0;
  const maxOrders = 700;

  try {
    while (nextUrl && processedCount < maxOrders) {
      const response = await axios.get(nextUrl, { headers: HEADERS });
      const orders = response.data.orders;

      for (const order of orders) {
        if (processedCount >= maxOrders) break;
        processedCount++;

        const orderCreated = new Date(order.created_at);
        const isNew = orderCreated > lastRunDate;

        const existing = await Order.findOne({ id: Number(order.id) });
        await delay(200);

        const metafields = await fetchMetafields(order.id);
        const cleaned = cleanOrder(order, metafields);

        if (!cleaned.fulfillment_status || cleaned.fulfillment_status === 'null') {
          const status = cleaned.custom_status?.toLowerCase() || '';
          if (status.includes('cancelled')) cleaned.fulfillment_status = 'fulfilled';
          else if (status.includes('ready for pickup')) cleaned.fulfillment_status = 'ready for pickup';
          else if (status.includes('on hold')) cleaned.fulfillment_status = 'on hold';
          else cleaned.fulfillment_status = 'unfulfilled';
        }

        if (!existing) {
          if (isNew) {
            await Order.create(cleaned);
            added.push(cleaned.order_number || cleaned.id);
            console.log(`✅ Pridaná NOVÁ objednávka: ${cleaned.order_number}`);
          } else {
            console.log(`⏭️ Staršia objednávka ${cleaned.order_number} – nebola pridaná.`);
          }
          continue;
        }

        const changed =
          JSON.stringify(existing.assignee) !== JSON.stringify(cleaned.assignee) ||
          JSON.stringify(existing.progress) !== JSON.stringify(cleaned.progress) ||
          existing.order_number !== cleaned.order_number ||
          existing.fulfillment_status !== cleaned.fulfillment_status ||
          existing.custom_status !== cleaned.custom_status;

        if (changed) {
          await Order.updateOne({ id: order.id }, { $set: cleaned });
          updated.push(cleaned.order_number || cleaned.id);
          console.log(`🔄 Aktualizovaná objednávka: ${cleaned.order_number}`);
        } else {
          unchanged.push(cleaned.order_number || cleaned.id);
        }
      }

      const linkHeader = response.headers.link;
      const match = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = match ? match[1] : null;
    }

    await CronLog.create({
      timestamp: new Date(),
      added,
      updated,
      unchanged,
      runBy: 'render-cron'
    });

    console.log(`\n📊 Súhrn CRON behu:`);
    console.log(`🧾 Spracovaných objednávok: ${processedCount}`);
    console.log(`➕ Pridané nové: ${added.length}`);
    console.log(`🔄 Aktualizované: ${updated.length}`);
    console.log(`⏭️ Nezmenené: ${unchanged.length}`);
  } catch (err) {
    console.error('❌ Chyba CRON behu:', err.message);
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
      console.error('❌ MongoDB chyba:', err.message);
    });
}
