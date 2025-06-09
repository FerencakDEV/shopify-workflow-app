const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/by-assignee-summary', async (req, res) => {
  try {
    const orders = await Order.find({
      custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
      fulfillment_status: { $nin: ['fulfilled', 'cancelled', 'ready-for-pickup', 'on-hold'] },
    }).select(
      'order_number assignee_1 assignee_2 assignee_3 assignee_4 progress_1 progress_2 progress_3 progress_4'
    );

    const summary = {};

    for (const order of orders) {
      for (let i = 1; i <= 4; i++) {
        const assignee = (order[`assignee_${i}`] || '').trim();
        const progress = (order[`progress_${i}`] || '').trim().toLowerCase();

        if (!assignee || (progress !== 'assigned' && progress !== 'in progress')) continue;

        if (!summary[assignee]) {
          summary[assignee] = { assignee, assigned: 0, inProgress: 0 };
        }

        if (progress === 'assigned') summary[assignee].assigned += 1;
        else if (progress === 'in progress') summary[assignee].inProgress += 1;
      }
    }

    res.json({ data: Object.values(summary) });
  } catch (err) {
    console.error('❌ Error in /by-assignee-summary:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
