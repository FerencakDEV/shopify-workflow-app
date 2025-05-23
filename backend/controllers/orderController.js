const { logToFile } = require ('../utils/logger'); // uprav cestu podľa umiestnenia
const axios = require('axios');
const SimpleCache = require('../cache'); // uprav cestu podľa umiestnenia
const Order = require ( '../models/Order.js');

const SHOPIFY_API_URL = 'https://reasons-ie.myshopify.com/admin/api/2023-10';
const HEADERS = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
  'Content-Type': 'application/json'
};
const cache = new SimpleCache(5 * 60 * 1000); // cache na 5 minút

// ➤ Základné načítanie objednávoks
 const getOrders = async (req, res) => {
  try {
    const response = await axios.get(`${SHOPIFY_API_URL}/orders.json?limit=5`, {
      headers: HEADERS
    });
    res.json(response.data);
  } catch (error) {
    logToFile('❌ Chyba pri načítaní objednávok:', error.message);
  console.error('❌ Chyba pri načítaní objednávok:', error.message);
    res.status(500).json({ error: 'Nepodarilo sa načítať objednávky.' });
  }
};

// ➤ Pomocná funkcia na určenie custom statusu
const getCustomStatus = (order, metafields) => {
  const fulfillmentStatus = order.fulfillment_status;

  const meta = {};
  metafields.forEach(mf => {
    try {
      meta[mf.key] = JSON.parse(mf.value);
    } catch {

      meta[mf.key] = mf.value;
    }
  });

  if (fulfillmentStatus === 'on_hold') return 'On Hold';
  if (fulfillmentStatus === 'fulfilled') return 'Fulfilled';
  if (fulfillmentStatus === 'ready_for_pickup') return 'Ready for Pickup - Collections';

  const hasAssignees = ['assignee', 'assignee-2', 'assignee-3', 'assignee-4'].some(key => Array.isArray(meta[key]) && meta[key].length > 0);
  if (!hasAssignees) {
    return 'New Orders - To be assigned';
  }

  const assignees = ['Q1', 'Q2', 'Online', 'Design', 'Design 2', 'Thesis', 'MagicTouch', 'Posters'];
  const isAssigned = assignees.some(a =>
    ['assignee', 'assignee-2', 'assignee-3', 'assignee-4'].some(key => (meta[key] || []).includes(a))
  );

  const isProgressAssigned = ['progress', 'progress-2', 'progress-3', 'progress-4'].some(key => (meta[key] || []).includes('Assigned'));

  if (isAssigned && isProgressAssigned) return 'Assigned Orders - Not Started';
  if (['progress', 'progress-2', 'progress-3', 'progress-4'].some(key => (meta[key] || []).includes('In Progress'))) return 'In Progress - Design or Print';
  if (['progress', 'progress-2', 'progress-3', 'progress-4'].some(key => (meta[key] || []).includes('Finishing & Binding'))) return 'Finishing & Binding';
  if (['progress', 'progress-2', 'progress-3', 'progress-4'].some(key => (meta[key] || []).includes('To be Checked'))) return 'To be Checked';
  if (['progress', 'progress-2', 'progress-3', 'progress-4'].some(key => (meta[key] || []).includes('Ready for Dispatch'))) return 'Ready for Dispatch';

  return 'Need Attention - Order with errors';
};

