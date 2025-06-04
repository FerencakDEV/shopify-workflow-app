const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const chalk = require('chalk');

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const { SHOPIFY_API_URL, SHOPIFY_TOKEN } = process.env;

const HEADERS = {
  'X-Shopify-Access-Token': SHOPIFY_TOKEN,
  'Content-Type': 'application/json'
};

const parseMetafields = (metafields) => {
  const result = {
    'order-custom-status': null,
    'expected-time': null,
    'assignee-1': null,
    'progress-1': null,
    'assignee-2': null,
    'progress-2': null,
    'assignee-3': null,
    'progress-3': null,
    'assignee-4': null,
    'progress-4': null
  };

  for (const mf of metafields) {
    if (mf.namespace === 'custom' && result.hasOwnProperty(mf.key)) {
      result[mf.key] = mf.value;
    }
  }

  return result;
};

const run = async () => {
  try {
    const url = `${SHOPIFY_API_URL}/orders.json?limit=50&status=any&order=created_at desc`;
    console.log(chalk.blue(`🔗 Fetching latest 50 orders...`));
    const res = await axios.get(url, { headers: HEADERS });
    const orders = res.data.orders;

    for (const order of orders) {
      const metafieldsUrl = `${SHOPIFY_API_URL}/orders/${order.id}/metafields.json`;
      const metafieldRes = await axios.get(metafieldsUrl, { headers: HEADERS });
      const metafields = parseMetafields(metafieldRes.data.metafields || []);

      console.log(chalk.green(`\n📦 Order #${order.order_number} (${metafields['order-custom-status'] || '—'})`));
      console.log(`  • Fulfillment: ${order.fulfillment_status || 'unfulfilled'}`);
      console.log(`  • Expected: ${metafields['expected-time'] || '—'}`);

      for (let i = 1; i <= 4; i++) {
        const assignee = metafields[`assignee-${i}`] || '—';
        const progress = metafields[`progress-${i}`] || '—';
        console.log(`  • Assignee ${i}: ${assignee} | Progress: ${progress}`);
      }
    }
  } catch (err) {
    console.error(chalk.red('❌ Error:'), err.message);
    if (err.response?.data) console.dir(err.response.data, { depth: 5 });
  }
};

run();
