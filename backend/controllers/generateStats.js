// scripts/generateStats.js

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Pripojené k MongoDB\n');

    const orders = await Order.find();

    const widgetStats = {
      newOrders: 0,
      urgentNewOrders: 0,
      assignedOrders: 0,
      inProgress: 0,
      finishingBinding: 0,
      toBeChecked: 0,
      readyForDispatch: 0,
      readyForPickup: 0,
      onHold: 0,
      needAttention: 0,
      fulfilled: 0
    };

    for (const order of orders) {
      const cs = order.custom_status || 'unknown';
      const fs = order.fulfillment_status || 'unknown';

      const progresses = [
        order.progress_1,
        order.progress_2,
        order.progress_3,
        order.progress_4
      ].filter(Boolean).map(p => p.toLowerCase());

      // Fulfilled = nemá byť nikde vo widgetoch
      if (fs === 'fulfilled' || cs === 'fulfilled') {
        widgetStats.fulfilled++;
        continue;
      }

      const hasAnyProgress = progresses.length > 0;

      // NEW ORDER
      if (cs === 'New Order' && !hasAnyProgress) widgetStats.newOrders++;

      // URGENT NEW ORDER
      if (cs === 'Urgent New Order' && !hasAnyProgress) widgetStats.urgentNewOrders++;

      // Assigned – ak je aspoň jedno "assigned"
      if (progresses.includes('assigned')) widgetStats.assignedOrders++;

      // In Progress
      if (progresses.includes('in progress')) widgetStats.inProgress++;

      // Finishing & Binding
      if (progresses.includes('finishing & binding')) widgetStats.finishingBinding++;

      // To be Checked
      if (progresses.includes('to be checked')) widgetStats.toBeChecked++;

      // Ready for Dispatch
      if (progresses.includes('ready for dispatch')) widgetStats.readyForDispatch++;

      // Ready for Pickup
      if (progresses.includes('ready for pickup')) widgetStats.readyForPickup++;

      // On Hold (iba podľa custom_status)
      if (cs === 'On Hold') widgetStats.onHold++;

      // Need Attention (iba podľa custom_status)
      if (cs === 'Need Attention') widgetStats.needAttention++;
    }

    console.log('📊 Výsledné widgety podľa logiky dashboardu:\n');
    console.table(widgetStats);

    process.exit(0);
  } catch (err) {
    console.error('❌ Chyba:', err.message);
    process.exit(1);
  }
  
})();
