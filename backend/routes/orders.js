const express = require('express');
const router = express.Router();
const { fullImport } = require('../controllers/fullImportController');
const {
  getOrders,
  getOrdersWithStatus,
  getCustomStatus,
  getOrderStats,
  getOrderById,
  getWorkloadByStaff
} = require('../controllers/orderController');

const { exportOrders } = require('../controllers/exportController');

router.get('/', getOrders);
router.get('/with-status', getOrdersWithStatus);
router.get('/export', exportOrders);
router.get('/stats', getOrderStats);
router.get('/:id', getOrderById);
router.get('/workload', getWorkloadByStaff);
router.get('/full-import', fullImport);



module.exports = router;
