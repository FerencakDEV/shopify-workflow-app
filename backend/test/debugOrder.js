require('dotenv').config({ path: require('path').resolve(__dirname, '../../backend/.env') });

const axios = require('axios');

const orderId = '10153681846596'; // ← ID objednávky, ktorú chceš preskúmať

const { SHOPIFY_API_URL, SHOPIFY_TOKEN } = process.env;

const HEADERS = {
  'X-Shopify-Access-Token': SHOPIFY_TOKEN,
  'Content-Type': 'application/json',
};

const run = async () => {
  try {
    console.log(`🔎 Fetching RAW ORDER: ${orderId}...\n`);
    const orderRes = await axios.get(`${SHOPIFY_API_URL}/orders/${orderId}.json`, { headers: HEADERS });
    console.log('📦 FULL ORDER OBJECT:\n');
    console.dir(orderRes.data, { depth: null });

    console.log('\n🧩 Fetching RAW METAFIELDS...\n');
    const metaRes = await axios.get(`${SHOPIFY_API_URL}/orders/${orderId}/metafields.json`, { headers: HEADERS });
    console.log('🧾 FULL METAFIELDS OBJECT:\n');
    console.dir(metaRes.data, { depth: null });

    console.log('\n✅ DONE');
  } catch (err) {
    console.error(`❌ ERROR: ${err.message}`);
  }
};

run();
