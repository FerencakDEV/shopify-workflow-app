const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /api/orders/all-light
router.get('/all-light', async (req, res) => {
  try {
    const orders = await Order.find({}, {
      order_number: 1,
      custom_status: 1,
      fulfillment_status: 1,
      assignee_1: 1,
      assignee_2: 1,
      assignee_3: 1,
      assignee_4: 1,
      progress_1: 1,
      progress_2: 1,
      progress_3: 1,
      progress_4: 1,
      is_urgent: 1,
      order_status: 1,
      created_at: 1,
    }).sort({ created_at: -1 }).limit(500);

    res.json({ orders });
  } catch (err) {
    console.error('❌ Error in /all-light:', err.message);
    res.status(500).json({ error: 'Failed to fetch light orders' });
  }
});

module.exports = router;
