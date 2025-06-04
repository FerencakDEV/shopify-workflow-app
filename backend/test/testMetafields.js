const axios = require('axios');
require('dotenv').config({ path: '../.env' });

const orderId = '10142240506180'; // nahraď za ID tvojej objednávky
const url = `${process.env.SHOPIFY_API_URL}/orders/${orderId}/metafields.json`;

axios.get(url, {
  headers: {
    'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log(`🧠 Metafields pre order ${orderId}:`);
  console.dir(res.data, { depth: null });
})
.catch(err => {
  console.error('❌ Chyba:', err.message);
});
