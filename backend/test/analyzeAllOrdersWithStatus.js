const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const SHOPIFY_API_URL = process.env.SHOPIFY_API_URL;
const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;

const HEADERS = {
  'X-Shopify-Access-Token': SHOPIFY_TOKEN,
  'Content-Type': 'application/json'
};

const statusCounter = {};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const fetchAllOrders = async () => {
  let orders = [];
  let url = `${SHOPIFY_API_URL}/orders.json?limit=250&status=any&order=created_at desc`;

  while (url) {
    try {
      const res = await axios.get(url, { headers: HEADERS });
      orders.push(...res.data.orders);

      const linkHeader = res.headers.link;
      if (linkHeader) {
        const matched = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        url = matched ? matched[1] : null;
      } else {
        url = null;
      }

      console.log(`📦 Načítaných objednávok: ${orders.length}`);
      await delay(500); // preventívny delay pre Shopify limity
    } catch (error) {
      console.error('❌ Chyba pri načítaní objednávok:', error.message);
      break;
    }
  }

  return orders;
};


const parseMetafieldList = (value) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getCustomStatus = (fulfillment, assignee, progress) => {
  if (fulfillment === 'fulfilled') return 'Fulfilled';
  if (fulfillment === 'on_hold') return 'On Hold';
  if (fulfillment === 'ready_for_pickup') return 'Ready for Pickup';
  if (['scheduled', 'request_declined'].includes(fulfillment)) return 'Need Attention';

  const hasAssignee = assignee.length > 0;
  const progressVal = progress[0] || '';

  if (!hasAssignee) return 'New Orders - To be assigned';
  if (progressVal === 'Assigned') return 'Assigned Orders - Not Started';
  if (progressVal === 'In Progress') return 'In Progress - Design or Print';
  if (progressVal === 'Finishing & Binding') return 'Finishing & Binding';
  if (progressVal === 'To be Checked') return 'To be Checked';

  return 'Need Attention';
};

const main = async () => {
  console.log('⏳ Načítavam všetky objednávky...');
  const orders = (await fetchAllOrders()).slice(0, 5);
  console.log(`📦 Celkový počet objednávok: ${orders.length}\n`);

  for (const [index, order] of orders.entries()) {
    console.log(`🔄 Spracúvam objednávku ${index + 1}/${orders.length} – ${order.name}`);
    const metafields = await fetchMetafields(order.id);
    const mfMap = {};
    metafields.forEach((mf) => (mfMap[mf.key.toLowerCase()] = mf.value));

    const assignee = parseMetafieldList(mfMap['assignee']);
    const progress = parseMetafieldList(mfMap['progress']);
    const status = getCustomStatus(order.fulfillment_status, assignee, progress);

    statusCounter[status] = (statusCounter[status] || 0) + 1;
    if ((index + 1) % 5 === 0) {
  console.log('📈 Dočasná štatistika:');
  Object.entries(statusCounter).forEach(([status, count]) => {
    console.log(`- ${status}: ${count}`);
  });
  console.log('----------------------\n');
}
    await delay(300); // bezpečný delay na API limity
  }

  console.log('📊 Štatistika podľa custom statusov:\n');
  Object.entries(statusCounter).forEach(([status, count]) => {
    console.log(`${status}: ${count}`);
  });
};


main();
