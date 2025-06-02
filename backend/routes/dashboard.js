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

    const validProgresses = [
      'assigned',
      'in progress',
      'printed-done',
      'finishing & binding',
      'to be checked',
      'ready for dispatch',
      'ready for pickup'
    ];

    orders.forEach(order => {
      const fulfillment = (order.fulfillment_status || '').toLowerCase();
      const status = (order.order_status || '').trim().toLowerCase();
      const isUrgent = order.is_urgent === true;

      const progresses = [
        (order.progress_1 || '').trim().toLowerCase(),
        (order.progress_2 || '').trim().toLowerCase(),
        (order.progress_3 || '').trim().toLowerCase(),
        (order.progress_4 || '').trim().toLowerCase()
      ].filter(p => p !== '');

      const assignees = [
        (order.assignee_1 || '').trim(),
        (order.assignee_2 || '').trim(),
        (order.assignee_3 || '').trim(),
        (order.assignee_4 || '').trim()
      ].filter(a => a !== '');

      // ❌ Preskoč fulfilled/cancelled
      if (['fulfilled', 'cancelled'].includes(fulfillment)) return;

      // ✅ READY FOR PICKUP z fulfillmentu
      if (fulfillment === 'ready for pickup') {
        counts.readyForPickup += 1;
        return;
      }

      // ✅ ON HOLD z fulfillmentu alebo statusu
      if (fulfillment === 'onhold' || status === 'on hold') {
        counts.onHold += 1;
        return;
      }

      // ✅ NEW / URGENT NEW ORDER – iba ak nemá assignee ani progress
      if (assignees.length === 0 && progresses.length === 0) {
        if (status === 'urgent new order' || isUrgent) {
          counts.urgentNewOrders += 1;
          return;
        }
        if (status === 'new order') {
          counts.newOrders += 1;
          return;
        }
      }

      // ✅ Ostatné widgety – podľa progress aj order_status (bez duplikácie)
      const countedProgress = new Set();

      progresses.forEach(p => {
        if (!countedProgress.has(p)) {
          switch (p) {
            case 'assigned':
              counts.assignedOrders += 1;
              countedProgress.add(p);
              break;
            case 'in progress':
              counts.inProgress += 1;
              countedProgress.add(p);
              break;
            case 'printed-done':
              counts.printedDone += 1;
              countedProgress.add(p);
              break;
            case 'finishing & binding':
              counts.finishingBinding += 1;
              countedProgress.add(p);
              break;
            case 'to be checked':
              counts.toBeChecked += 1;
              countedProgress.add(p);
              break;
            case 'ready for dispatch':
              counts.readyForDispatch += 1;
              countedProgress.add(p);
              break;
            case 'ready for pickup':
              counts.readyForPickup += 1;
              countedProgress.add(p);
              break;
          }
        }
      });

      // ✅ Ak order_status obsahuje niečo z widgetov a nebolo to už počítané z progressu → pridaj
      if (validProgresses.includes(status) && !countedProgress.has(status)) {
        switch (status) {
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
        }
      }

      // ✅ NEED ATTENTION – ak niečo nesedí (nekompletný assignee/progress)
      const allProgressesFilled = progresses.length;
      const allAssigneesFilled = assignees.length;

      const mismatch =
        (allProgressesFilled > 0 && allAssigneesFilled === 0) ||
        (allAssigneesFilled > 0 && allProgressesFilled === 0);

      if (
        !['on hold', 'ready for pickup'].includes(status) &&
        !['onhold', 'ready for pickup'].includes(fulfillment) &&
        mismatch
      ) {
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
