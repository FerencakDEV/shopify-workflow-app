const express = require('express');
const router = express.Router();

const Order = require('../models/Order');

// ✅ Funkčný import zo správneho súboru
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

// 📦 API endpointy

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
  'all-orders': '.*' // špeciálny prípad
};

// ✅ PRESUNUTÉ NAD /:id
router.get('/by-status/:key', async (req, res) => {
  const key = req.params.key;
  const status = STATUS_MAP[key];

  if (!status) {
    return res.status(400).send('Invalid status key');
  }

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
  query = {}; // All orders
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

// ⛔ Daj AŽ SEM, aby neblokoval ostatné
router.get('/:id', getOrderById);

module.exports = router;
