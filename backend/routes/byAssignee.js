// routes/workload-chart.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/workload-chart', async (req, res) => {
  try {
    const orders = await Order.find({
      custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
      fulfillment_status: { $nin: ['fulfilled', 'cancelled', 'ready-for-pickup', 'on-hold'] },
    }).select(
      'order_number assignee_1 assignee_2 assignee_3 assignee_4 progress_1 progress_2 progress_3 progress_4'
    );

    const countsMap = new Map();

    orders.forEach(order => {
      const assignees = [order.assignee_1, order.assignee_2, order.assignee_3, order.assignee_4];
      const progresses = [order.progress_1, order.progress_2, order.progress_3, order.progress_4];

      const seen = new Set(); // To avoid double-counting same assignee in one order

      for (let i = 0; i < 4; i++) {
        const name = (assignees[i] || '').trim();
        const prog = (progresses[i] || '').trim().toLowerCase();
        if (!name) continue;
        if (!['assigned', 'in progress'].includes(prog)) continue;

        const key = name;
        if (!countsMap.has(key)) {
          countsMap.set(key, { assignee: name, assigned: 0, inProgress: 0 });
        }

        const current = countsMap.get(key);

        // Avoid duplicate count of the same order for same assignee
        const orderKey = `${order.order_number}-${key}`;
        if (seen.has(orderKey)) continue;
        seen.add(orderKey);

        if (prog === 'assigned') current.assigned++;
        if (prog === 'in progress') current.inProgress++;
      }
    });

    const data = Array.from(countsMap.values());
    res.json({ data });
  } catch (err) {
    console.error('Error generating workload chart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
