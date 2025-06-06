const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/workload-chart', async (req, res) => {
  try {
    const allOrders = await Order.find({
      custom_status: { $nin: ['On Hold', 'Cancelled', 'Fulfilled'] }
    });

    const assigneeList = [
      'Q1',
      'Q2',
      'Online',
      'Thesis',
      'Design',
      'Design 2',
      'MagicTouch',
      'Posters'
    ];

    const result = assigneeList.map((name) => {
      const assigned = allOrders.filter((order) =>
        (order.assignee || []).includes(name) &&
        (order.progress || []).includes('Assigned')
      ).length;

      const inProgress = allOrders.filter((order) =>
        (order.assignee || []).includes(name) &&
        (order.progress || []).includes('In Progress')
      ).length;

      return { assignee: name, inProgress, assigned };
    });

    res.json({ data: result });
  } catch (err) {
    console.error('❌ Workload Chart Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
