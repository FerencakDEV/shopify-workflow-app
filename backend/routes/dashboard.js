const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Pomocná funkcia na očistenie stringov (lowercase, trim, medzery)
const normalize = str =>
  (str || '').toLowerCase().trim().replace(/\s+/g, ' ');

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

    orders.forEach(order => {
      const fulfillment = normalize(order.fulfillment_status);
      const orderStatus = normalize(order.order_status);
      const isUrgent = order.is_urgent === true;

      const progresses = [
        order.progress_1,
        order.progress_2,
        order.progress_3,
        order.progress_4
      ]
        .map(p => normalize(p))
        .filter(Boolean);

      const assignees = [
        order.assignee_1,
        order.assignee_2,
        order.assignee_3,
        order.assignee_4
      ]
        .map(a => normalize(a))
        .filter(Boolean);

      const hasAssignee = assignees.length > 0;
      const hasProgress = progresses.length > 0;

      // Fulfilled alebo Cancelled → ignoruj
      if (['fulfilled', 'cancelled'].includes(fulfillment)) return;

      // ON HOLD
      if (fulfillment === 'onhold' || orderStatus === 'on hold') {
        counts.onHold += 1;
        return;
      }

      // READY FOR PICKUP
      if (fulfillment === 'ready for pickup' || orderStatus === 'ready for pickup') {
        counts.readyForPickup += 1;
        return;
      }

      // URGENT NEW ORDER
      if ((orderStatus === 'urgent new order' || isUrgent) && !hasAssignee && !hasProgress) {
        counts.urgentNewOrders += 1;
        return;
      }

      // NEW ORDER
      if (orderStatus === 'new order' && !isUrgent && !hasAssignee && !hasProgress) {
        counts.newOrders += 1;
        return;
      }

      // Zarátať do viacerých widgetov podľa progressu
      let matchedKnownProgress = false;

      progresses.forEach(progress => {
        switch (progress) {
          case 'assigned':
            counts.assignedOrders += 1;
            matchedKnownProgress = true;
            break;
          case 'in progress':
            counts.inProgress += 1;
            matchedKnownProgress = true;
            break;
          case 'printed-done':
            counts.printedDone += 1;
            matchedKnownProgress = true;
            break;
          case 'finishing & binding':
            counts.finishingBinding += 1;
            matchedKnownProgress = true;
            break;
          case 'to be checked':
            counts.toBeChecked += 1;
            matchedKnownProgress = true;
            break;
          case 'ready for dispatch':
            counts.readyForDispatch += 1;
            matchedKnownProgress = true;
            break;
          case 'ready for pickup':
            counts.readyForPickup += 1;
            matchedKnownProgress = true;
            break;
          default:
            break;
        }
      });

      // Ak má progress alebo assignee, ale žiadny známy progress – NEED ATTENTION
      if ((hasProgress || hasAssignee) && !matchedKnownProgress) {
        counts.needAttention += 1;
        return;
      }

      // Posledný fallback – ak naozaj nič nesedí
      if (!hasProgress && !hasAssignee) {
        counts.needAttention += 1;
      }
    });

    res.json(counts);
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard counts' });
  }
});

module.exports = router;
