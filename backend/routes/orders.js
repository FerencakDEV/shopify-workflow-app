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
router.get('/full-import', (req, res) => {
  res.send('✅ Import spustený... beží na pozadí');
  importOrdersCleaned()
    .then(() => console.log('✅ Full import dokončený'))
    .catch(err => console.error('❌ Chyba pri importe:', err));
});

module.exports = router;
