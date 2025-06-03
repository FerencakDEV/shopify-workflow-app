const express = require('express');
const router = express.Router();

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
router.get('/:id', getOrderById);
router.get('/workload', getWorkloadByStaff);
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
  'all-orders': '.*' // special case, if you want
};
router.get('/by-status/:key', async (req, res) => {
  const key = req.params.key;
  const status = STATUS_MAP[key];

  if (!status) {
    return res.status(400).send('Invalid status key');
  }

  try {
    const query = status === '.*'
      ? {} // all orders
      : { custom_status: new RegExp(`^${status}$`, 'i') };

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




module.exports = router;
