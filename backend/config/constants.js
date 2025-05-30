if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const SHOPIFY_API_URL = process.env.SHOPIFY_API_URL;
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;

if (!SHOPIFY_TOKEN) {
  console.warn('⚠️ SHOPIFY_TOKEN is missing in environment!');
}

const HEADERS = {
  'X-Shopify-Access-Token': SHOPIFY_TOKEN,
  'Content-Type': 'application/json',
};

module.exports = { SHOPIFY_API_URL, HEADERS };
