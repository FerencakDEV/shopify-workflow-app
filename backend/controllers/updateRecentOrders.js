const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const chalk = require('chalk');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const { cleanOrder } = require('./cleanOrder');
const Order = require('../models/Order');

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const { SHOPIFY_API_URL, SHOPIFY_TOKEN } = process.env;

const HEADERS = {
  'X-Shopify-Access-Token': SHOPIFY_TOKEN,
  'Content-Type': 'application/json'
};

const fetchMetafields = async (orderId) => {
  try {
    const url = `${SHOPIFY_API_URL}/orders/${orderId}/metafields.json`;
    const res = await axios.get(url, { headers: HEADERS });
    return res.data.metafields || [];
  } catch (err) {
    console.warn(`⚠️ Metafields fetch failed for Order ${orderId}`);
    console.warn(`   → Message: ${err.message}`);
    if (err.stack) console.warn(`   → Stack:`, err.stack.split('\n')[0]);
    return [];
  }
};

const updateOrders = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(chalk.green('✅ Connected to MongoDB'));

  let count = 0;
  const customStatusStats = {};
  const assigneeStats = {};
  let nextPageUrl = `${SHOPIFY_API_URL}/orders.json?limit=250&status=any`;

  while (true) {
    try {
      console.log(chalk.gray('🔗 Fetching page:'), nextPageUrl);
      const response = await axios.get(nextPageUrl, { headers: HEADERS });
      const orders = response.data.orders;
      if (!orders.length) break;

      for (const order of orders) {
        if (!order.id) {
          console.warn('❗ Order missing ID, skipping...');
          continue;
        }

        const metafields = await fetchMetafields(order.id);
        const cleaned = cleanOrder(order, metafields);

        customStatusStats[cleaned.custom_status] = (customStatusStats[cleaned.custom_status] || 0) + 1;
        cleaned.assignee.forEach(person => {
          assigneeStats[person] = (assigneeStats[person] || 0) + 1;
        });

        await Order.findOneAndUpdate(
          { id: order.id },
          { $set: cleaned },
          { upsert: true, new: true }
        );

        // 📦 Kompletný prehľad
        console.log(chalk.cyan(`\n📦 Order: #${cleaned.order_number} | ID: ${cleaned.id}`));
        console.log(`  • Created: ${cleaned.created_at?.toISOString() || '—'}`);
        console.log(`  • Customer: ${cleaned.customer.first_name} ${cleaned.customer.last_name} (${cleaned.customer.email})`);
        console.log(`  • Fulfillment: ${chalk.yellow(cleaned.fulfillment_status || 'unfulfilled')} → custom_status: ${chalk.magenta(cleaned.custom_status)}`);
        console.log(`  • Assignee(s): ${chalk.blue(cleaned.assignee.join(', ') || '—')}`);
        console.log(`  • Progress: ${chalk.blue(cleaned.progress.join(', ') || '—')}`);
        console.log(`  • Expected: ${chalk.gray(cleaned.expected_time || '—')}`);

        if (cleaned.line_items.length) {
          console.log(`  • Items:`);
          cleaned.line_items.forEach(item => {
            console.log(`     - ${item.name} (${item.quantity}x) – $${item.price}`);
          });
        }

        count++;
        await delay(150);
      }

      const linkHeader = response.headers['link'];
if (linkHeader && linkHeader.includes('rel="next"')) {
  const links = linkHeader.split(',').map(s => s.trim());
  const nextLink = links.find(s => s.includes('rel="next"'));
  if (nextLink) {
    const urlMatch = nextLink.match(/<([^>]+)>/);
    if (urlMatch && urlMatch[1]) {
      nextPageUrl = urlMatch[1];
      await delay(500);
      continue;
    }
  }
}
console.log(chalk.yellow('⚠️ No next page – import finished.'));
break;

    } catch (err) {
      console.error(chalk.red(`❌ Shopify fetch failed:`), err.message);

      if (err.response) {
        console.log(chalk.red('📄 Response body:'));
        console.log(typeof err.response.data === 'string' ? err.response.data.slice(0, 300) : err.response.data);
        console.log(chalk.gray('📥 Status:'), err.response.status);
        console.log(chalk.gray('📥 Content-Type:'), err.response.headers['content-type']);
      }

      break;
    }
  }

  await mongoose.disconnect();
  console.log(chalk.green(`\n🏁 Update complete – Total orders processed: ${count}`));

  console.log('\n📊 Orders by Custom Status:');
  Object.entries(customStatusStats).forEach(([status, count]) => {
    console.log(`  • ${status}: ${count}`);
  });
  console.log(`  → Total: ${Object.values(customStatusStats).reduce((sum, val) => sum + val, 0)}\n`);

  console.log('👤 Orders by Assignee:');
  Object.entries(assigneeStats).forEach(([person, count]) => {
    console.log(`  • ${person}: ${count}`);
  });
  console.log(`  → Total unique assignees: ${Object.keys(assigneeStats).length}`);
  console.log(`  → Total assigned entries: ${Object.values(assigneeStats).reduce((sum, val) => sum + val, 0)}\n`);
};

updateOrders();
