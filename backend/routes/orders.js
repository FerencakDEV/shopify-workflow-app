const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Mapa z query parametra na custom_status v databáze
const STATUS_MAP = {
  newOrders: 'New Order',
  urgentNewOrders: 'Urgent New Order',
  assignedOrders: 'Assigned Order',
  inProgress: 'In Progress',
  finishingBinding: 'Finishing & Binding',
  toBeChecked: 'To be Checked',
  needAttention: 'Need Attention',
  onHold: 'On Hold',
  readyForDispatch: 'Ready for Dispatch',
  readyForPickup: 'Ready for Pickup',
  fulfilled: 'Fulfilled', // voliteľne
  allOrders: '.*'
};

// 📦 Route na získanie objednávok podľa custom_status
router.get('/by-status', async (req, res) => {
  const key = req.query.status;
  const status = STATUS_MAP[key];

  if (!status) return res.status(400).json({ error: 'Invalid status key' });

  try {
    let query = {
      fulfillment_status: { $ne: 'fulfilled' },
      custom_status: {}
    };

    if (status === '.*') {
      delete query.custom_status; // všetky okrem fulfilled
    } else {
      query.custom_status = new RegExp(`^${status}$`, 'i');
    }

    const orders = await Order.find(query, {
      order_number: 1,
      custom_status: 1,
      fulfillment_status: 1,
      assignee: 1,
      progress: 1,
      metafields: 1
    });

    res.json({ count: orders.length, orders });
  } catch (err) {
    console.error(`❌ Error fetching orders by status '${key}':`, err);
    res.status(500).json({ error: 'Failed to fetch filtered orders' });
  }
});

module.exports = router;
