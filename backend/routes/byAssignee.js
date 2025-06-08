const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/by-assignee/:name', async (req, res) => {
  const assigneeName = req.params.name;
  const excludeFulfilled = { $nin: ['fulfilled', 'cancelled', 'ready-for-pickup', 'on-hold'] };
  const regex = (val) => new RegExp(`^${val}$`, 'i');

  try {
    const allOrders = await Order.find({
      custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
      fulfillment_status: excludeFulfilled,
    }).select(
      'order_number custom_status fulfillment_status assignee_1 assignee_2 assignee_3 assignee_4 progress_1 progress_2 progress_3 progress_4'
    );

    const result = [];
    const validStatuses = ['assigned', 'in progress'];

    allOrders.forEach(order => {
      for (let i = 1; i <= 4; i++) {
        const assignee = (order[`assignee_${i}`] || '').trim();
        const progress = (order[`progress_${i}`] || '').trim().toLowerCase();

        if (!assignee || assignee !== assigneeName) continue;
        if (!validStatuses.includes(progress)) continue;

        result.push({
          order_number: order.order_number,
          custom_status: order.custom_status,
          fulfillment_status: order.fulfillment_status,
          assignee,
          progress: progress.charAt(0).toUpperCase() + progress.slice(1)
        });
      }
    });

    res.json({ count: result.length, data: result });
  } catch (err) {
    console.error('❌ Error fetching orders by assignee:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
