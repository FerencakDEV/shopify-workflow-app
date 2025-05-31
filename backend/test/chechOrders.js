const mongoose = require('mongoose');
require('dotenv').config({path: '../../backend/.env'});
const Order = require('../models/Order'); 
const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const orders = await Order.find({}, {
      order_number: 1,
      fulfillment_status: 1,
      assignee_1: 1,
      assignee_2: 1,
      assignee_3: 1,
      assignee_4: 1,
      progress_1: 1,
      progress_2: 1,
      progress_3: 1,
      progress_4: 1
    });

    console.log(`📦 Found ${orders.length} orders\n`);

    orders.forEach(order => {
      console.log(`-----------------------------`);
      console.log(`Order #${order.order_number}`);
      console.log(`Fulfillment Status: ${order.fulfillment_status}`);
      console.log(`Assignees:`, order.assignee_1, order.assignee_2, order.assignee_3, order.assignee_4);
      console.log(`Progress:`, order.progress_1, order.progress_2, order.progress_3, order.progress_4);
    });

    process.exit();
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
};

run();
