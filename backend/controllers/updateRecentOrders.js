// scripts/updateRecentOrders.js
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const chalk = require('chalk');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const Order = require('../models/Order');

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const { SHOPIFY_API_URL, SHOPIFY_TOKEN, MONGO_URI } = process.env;

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
    console.warn(`⚠️ Metafields fetch failed for Order ${orderId}: ${err.message}`);
    return [];
  }
};

const getMeta = (metafields, key, fallbackKey = null) => {
  const found = metafields.find(m => m.key === key);
  if (found) return found.value;
  if (fallbackKey) {
    const fallback = metafields.find(m => m.key === fallbackKey);
    return fallback ? fallback.value : '';
  }
  return '';
};

const updateOrders = async () => {
  await mongoose.connect(MONGO_URI);
  console.log(chalk.green('✅ MongoDB connected'));

  const customStatusStats = {};
  const assigneeStats = {};
  let total = 0;
  let fixedFulfillmentCount = 0;
  let nextPage = `${SHOPIFY_API_URL}/orders.json?limit=50&status=any`;

  while (nextPage) {
    console.log(chalk.gray('➡️ Fetching orders from:'), nextPage);
    const res = await axios.get(nextPage, { headers: HEADERS });
    const orders = res.data.orders;

    for (const order of orders) {
      const metafields = await fetchMetafields(order.id);

      const assignees = [
        getMeta(metafields, 'assignee-1', 'assignee'),
        getMeta(metafields, 'assignee-2'),
        getMeta(metafields, 'assignee-3'),
        getMeta(metafields, 'assignee-4')
      ];
      const progress = [
        getMeta(metafields, 'progress-1', 'progress'),
        getMeta(metafields, 'progress-2'),
        getMeta(metafields, 'progress-3'),
        getMeta(metafields, 'progress-4')
      ];
      const customStatus = getMeta(metafields, 'order-custom-status');
      const expectedTime = getMeta(metafields, 'expected-time');
      const isUrgent = (order.tags || []).includes('urgent') || customStatus?.toLowerCase()?.includes('urgent');

      const originalFulfillment = order.fulfillment_status;
      const fulfillmentStatus = originalFulfillment === null ? 'unfulfilled' : originalFulfillment;

      const cleaned = {
        id: order.id,
        order_number: order.order_number,
        email: order.email,
        created_at: order.created_at,
        updated_at: order.updated_at,
        custom_status: customStatus || '',
        expected_time: expectedTime || '',
        assignee: assignees,
        assignee_1: assignees[0] || '',
        assignee_2: assignees[1] || '',
        assignee_3: assignees[2] || '',
        assignee_4: assignees[3] || '',
        progress: progress,
        progress_1: progress[0] || '',
        progress_2: progress[1] || '',
        progress_3: progress[2] || '',
        progress_4: progress[3] || '',
        fulfillment_status: fulfillmentStatus,
        is_urgent: !!isUrgent,
        tags: order.tags || [],
        line_items: order.line_items,
        note: order.note || '',
        metafields: Object.fromEntries(metafields.map(m => [m.key, m.value]))
      };

      await Order.findOneAndUpdate({ id: order.id }, { $set: cleaned }, { upsert: true });

      if (originalFulfillment === null) {
        fixedFulfillmentCount++;
        console.log(
          chalk.bgYellow.black(`⚠️ FIXED Order #${order.order_number}: fulfillment_status was null → set to 'unfulfilled'`)
        );
      }

      console.log(
        chalk.cyan(`📦 #${cleaned.order_number} (${cleaned.custom_status || '—'})`)
        + ` | ${chalk.gray('Fulfillment:')} ${fulfillmentStatus}`
        + ` | ${chalk.blue(cleaned.assignee.filter(Boolean).join(', ') || '—')}`
      );

      customStatusStats[cleaned.custom_status] = (customStatusStats[cleaned.custom_status] || 0) + 1;
      cleaned.assignee.forEach(a => {
        if (a) assigneeStats[a] = (assigneeStats[a] || 0) + 1;
      });

      total++;
      await delay(150);
    }

    const link = res.headers['link'];
    const nextLink = link?.split(',').find(l => l.includes('rel="next"'));
    nextPage = nextLink ? nextLink.match(/<([^>]+)>/)?.[1] : null;

    await delay(500);
  }

  console.log(chalk.green(`\n🏁 Done! ${total} orders processed.`));
  console.log(chalk.yellow(`🔧 Fixed ${fixedFulfillmentCount} fulfillment_status = null`));
  console.log('\n📊 Custom Statuses:');
  Object.entries(customStatusStats).forEach(([status, count]) =>
    console.log(`  • ${status}: ${count}`));

  console.log('\n👤 Assignees:');
  Object.entries(assigneeStats).forEach(([name, count]) =>
    console.log(`  • ${name}: ${count}`));

  await mongoose.disconnect();
};

updateOrders();
