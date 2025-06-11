require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/Order');
const PendingUpdate = require('../models/PendingUpdate');
const { cleanOrder } = require('../controllers/cleanOrder');
const { SHOPIFY_API_URL, HEADERS } = require('../config/constants');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchOrder = async (id) => {
  try {
    const res = await axios.get(`${SHOPIFY_API_URL}/orders/${id}.json`, { headers: HEADERS });
    return res.data.order;
  } catch {
    return null;
  }
};

const fetchMetafields = async (id) => {
  try {
    const res = await axios.get(`${SHOPIFY_API_URL}/orders/${id}/metafields.json`, { headers: HEADERS });
    return res.data.metafields || [];
  } catch {
    return [];
  }
};

const processPendingUpdates = async () => {
  const pending = await PendingUpdate.find({});
  console.log(`🔁 Spracovávam ${pending.length} pending webhookov`);

  for (const entry of pending) {
    const { orderId } = entry;
    const fullOrder = await fetchOrder(orderId);
    const metafields = await fetchMetafields(orderId);

    if (!fullOrder || metafields.length === 0) {
      console.log(`⚠️ Order ${orderId} stále bez dát`);
      continue;
    }

    const cleaned = cleanOrder(fullOrder, metafields);
    const existing = await Order.findOne({ id: cleaned.id });

    if (!existing) {
      await Order.create(cleaned);
      console.log(`✅ Vytvorená nová objednávka ${cleaned.id} cez pending cron`);
    } else {
      await Order.updateOne({ id: cleaned.id }, { $set: cleaned });
      console.log(`🔄 Updatnutá objednávka ${cleaned.id} cez pending cron`);
    }

    // ✅ Zmaž zo zásobníka
    await PendingUpdate.deleteOne({ orderId });
  }
};

if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI).then(async () => {
    await processPendingUpdates();
    mongoose.connection.close();
  });
}

