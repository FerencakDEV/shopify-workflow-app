const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/workload-chart', async (req, res) => {
  try {
    const excludeFulfilled = { $nin: ['fulfilled', 'cancelled', 'ready-for-pickup', 'on-hold'] };
    const regex = (val) => ({ $regex: new RegExp(`^${val}$`, 'i') });

    const orders = await Order.find({
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
      ]
    });

    const assigneeMap = {};

    for (const order of orders) {
      const assignees = [
        order.assignee_1,
        order.assignee_2,
        order.assignee_3,
        order.assignee_4
      ].map(a => a?.trim()).filter(Boolean);

      const progresses = [
        order.progress_1,
        order.progress_2,
        order.progress_3,
        order.progress_4
      ].map(p => p?.trim().toLowerCase());

      for (const assignee of assignees) {
        if (!assigneeMap[assignee]) {
          assigneeMap[assignee] = { assignee, assigned: 0, inProgress: 0 };
        }

        if (progresses.includes('assigned')) assigneeMap[assignee].assigned++;
        if (progresses.includes('in progress')) assigneeMap[assignee].inProgress++;
      }
    }

    const assigneeOrder = ['Q1', 'Q2', 'Online', 'Thesis', 'Design', 'Design 2', 'MagicTouch', 'Posters'];
    const result = assigneeOrder.map(name => ({
      assignee: name,
      ...assigneeMap[name] || { assigned: 0, inProgress: 0 }
    }));

    res.json({ data: result });
  } catch (err) {
    console.error('❌ Workload Chart Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
