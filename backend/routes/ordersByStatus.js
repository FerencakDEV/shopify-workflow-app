const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // uprav ak máš inú cestu

// Pomocné funkcie
const getProgressArray = (order) => {
  return [
    order.progress_1,
    order.progress_2,
    order.progress_3,
    order.progress_4
  ].filter(Boolean);
};

router.get('/', async (req, res) => {
  const status = req.query.status;
  if (!status) return res.status(400).json({ error: 'Missing status parameter' });

  try {
    const allOrders = await Order.find({ fulfillment_status: { $ne: 'fulfilled' } });

    const filtered = allOrders.filter(order => {
      const cs = order.custom_status || '';
      const fs = order.fulfillment_status || '';
      const progress = getProgressArray(order).map(p => p.toLowerCase());

      switch (status) {
        case 'newOrders':
          return cs === 'New Order' && (!order.assignee_1 && !order.assignee_2 && !order.assignee_3 && !order.assignee_4);

        case 'urgentNewOrders':
          return cs === 'Urgent New Order' && order.is_urgent === true;

        case 'assignedOrders':
          return ['New Order', 'Urgent New Order'].includes(cs) && progress.includes('assigned');

        case 'inProgress':
          return ['New Order', 'Urgent New Order', 'Hold Released'].includes(cs) && progress.includes('in progress');

        case 'finishingBinding':
          return ['New Order', 'Urgent New Order', 'Hold Released'].includes(cs) && progress.includes('finishing & binding');

        case 'toBeChecked':
          return progress.includes('to be checked');

        case 'readyForDispatch':
          return progress.includes('ready for dispatch');

        case 'readyForPickup':
          return progress.includes('ready for pickup');

        case 'onHold':
          return cs === 'On Hold';

        case 'needAttention':
          return cs === 'Need Attention';

        default:
          return false;
      }
    });

    res.json({ count: filtered.length, orders: filtered });

  } catch (err) {
    console.error('❌ Error fetching by status:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
