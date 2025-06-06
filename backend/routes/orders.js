// routes/orders.js
router.get('/by-assignee/:name', async (req, res) => {
  const assigneeName = req.params.name;
  try {
    const orders = await Order.find({
      $or: [
        { assignee_1: assigneeName },
        { assignee_2: assigneeName },
        { assignee_3: assigneeName },
        { assignee_4: assigneeName }
      ]
    }).select('order_number custom_status fulfillment_status assignee_1 assignee_2 assignee_3 assignee_4');

    res.json({ data: orders });
  } catch (err) {
    console.error('❌ Error fetching orders by assignee:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
