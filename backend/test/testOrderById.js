// backend/testOrderById.js
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const orderId = '10133502427460'; // ← zmeň na ID ktoré chceš

const SHOPIFY_API_URL = process.env.SHOPIFY_API_URL;
const HEADERS = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
  'Content-Type': 'application/json',
};

const fetchOrder = async () => {
  try {
    // 1️⃣ Najprv načítame samotnú objednávku
    const res = await axios.get(`${SHOPIFY_API_URL}/orders/${orderId}.json`, {
      headers: HEADERS,
    });

    const order = res.data.order;

    console.log(`\n✅ Order #${order.order_number} loaded.`);

    // 2️⃣ Potom načítame jej metafields
    const metafieldsUrl = `${SHOPIFY_API_URL}/orders/${order.id}/metafields.json`;
    const metafieldsRes = await axios.get(metafieldsUrl, { headers: HEADERS });

    console.log(`\n🔍 Metafields for order ${order.id}:`);
    metafieldsRes.data.metafields.forEach((mf) => {
      console.log(`  • ${mf.namespace}.${mf.key} = ${mf.value}`);
    });

    // 3️⃣ (Voliteľne) vypíšeme celú objednávku
    // console.dir(order, { depth: null });
  } catch (error) {
    console.error('❌ Failed to fetch order:', error.message);
  }
};

fetchOrder();
