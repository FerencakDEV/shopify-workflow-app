const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const SHOPIFY_API_URL = 'https://reasons-ie.myshopify.com/admin/api/2023-10';
const HEADERS = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
  'Content-Type': 'application/json'
};

axios.get(`${SHOPIFY_API_URL}/orders.json?limit=1`, { headers: HEADERS })
  .then(res => {
    console.log('✅ Shopify API working, orders:', res.data.orders.length);
  })
  .catch(err => {
    console.error('❌ Shopify API failed:', err.message);
    console.error(err.response?.data || '');
  });
