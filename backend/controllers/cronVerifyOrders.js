require('dotenv').config({ path: require('path').resolve(__dirname, '../../backend/.env') });

const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/Order');
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

const runInitialImport = async () => {
  console.log('🚀 Inicializačný import 750 objednávok – štartuje...');
  let nextUrl = `${SHOPIFY_API_URL}/orders.json?limit=250&status=any&order=created_at desc`;

  let processedCount = 0;
  const maxOrders = 750;
  const added = [];

  try {
    while (nextUrl && processedCount < maxOrders) {
      const res = await axios.get(nextUrl, { headers: HEADERS });
      const orders = res.data.orders;

      for (const order of orders) {
        if (processedCount >= maxOrders) break;
        processedCount++;

        const existing = await Order.findOne({ id: Number(order.id) });
        if (existing) {
          console.log(`⏭️ Objednávka ${order.id} už existuje – preskakujem`);
          continue;
        }

        const metafields = await fetchMetafields(order.id);
        const cleaned = cleanOrder(order, metafields);

        if (!cleaned.fulfillment_status || cleaned.fulfillment_status === 'null') {
          const status = cleaned.custom_status?.toLowerCase() || '';
          if (status.includes('cancelled')) cleaned.fulfillment_status = 'fulfilled';
          else if (status.includes('ready for pickup')) cleaned.fulfillment_status = 'ready for pickup';
          else if (status.includes('on hold')) cleaned.fulfillment_status = 'on hold';
          else cleaned.fulfillment_status = 'unfulfilled';
        }

        try {
          await Order.create(cleaned);
          added.push(cleaned.order_number || cleaned.id);
          console.log(`✅ Pridaná objednávka: ${cleaned.order_number}`);
        } catch (err) {
          if (err.code === 11000) {
            console.log(`⚠️ Duplikát ${order.id} – ignorujem`);
          } else {
            throw err;
          }
        }

        await delay(150); // prevent rate limit
      }

      // stránkovanie
      const linkHeader = res.headers.link;
      const match = linkHeader?.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = match ? match[1] : null;
    }

    console.log(`\n📦 Import dokončený`);
    console.log(`🔢 Spracovaných: ${processedCount}`);
    console.log(`✅ Pridaných: ${added.length}`);
  } catch (err) {
    console.error('❌ Chyba počas importu:', err.message);
  }
};

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log('✅ Pripojené k MongoDB');
      await runInitialImport();
      mongoose.connection.close();
    })
    .catch(err => {
      console.error('❌ MongoDB chyba:', err.message);
    });
}
