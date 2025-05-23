// backend/testVerifyDatabase.js

const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const Order = require('./models/Order');

// Načítanie .env premenných
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const { SHOPIFY_API_URL, HEADERS } = require('./config/constants');

(async () => {
  try {
    console.log('🔧 Spúšťam kontrolu objednávok...');

    // Pripojenie na MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Posledné ID v MongoDB
    const latestFromDB = await Order.findOne().sort({ id: -1 }).select('id');
    const dbLastId = latestFromDB?.id || 0;

    // Načítanie prvej a poslednej objednávky zo Shopify
    const [firstOrderRes, lastOrderRes] = await Promise.all([
      axios.get(`${SHOPIFY_API_URL}/orders.json?limit=1&order=id+asc`, { headers: HEADERS }),
      axios.get(`${SHOPIFY_API_URL}/orders.json?limit=1&order=id+desc`, { headers: HEADERS }),
    ]);

    const firstOrder = firstOrderRes.data.orders[0];
    const lastOrder = lastOrderRes.data.orders[0];

    // Výpočet a výpis
    const orderCountRes = await axios.get(`${SHOPIFY_API_URL}/orders/count.json`, { headers: HEADERS });
    const orderCount = orderCountRes.data.count;
    const dbCount = await Order.countDocuments();

    console.log('⏳ Najstaršia objednávka:', firstOrder.name, `(${firstOrder.id})`);
    console.log('🚀 Najnovšia objednávka:', lastOrder.name, `(${lastOrder.id})`);
    console.log('🧩 MongoDB posledná objednávka:', dbLastId);
    console.log('📊 Odhadovaný počet objednávok:', orderCount);
    console.log('📦 Počet objednávok v MongoDB:', dbCount);

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Chyba pri overovaní objednávok:');
    console.error(err);
    await mongoose.disconnect();
  }
})();
