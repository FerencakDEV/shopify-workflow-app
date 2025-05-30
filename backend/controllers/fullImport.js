const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });
const axios = require('axios');
const Order = require('../models/Order');
const { getCustomStatus } = require('./orderController');
const { SHOPIFY_API_URL, HEADERS } = require('../config/constants');

// Načítaj environmentálne premenné
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

console.log('🔐 Headers:', HEADERS);
console.log('🌍 API URL:', SHOPIFY_API_URL);

const fullImport = async () => {
  let hasMore = true;
  let sinceId = null;
  let totalImported = 0;

  try {
    while (hasMore) {

      const lastOrder = await Order.findOne().sort({ id: -1 }).select('id');
      if (lastOrder) sinceId = lastOrder.id;
      console.log(`🔄 Načítavam objednávky od ID: ${sinceId || 'začiatok'}`);
      let url = `${SHOPIFY_API_URL}/orders.json?limit=250`;
      if (sinceId) {
        url += `&since_id=${sinceId}`;
        // Shopify v tomto prípade zoradí podľa ID automaticky
        } else {
         url += `&order=processed_at+asc`;
        }

      const ordersRes = await axios.get(url, { headers: HEADERS });
      const orders = ordersRes.data.orders;
      if (!orders.length) break;

      for (const order of orders) {
        try {
          const metaRes = await axios.get(`${SHOPIFY_API_URL}/orders/${order.id}/metafields.json`, { headers: HEADERS });
          await delay(600);

          const rawMetafields = metaRes.data.metafields || [];

          const cleanMetafields = rawMetafields.filter(
            m => typeof m.key === 'string' && m.key.trim() !== ''
          );

          if (cleanMetafields.length !== rawMetafields.length) {
            console.warn(`⚠️ Odstránené ${rawMetafields.length - cleanMetafields.length} neplatné metafields pre order ${order.id}`);
          }

          const safeMetafields = cleanMetafields.map(m => {
            const key = typeof m.key === 'string' ? m.key : 'unknown';
            let value;
            try {
              if (typeof m.value === 'object') {
                console.warn(`⚠️ Konvertujem objektové metafield value na string pre order ${order.id}, key: ${m.key}`);
                value = JSON.stringify(m.value, (k, v) => typeof v === 'undefined' ? 'undefined' : v);
              } else {
                value = String(m.value);
              }
            } catch (err) {
              console.warn(`⚠️ Neviem spracovať metafield pri objednávke ${order.id}, key: ${m.key}, value:`, m.value);
              value = 'unreadable';
            }
            return { key, value };
          });

          const enrichedData = {
            name: order.name,
            email: order.email,
            created_at: order.created_at,
            fulfillment_status: order.fulfillment_status,
            custom_status: getCustomStatus(order, cleanMetafields),
            assignee: cleanMetafields.find(m => m.key === 'assignee')?.value || '',
            expected_time: cleanMetafields.find(m => m.key === 'expected-time')?.value || '',
            metafields: safeMetafields.reduce((acc, m) => {
  const key = typeof m.key === 'string' ? m.key : 'unknown';
  let value;

  try {
    if (typeof m.value === 'object') {
      console.warn(`⚠️ Konvertujem objektové metafield value na string pre key: ${key}`);
      value = JSON.stringify(m.value);
    } else {
      value = String(m.value);
    }
  } catch {
    value = 'unreadable';
  }

  acc[key] = value;
  return acc;
}, {}),
            tags: typeof order.tags === 'string' ? order.tags.split(',').map(t => t.trim()) : [],
          };

          try {
            Object.keys(enrichedData).forEach(k => {
    if (typeof k !== 'string') {
      console.warn(`❌ Neplatný key v enrichedData:`, k);
    }
  });

  if (Array.isArray(enrichedData.metafields)) {
    enrichedData.metafields.forEach((m, i) => {
      if (typeof m.key !== 'string') {
        console.warn(`❌ Metafield key [${i}] je neplatný:`, m.key);
      }
    });
  }

            await Order.findOneAndUpdate(
              { id: order.id },
              { $set: enrichedData },
              { upsert: true }
            );

            console.log(`✅ Spracovaná objednávka: ${order.name} (${order.id})`);
            totalImported++;
            sinceId = order.id;

          } catch (innerErr) {
            console.warn(`⚠️ Chyba pri objednávke ${order?.id}:`, innerErr.message);
            console.error('❌ enrichedData spôsobujúce chybu:');
            console.dir(enrichedData, { depth: null });
            throw innerErr;
          }

          await delay(1000); // throttling medzi objednávkami
        } catch (err) {
          console.warn(`⚠️ Globálna chyba pri spracovaní objednávky ${order.id}:`, err.message);
        }
      }

      console.log(`✅ [Import] Batch done. Total imported: ${totalImported}`);
    }

    console.log(`🎉 Full import completed. Total orders: ${totalImported}`);
  } catch (err) {
    console.error('❌ Import failed:', err.response?.data || err.message);
  }
};

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log('✅ Connected to MongoDB');
      await fullImport();
      mongoose.connection.close();
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
    });
}

module.exports = { fullImport };
