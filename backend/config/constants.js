const SHOPIFY_API_URL = process.env.SHOPIFY_API_URL;

const HEADERS = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN, // ← upravené
  'Content-Type': 'application/json',
};
if (!process.env.SHOPIFY_TOKEN) {
  console.warn('⚠️ SHOPIFY_TOKEN is missing in environment!');
}

module.exports = { SHOPIFY_API_URL, HEADERS };
