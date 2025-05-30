const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/workload-chart', async (req, res) => {
  try {
    const orders = await Order.find(
      { fulfillment_status: 'unfulfilled' }, // iba nevybavené objednávky
      {
        order_status: 1,
        assignee_1: 1,
        assignee_2: 1,
        assignee_3: 1,
        assignee_4: 1,
        progress_1: 1,
        progress_2: 1,
        progress_3: 1,
        progress_4: 1
      }
    );

    const excludedStatuses = ['on hold', 'cancelled', 'fulfilled'];
    const result = {};

    orders.forEach(order => {
      const rawStatus = order.order_status || '';
      const status = rawStatus.trim().toLowerCase();

      if (excludedStatuses.includes(status)) return;

      for (let i = 1; i <= 4; i++) {
        const assignee = (order[`assignee_${i}`] || '').trim();
        const progress = (order[`progress_${i}`] || '').trim();

        // Ignoruj len ak je assignee úplne prázdne
        if (assignee !== '') {
          // Inicializuj ak ešte neexistuje
          if (!result[assignee]) result[assignee] = { assigned: 0, inProgress: 0 };

          // Normalize case
          const normalizedProgress = progress.toLowerCase();

          if (normalizedProgress === 'assigned') result[assignee].assigned += 1;
          else if (normalizedProgress === 'in progress') result[assignee].inProgress += 1;
        }
      }
    });

    res.json(result);
  } catch (err) {
    console.error('❌ Workload Chart Error:', err);
    res.status(500).json({ error: 'Failed to fetch workload chart data' });
  }
});

module.exports = router;
