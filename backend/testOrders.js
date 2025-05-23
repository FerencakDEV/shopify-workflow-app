const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Načítaj .env aj z root priečinka, ak tam je
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const { SHOPIFY_API_URL, HEADERS } = require('../backend/config/constants');

const testOrderId = '10121057403204'; // ← zmeň na objednávku, ktorá padá

const test = async () => {
  try {
    const metaRes = await axios.get(`${SHOPIFY_API_URL}/orders/${testOrderId}/metafields.json`, {
      headers: HEADERS
    });

    const orderRes = await axios.get(`${SHOPIFY_API_URL}/orders/${testOrderId}.json`, {
      headers: HEADERS
    });

    const order = orderRes.data.order;
    const metafields = metaRes.data.metafields || [];

    console.log(`✅ Objednávka: ${order.name} (${order.id})`);
    console.log('--- METAFIELDS ---');
    console.dir(metafields, { depth: null });

    console.log('--- CELÁ OBJEDNÁVKA ---');
    console.dir(order, { depth: null });

  } catch (err) {
    console.error('❌ Chyba pri načítaní objednávky:', err.response?.data || err.message);
  }
};

test();
