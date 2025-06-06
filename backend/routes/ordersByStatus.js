const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const unfulfilled = [null, '', 'unfulfilled'];

    let query = {};

    switch (status) {
      case 'newOrders':
        query = {
          fulfillment_status: { $in: unfulfilled },
          $and: [
            {
              $or: [
                { progress: { $exists: false } },
                { progress: '' },
                { progress_1: '' },
                { progress_1: { $exists: false } },
                { $and: [
                  { progress_1: '' },
                  { progress_2: '' },
                  { progress_3: '' },
                  { progress_4: '' },
                ] }
              ]
            }
          ]
        };
        break;

      case 'urgentNewOrders':
        query = {
          fulfillment_status: { $in: unfulfilled },
          is_urgent: true,
          $and: [
            {
              $or: [
                { progress: { $exists: false } },
                { progress: '' },
                { progress_1: '' },
                { progress_1: { $exists: false } },
                { $and: [
                  { progress_1: '' },
                  { progress_2: '' },
                  { progress_3: '' },
                  { progress_4: '' },
                ] }
              ]
            }
          ]
        };
        break;

      case 'assignedOrders':
        query = {
          fulfillment_status: { $in: unfulfilled },
          $or: [
            { progress: 'Assigned' },
            { progress_1: 'Assigned' },
            { progress_2: 'Assigned' },
            { progress_3: 'Assigned' },
            { progress_4: 'Assigned' },
          ],
        };
        break;

      case 'inProgress':
        query = {
          fulfillment_status: { $in: unfulfilled },
          $or: [
            { progress: 'In Progress' },
            { progress_1: 'In Progress' },
            { progress_2: 'In Progress' },
            { progress_3: 'In Progress' },
            { progress_4: 'In Progress' },
          ],
        };
        break;

      case 'printedDone':
        query = {
          fulfillment_status: { $in: unfulfilled },
          $or: [
            { progress: 'Printed-Done' },
            { progress_1: 'Printed-Done' },
            { progress_2: 'Printed-Done' },
            { progress_3: 'Printed-Done' },
            { progress_4: 'Printed-Done' },
          ],
        };
        break;

      case 'finishingBinding':
        query = {
          fulfillment_status: { $in: unfulfilled },
          $or: [
            { progress: 'Finishing & Binding' },
            { progress_1: 'Finishing & Binding' },
            { progress_2: 'Finishing & Binding' },
            { progress_3: 'Finishing & Binding' },
            { progress_4: 'Finishing & Binding' },
          ],
        };
        break;

      case 'toBeChecked':
        query = {
          fulfillment_status: { $in: unfulfilled },
          $or: [
            { progress: 'To Be Checked' },
            { progress_1: 'To Be Checked' },
            { progress_2: 'To Be Checked' },
            { progress_3: 'To Be Checked' },
            { progress_4: 'To Be Checked' },
          ],
        };
        break;

      case 'onHold':
        query = {
          fulfillment_status: { $in: unfulfilled },
          $or: [
            { progress: 'On Hold' },
            { progress_1: 'On Hold' },
            { progress_2: 'On Hold' },
            { progress_3: 'On Hold' },
            { progress_4: 'On Hold' },
          ],
        };
        break;

      case 'needAttention':
        query = {
          fulfillment_status: { $in: unfulfilled },
          $or: [
            { progress: 'Need Attention' },
            { progress_1: 'Need Attention' },
            { progress_2: 'Need Attention' },
            { progress_3: 'Need Attention' },
            { progress_4: 'Need Attention' },
          ],
        };
        break;

      case 'readyForDispatch':
        query = {
          fulfillment_status: { $in: unfulfilled },
          $or: [
            { progress: 'Ready for Dispatch' },
            { progress_1: 'Ready for Dispatch' },
            { progress_2: 'Ready for Dispatch' },
            { progress_3: 'Ready for Dispatch' },
            { progress_4: 'Ready for Dispatch' },
          ],
        };
        break;

      case 'readyForPickup':
        query = {
          fulfillment_status: { $in: unfulfilled },
          $or: [
            { progress: 'Ready for Pickup' },
            { progress_1: 'Ready for Pickup' },
            { progress_2: 'Ready for Pickup' },
            { progress_3: 'Ready for Pickup' },
            { progress_4: 'Ready for Pickup' },
          ],
        };
        break;

      case 'fulfilled':
        query = { fulfillment_status: 'fulfilled' };
        break;

      default:
        return res.status(400).json({ error: 'Invalid status' });
    }

    const orders = await Order.find(query).sort({ processed_at: -1 });
    res.json(orders);
  } catch (err) {
    console.error('❌ Error fetching orders by status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