// ➤ Objednávky so statusmi, filtrami a zoradením
const getOrdersWithStatus = async (req, res) => {
  const statusMap = {
    new: "New Orders - To be assigned",
    assigned: "Assigned Orders - Not Started",
    inprogress: "In Progress - Design or Print",
    finishing: "Finishing & Binding",
    checked: "To be Checked",
    dispatch: "Ready for Dispatch",
    pickup: "Ready for Pickup",
    onhold: "On Hold",
    fulfilled: "Fulfilled",
    attention: "Need Attention - Order with errors"
  };

  const { status, assignee, from, to, sort, direction } = req.query;
  const cacheKey = `ordersWithStatus:${status || 'all'}`;

  console.log("GET /orders/with-status called with query:", req.query);

  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Returning cached ordersWithStatus');
    return res.json(cached);
  }

  try {
    const limitParam = parseInt(req.query.limit) || 20;
    const offsetParam = parseInt(req.query.offset) || 0;
    const sinceId = req.query.since_id || null;

    let url = `${SHOPIFY_API_URL}/orders.json?limit=${limitParam}`;
    if (sinceId) url += `&since_id=${sinceId}`;

    const ordersRes = await axios.get(url, { headers: HEADERS });
    let orders = ordersRes.data.orders;

    console.log(`Načítaných objednávok z Shopify: ${orders.length}`);

    if (from || to) {
      orders = orders.filter(order => {
        const createdAt = new Date(order.created_at);
        if (from && createdAt < new Date(from)) return false;
        if (to && createdAt > new Date(to)) return false;
        return true;
      });
    }

    if (sort === 'created_at') {
      orders.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return direction === 'desc' ? dateB - dateA : dateA - dateB;
      });
    }

    const enriched = [];

    for (const order of orders) {
      try {
        const metaRes = await axios.get(`${SHOPIFY_API_URL}/orders/${order.id}/metafields.json`, { headers: HEADERS });
        const metafields = metaRes.data.metafields || [];
        const custom_status = getCustomStatus(order, metafields);
        console.log(`Order ${order.name} má custom_status: ${custom_status}`);
        enriched.push({
          id: order.id,
          name: order.name,
          email: order.email,
          created_at: order.created_at,
          fulfillment_status: order.fulfillment_status,
          custom_status,
          assignee: metafields.find(m => m.key === 'assignee')?.value || '',
          expected_time: metafields.find(m => m.key === 'expected-time')?.value || '',
          metafields,
          tags: order.tags ? order.tags.split(',').map(tag => tag.trim()) : [],
        });
        await Order.findOneAndUpdate(
      { id: order.id },
      enrichedOrder,
      { upsert: true, new: true }
    );

        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        logToFile(`⚠️ Chyba pri objednávke ${order.name}:`, err.message);
        console.error(`⚠️ Chyba pri objednávke ${order.name}:`, err.message);
      }
    }

    let result = enriched;

    if (status) {
      const fullStatus = statusMap[status] || status;
      result = result.filter(o => o.custom_status === fullStatus);
    }

    if (assignee) {
      result = result.filter(o =>
        o.metafields?.some(mf =>
          ['assignee', 'assignee-2', 'assignee-3', 'assignee-4'].includes(mf.key) &&
          mf.value.includes(assignee)
        )
      );
    }

    result = result.slice(offsetParam, offsetParam + limitParam);

    console.log(`Posielam späť ${result.length} objednávok`);
    cache.set(cacheKey, result);
    console.log('Cache updated for ordersWithStatus');
    res.json(result);

  } catch (error) {
    logToFile('❌ Chyba pri spracovaní objednávok:', error.message);
    console.error('❌ Chyba pri spracovaní objednávok:', error.message);
    res.status(500).json({ error: 'Nepodarilo sa načítať objednávky.' });
  }
};



