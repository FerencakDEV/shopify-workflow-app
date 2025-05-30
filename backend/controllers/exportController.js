const { getCustomStatus } = require('./orderController');
const { logToFile } = require('../utils/logger');
const axios = require('axios');
const { Parser } = require('json2csv');

const SHOPIFY_API_URL = 'https://reasons-ie.myshopify.com/admin/api/2023-10';
const HEADERS = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
  'Content-Type': 'application/json'
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const exportOrders = async (req, res) => {
  const { format, status, assignee, from, to } = req.query;

  const logMsg = [
    '🔍 Export started...',
    `🛠️ Format: ${format}`,
    `📦 Status filter: ${status}`,
    `📦 Assignee filter: ${assignee}`,
    `📦 Date from: ${from}`
  ];
  logMsg.forEach(msg => {
    console.log(msg);
    logToFile(msg);
  });

  const formatClean = (format || '').trim().toLowerCase();
  if (!['csv', 'json'].includes(formatClean)) {
    return res.status(400).json({ error: 'Format must be csv or json.' });
  }

  try {
    const ordersRes = await axios.get(`${SHOPIFY_API_URL}/orders.json?limit=100`, { headers: HEADERS });
    const allOrders = ordersRes.data.orders;

    const filtered = allOrders.filter(order => {
      const createdAt = new Date(order.created_at);
      if (from && createdAt < new Date(from)) return false;
      if (to && createdAt > new Date(to)) return false;
      return true;
    });

    const enriched = [];

    for (const order of filtered) {
      try {
        const metaRes = await axios.get(`${SHOPIFY_API_URL}/orders/${order.id}/metafields.json`, { headers: HEADERS });
        const metafields = metaRes.data.metafields || [];
        const custom_status = getCustomStatus(order, metafields);

        const assigneeFields = ['assignee', 'assignee-2', 'assignee-3', 'assignee-4'];
        const allAssignees = assigneeFields
          .map(key => {
            const raw = metafields.find(m => m.key === key)?.value || '[]';
            try {
              return JSON.parse(raw);
            } catch {
              return [];
            }
          })
          .flat();

        enriched.push({
          id: order.id,
          name: order.name,
          email: order.email,
          created_at: order.created_at,
          fulfillment_status: order.fulfillment_status,
          custom_status,
          assignee: allAssignees.join(', '),
          expected_time: metafields.find(m => m.key === 'expected-time')?.value || ''
        });

        await sleep(300);
      } catch (innerErr) {
        const msg = `❌ Error processing order ID ${order.id}: ${innerErr.message}`;
        console.error(msg);
        logToFile(msg);
      }
    }

    let result = enriched;

    if (status) {
      result = result.filter(o => o.custom_status === status);
    }

    if (assignee) {
      result = result.filter(o => o.assignee.toLowerCase().includes(assignee.toLowerCase()));
    }

    if (formatClean === 'json') {
      return res.json(result);
    } else {
      const parser = new Parser();
      const csv = parser.parse(result);
      res.header('Content-Type', 'text/csv');
      res.attachment(`orders_${Date.now()}.csv`);
      return res.send(csv);
    }

  } catch (error) {
    const msg = `❌ Export error: ${error.message}`;
    console.error(msg);
    logToFile(msg);
    res.status(500).json({ error: 'Failed to export orders.' });
  }
};

module.exports = { exportOrders };
