const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Helper funkcie
const get = (mf, key) => mf?.custom?.[key] || '';

const countAssignees = (order) => {
  return [order.assignee_1, order.assignee_2, order.assignee_3, order.assignee_4]
    .filter(a => a && a.trim() !== '').length;
};

const hasProgress = (order, name) => {
  return [order.progress_1, order.progress_2, order.progress_3, order.progress_4]
    .some(p => p === name);
};

// Hlavný endpoint
router.get('/by-status', async (req, res) => {
  const statusFilter = req.query.status;
  if (!statusFilter) return res.status(400).json({ error: 'Missing status param' });

  try {
    const allOrders = await Order.find();

    const filtered = allOrders.filter(order => {
      const status = (order.fulfillment_status || '').toLowerCase();
      const mf = order.metafields || {};
      const customStatus = order.custom_status || get(mf, 'order-custom-status');
      const urgency = get(mf, 'turnaround-urgency')?.toUpperCase();
      const assignees = countAssignees(order);

      if (['fulfilled', 'cancelled'].includes(status)) return false;

      switch (statusFilter) {
        case 'newOrders':
          return status === 'unfulfilled' && customStatus === 'New Order' && assignees === 0;

        case 'urgentNewOrders':
          return status === 'unfulfilled' && customStatus === 'Urgent New Order' && assignees === 0 && urgency === 'URGENT';

        case 'assignedOrders':
          return ['unfulfilled', 'partially fulfilled'].includes(status)
            && ['New Order', 'Urgent New Order'].includes(customStatus)
            && assignees > 0
            && hasProgress(order, 'Assigned');

        case 'inProgress':
          return ['unfulfilled', 'partially fulfilled'].includes(status)
            && ['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus)
            && hasProgress(order, 'In Progress');

        case 'printedDone':
          return ['unfulfilled', 'partially fulfilled'].includes(status)
            && ['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus)
            && hasProgress(order, 'Printed-Done');

        case 'finishingBinding':
          return ['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus)
            && hasProgress(order, 'Finishing & Binding');

        case 'toBeChecked':
          return ['unfulfilled', 'partially fulfilled'].includes(status)
            && hasProgress(order, 'To Be Checked');

        case 'readyForDispatch':
          return status === 'unfulfilled' && hasProgress(order, 'Ready for Dispatch');

        case 'readyForPickup':
          return status !== 'fulfilled' && hasProgress(order, 'Ready for Pickup');

        case 'onHold':
          return status !== 'fulfilled' && customStatus === 'On Hold';

        case 'needAttention':
          return status !== 'fulfilled' && customStatus === 'Need Attention';

        default:
          return false;
      }
    });

    res.json({ count: filtered.length, orders: filtered });
  } catch (err) {
    console.error('Error fetching orders by status:', err);
    res.status(500).json({ error: 'Failed to fetch filtered orders' });
  }
});

module.exports = router;
