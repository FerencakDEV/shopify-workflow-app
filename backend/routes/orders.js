const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

const {
  getOrders,
  getOrdersWithStatus,
  getOrderStats,
  getOrderById,
  getWorkloadByStaff
} = require('../controllers/orderController');

const { exportOrders } = require('../controllers/exportController');
const { importOrdersCleaned } = require('../controllers/fullImportDescending');

// 🔄 Reimport z API
router.get('/full-import', async (req, res) => {
  try {
    await importOrdersCleaned();
    res.status(200).json({ message: '✅ Import úspešne dokončený' });
  } catch (err) {
    console.error('❌ Import error:', err.message);
    res.status(500).json({ error: 'Import failed', detail: err.message });
  }
});

// Základné endpointy
router.get('/', getOrders);
router.get('/with-status', getOrdersWithStatus);
router.get('/export', exportOrders);
router.get('/stats', getOrderStats);
router.get('/workload', getWorkloadByStaff);

// 🧠 Logika filtrov podľa statusu
router.get('/by-status', async (req, res) => {
  const status = req.query.status;
  if (!status) return res.status(400).json({ error: 'Missing status param' });

  const q = (cond) => Order.find(cond, {
    order_number: 1,
    custom_status: 1,
    fulfillment_status: 1,
    assignee: 1,
    progress: 1,
    metafields: 1
  }).sort({ created_at: -1 }).limit(300);

  let query = {};

  try {
    switch (status) {
      case 'newOrders':
        query = {
          custom_status: 'New Order',
          fulfillment_status: { $ne: 'fulfilled' },
          $or: [
            { assignee: { $size: 0 } },
            { assignee: { $exists: false } },
            { assignee: null }
          ]
        };
        break;

      case 'urgentNewOrders':
        query = {
          custom_status: 'Urgent New Order',
          fulfillment_status: { $ne: 'fulfilled' },
          is_urgent: true,
          $or: [
            { assignee: { $size: 0 } },
            { assignee: { $exists: false } },
            { assignee: null }
          ]
        };
        break;

      case 'assignedOrders':
        query = {
          custom_status: { $in: ['New Order', 'Urgent New Order'] },
          fulfillment_status: { $in: ['unfulfilled', 'partially_fulfilled'] },
          progress: 'Assigned',
          assignee: { $exists: true, $not: { $size: 0 } }
        };
        break;

      case 'inProgress':
        query = {
          custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
          fulfillment_status: { $in: ['unfulfilled', 'partially_fulfilled'] },
          progress: 'In Progress'
        };
        break;

      case 'finishingBinding':
        query = {
          custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
          progress: 'Finishing & Binding',
          fulfillment_status: { $ne: 'fulfilled' }
        };
        break;

      case 'toBeChecked':
        query = {
          progress: 'To be Checked',
          fulfillment_status: { $in: ['unfulfilled', 'partially_fulfilled'] }
        };
        break;

      case 'readyForDispatch':
        query = {
          progress: 'Ready for Dispatch',
          fulfillment_status: 'unfulfilled'
        };
        break;

      case 'readyForPickup':
        query = {
          progress: 'Ready for Pickup',
          fulfillment_status: { $ne: 'fulfilled' }
        };
        break;

      case 'onHold':
        query = {
          custom_status: 'On Hold',
          fulfillment_status: { $ne: 'fulfilled' }
        };
        break;

      case 'needAttention':
        query = {
          custom_status: 'Need Attention',
          fulfillment_status: { $ne: 'fulfilled' }
        };
        break;

      case 'fulfilled':
        query = {
          fulfillment_status: 'fulfilled'
        };
        break;

      case 'allOrders':
        query = {}; // bez filtra
        break;

      default:
        return res.status(400).json({ error: 'Invalid status param' });
    }

    const orders = await q(query);
    res.json({ count: orders.length, orders });

  } catch (err) {
    console.error('❌ Error in /by-status:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Detail objednávky
router.get('/:id', getOrderById);

module.exports = router;