const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    // Základná objednávka
    const orderRes = await axios.get(`${SHOPIFY_API_URL}/orders/${id}.json`, {
      headers: HEADERS
    });
    const order = orderRes.data.order;

    // Metafields
    const metaRes = await axios.get(`${SHOPIFY_API_URL}/orders/${id}/metafields.json`, {
      headers: HEADERS
    });
    const metafields = metaRes.data.metafields || [];

    const custom_status = getCustomStatus(order, metafields);

    // Asignácie a progressy
    const assignee1 = metafields.find(m => m.key === 'assignee')?.value || '';
    const assignee2 = metafields.find(m => m.key === 'assignee-2')?.value || '';
    const assignee3 = metafields.find(m => m.key === 'assignee-3')?.value || '';
    const assignee4 = metafields.find(m => m.key === 'assignee-4')?.value || '';

    const progress1 = metafields.find(m => m.key === 'progress')?.value || '';
    const progress2 = metafields.find(m => m.key === 'progress-2')?.value || '';
    const progress3 = metafields.find(m => m.key === 'progress-3')?.value || '';
    const progress4 = metafields.find(m => m.key === 'progress-4')?.value || '';

    const detail = {
      id: order.id,
      name: order.name,
      email: order.email,
      phone: order.phone,
      created_at: order.created_at,
      fulfillment_status: order.fulfillment_status,
      total_price: order.total_price,
      line_items: order.line_items,
      shipping_address: order.shipping_address,
      metafields,
      assignee: assignee1,
      expected_time: metafields.find(m => m.key === 'expected-time')?.value || '',
      assignee_2: assignee2,
      assignee_3: assignee3,
      assignee_4: assignee4,
      progress: progress1,
      progress_2: progress2,
      progress_3: progress3,
      progress_4: progress4,
      custom_status
    };

    res.json(detail);

  } catch (error) {
    logToFile(`❌ Chyba pri získaní objednávky ${id}:`, error.message);
  console.error(`❌ Chyba pri získaní objednávky ${id}:`, error.message);
    res.status(500).json({ error: 'Nepodarilo sa načítať detail objednávky.' });
  }
};

