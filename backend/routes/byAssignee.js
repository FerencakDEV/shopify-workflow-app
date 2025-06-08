const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/by-assignee/:name', async (req, res) => {
  const assigneeName = req.params.name;
  const excludeFulfilled = { $nin: ['fulfilled', 'cancelled', 'ready-for-pickup', 'on-hold'] };
  const regex = (val) => ({ $regex: new RegExp(`^${val}$`, 'i') });

  try {
    const allOrders = await Order.find({
      custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
      fulfillment_status: excludeFulfilled,
      $or: [
        { progress_1: regex('assigned') },
        { progress_2: regex('assigned') },
        { progress_3: regex('assigned') },
        { progress_4: regex('assigned') },
        { progress_1: regex('in progress') },
        { progress_2: regex('in progress') },
        { progress_3: regex('in progress') },
        { progress_4: regex('in progress') }
      ],
      $or: [
        { assignee_1: assigneeName },
        { assignee_2: assigneeName },
        { assignee_3: assigneeName },
        { assignee_4: assigneeName }
      ]
    }).select(
      'order_number custom_status fulfillment_status assignee_1 assignee_2 assignee_3 assignee_4 progress_1 progress_2 progress_3 progress_4'
    );

    const results = [];

    for (const order of allOrders) {
      for (let i = 1; i <= 4; i++) {
        const assignee = order[`assignee_${i}`];
        const progress = (order[`progress_${i}`] || '').toLowerCase();

        if (
          assignee &&
          assignee.toLowerCase() === assigneeName.toLowerCase() &&
          (progress === 'assigned' || progress === 'in progress')
        ) {
          results.push({
            order_number: order.order_number,
            custom_status: order.custom_status,
            fulfillment_status: order.fulfillment_status,
            assignee,
            progress,
          });
        }
      }
    }

    res.json({ count: results.length, data: results });
  } catch (err) {
    console.error('❌ Error fetching orders by assignee:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
