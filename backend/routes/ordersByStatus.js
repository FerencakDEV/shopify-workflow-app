const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/by-status', async (req, res) => {
  const status = req.query.status?.trim();

  console.log('📥 Route /by-status hit');
  console.log('📌 Query param status:', status);

  if (!status) {
    return res.status(400).json({ error: 'Missing status param' });
  }

  let query = {};
  const regex = (value) => ({ $regex: new RegExp(`^${value}$`, 'i') });
  const unfulfilled = ['unfulfilled', 'partially_fulfilled'];

  try {
    switch (status) {
      case 'newOrders':
  query = {
    custom_status: regex('New Order'),
    fulfillment_status: { $ne: 'fulfilled' },
    $and: [
      {
        $or: [
          { assignee: { $exists: false } },
          { assignee: null },
          { assignee: [] },
          { assignee: [""] },
          { assignee: { $not: { $elemMatch: { $ne: "" } } } }
        ]
      },
      {
        $and: [
          { $or: [{ assignee_1: { $exists: false } }, { assignee_1: "" }] },
          { $or: [{ assignee_2: { $exists: false } }, { assignee_2: "" }] },
          { $or: [{ assignee_3: { $exists: false } }, { assignee_3: "" }] },
          { $or: [{ assignee_4: { $exists: false } }, { assignee_4: "" }] }
        ]
      }
    ]
  };
  break;


      case 'urgentNewOrders':
        query = {
          custom_status: regex('Urgent New Order'),
          fulfillment_status: { $ne: 'fulfilled' },
          is_urgent: true,
          $or: [
            { assignee: { $size: 0 } },
            { assignee: { $not: { $elemMatch: { $ne: '' } } } },
            { assignee: { $exists: false } },
            { assignee: null }
          ]
        };
        break;

      case 'assignedOrders':
        query = {
          custom_status: { $in: [regex('New Order'), regex('Urgent New Order')] },
          fulfillment_status: { $in: unfulfilled },
          $or: [
            { progress: { $in: [regex('Assigned')] } },
            { progress_1: regex('Assigned') },
            { progress_2: regex('Assigned') },
            { progress_3: regex('Assigned') },
            { progress_4: regex('Assigned') }
          ],
          assignee: { $exists: true, $not: { $size: 0 } }
        };
        break;

      // ... sem doplníš ostatné stavy neskôr

      default:
        console.error('🚫 Invalid status param received:', status);
        return res.status(400).json({ error: 'Invalid status' });
    }

    const orders = await Order.find(query).limit(50);
    res.json({ count: orders.length, orders });

  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
