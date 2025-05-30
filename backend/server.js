const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');
const orderRoutes = require('./routes/orders');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// ✅ CORS (Musí byť pred routes!)
app.use(cors({
  origin: ['http://localhost:3000', 'https://shopify-workflow-app-frontend.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// ✅ JSON parsing
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/webhook')) {
      req.rawBody = buf;
    }
  }
}));

// ✅ API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/orders', orderRoutes);

// ✅ Healthcheck route
app.get('/', (req, res) => {
  console.log('✅ GET / route hit');
  res.send('Shopify backend beží 🚀');
});

// ✅ Webhooks
app.post('/webhook/order-created', async (req, res) => {
  try {
    console.log('📦 Webhook – CREATE prijatý:', req.body.order_number);
    await Order.create(req.body);
    res.status(200).send('Order uložená');
  } catch (err) {
    console.error('❌ Chyba v order-created:', err.message);
    res.status(500).send('Chyba pri vytváraní objednávky');
  }
});

app.post('/webhook/order-updated', async (req, res) => {
  try {
    console.log('🔁 Webhook – UPDATE prijatý:', req.body.order_number);
    await Order.updateOne({ id: req.body.id }, { $set: req.body }, { upsert: true });
    res.status(200).send('Order aktualizovaná');
  } catch (err) {
    console.error('❌ Chyba v order-updated:', err.message);
    res.status(500).send('Chyba pri aktualizácii objednávky');
  }
});

// ✅ Spusti server až po spojení s MongoDB
const PORT = process.env.PORT || 10000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });
process.on('uncaughtException', err => {
  console.error('🧨 Uncaught Exception:', err);
});

process.on('unhandledRejection', reason => {
  console.error('🧨 Unhandled Rejection:', reason);
});