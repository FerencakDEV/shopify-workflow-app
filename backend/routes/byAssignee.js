const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/by-assignee/:name', async (req, res) => {
  const assigneeName = req.params.name;
  const excludeFulfilled = { $nin: ['fulfilled', 'cancelled', 'ready-for-pickup', 'on-hold'] };
  const regexAssigned = { $regex: /^assigned$/i };
  const regexInProgress = { $regex: /^in progress$/i };

  try {
    const orders = await Order.find({
      fulfillment_status: excludeFulfilled,
      $or: [
        { assignee_1: assigneeName },
        { assignee_2: assigneeName },
        { assignee_3: assigneeName },
        { assignee_4: assigneeName }
      ],
      $or: [
        { progress_1: regexAssigned },
        { progress_2: regexAssigned },
        { progress_3: regexAssigned },
        { progress_4: regexAssigned },
        { progress_1: regexInProgress },
        { progress_2: regexInProgress },
        { progress_3: regexInProgress },
        { progress_4: regexInProgress }
      ]
    }).select('order_number custom_status fulfillment_status assignee_1 assignee_2 assignee_3 assignee_4');

    res.json({ data: orders });
  } catch (err) {
    console.error('❌ Error fetching orders by assignee:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
