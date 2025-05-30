const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Order = require('../models/Order');

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const fixOrdersStructure = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Pripojené k MongoDB');

    const orders = await Order.find({});
    console.log(`🔍 Načítaných objednávok: ${orders.length}`);

    let updatedCount = 0;

    for (const order of orders) {
      const updates = {};

      // Dopĺňanie základných polí, ak chýbajú
      if (order.custom_status === undefined) updates.custom_status = '';
      if (order.assignee === undefined) updates.assignee = [];
      if (order.assignee_1 === undefined) updates.assignee_1 = '';
      if (order.assignee_2 === undefined) updates.assignee_2 = '';
      if (order.assignee_3 === undefined) updates.assignee_3 = '';
      if (order.assignee_4 === undefined) updates.assignee_4 = '';
      if (order.progress === undefined) updates.progress = [];
      if (order.progress_1 === undefined) updates.progress_1 = '';
      if (order.progress_2 === undefined) updates.progress_2 = '';
      if (order.progress_3 === undefined) updates.progress_3 = '';
      if (order.progress_4 === undefined) updates.progress_4 = '';
      if (order.expected_time === undefined) updates.expected_time = '';
      if (order.expected_time_1 === undefined) updates.expected_time_1 = '';
      if (order.expected_time_2 === undefined) updates.expected_time_2 = '';
      if (order.expected_time_3 === undefined) updates.expected_time_3 = '';
      if (order.expected_time_4 === undefined) updates.expected_time_4 = '';
      if (order.total_price === undefined) updates.total_price = '';

      // Zákazník (celý objekt ak chýba alebo neexistuje)
      if (order.customer === undefined || typeof order.customer !== 'object') {
        updates.customer = {
          id: null,
          email: '',
          first_name: '',
          last_name: ''
        };
      } else {
        const custUpdate = {};
        if (order.customer.id === undefined) custUpdate.id = null;
        if (order.customer.email === undefined) custUpdate.email = '';
        if (order.customer.first_name === undefined) custUpdate.first_name = '';
        if (order.customer.last_name === undefined) custUpdate.last_name = '';
        if (Object.keys(custUpdate).length > 0) {
          updates.customer = { ...order.customer.toObject?.() ?? order.customer, ...custUpdate };
        }
      }

      // Ak je čo updatnúť – spusti update
      if (Object.keys(updates).length > 0) {
        await Order.updateOne({ _id: order._id }, { $set: updates });
        updatedCount++;
      }
    }

    console.log(`✅ Fix dokončený – upravených objednávok: ${updatedCount}`);
    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Chyba pri opravovaní objednávok:', err.message);
    mongoose.connection.close();
  }
};

if (require.main === module) {
  fixOrdersStructure();
}

module.exports = { fixOrdersStructure };
