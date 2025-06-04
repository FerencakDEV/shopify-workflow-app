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

router.get('/full-import', async (req, res) => {
  try {
    await importOrdersCleaned();
    res.status(200).json({ message: '✅ Import úspešne dokončený' });
  } catch (err) {
    console.error('❌ Import error:', err.message);
    res.status(500).json({ error: 'Import failed', detail: err.message });
  }
});

router.get('/', getOrders);
router.get('/with-status', getOrdersWithStatus);
router.get('/export', exportOrders);
router.get('/stats', getOrderStats);
router.get('/workload', getWorkloadByStaff);

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
  });

  try {
    let query = {};

    switch (status) {
      case 'newOrders':
        query = {
          custom_status: 'New Order',
          fulfillment_status: { $ne: 'fulfilled' },
          $or: [
            { assignee: { $size: 0 } },
            {
              $and: [
                { 'assignee.0': { $exists: false } },
                { 'metafields["assignee"]': { $in: [null, ''] } }
              ]
            }
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
            {
              $and: [
                { 'assignee.0': { $exists: false } },
                { 'metafields["assignee"]': { $in: [null, ''] } }
              ]
            }
          ]
        };
        break;

      case 'assignedOrders':
        query = {
          custom_status: { $in: ['New Order', 'Urgent New Order'] },
          fulfillment_status: { $in: ['unfulfilled', 'partially_fulfilled'] },
          'progress': 'Assigned',
          $or: [
            { assignee: { $ne: [] } },
            { 'assignee.0': { $exists: true } }
          ]
        };
        break;

      case 'inProgress':
        query = {
          custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
          fulfillment_status: { $in: ['unfulfilled', 'partially_fulfilled'] },
          'progress': 'In Progress'
        };
        break;

      case 'finishingBinding':
        query = {
          custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
          'progress': 'Finishing & Binding'
        };
        break;

      case 'toBeChecked':
        query = {
          fulfillment_status: { $in: ['unfulfilled', 'partially_fulfilled'] },
          'progress': 'To be Checked'
        };
        break;

      case 'readyForDispatch':
        query = {
          fulfillment_status: 'unfulfilled',
          'progress': 'Ready for Dispatch'
        };
        break;

      case 'readyForPickup':
        query = {
          fulfillment_status: { $ne: 'fulfilled' },
          'progress': 'Ready for Pickup'
        };
        break;

      case 'onHold':
        query = {
          fulfillment_status: { $ne: 'fulfilled' },
          custom_status: 'On Hold'
        };
        break;

      case 'needAttention':
        query = {
          fulfillment_status: { $ne: 'fulfilled' },
          custom_status: 'Need Attention'
        };
        break;

      case 'fulfilled':
        query = {
          fulfillment_status: 'fulfilled'
        };
        break;

      case 'allOrders':
        query = {}; // No filter
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

router.get('/:id', getOrderById);

module.exports = router;
