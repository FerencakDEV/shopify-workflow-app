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

    const getProgressArray = (order) => [
      (order.progress_1 || '').trim(),
      (order.progress_2 || '').trim(),
      (order.progress_3 || '').trim(),
      (order.progress_4 || '').trim()
    ].filter(p => p !== '');

    const getAssigneeArray = (order) => [
      (order.assignee_1 || '').trim(),
      (order.assignee_2 || '').trim(),
      (order.assignee_3 || '').trim(),
      (order.assignee_4 || '').trim()
    ].filter(a => a !== '');

    orders.forEach(order => {
      const status = (order.fulfillment_status || '').toLowerCase();
      const customStatus = order.order_status || '';
      const isUrgent = order.is_urgent === true;
      const progresses = getProgressArray(order);
      const assignees = getAssigneeArray(order);

      if (['fulfilled', 'cancelled'].includes(status)) return;

      // ON HOLD
      if (status === 'onhold' || customStatus === 'On Hold') {
        counts.onHold += 1;
      }

      // READY FOR PICKUP
      if (status === 'ready for pickup' || customStatus === 'Ready for Pickup') {
        counts.readyForPickup += 1;
      }

      const noProgress = progresses.length === 0;
      const noAssignee = assignees.length === 0;

      // URGENT NEW ORDER
      if ((customStatus === 'Urgent New Order' || isUrgent) && noProgress && noAssignee) {
        counts.urgentNewOrders += 1;
      }

      // NEW ORDER
      if (customStatus === 'New Order' && !isUrgent && noProgress && noAssignee) {
        counts.newOrders += 1;
      }

      // ostatné widgety – môžu byť súčasne viaceré:
      progresses.forEach(progress => {
        const key = progress.toLowerCase();

        switch (key) {
          case 'assigned':
            counts.assignedOrders += 1;
            break;
          case 'in progress':
            counts.inProgress += 1;
            break;
          case 'printed-done':
            counts.printedDone += 1;
            break;
          case 'finishing & binding':
            counts.finishingBinding += 1;
            break;
          case 'to be checked':
            counts.toBeChecked += 1;
            break;
          case 'ready for dispatch':
            counts.readyForDispatch += 1;
            break;
          case 'ready for pickup':
            counts.readyForPickup += 1;
            break;
          default:
            break;
        }
      });

      // NEED ATTENTION – fallback
      if (
        !['On Hold', 'Ready for Pickup'].includes(customStatus) &&
        (progresses.length > 0 || assignees.length > 0)
      ) {
        const matched = progresses.some(p =>
          ['assigned', 'in progress', 'printed-done', 'finishing & binding', 'to be checked', 'ready for dispatch', 'ready for pickup']
            .includes(p.toLowerCase())
        );

        if (!matched) {
          counts.needAttention += 1;
        }
      }
    });

    res.json(counts);
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard counts' });
  }
});

module.exports = router;
