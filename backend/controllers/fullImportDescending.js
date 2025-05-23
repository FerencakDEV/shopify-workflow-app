// backend/controllers/fullImportCleanedOptimized.js

const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Order = require('../models/Order');
const { cleanOrder } = require('./cleanOrder');

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const { SHOPIFY_API_URL, HEADERS } = require('../config/constants');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const progressPath = path.resolve(__dirname, '../progress.json');




const BATCH_SIZE = 10; // Bezpečný limit pre Shopify API
const DELAY_BETWEEN_BATCHES = 2500;

const importOrdersCleaned = async () => {
let nextPageUrl = `${SHOPIFY_API_URL}/orders.json?limit=250&order=created_at asc&status=any`;


  try {
    console.log('➡️ ENV SHOPIFY_API_URL:', process.env.SHOPIFY_API_URL);
    console.log('➡️ ENV TOKEN EXISTS:', !!process.env.SHOPIFY_TOKEN);
    let totalImported = 0;
    while (nextPageUrl) {

      const response = await axios.get(nextPageUrl, { headers: HEADERS });
      console.log('✅ Shopify response received:', response.status);

      const orders = response.data.orders;
      if (!orders.length) break;

      for (let i = 0; i < orders.length; i += BATCH_SIZE) {
        const batch = orders.slice(i, i + BATCH_SIZE);
        const batchFirstNumber = batch[0]?.order_number || batch[0]?.name;
        const batchLastNumber = batch[batch.length - 1]?.order_number || batch[batch.length - 1]?.name;

        const tasks = batch.map(async (order) => {
          try {
            const metafieldsUrl = `${SHOPIFY_API_URL}/orders/${order.id}/metafields.json`;

            const metaRes = await axios.get(metafieldsUrl, { headers: HEADERS });

            const rawMetafields = metaRes.data.metafields || [];

            const cleanMetafields = rawMetafields.filter(m => typeof m.key === 'string' && m.key.trim() !== '');
            const safeMetafields = cleanMetafields.reduce((acc, m) => {
              const key = typeof m.key === 'string' ? m.key : 'unknown';
              let value;
              try {
                value = typeof m.value === 'object' ? JSON.stringify(m.value) : String(m.value);
              } catch {
                value = 'unreadable';
              }
              acc[key] = value;
              return acc;
            }, {});

            const cleaned = cleanOrder({
              ...order,
              custom_status: '',
              assignee: safeMetafields['assignee'] || '',
              progress: safeMetafields['progress'] || '',
              expected_time: safeMetafields['expected_time'] || '',
              metafields: safeMetafields
            });

            await Order.findOneAndUpdate({ id: cleaned.id }, { $set: cleaned }, { upsert: true });

          } catch (err) {
            console.warn(`⚠️ Zlyhala objednávka ${order.id}:`, {
              url: err.config?.url,
              status: err.response?.status,
              data: err.response?.data,
              message: err.message
            });
          }
        });

        await Promise.allSettled(tasks);
        
        totalImported += batch.length;
        console.log(`📦 Spracovaná dávka ${batch.length} objednávok (ID: ${batchFirstNumber} – ${batchLastNumber})`);
        await delay(DELAY_BETWEEN_BATCHES);
      }

      const linkHeader = response.headers['link'];
      const match = linkHeader && linkHeader.match(/<([^>]+)>; rel="next"/);
      nextPageUrl = match ? match[1] : null;
    }

    console.log(`🎉 Import ukončený. Spolu importovaných: ${totalImported}`);
  } catch (err) {
    console.error('❌ Request failed (main loop):', {
      url: err.config?.url,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      headers: err.response?.headers,
      message: err.message
    });
  }
};


if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log('✅ Pripojené k MongoDB');
      await importOrdersCleaned();
      mongoose.connection.close();
    })
    .catch(err => {
      console.error('❌ Chyba pripojenia k MongoDB:', err.message);
    });
}

module.exports = { importOrdersCleaned };