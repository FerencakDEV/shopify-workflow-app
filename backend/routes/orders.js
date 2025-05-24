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

// ✅ Import spustený ako async task (neblokuje odpoveď)




module.exports = router;
