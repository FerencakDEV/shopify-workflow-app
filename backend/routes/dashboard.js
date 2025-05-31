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
      order.progress_1 || '',
      order.progress_2 || '',
      order.progress_3 || '',
      order.progress_4 || ''
    ];

    const getAssigneeArray = (order) => [
      order.assignee_1 || '',
      order.assignee_2 || '',
      order.assignee_3 || '',
      order.assignee_4 || ''
    ];

    const hasProgress = (progressArray, name) => progressArray.includes(name);
    const countAssignees = (assignees) => assignees.filter(a => a && a.trim() !== '').length;

    orders.forEach(order => {
      const status = (order.fulfillment_status || '').toLowerCase();
      const customStatus = order.order_status || '';
      const isUrgent = order.is_urgent === true;
      const progressArray = getProgressArray(order);
      const assignees = getAssigneeArray(order);
      const assigneeCount = countAssignees(assignees);

      // 🔒 SKIP fulfilled alebo cancelled
      if (['fulfilled', 'cancelled'].includes(status)) return;

      // ✅ ON HOLD
      if (status === 'onhold' || customStatus === 'On Hold') {
        counts.onHold += assigneeCount || 1;
        return;
      }

      // ✅ READY FOR PICKUP
      if (status === 'ready for pickup' || customStatus === 'Ready for Pickup') {
        counts.readyForPickup += assigneeCount || 1;
        return;
      }

      // 🔄 Ak nie je status určený, zaraď podľa order_status
      if (status === 'unfulfilled' || status === '') {
        const hasAnyProgress = progressArray.some(p => p && p.trim() !== '');

        // ✅ URGENT NEW ORDER
        if ((customStatus === 'Urgent New Order' || isUrgent) && assigneeCount === 0 && !hasAnyProgress) {
          counts.urgentNewOrders++;
          return;
        }

        // ✅ NEW ORDER
        if (customStatus === 'New Order' && !isUrgent && assigneeCount === 0 && !hasAnyProgress) {
          counts.newOrders++;
          return;
        }

        // ✅ ASSIGNED
        if (['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus) && assigneeCount > 0 && hasProgress(progressArray, 'Assigned')) {
          counts.assignedOrders += assigneeCount;
          return;
        }

        // ✅ IN PROGRESS
        if (['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus) && hasProgress(progressArray, 'In Progress')) {
          counts.inProgress += assigneeCount;
          return;
        }

        // ✅ PRINTED DONE
        if (['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus) && hasProgress(progressArray, 'Printed-Done')) {
          counts.printedDone += assigneeCount;
          return;
        }

        // ✅ FINISHING & BINDING
        if (['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus) && hasProgress(progressArray, 'Finishing & Binding')) {
          counts.finishingBinding += assigneeCount;
          return;
        }

        // ✅ TO BE CHECKED
        if (hasProgress(progressArray, 'To Be Checked')) {
          counts.toBeChecked += assigneeCount;
          return;
        }

        // ✅ READY FOR DISPATCH
        if (hasProgress(progressArray, 'Ready for Dispatch')) {
          counts.readyForDispatch += assigneeCount;
          return;
        }

        // ✅ NEED ATTENTION – nič nepasuje, ale má nejaký progress/assignee
        if (assigneeCount > 0 || hasAnyProgress) {
          counts.needAttention += assigneeCount || 1;
          return;
        }

        // ✅ NEED ATTENTION fallback – úplne bez progressu/statusu
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
