// routes/dashboard.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/workload', async (req, res) => {
  try {
    const orders = await Order.find({}, {
      fulfillment_status: 1,
      assignee_1: 1, assignee_2: 1, assignee_3: 1, assignee_4: 1,
      progress_1: 1, progress_2: 1, progress_3: 1, progress_4: 1
    });

    const workload = {};

    orders.forEach(order => {
      const status = (order.fulfillment_status || '').toLowerCase();
      if (status !== 'unfulfilled') return; // ✅ iba unfulfilled objednávky

      for (let i = 1; i <= 4; i++) {
        const assignee = (order[`assignee_${i}`] || '').trim();
        const progress = (order[`progress_${i}`] || '').trim();
        if (!assignee) continue;

        if (!workload[assignee]) {
          workload[assignee] = { assigned: 0, inProgress: 0 };
        }

        if (progress === 'In Progress') {
          workload[assignee].inProgress += 1;
        } else if (progress === 'Assigned') {
          workload[assignee].assigned += 1;
        }
      }
    });

    res.json(workload);
  } catch (err) {
    console.error('Workload fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch workload data' });
  }
});

module.exports = router;
