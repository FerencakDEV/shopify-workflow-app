const SHOPIFY_API_URL = 'https://reasons-ie.myshopify.com/admin/api/2023-10';

const HEADERS = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
  'Content-Type': 'application/json',
};

module.exports = {
  SHOPIFY_API_URL,
  HEADERS,
};