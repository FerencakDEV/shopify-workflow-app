const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/status-counts', async (req, res) => {
  try {
    const orders = await Order.find({}, {
      fulfillment_status: 1,
      order_status: 1,
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

    const knownProgresses = [
      'assigned',
      'in progress',
      'printed-done',
      'finishing & binding',
      'to be checked',
      'ready for dispatch',
      'ready for pickup'
    ];

    for (const order of orders) {
      const status = (order.fulfillment_status || '').toLowerCase();
      const orderStatus = (order.order_status || '').toLowerCase();
      const isUrgent = order.is_urgent === true;

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

      // Filter out completed orders
      if (['fulfilled', 'cancelled'].includes(status)) continue;

      if (status === 'on hold' || orderStatus === 'on hold') {
        counts.onHold++;
        continue;
      }

      if (status === 'ready for pickup' || orderStatus === 'ready for pickup') {
        counts.readyForPickup++;
        continue;
      }

      // Strict new/urgent check (must have no assignee and no progress)
      if ((orderStatus === 'urgent new order' || isUrgent) && noProgress && noAssignee) {
        counts.urgentNewOrders++;
        continue;
      }

      if (orderStatus === 'new order' && !isUrgent && noProgress && noAssignee) {
        counts.newOrders++;
        continue;
      }

      // Widget counts by progress
      const used = new Set();

      for (const progress of progresses) {
        if (used.has(progress)) continue;
        used.add(progress);

        switch (progress) {
          case 'assigned':
            counts.assignedOrders++;
            break;
          case 'in progress':
            counts.inProgress++;
            break;
          case 'printed-done':
            counts.printedDone++;
            break;
          case 'finishing & binding':
            counts.finishingBinding++;
            break;
          case 'to be checked':
            counts.toBeChecked++;
            break;
          case 'ready for dispatch':
            counts.readyForDispatch++;
            break;
        }
      }

      // If inconsistent number of assignees/progress OR unknown progress, add to need attention
      const hasUnknown = progresses.some(p => !knownProgresses.includes(p));
      const partial = progresses.length !== assignees.length;

      if (!['on hold', 'ready for pickup'].includes(orderStatus) && (hasUnknown || partial)) {
        counts.needAttention++;
      }
    }

    res.json(counts);
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard counts' });
  }
});

module.exports = router;
