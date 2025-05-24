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
router.get('/', getOrders);
router.get('/with-status', getOrdersWithStatus);
router.get('/export', exportOrders);
router.get('/stats', getOrderStats);
router.get('/:id', getOrderById);
router.get('/workload', getWorkloadByStaff);

// ✅ Import spustený ako async task (neblokuje odpoveď)
router.get('/full-import', async (req, res) => {
  try {
    await importOrdersCleaned();
    res.status(200).json({ message: '✅ Full import dokončený' });
  } catch (err) {
    console.error('❌ Full import error:', err.message);
    res.status(500).json({ error: 'Import zlyhal', details: err.message });
  }
});

module.exports = router;
