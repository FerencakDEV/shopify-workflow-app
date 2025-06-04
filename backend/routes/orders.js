const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// 📦 API endpointy a controller funkcie
const { importOrdersCleaned } = require('../controllers/fullImportDescending');
const {
  getOrders,
  getOrdersWithStatus,
  getCustomStatus,
  getOrderStats,
  getOrderById,
  getWorkloadByStaff
} = require('../controllers/orderController');
const { exportOrders } = require('../controllers/exportController');

// 🔑 Mapovanie statusov pre frontend
const STATUS_MAP = {
  'new-orders': 'New Order',
  'urgent-new-orders': 'Urgent New Order',
  'assigned-orders': 'Assigned Order',
  'in-progress': 'In Progress',
  'finishing-binding': 'Finishing & Binding',
  'to-be-checked': 'To be Checked',
  'need-attention': 'Need Attention',
  'on-hold': 'On Hold',
  'ready-for-dispatch': 'Ready for Dispatch',
  'ready-for-pickup': 'Ready for Pickup',
  'fulfilled': 'Fulfilled',
  'all-orders': '.*'
};

// ✅ Spustiť import
router.get('/full-import', async (req, res) => {
  try {
    await importOrdersCleaned();
    res.status(200).json({ message: '✅ Import úspešne dokončený' });
  } catch (err) {
    console.error('❌ Import chyba z route:', {
      message: err.message,
      stack: err.stack,
      url: err.config?.url,
      method: err.config?.method,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      headers: err.response?.headers
    });
    res.status(500).json({ error: 'Nepodarilo sa spustiť import', detail: err.response?.data || err.message });
  }
});

router.get('/', getOrders);
router.get('/with-status', getOrdersWithStatus);
router.get('/export', exportOrders);
router.get('/stats', getOrderStats);
router.get('/workload', getWorkloadByStaff);

// 🧠 Helpery
const get = (mf, key) => mf?.custom?.[key] || '';
const countAssignees = (mf) =>
  ['assignee', 'assignee-2', 'assignee-3', 'assignee-4'].map(key => get(mf, key)).filter(Boolean).length;
const hasProgress = (mf, name) =>
  ['progress', 'progress-2', 'progress-3', 'progress-4'].some(key => get(mf, key) === name);

// 🚦 Logika pre status z query parametru (?status=...)
router.get('/by-status', async (req, res) => {
  const statusFilter = req.query.status;
  if (!statusFilter) return res.status(400).json({ error: 'Missing status param' });

  try {
    const allOrders = await Order.find();
    const filtered = allOrders.filter(order => {
      const status = (order.fulfillment_status || '').toLowerCase();
      const mf = order.metafields;
      const customStatus = get(mf, 'order-custom-status');
      const urgency = get(mf, 'turnaround-urgency')?.toUpperCase();
      const assignees = countAssignees(mf);

      if (['fulfilled', 'cancelled'].includes(status)) return false;

      switch (statusFilter) {
        case 'newOrders':
          return status === 'unfulfilled' && customStatus === 'New Order' && assignees === 0;
        case 'urgentNewOrders':
          return status === 'unfulfilled' && customStatus === 'Urgent New Order' && assignees === 0 && urgency === 'URGENT';
        case 'assignedOrders':
          return ['unfulfilled', 'partially fulfilled'].includes(status)
            && ['New Order', 'Urgent New Order'].includes(customStatus)
            && assignees > 0
            && hasProgress(mf, 'Assigned');
        case 'inProgress':
          return ['unfulfilled', 'partially fulfilled'].includes(status)
            && ['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus)
            && hasProgress(mf, 'In Progress');
        case 'printedDone':
          return ['unfulfilled', 'partially fulfilled'].includes(status)
            && ['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus)
            && hasProgress(mf, 'Printed-Done');
        case 'finishingBinding':
          return ['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus)
            && hasProgress(mf, 'Finishing & Binding');
        case 'toBeChecked':
          return ['unfulfilled', 'partially fulfilled'].includes(status)
            && hasProgress(mf, 'To be Checked');
        case 'readyForDispatch':
          return status === 'unfulfilled' && hasProgress(mf, 'Ready for Dispatch');
        case 'readyForPickup':
          return status !== 'fulfilled' && hasProgress(mf, 'Ready for Pickup');
        case 'onHold':
          return status !== 'fulfilled' && customStatus === 'On Hold';
        case 'needAttention':
          return status !== 'fulfilled' && customStatus === 'Need Attention';
        default:
          return false;
      }
    });

    res.json({ count: filtered.length, orders: filtered });
  } catch (err) {
    console.error('Error fetching orders by status:', err);
    res.status(500).json({ error: 'Failed to fetch filtered orders' });
  }
});

// 🌐 Logika pre status z URL parametra /by-status/:key
router.get('/by-status/:key', async (req, res) => {
  const key = req.params.key;
  const status = STATUS_MAP[key];

  if (!status) return res.status(400).send('Invalid status key');

  try {
    let query = {};

    if (status === 'New Order') {
      query = {
        custom_status: 'New Order',
        $or: [
          { metafields: { $exists: false } },
          { metafields: {} },
          {
            $and: [
              { 'metafields.assignee': { $exists: false } },
              { 'metafields.progress': { $exists: false } },
              { 'metafields["order-custom-status"]': { $in: [null, '', 'New Order'] } },
              { 'metafields["expected-time"]': { $exists: false } }
            ]
          }
        ]
      };
    } else if (status === '.*') {
      query = {};
    } else {
      query = { custom_status: new RegExp(`^${status}$`, 'i') };
    }

    const orders = await Order.find(query, {
      order_number: 1,
      custom_status: 1,
      fulfillment_status: 1,
      metafields: 1
    });

    res.json(orders);
  } catch (err) {
    console.error(`❌ Error loading orders by status '${status}':`, err.message);
    res.status(500).send('Server error');
  }
});

// 🧾 Detail objednávky
router.get('/:id', getOrderById);

module.exports = router;
