const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/status-counts', async (req, res) => {
  try {
    const orders = await Order.find({}, {
      fulfillment_status: 1,
      metafields: 1
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

    const get = (mf, path) => mf?.custom?.[path] || '';

    const countAssignees = (mf) => {
      let count = 0;
      if (get(mf, 'assignee')) count++;
      if (get(mf, 'assignee-2')) count++;
      if (get(mf, 'assignee-3')) count++;
      if (get(mf, 'assignee-4')) count++;
      return count;
    };

    const hasProgress = (mf, name) => {
      return [
        get(mf, 'progress'),
        get(mf, 'progress-2'),
        get(mf, 'progress-3'),
        get(mf, 'progress-4')
      ].includes(name);
    };

    orders.forEach(order => {
      const status = (order.fulfillment_status || '').toLowerCase();
      const mf = order.metafields;
      const customStatus = get(mf, 'order-custom-status');
      const urgency = get(mf, 'turnaround-urgency').toUpperCase();
      const assignees = countAssignees(mf);

      // ❌ Skip fulfilled or cancelled orders
      if (['fulfilled', 'cancelled'].includes(status)) return;

      // ✅ NEW ORDERS
      if (
        status === 'unfulfilled' &&
        customStatus === 'New Order' &&
        assignees === 0
      ) {
        counts.newOrders++;
      }

      // ✅ URGENT NEW ORDERS
      if (
        status === 'unfulfilled' &&
        customStatus === 'Urgent New Order' &&
        assignees === 0 &&
        urgency === 'URGENT'
      ) {
        counts.urgentNewOrders++;
      }

      // ✅ ASSIGNED ORDERS
      if (
        ['unfulfilled', 'partially fulfilled'].includes(status) &&
        ['New Order', 'Urgent New Order'].includes(customStatus) &&
        assignees > 0 &&
        hasProgress(mf, 'Assigned')
      ) {
        counts.assignedOrders += assignees;
      }

      // ✅ IN PROGRESS
      if (
        ['unfulfilled', 'partially fulfilled'].includes(status) &&
        ['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus) &&
        hasProgress(mf, 'In Progress')
      ) {
        counts.inProgress += assignees;
      }

      // ✅ PRINTED-DONE
      if (
        ['unfulfilled', 'partially fulfilled'].includes(status) &&
        ['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus) &&
        hasProgress(mf, 'Printed-Done')
      ) {
        counts.printedDone += assignees;
      }

      // ✅ FINISHING & BINDING
      if (
        ['New Order', 'Urgent New Order', 'Hold Released'].includes(customStatus) &&
        hasProgress(mf, 'Finishing & Binding')
      ) {
        counts.finishingBinding += assignees;
      }

      // ✅ TO BE CHECKED
      if (
        ['unfulfilled', 'partially fulfilled'].includes(status) &&
        hasProgress(mf, 'To Be Checked')
      ) {
        counts.toBeChecked += assignees;
      }

      // ✅ READY FOR DISPATCH
      if (
        status === 'unfulfilled' &&
        hasProgress(mf, 'Ready for Dispatch')
      ) {
        counts.readyForDispatch += assignees;
      }

      // ✅ READY FOR PICKUP
      if (
        status !== 'fulfilled' &&
        hasProgress(mf, 'Ready for Pickup')
      ) {
        counts.readyForPickup += assignees;
      }

      // ✅ ON HOLD
      if (
        status !== 'fulfilled' &&
        customStatus === 'On Hold'
      ) {
        counts.onHold += assignees || 1;
      }

      // ✅ NEED ATTENTION
      if (
        status !== 'fulfilled' &&
        customStatus === 'Need Attention'
      ) {
        counts.needAttention += assignees || 1;
      }
    });

    res.json(counts);
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard counts' });
  }
});

module.exports = router;
