const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/', async (req, res) => {
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
      onHold: 0,
      needAttention: 0,
      readyForDispatch: 0,
      readyForPickup: 0,
      allOrders: orders.length
    };

    // Spočíta, koľko assignee polí je vyplnených (nezávisle)
    function countAssignees(order) {
      let count = 0;
      if (order.metafields?.custom?.['assignee']) count++;
      if (order.metafields?.custom?.['assignee-2']) count++;
      if (order.metafields?.custom?.['assignee-3']) count++;
      if (order.metafields?.custom?.['assignee-4']) count++;
      return count;
    }

    // Skontroluje, či má order aspoň jedno progress pole s danou hodnotou
    function hasProgress(order, progressName) {
      return (
        order.metafields?.custom?.['progress'] === progressName ||
        order.metafields?.custom?.['progress-2'] === progressName ||
        order.metafields?.custom?.['progress-3'] === progressName ||
        order.metafields?.custom?.['progress-4'] === progressName
      );
    }

    orders.forEach(order => {
      const fulfillmentStatus = order.fulfillment_status?.toLowerCase() || '';
      const customStatus = order.metafields?.custom?.['order-custom-status'] || '';
      const turnaroundUrgency = order.metafields?.custom?.['turnaround-urgency'] || '';

      const assigneesCount = countAssignees(order);

      // New Orders: Unfulfilled + New Order + žiadni assignee
      if (
        fulfillmentStatus === 'unfulfilled' &&
        customStatus === 'New Order' &&
        assigneesCount === 0
      ) {
        counts.newOrders++;
      }

      // Urgent New Orders: Unfulfilled + Urgent New Order + žiadni assignee + Urgency = URGENT
      if (
        fulfillmentStatus === 'unfulfilled' &&
        customStatus === 'Urgent New Order' &&
        assigneesCount === 0 &&
        turnaroundUrgency.toUpperCase() === 'URGENT'
      ) {
        counts.urgentNewOrders++;
      }

      // Assigned Orders: (Unfulfilled | Partially fulfilled) + New/Urgent New Order + assignee ≥ 1 + Assigned progress
      if (
        (fulfillmentStatus === 'unfulfilled' || fulfillmentStatus === 'partially fulfilled') &&
        (customStatus === 'New Order' || customStatus === 'Urgent New Order') &&
        assigneesCount > 0 &&
        hasProgress(order, 'Assigned')
      ) {
        counts.assignedOrders += assigneesCount;
      }

      // In Progress: (Unfulfilled | Partially fulfilled) + New/Urgent/Hold Released + In Progress progress
      if (
        (fulfillmentStatus === 'unfulfilled' || fulfillmentStatus === 'partially fulfilled') &&
        (customStatus === 'New Order' || customStatus === 'Urgent New Order' || customStatus === 'Hold Released') &&
        hasProgress(order, 'In Progress')
      ) {
        counts.inProgress += assigneesCount;
      }

      // Printed-Done: (Unfulfilled | Partially fulfilled) + New/Urgent/Hold Released + Printed-Done progress
      if (
        (fulfillmentStatus === 'unfulfilled' || fulfillmentStatus === 'partially fulfilled') &&
        (customStatus === 'New Order' || customStatus === 'Urgent New Order' || customStatus === 'Hold Released') &&
        hasProgress(order, 'Printed-Done')
      ) {
        counts.printedDone += assigneesCount;
      }

      // Finishing & Binding: New/Urgent/Hold Released + Finishing & Binding progress
      if (
        (customStatus === 'New Order' || customStatus === 'Urgent New Order' || customStatus === 'Hold Released') &&
        hasProgress(order, 'Finishing & Binding')
      ) {
        counts.finishingBinding += assigneesCount;
      }

      // To be Checked: (Unfulfilled | Partially fulfilled) + To Be Checked progress
      if (
        (fulfillmentStatus === 'unfulfilled' || fulfillmentStatus === 'partially fulfilled') &&
        hasProgress(order, 'To Be Checked')
      ) {
        counts.toBeChecked += assigneesCount;
      }

      // Ready for Dispatch: Unfulfilled + Ready for Dispatch progress
      if (
        fulfillmentStatus === 'unfulfilled' &&
        hasProgress(order, 'Ready for Dispatch')
      ) {
        counts.readyForDispatch += assigneesCount;
      }

      // Ready for Pickup: fulfillment status nie je fulfilled + Ready for Pickup progress
      if (
        fulfillmentStatus !== 'fulfilled' &&
        hasProgress(order, 'Ready for Pickup')
      ) {
        counts.readyForPickup += assigneesCount;
      }

      // On Hold: fulfillment status nie je fulfilled + On Hold custom status
      if (
        fulfillmentStatus !== 'fulfilled' &&
        customStatus === 'On Hold'
      ) {
        counts.onHold += assigneesCount || 1; // aspoň 1, ak žiadny assignee
      }

      // Need Attention: fulfillment status nie je fulfilled + Need Attention custom status
      if (
        fulfillmentStatus !== 'fulfilled' &&
        customStatus === 'Need Attention'
      ) {
        counts.needAttention += assigneesCount || 1;
      }
    });

    res.json(counts);
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard counts' });
  }
});

module.exports = router;
