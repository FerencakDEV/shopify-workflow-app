const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

const get = (mf, key) => {
  if (!mf) return '';
  if (mf.custom && key in mf.custom) return mf.custom[key];
  if (key in mf) return mf[key];
  return '';
};

const countAssignees = (mf) => {
  return ['assignee', 'assignee-2', 'assignee-3', 'assignee-4']
    .map(key => get(mf, key)).filter(Boolean).length;
};

const hasProgress = (mf, name) => {
  return ['progress', 'progress-2', 'progress-3', 'progress-4']
    .some(key => get(mf, key) === name);
};

router.get('/by-status', async (req, res) => {
  const statusFilter = req.query.status;
  if (!statusFilter) return res.status(400).json({ error: 'Missing status param' });

  try {
    const allOrders = await Order.find();

    const filtered = allOrders.filter(order => {
      const status = (order.fulfillment_status || '').toLowerCase();
      const mf = order.metafields;
      const customStatus = get(mf, 'order-custom-status') || order.custom_status;
      const urgency = get(mf, 'turnaround-urgency')?.toUpperCase();
      const assignees = countAssignees(mf);

      // Fulfilled or Cancelled are ignored globally
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
            && hasProgress(mf, 'Assigned');

        case 'inProgress':
          return ['unfulfilled', 'partially fulfilled'].includes(status)
            && ['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus)
            && hasProgress(mf, 'In Progress');

        case 'printedDone':
          return ['unfulfilled', 'partially fulfilled'].includes(status)
            && ['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus)
            && hasProgress(mf, 'Printed-Done');

        case 'finishingBinding':
          return ['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus)
            && hasProgress(mf, 'Finishing & Binding');

        case 'toBeChecked':
          return ['unfulfilled', 'partially fulfilled'].includes(status)
            && hasProgress(mf, 'To Be Checked');

        case 'readyForDispatch':
          return status === 'unfulfilled' && hasProgress(mf, 'Ready for Dispatch');

        case 'readyForPickup':
          return status !== 'fulfilled' && hasProgress(mf, 'Ready for Pickup');

        case 'onHold':
          return status !== 'fulfilled' && customStatus === 'On Hold';

        case 'needAttention':
          return status !== 'fulfilled' && customStatus === 'Need Attention';

        default:
          // 🔍 Generic fallback: match against order_status, custom_status, or any progress fields
          return (
            (order.order_status === statusFilter) ||
            (customStatus === statusFilter) ||
            ['progress', 'progress-2', 'progress-3', 'progress-4'].some(
              key => get(mf, key) === statusFilter
            )
          );
      }
    });

    res.json({ count: filtered.length, orders: filtered });
  } catch (err) {
    console.error('❌ Error fetching orders by status:', err);
    res.status(500).json({ error: 'Failed to fetch filtered orders' });
  }
});

module.exports = router;
