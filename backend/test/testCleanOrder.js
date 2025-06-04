// test/testCleanOrder.js
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const chalk = require('chalk');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const { SHOPIFY_API_URL, SHOPIFY_TOKEN } = process.env;

const HEADERS = {
  'X-Shopify-Access-Token': SHOPIFY_TOKEN,
  'Content-Type': 'application/json',
};

const fetchMetafields = async (orderId) => {
  try {
    const res = await axios.get(`${SHOPIFY_API_URL}/orders/${orderId}/metafields.json`, {
      headers: HEADERS,
    });
    return res.data.metafields || [];
  } catch (err) {
    console.warn(`❌ Failed to fetch metafields for ${orderId}: ${err.message}`);
    return [];
  }
};

const run = async () => {
  const nextPageUrl = `${SHOPIFY_API_URL}/orders.json?limit=50&status=any`;

  try {
    const res = await axios.get(nextPageUrl, { headers: HEADERS });
    const orders = res.data.orders;

    for (const order of orders) {
      const metafields = await fetchMetafields(order.id);

      const getMeta = (key, fallbackKey = null) => {
        const found = metafields.find(m => m.key === key);
        if (found) return found.value;
        if (fallbackKey) {
          const fallback = metafields.find(m => m.key === fallbackKey);
          return fallback ? fallback.value : '';
        }
        return '';
      };

      const assignees = [
        getMeta('assignee-1', 'assignee'),
        getMeta('assignee-2'),
        getMeta('assignee-3'),
        getMeta('assignee-4'),
      ];
      const progress = [
        getMeta('progress-1', 'progress'),
        getMeta('progress-2'),
        getMeta('progress-3'),
        getMeta('progress-4'),
      ];
      const customStatus = getMeta('order-custom-status');
      const expectedTime = getMeta('expected-time');

      console.log(chalk.yellow(`\n📦 Order #${order.order_number}`));
      console.log(`  • Fulfillment: ${chalk.cyan(order.fulfillment_status || '—')}`);
      console.log(`  • Custom Status: ${chalk.magenta(customStatus || '—')}`);
      console.log(`  • Expected Time: ${chalk.gray(expectedTime || '—')}`);

      console.log(`  • Assignees:`);
      assignees.forEach((a, i) =>
        console.log(`     - ${chalk.blue(`assignee-${i + 1}`)}: ${a || '—'}`)
      );

      console.log(`  • Progress:`);
      progress.forEach((p, i) =>
        console.log(`     - ${chalk.green(`progress-${i + 1}`)}: ${p || '—'}`)
      );

      await delay(300);
    }
  } catch (err) {
    console.error(`❌ Failed to fetch orders:`, err.message);
  }
};

run();
