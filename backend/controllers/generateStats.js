// scripts/generateStats.js

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Pripojené k MongoDB\n');

    const orders = await Order.find();

    const stats = {
      fulfillment_status: {},
      custom_status: {},
      order_status: {},
      assignee: {},
      progress: {}
    };

    for (const o of orders) {
      const fs = o.fulfillment_status || 'unknown';
      const cs = o.custom_status || 'unknown';
      const os = o.order_status || 'unknown';

      stats.fulfillment_status[fs] = (stats.fulfillment_status[fs] || 0) + 1;
      stats.custom_status[cs] = (stats.custom_status[cs] || 0) + 1;
      stats.order_status[os] = (stats.order_status[os] || 0) + 1;

      for (let i = 1; i <= 4; i++) {
        const a = o[`assignee_${i}`];
        if (a) stats.assignee[a] = (stats.assignee[a] || 0) + 1;

        const p = o[`progress_${i}`];
        if (p) stats.progress[p] = (stats.progress[p] || 0) + 1;
      }
    }

    console.log('📦 Fulfillment Status:');
    console.table(stats.fulfillment_status);

    console.log('📦 Custom Status (widgety):');
    console.table(stats.custom_status);

    console.log('📦 Order Status (z metafields):');
    console.table(stats.order_status);

    console.log('👷 Assignees:');
    console.table(stats.assignee);

    console.log('📈 Progress statusy:');
    console.table(stats.progress);

    process.exit(0);
  } catch (err) {
    console.error('❌ Chyba:', err.message);
    process.exit(1);
  }
})();
