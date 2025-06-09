const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/by-assignee/:name', async (req, res) => {
  const assigneeName = req.params.name;
  const excludeFulfilled = { $nin: ['fulfilled', 'cancelled', 'ready-for-pickup', 'on-hold'] };
  const regex = (val) => ({ $regex: new RegExp(`^${val}$`, 'i') });

  try {
    const orders = await Order.find({
      custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
      fulfillment_status: excludeFulfilled,
      $or: [
        { assignee_1: assigneeName },
        { assignee_2: assigneeName },
        { assignee_3: assigneeName },
        { assignee_4: assigneeName }
      ],
      $or: [
        { progress_1: regex('assigned') },
        { progress_2: regex('assigned') },
        { progress_3: regex('assigned') },
        { progress_4: regex('assigned') },
        { progress_1: regex('in progress') },
        { progress_2: regex('in progress') },
        { progress_3: regex('in progress') },
        { progress_4: regex('in progress') }
      ]
    }).select(
      'order_number custom_status fulfillment_status assignee_1 assignee_2 assignee_3 assignee_4 progress_1 progress_2 progress_3 progress_4'
    );

    const orderMap = new Map();

    for (const order of orders) {
      const orderId = order.order_number;

      const assignees = [order.assignee_1, order.assignee_2, order.assignee_3, order.assignee_4].filter(Boolean);
      const progresses = [order.progress_1, order.progress_2, order.progress_3, order.progress_4];

      let matchFound = false;
      let orderType = 'assigned'; // default fallback

      for (let i = 0; i < 4; i++) {
        const a = (order[`assignee_${i + 1}`] || '').trim().toLowerCase();
        const p = (order[`progress_${i + 1}`] || '').trim().toLowerCase();

        if (a === assigneeName.toLowerCase() && (p === 'assigned' || p === 'in progress')) {
          matchFound = true;
          orderType = p;
          break;
        }
      }

      if (matchFound && !orderMap.has(orderId)) {
        orderMap.set(orderId, {
          order_number: orderId,
          custom_status: order.custom_status,
          fulfillment_status: order.fulfillment_status,
          assignees,
          progressList: progresses.filter(Boolean),
          orderType, // used for sorting later
        });
      }
    }

    // Roztriedime podľa typu
    const inProgress = [];
    const assigned = [];

    for (const order of orderMap.values()) {
      if (order.orderType === 'in progress') {
        inProgress.push(order);
      } else {
        assigned.push(order);
      }
    }

    const sorted = [...inProgress, ...assigned];

    res.json({ count: sorted.length, data: sorted });
  } catch (err) {
    console.error('❌ Error fetching orders by assignee:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
