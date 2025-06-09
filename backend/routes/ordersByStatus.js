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
    custom_status: { $in: ['New Order', 'Hold Released'] },
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
    custom_status: { $in: ['Urgent New Order', 'New Order', 'Hold Released'] }, // ✅ pridané
    is_urgent: { $in: [true, "true"], $exists: true },
    fulfillment_status: { $ne: 'fulfilled' },
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

      case 'assignedOrders':
        query = {
          custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
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
          custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
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
          custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
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
          custom_status: { $in: ['New Order', 'Urgent New Order', 'Hold Released'] },
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
          fulfillment_status: 'unfulfilled',

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
    fulfillment_status: { $ne: 'fulfilled' },
    $or: [
      { progress_1: regex('ready for pickup') },
      { progress_2: regex('ready for pickup') },
      { progress_3: regex('ready for pickup') },
      { progress_4: regex('ready for pickup') }
    ]
  };
  break;

      case 'onHold':
  query = {
    fulfillment_status: { $ne: 'fulfilled' },
    custom_status: 'On Hold'
  };
  break;

        case 'needAttention':
  const empty = [null, '', undefined];
  query = {
    fulfillment_status: { $ne: 'fulfilled' },
    $or: [
      // Assignee and progress mismatch
      ...[1, 2, 3, 4].flatMap(i => ([
        {
          $and: [
            { [`assignee_${i}`]: { $nin: empty } },
            {
              $or: [
                { [`progress_${i}`]: { $in: empty } },
                { [`progress_${i}`]: { $exists: false } }
              ]
            }
          ]
        },
        {
          $and: [
            { [`progress_${i}`]: { $nin: empty } },
            {
              $or: [
                { [`assignee_${i}`]: { $in: empty } },
                { [`assignee_${i}`]: { $exists: false } }
              ]
            }
          ]
        }
      ])),
      // Missing custom_status
      { custom_status: { $in: empty } }
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
