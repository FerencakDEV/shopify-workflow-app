const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SHOPIFY_API_URL = process.env.SHOPIFY_API_URL;
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;
const ORDER_ID = '10130456740164'; // ← zmeň podľa potreby

const HEADERS = {
  'X-Shopify-Access-Token': SHOPIFY_TOKEN,
  'Content-Type': 'application/json'
};

const fetchOrderWithMetafields = async () => {
  try {
    // 🛒 Získaj základnú objednávku
    const orderRes = await axios.get(`${SHOPIFY_API_URL}/orders/${ORDER_ID}.json`, { headers: HEADERS });
    const order = orderRes.data.order;

    // 🧩 Získaj metafields pre túto objednávku
    const metaRes = await axios.get(`${SHOPIFY_API_URL}/orders/${ORDER_ID}/metafields.json`, { headers: HEADERS });
    const metafields = metaRes.data.metafields;

    // 🔎 Výpis
    console.log(`📦 Objednávka #${order.name}`);
    console.dir(order, { depth: null, colors: true });

    console.log('\n🧠 Metafields:');
    console.dir(metafields, { depth: null, colors: true });

  } catch (err) {
    console.error('❌ Chyba pri získavaní objednávky alebo metafields:', err.message);
  }
};

fetchOrderWithMetafields();
