require('dotenv').config({ path: require('path').resolve(__dirname, '../../backend/.env') });

const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/Order');
const CronLog = require('../models/CronLog');
const { cleanOrder } = require('./cleanOrder');
const { SHOPIFY_API_URL, HEADERS } = require('../config/constants');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const MAX_ORDERS = 750;

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
  let nextUrl = `${SHOPIFY_API_URL}/orders.json?limit=250&status=any&order=created_at desc`;

  const added = [], updated = [], unchanged = [];
  let totalProcessed = 0;

  try {
    while (nextUrl && totalProcessed < MAX_ORDERS) {
      const response = await axios.get(nextUrl, { headers: HEADERS });
      const orders = response.data.orders;

      for (const order of orders) {
        if (totalProcessed >= MAX_ORDERS) break;

        const existing = await Order.findOne({ id: Number(order.id) });
        await delay(150);

        const metafields = await fetchMetafields(order.id);
        const cleaned = cleanOrder(order, metafields); // použije už aktualizovanú logiku

        if (!existing) {
          await Order.create(cleaned);
          added.push(cleaned.order_number || cleaned.id);
          console.log(`✅ Pridaná NOVÁ objednávka: ${cleaned.order_number}`);
        } else {
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

        totalProcessed++;
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

    console.log(`\n📊 Súhrn CRON:`);
    console.log(`➕ Pridané: ${added.length}`);
    console.log(`🔄 Aktualizované: ${updated.length}`);
    console.log(`⏭️ Nezmenené: ${unchanged.length}`);
    console.log(`📦 Celkom spracovaných: ${totalProcessed}`);
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
