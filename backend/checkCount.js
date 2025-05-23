const axios = require('axios');
require('dotenv').config();

const { getCustomStatus } = require('./controllers/orderController');

const SHOPIFY_API_URL = 'https://reasons-ie.myshopify.com/admin/api/2023-10';
const HEADERS = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
  'Content-Type': 'application/json'
};

(async () => {
  try {
    const res = await axios.get(`${SHOPIFY_API_URL}/orders.json?limit=50`, {
      headers: HEADERS
    });

    const orders = res.data.orders;
    const statusMap = {};

    for (const order of orders) {
      try {
        const metaRes = await axios.get(`${SHOPIFY_API_URL}/orders/${order.id}/metafields.json`, {
          headers: HEADERS
        });

        const metafields = metaRes.data.metafields || [];
        const status = getCustomStatus(order, metafields);

        statusMap[status] = (statusMap[status] || 0) + 1;

        await new Promise(resolve => setTimeout(resolve, 500)); // pauza kvôli 429
      } catch (err) {
        console.warn(`⚠️ Metafields chyba pri objednávke ${order.name}:`, err.message);
        continue;
      }
    }

    const total = Object.values(statusMap).reduce((sum, count) => sum + count, 0);

    console.log("\n✅ Objednávky podľa statusu:");
    for (const [key, count] of Object.entries(statusMap)) {
      console.log(`- ${key}: ${count}`);
    }
    console.log(`\n🔢 Celkový počet: ${total}\n`);

  } catch (err) {
    console.error("❌ Chyba pri načítaní objednávok:", err.message);
  }
})();


/*✅ Reálne počty v Shopify:
Status	Počet
🆕 New Orders - To be assigned	23
📥 Assigned Orders - Not Started	21
🔍 To be Checked	1
🛠 In Progress - Design or Print	2
✅ Fulfilled	2
📦 Ready for Dispatch	1
🔢 Spolu	50*/

