router.get('/by-assignee/:name', async (req, res) => {
  const assigneeName = req.params.name;
  const excludeFulfilled = { $nin: ['fulfilled', 'cancelled', 'ready-for-pickup', 'on-hold'] };
  const regex = (val) => ({ $regex: new RegExp(`^${val}$`, 'i') });

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
        { progress_1: regex('assigned') },
        { progress_2: regex('assigned') },
        { progress_3: regex('assigned') },
        { progress_4: regex('assigned') },
        { progress_1: regex('in progress') },
        { progress_2: regex('in progress') },
        { progress_3: regex('in progress') },
        { progress_4: regex('in progress') }
      ]
    }).select('order_number custom_status fulfillment_status assignee_1 assignee_2 assignee_3 assignee_4');

    res.json({ data: orders });
  } catch (err) {
    console.error('❌ Error fetching orders by assignee:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
