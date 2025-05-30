const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({}, {
      custom_status: 1,
      progress_1: 1,
      progress_2: 1,
      progress_3: 1,
      progress_4: 1,
    });

    const counts = {
      newOrders: 0,
      urgentNewOrders: 0,
      assignedOrders: 0,
      inProgress: 0,
      finishingBinding: 0,
      toBeChecked: 0,
      needAttention: 0,
      onHold: 0,
      readyForDispatch: 0,
      readyForPickup: 0
    };

    orders.forEach(order => {
      // ✅ custom_status
      switch (order.custom_status) {
        case 'New Order': counts.newOrders++; break;
        case 'Urgent New Order': counts.urgentNewOrders++; break;
        case 'Need Attention': counts.needAttention++; break;
        case 'On Hold': counts.onHold++; break;
        case 'Ready for Dispatch': counts.readyForDispatch++; break;
        case 'Ready for Pickup': counts.readyForPickup++; break;
        default: break;
      }

      // ✅ progress polia (aj viac naraz)
      const progressList = [
        order.progress_1,
        order.progress_2,
        order.progress_3,
        order.progress_4,
      ];

      progressList.forEach(progress => {
        switch (progress) {
          case 'Assigned': counts.assignedOrders++; break;
          case 'In Progress': counts.inProgress++; break;
          case 'Finishing & Binding': counts.finishingBinding++; break;
          case 'To be Checked': counts.toBeChecked++; break;
          default: break;
        }
      });
    });

    res.json(counts);
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard counts' });
  }
});

module.exports = router;
