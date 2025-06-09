const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/status-counts', async (req, res) => {
  try {
    const orders = await Order.find({}, {
      fulfillment_status: 1,
      custom_status: 1,
      is_urgent: 1,
      assignee_1: 1,
      assignee_2: 1,
      assignee_3: 1,
      assignee_4: 1,
      progress_1: 1,
      progress_2: 1,
      progress_3: 1,
      progress_4: 1,
      id: 1
    });

    const counts = {
      newOrders: 0,
      urgentNewOrders: 0,
      assignedOrders: 0,
      inProgress: 0,
      printedDone: 0,
      finishingBinding: 0,
      toBeChecked: 0,
      readyForDispatch: 0,
      readyForPickup: 0,
      onHold: 0,
      needAttention: 0,
      allOrders: orders.length
    };

    const blank = [null, '', undefined];
    const excludeFulfilled = ['fulfilled', 'cancelled', 'ready-for-pickup', 'on-hold'];
    const regexMatch = (value) => new RegExp(`^${value}$`, 'i');

    for (const order of orders) {
      const status = (order.fulfillment_status || '').toLowerCase();
      const customStatus = (order.custom_status || '').toLowerCase();

      let isUrgent = order.is_urgent === true || order.is_urgent === 'true';
      if (customStatus === 'urgent new order') isUrgent = true;

      const progresses = [
        order.progress_1,
        order.progress_2,
        order.progress_3,
        order.progress_4
      ].map(p => (p || '').trim().toLowerCase());

      const assignees = [
        order.assignee_1,
        order.assignee_2,
        order.assignee_3,
        order.assignee_4
      ].map(a => (a || '').trim());

      const noProgress = progresses.every(p => blank.includes(p));
      const noAssignee = assignees.every(a => blank.includes(a));

      // ✅ On Hold
      if (status === 'on-hold') {
        counts.onHold++;
        continue;
      }

      // ✅ Fulfilled exclusion (po On Hold)
      if (excludeFulfilled.includes(status)) continue;

      // ✅ Ready for Pickup
      if (
        status !== 'fulfilled' &&
        progresses.some(p => regexMatch('ready for pickup').test(p))
      ) {
        counts.readyForPickup++;
        continue;
      }

      // ✅ Urgent New Order
      if (customStatus === 'urgent new order' && noProgress && noAssignee) {
        counts.urgentNewOrders++;
        continue;
      }

      // ✅ New Order
      if (
        ['new order', 'hold released'].includes(customStatus) &&
        !isUrgent &&
        noProgress &&
        noAssignee
      ) {
        counts.newOrders++;
        continue;
      }

      // ✅ Assigned Orders
      if (
        ['new order', 'urgent new order', 'hold released'].includes(customStatus) &&
        progresses.some(p => regexMatch('assigned').test(p))
      ) {
        counts.assignedOrders++;
      }

      // ✅ In Progress
      if (
        ['new order', 'urgent new order', 'hold released'].includes(customStatus) &&
        progresses.some(p => regexMatch('in progress').test(p))
      ) {
        counts.inProgress++;
      }

      // ✅ Printed Done
      if (
        ['new order', 'urgent new order', 'hold released'].includes(customStatus) &&
        progresses.some(p => regexMatch('printed-done').test(p))
      ) {
        counts.printedDone++;
      }

      // ✅ Finishing & Binding
      if (
        ['new order', 'urgent new order', 'hold released'].includes(customStatus) &&
        progresses.some(p => regexMatch('finishing & binding').test(p))
      ) {
        counts.finishingBinding++;
      }

      // ✅ To Be Checked
      const toBeCheckedCount = progresses.filter(p => p === 'to be checked').length;
      if (toBeCheckedCount > 0) {
        counts.toBeChecked += toBeCheckedCount;
      }

      // ✅ Ready for Dispatch
      if (
        status === 'unfulfilled' &&
        progresses.some(p => regexMatch('ready for dispatch').test(p))
      ) {
        counts.readyForDispatch++;
      }

      // ✅ Need Attention
      const needAttentionMatch = [1, 2, 3, 4].some(i => {
  const aRaw = order[`assignee_${i}`];
  const pRaw = order[`progress_${i}`];

  const a = typeof aRaw === 'string' ? aRaw.trim() : aRaw;
  const p = typeof pRaw === 'string' ? pRaw.trim() : pRaw;

  return (
    (!blank.includes(a) && blank.includes(p)) ||
    (!blank.includes(p) && blank.includes(a))
  );
});

if (
  needAttentionMatch &&
  status === 'unfulfilled' &&
  customStatus !== 'Ready for Pickup'
) {
  counts.needAttention++;
  continue;
}
    }

    res.json({ counts });
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard counts' });
  }
});

module.exports = router;
