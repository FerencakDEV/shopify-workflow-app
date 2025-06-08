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
  const blank = ['', null]; // dostupné pre všetky case
  const excludeFulfilled = { $nin: ['fulfilled', 'cancelled', 'ready-for-pickup', 'on-hold'] };

  try {
    switch (status) {
      case 'newOrders':
        query = {
          $or: [
            { order_status: regex('New Order') },
            { custom_status: regex('New Order') },
            { 'metafields.order-custom-status': regex('New Order') }
          ],
          is_urgent: { $in: [false, "false"], $exists: true },
          fulfillment_status: excludeFulfilled,
          $and: [
            { $or: [{ progress_1: { $exists: false } }, { progress_1: blank }] },
            { $or: [{ progress_2: { $exists: false } }, { progress_2: blank }] },
            { $or: [{ progress_3: { $exists: false } }, { progress_3: blank }] },
            { $or: [{ progress_4: { $exists: false } }, { progress_4: blank }] },
            { $or: [{ assignee_1: { $exists: false } }, { assignee_1: blank }] },
            { $or: [{ assignee_2: { $exists: false } }, { assignee_2: blank }] },
            { $or: [{ assignee_3: { $exists: false } }, { assignee_3: blank }] },
            { $or: [{ assignee_4: { $exists: false } }, { assignee_4: blank }] }
          ]
        };
        break;

      case 'urgentNewOrders':
        query = {
          $or: [
            { custom_status: regex('Urgent New Order') },
            { 'metafields.order-custom-status': regex('Urgent New Order') }
          ],
          is_urgent: { $in: [true, "true"] },
          fulfillment_status: excludeFulfilled,
          $and: [
            { progress_1: { $in: blank } },
            { progress_2: { $in: blank } },
            { progress_3: { $in: blank } },
            { progress_4: { $in: blank } },
            { assignee_1: { $in: blank } },
            { assignee_2: { $in: blank } },
            { assignee_3: { $in: blank } },
            { assignee_4: { $in: blank } }
          ]
        };
        break;

      case 'assignedOrders':
        query = {
          fulfillment_status: excludeFulfilled,
          $or: [
            { progress_1: regex('assigned') },
            { progress_2: regex('assigned') },
            { progress_3: regex('assigned') },
            { progress_4: regex('assigned') }
          ]
        };
        break;

      case 'inProgress':
        query = {
          fulfillment_status: excludeFulfilled,
          $or: [
            { progress_1: regex('in progress') },
            { progress_2: regex('in progress') },
            { progress_3: regex('in progress') },
            { progress_4: regex('in progress') }
          ]
        };
        break;

      case 'printedDone':
        query = {
          fulfillment_status: excludeFulfilled,
          $or: [
            { progress_1: regex('printed-done') },
            { progress_2: regex('printed-done') },
            { progress_3: regex('printed-done') },
            { progress_4: regex('printed-done') }
          ]
        };
        break;

      case 'finishingBinding':
        query = {
          fulfillment_status: excludeFulfilled,
          $or: [
            { progress_1: regex('finishing & binding') },
            { progress_2: regex('finishing & binding') },
            { progress_3: regex('finishing & binding') },
            { progress_4: regex('finishing & binding') }
          ]
        };
        break;

      case 'toBeChecked':
        query = {
          fulfillment_status: excludeFulfilled,
          $or: [
            { progress_1: regex('to be checked') },
            { progress_2: regex('to be checked') },
            { progress_3: regex('to be checked') },
            { progress_4: regex('to be checked') }
          ]
        };
        break;

      case 'readyForDispatch':
        query = {
          fulfillment_status: excludeFulfilled,
          $or: [
            { progress_1: regex('ready for dispatch') },
            { progress_2: regex('ready for dispatch') },
            { progress_3: regex('ready for dispatch') },
            { progress_4: regex('ready for dispatch') }
          ]
        };
        break;

      case 'readyForPickup':
        query = {
          $or: [
            { fulfillment_status: regex('ready for pickup') },
            { order_status: regex('ready for pickup') }
          ]
        };
        break;

      case 'onHold':
        query = {
          $or: [
            { fulfillment_status: regex('on hold') },
            { order_status: regex('on hold') }
          ]
        };
        break;

      default:
        console.error('🚫 Invalid status param received:', status);
        return res.status(400).json({ error: 'Invalid status' });
    }

    const rawOrders = await Order.find(query);

    const orders = rawOrders.map(order => ({
      ...order.toObject(),
      progress: [
        order.progress_1,
        order.progress_2,
        order.progress_3,
        order.progress_4,
      ].filter(Boolean),
      assignee: [
        order.assignee_1,
        order.assignee_2,
        order.assignee_3,
        order.assignee_4,
      ].filter(Boolean),
    }));

    res.json({ count: orders.length, orders });

  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
