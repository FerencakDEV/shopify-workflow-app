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
      progress_4: 1
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
    const regex = (value) => new RegExp(`^${value}$`, 'i');

    for (const order of orders) {
      const status = (order.fulfillment_status || '').toLowerCase();
      const customStatus = (order.custom_status || '').toLowerCase();
      const isUrgent = order.is_urgent === true || order.is_urgent === 'true';

      const progresses = [
        order.progress_1,
        order.progress_2,
        order.progress_3,
        order.progress_4
      ].map(p => (p || '').trim().toLowerCase()).filter(Boolean);

      const assignees = [
        order.assignee_1,
        order.assignee_2,
        order.assignee_3,
        order.assignee_4
      ].map(a => (a || '').trim()).filter(Boolean);

      const noProgress = progresses.length === 0;
      const noAssignee = assignees.length === 0;

      // Exclude fulfilled and cancelled
      if (["fulfilled", "cancelled"].includes(status)) continue;

      // On Hold
      if (customStatus === 'on hold') {
        counts.onHold++;
        continue;
      }

      // Ready for Pickup
      if (progresses.includes('ready for pickup')) {
        counts.readyForPickup++;
        continue;
      }

      // Urgent New Order
      if (['new order', 'hold released'].includes(customStatus) && isUrgent && noProgress && noAssignee) {
        counts.urgentNewOrders++;
        continue;
      }

      // New Order
      if (['new order', 'hold released'].includes(customStatus) && !isUrgent && noProgress && noAssignee) {
        counts.newOrders++;
        continue;
      }

      // Assigned
      if (progresses.includes('assigned')) counts.assignedOrders++;

      // In Progress
      if (progresses.includes('in progress')) counts.inProgress++;

      // Printed Done
      if (progresses.includes('printed-done')) counts.printedDone++;

      // Finishing & Binding
      if (progresses.includes('finishing & binding')) counts.finishingBinding++;

      // To Be Checked
      if (progresses.includes('to be checked')) counts.toBeChecked++;

      // Ready for Dispatch
      if (progresses.includes('ready for dispatch')) counts.readyForDispatch++;

      // Need Attention Logic
      const empty = [null, '', undefined];
      const mismatched = [1, 2, 3, 4].some(i => {
        const assignee = order[`assignee_${i}`];
        const progress = order[`progress_${i}`];

        const hasAssignee = !empty.includes(assignee);
        const hasProgress = !empty.includes(progress);

        return (hasAssignee && !hasProgress) || (!hasAssignee && hasProgress);
      });

      if (mismatched) counts.needAttention++;
    }

    res.json(counts);
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard counts' });
  }
});

module.exports = router;
