const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/by-assignee/:name', async (req, res) => {
  const assigneeName = req.params.name.toLowerCase();
  const excludeFulfilled = { $nin: ['fulfilled', 'cancelled', 'ready-for-pickup', 'on-hold'] };
  const regex = (val) => ({ $regex: new RegExp(`^${val}$`, 'i') });

  try {
    const orders = await Order.find({
      custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
      fulfillment_status: excludeFulfilled,
    }).select(
      'order_number custom_status fulfillment_status assignee_1 assignee_2 assignee_3 assignee_4 progress_1 progress_2 progress_3 progress_4'
    );

    const uniqueOrders = [];

    for (const order of orders) {
      for (let i = 1; i <= 4; i++) {
        const assignee = (order[`assignee_${i}`] || '').toLowerCase();
        const progress = (order[`progress_${i}`] || '').toLowerCase();

        const isTargetAssignee = assignee === assigneeName;
        const isRelevantProgress = progress === 'assigned' || progress === 'in progress';

        if (isTargetAssignee && isRelevantProgress) {
          uniqueOrders.push({
            order_number: order.order_number,
            custom_status: order.custom_status,
            fulfillment_status: order.fulfillment_status,
            assignees: [order.assignee_1, order.assignee_2, order.assignee_3, order.assignee_4].filter(Boolean),
            progress: [order.progress_1, order.progress_2, order.progress_3, order.progress_4].filter(Boolean).join(', ')
          });
          break; // započítaj túto objednávku iba raz
        }
      }
    }

    res.json({ count: uniqueOrders.length, data: uniqueOrders });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