/*
const getWorkloadByStaff = async (req, res) => {
  try {
    const ordersRes = await axios.get(`${SHOPIFY_API_URL}/orders.json?limit=50`, {
      headers: HEADERS
    });

    const orders = ordersRes.data.orders;
    const workloadMap = {};

    for (const order of orders) {
      if (!order?.id || typeof order.id !== 'number') {
        logToFile(`⚠️ Preskočená objednávka bez ID alebo s neplatným ID:`, order?.id);
  console.warn(`⚠️ Preskočená objednávka bez ID alebo s neplatným ID:`, order?.id);
        continue;
      }

      try {
        const metaRes = await axios.get(`${SHOPIFY_API_URL}/orders/${order.id}/metafields.json`, {
          headers: HEADERS
        });

        const metafields = metaRes.data.metafields || [];

        const assignee1 = metafields.find(m => m.key === 'assignee')?.value;
        const assignee2 = metafields.find(m => m.key === 'assignee-2')?.value;

        const parseList = (val) => {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        };

        const allAssignees = [
          ...parseList(assignee1),
          ...parseList(assignee2)
        ];

        allAssignees.forEach(name => {
          if (!name) return;
          if (!workloadMap[name]) workloadMap[name] = 0;
          workloadMap[name]++;
        });

        await new Promise(resolve => setTimeout(resolve, 300)); // API throttling
      } catch (innerErr) {
        logToFile(`⚠️ Metafields chyba pri objednávke ${order.id}:`, innerErr.message);
  console.error(`⚠️ Metafields chyba pri objednávke ${order.id}:`, innerErr.message);
        continue;
      }
    }

    const result = Object.entries(workloadMap).map(([assignee, count]) => ({
      assignee,
      count
    }));

    res.json(result);

  } catch (error) {
    logToFile("❌ Chyba pri výpočte workloadu:", error.response?.data || error.message);
  console.error("❌ Chyba pri výpočte workloadu:", error.response?.data || error.message);
    res.status(500).json({ error: "Nepodarilo sa načítať workload zamestnancov" });
  }
};

*/
const getWorkloadByStaff = async (req, res) => {
  try {
    const ordersRes = await axios.get(`${SHOPIFY_API_URL}/orders.json?limit=5`, {
      headers: HEADERS
    });

    const orders = ordersRes.data.orders;
    const workloadMap = {};

    logToFile(`🛠️ Spracúvam ${orders.length} objednávok`);
  console.log(`🛠️ Spracúvam ${orders.length} objednávok`);

    for (const order of orders) {
      const orderId = order?.id;
      if (!orderId || typeof orderId !== "number") {
        logToFile("⛔ Neplatné ID objednávky:", orderId);
  console.warn("⛔ Neplatné ID objednávky:", orderId);
        continue;
      }

      logToFile(`🔍 Spracovávam order.id=${orderId}`);
  console.log(`🔍 Spracovávam order.id=${orderId}`);

      try {
        const metaRes = await axios.get(`${SHOPIFY_API_URL}/orders/${orderId}/metafields.json`, {
          headers: HEADERS
        });

        const metafields = metaRes.data.metafields || [];

        const assignee1Raw = metafields.find(m => m.key === 'assignee')?.value || '[]';
        const assignee2Raw = metafields.find(m => m.key === 'assignee-2')?.value || '[]';

        let assignee1, assignee2;
        try {
          assignee1 = JSON.parse(assignee1Raw);
        } catch (err) {
          console.warn(`⚠️ JSON.parse error pri assignee1 (order ${order.id}):`, assignee1Raw);
          assignee1 = [];
        }
        try {
          assignee2 = JSON.parse(assignee2Raw);
        } catch (err) {
          console.warn(`⚠️ JSON.parse error pri assignee2 (order ${order.id}):`, assignee2Raw);
          assignee2 = [];
        }

        const allAssignees = [...assignee1, ...assignee2];

        allAssignees.forEach(name => {
          if (!workloadMap[name]) workloadMap[name] = 0;
          workloadMap[name]++;
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

      }  catch (innerErr) {
  logToFile("❌ Chyba pri získavaní metafields pre objednávku:");
  console.error("❌ Chyba pri získavaní metafields pre objednávku:");
  logToFile("🔸 order.id:", order?.id);
  console.error("🔸 order.id:", order?.id);
  logToFile("🔸 URL:", `${SHOPIFY_API_URL}/orders/${order.id}/metafields.json`);
  console.error("🔸 URL:", `${SHOPIFY_API_URL}/orders/${order.id}/metafields.json`);
  logToFile("🔸 Status:", innerErr.response?.status);
  console.error("🔸 Status:", innerErr.response?.status);
  logToFile("🔸 Data:", innerErr.response?.data || innerErr.message);
  console.error("🔸 Data:", innerErr.response?.data || innerErr.message);
  continue;
}

    }

    const result = Object.entries(workloadMap).map(([assignee, count]) => ({
      assignee,
      count
    }));

    res.json(result);

  } catch (error) {
    logToFile("❌ Globálna chyba pri výpočte workloadu:", error.response?.data || error.message);
  console.error("❌ Globálna chyba pri výpočte workloadu:", error.response?.data || error.message);
    res.status(500).json({ error: "Nepodarilo sa načítať workload zamestnancov" });
  }
};
const getOrderStats = async (req, res) => {
  try {
    const response = await axios.get(`${SHOPIFY_API_URL}/orders.json?limit=50`, {
      headers: HEADERS
    });

    const orders = response.data.orders;
    const statusMap = {};

    for (const order of orders) {
      const metaRes = await axios.get(`${SHOPIFY_API_URL}/orders/${order.id}/metafields.json`, {
        headers: HEADERS
      });

      const metafields = metaRes.data.metafields || [];
      const status = getCustomStatus(order, metafields);

      if (!statusMap[status]) statusMap[status] = 0;
      statusMap[status] += 1;

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const result = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count
    }));

    res.json(result);

  } catch (error) {
    logToFile("❌ Chyba pri generovaní štatistík:", error.message);
  console.error("❌ Chyba pri generovaní štatistík:", error.message);
    res.status(500).json({ error: "Nepodarilo sa načítať štatistiky" });
  }
};






module.exports = {
  getOrders,
  getOrdersWithStatus,
  getCustomStatus,
  getOrderStats,
  getOrderById,
  getWorkloadByStaff,
  
}
