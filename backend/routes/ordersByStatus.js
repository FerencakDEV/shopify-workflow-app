const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Pomocné funkcie
const getProgressArray = (order) => {
  return [
    order.progress_1,
    order.progress_2,
    order.progress_3,
    order.progress_4
  ].filter(Boolean);
};

router.get('/by-status', async (req, res) => {
  const status = req.query.status;
  if (!status) return res.status(400).json({ error: 'Missing status param' });

  try {
    let query = {};

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
          $or: [
            { progress: { $in: ['Assigned'] } },
            { progress_1: 'Assigned' },
            { progress_2: 'Assigned' },
            { progress_3: 'Assigned' },
            { progress_4: 'Assigned' },
          ],
          assignee: { $exists: true, $not: { $size: 0 } }
        };
        break;

      case 'inProgress':
        query = {
          custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
          fulfillment_status: { $in: ['unfulfilled', 'partially_fulfilled'] },
          $or: [
            { progress: { $in: ['In Progress'] } },
            { progress_1: 'In Progress' },
            { progress_2: 'In Progress' },
            { progress_3: 'In Progress' },
            { progress_4: 'In Progress' },
          ]
        };
        break;

      case 'finishingBinding':
        query = {
          custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
          fulfillment_status: { $ne: 'fulfilled' },
          $or: [
            { progress: { $in: ['Finishing & Binding'] } },
            { progress_1: 'Finishing & Binding' },
            { progress_2: 'Finishing & Binding' },
            { progress_3: 'Finishing & Binding' },
            { progress_4: 'Finishing & Binding' },
          ]
        };
        break;

      case 'toBeChecked':
        query = {
          fulfillment_status: { $in: ['unfulfilled', 'partially_fulfilled'] },
          $or: [
            { progress: { $in: ['To be Checked'] } },
            { progress_1: 'To be Checked' },
            { progress_2: 'To be Checked' },
            { progress_3: 'To be Checked' },
            { progress_4: 'To be Checked' },
          ]
        };
        break;

      case 'readyForDispatch':
        query = {
          fulfillment_status: 'unfulfilled',
          $or: [
            { progress: { $in: ['Ready for Dispatch'] } },
            { progress_1: 'Ready for Dispatch' },
            { progress_2: 'Ready for Dispatch' },
            { progress_3: 'Ready for Dispatch' },
            { progress_4: 'Ready for Dispatch' },
          ]
        };
        break;

      case 'readyForPickup':
        query = {
          fulfillment_status: { $ne: 'fulfilled' },
          $or: [
            { progress: { $in: ['Ready for Pickup'] } },
            { progress_1: 'Ready for Pickup' },
            { progress_2: 'Ready for Pickup' },
            { progress_3: 'Ready for Pickup' },
            { progress_4: 'Ready for Pickup' },
          ]
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
        query = {};
        break;

      default:
        return res.status(400).json({ error: 'Invalid status param' });
    }

    const orders = await Order.find(query, {
      order_number: 1,
      custom_status: 1,
      fulfillment_status: 1,
      assignee: 1,
      progress: 1,
      metafields: 1
    }).sort({ created_at: -1 }).limit(300);

    res.json({ count: orders.length, orders });

  } catch (err) {
    console.error('❌ Error in /by-status:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
