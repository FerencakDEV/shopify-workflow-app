const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/Order');
const { cleanOrder } = require('../controllers/cleanOrder');
const { SHOPIFY_API_URL, HEADERS } = require('../config/constants');

console.log('🔎 DEBUG SHOPIFY_TOKEN:', process.env.SHOPIFY_TOKEN);

const refreshOneOrder = async (orderId) => {
  try {
    const res = await axios.get(`${SHOPIFY_API_URL}/orders/${orderId}.json`, { headers: HEADERS });
    const rawOrder = res.data.order;
    const cleaned = cleanOrder(rawOrder);

    await Order.updateOne({ id: rawOrder.id }, { $set: cleaned }, { upsert: true });

    console.log(`✅ Aktualizovaná objednávka: ${rawOrder.name}`);
  } catch (err) {
    console.error(`❌ Chyba pri aktualizácii objednávky ${orderId}:`, err.message);
    throw new Error(orderId); // dôležité: vyhodíme orderId ako message
  }
};

const refreshIncompleteOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Pripojené k MongoDB');

    const incompleteOrders = await Order.find({
      $or: [
        { total_price: { $exists: false } },
        { 'customer.first_name': { $exists: false } },
        { 'line_items.0.quantity': { $exists: false } },
      ],
    });

    console.log(`🔍 Nájdených nekompletných objednávok: ${incompleteOrders.length}`);

    const results = await Promise.allSettled(
      incompleteOrders.map(order => refreshOneOrder(order.id))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    const failedIds = results
      .filter(r => r.status === 'rejected')
      .map(r => r.reason.message); // lebo Error obsahuje orderId v message

    console.log(`\n📊 Súhrn aktualizácií:`);
    console.log(`✅ Úspešne aktualizované: ${successful}`);
    console.log(`❌ Nepodarilo sa aktualizovať: ${failed}`);

    if (failed > 0) {
      console.log(`❗ Zlyhané objednávky (ID):\n${failedIds.join(', ')}`);
    }

    await mongoose.connection.close();
  } catch (err) {
    console.error('❌ Chyba pri refreshi objednávok:', err.message);
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  refreshIncompleteOrders();
}

module.exports = { refreshIncompleteOrders };
