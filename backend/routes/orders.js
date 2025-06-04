// routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

const {
  getOrders,
  getOrdersWithStatus,
  getCustomStatus,
  getOrderStats,
  getOrderById,
  getWorkloadByStaff
} = require('../controllers/orderController');

const { exportOrders } = require('../controllers/exportController');
const { importOrdersCleaned } = require('../controllers/fullImportDescending');

// 🔁 Import všetkých objednávok
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

// 🔧 Ostatné štandardné endpointy
router.get('/', getOrders);
router.get('/with-status', getOrdersWithStatus);
router.get('/export', exportOrders);
router.get('/stats', getOrderStats);
router.get('/workload', getWorkloadByStaff);

// 📦 Mapa status key → custom_status
const STATUS_MAP = {
  newOrders: 'New Order',
  urgentNewOrders: 'Urgent New Order',
  assignedOrders: 'Assigned Order',
  inProgress: 'In Progress',
  finishingBinding: 'Finishing & Binding',
  toBeChecked: 'To be Checked',
  needAttention: 'Need Attention',
  onHold: 'On Hold',
  readyForDispatch: 'Ready for Dispatch',
  readyForPickup: 'Ready for Pickup',
  fulfilled: 'Fulfilled',
  allOrders: '.*'
};

// ✅ Endpoint: /by-status?status=newOrders
router.get('/by-status', async (req, res) => {
  const key = req.query.status;
  const status = STATUS_MAP[key];

  if (!status) return res.status(400).json({ error: 'Invalid status key' });

  try {
    let query = {
      fulfillment_status: { $ne: 'fulfilled' },
      custom_status: {}
    };

    if (status === '.*') {
      delete query.custom_status; // všetky okrem fulfilled
    } else {
      query.custom_status = new RegExp(`^${status}$`, 'i');
    }

    const orders = await Order.find(query, {
      order_number: 1,
      custom_status: 1,
      fulfillment_status: 1,
      assignee: 1,
      progress: 1,
      metafields: 1
    });

    res.json({ count: orders.length, orders });
  } catch (err) {
    console.error(`❌ Error fetching orders by status '${key}':`, err);
    res.status(500).json({ error: 'Failed to fetch filtered orders' });
  }
});

// 🟦 Detail objednávky podľa ID (musí ísť až na koniec)
router.get('/:id', getOrderById);

module.exports = router;
