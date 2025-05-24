const SHOPIFY_API_URL = process.env.SHOPIFY_API_URL;

const HEADERS = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN, // ← upravené
  'Content-Type': 'application/json',
};

module.exports = { SHOPIFY_API_URL, HEADERS };
