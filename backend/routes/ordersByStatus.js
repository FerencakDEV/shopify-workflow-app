const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/by-status', async (req, res) => {
  const status = req.query.status;
  if (!status) return res.status(400).json({ error: 'Missing status param' });

  try {
    let query = {};

    const regex = (value) => ({ $regex: new RegExp(`^${value}$`, 'i') });

    switch (status) {
      case 'newOrders':
        query = {
          custom_status: regex('New Order'),
          fulfillment_status: { $ne: 'fulfilled' },
          $or: [
            { assignee: { $size: 0 } },
            { assignee: { $not: { $elemMatch: { $ne: '' } } } },
            { assignee: { $exists: false } },
            { assignee: null }
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
          fulfillment_status: { $in: ['unfulfilled', 'partially_fulfilled'] },
          $or: [
            { progress: { $in: [regex('Assigned')] } },
            { progress_1: regex('Assigned') },
            { progress_2: regex('Assigned') },
            { progress_3: regex('Assigned') },
            { progress_4: regex('Assigned') },
          ],
          assignee: { $exists: true, $not: { $size: 0 } }
        };
        break;

      case 'inProgress':
        query = {
          custom_status: { $in: [regex('New Order'), regex('Urgent New Order'), regex('Hold Released')] },
          fulfillment_status: { $in: ['unfulfilled', 'partially_fulfilled'] },
          $or: [
            { progress: { $in: [regex('In Progress')] } },
            { progress_1: regex('In Progress') },
            { progress_2: regex('In Progress') },
            { progress_3: regex('In Progress') },
            { progress_4: regex('In Progress') },
          ]
        };
        break;

      case 'finishingBinding':
        query = {
          custom_status: { $in: [regex('New Order'), regex('Urgent New Order'), regex('Hold Released')] },
          fulfillment_status: { $ne: 'fulfilled' },
          $or: [
            { progress: { $in: [regex('Finishing & Binding')] } },
            { progress_1: regex('Finishing & Binding') },
            { progress_2: regex('Finishing & Binding') },
            { progress_3: regex('Finishing & Binding') },
            { progress_4: regex('Finishing & Binding') },
          ]
        };
        break;

      case 'toBeChecked':
        query = {
          fulfillment_status: { $in: ['unfulfilled', 'partially_fulfilled'] },
          $or: [
            { progress: { $in: [regex('To be Checked')] } },
            { progress_1: regex('To be Checked') },
            { progress_2: regex('To be Checked') },
            { progress_3: regex('To be Checked') },
            { progress_4: regex('To be Checked') },
          ]
        };
        break;

      case 'readyForDispatch':
        query = {
          fulfillment_status: 'unfulfilled',
          $or: [
            { progress: { $in: [regex('Ready for Dispatch')] } },
            { progress_1: regex('Ready for Dispatch') },
            { progress_2: regex('Ready for Dispatch') },
            { progress_3: regex('Ready for Dispatch') },
            { progress_4: regex('Ready for Dispatch') },
          ]
        };
        break;

      case 'readyForPickup':
        query = {
          fulfillment_status: { $ne: 'fulfilled' },
          $or: [
            { progress: { $in: [regex('Ready for Pickup')] } },
            { progress_1: regex('Ready for Pickup') },
            { progress_2: regex('Ready for Pickup') },
            { progress_3: regex('Ready for Pickup') },
            { progress_4: regex('Ready for Pickup') },
          ]
        };
        break;

      case 'onHold':
        query = {
          custom_status: regex('On Hold'),
          fulfillment_status: { $ne: 'fulfilled' }
        };
        break;

      case 'needAttention':
        query = {
          custom_status: regex('Need Attention'),
          fulfillment_status: { $ne: 'fulfilled' }
        };
        break;

      case 'fulfilled':
        query = {
          fulfillment_status: 'fulfilled'
        };
        break;

      case 'allOrders':
        query = {};
        break;

      default:
        return res.status(400).json({ error: 'Invalid status param' });
    }

    console.log('🧪 Status:', status);
    console.log('🧪 Mongo query:', JSON.stringify(query, null, 2));

    const orders = await Order.find(query, {
      order_number: 1,
      custom_status: 1,
      fulfillment_status: 1,
      assignee: 1,
      progress: 1,
      metafields: 1
    }).sort({ created_at: -1 }).limit(300);

    console.log(`✅ Found ${orders.length} orders for status ${status}`);

    res.json({ count: orders.length, orders });

  } catch (err) {
    console.error('❌ Error in /by-status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
