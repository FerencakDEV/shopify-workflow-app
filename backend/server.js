const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./models/Order');



const dashboardRoutes = require('./routes/dashboard');
const workloadChartRoute = require('./routes/workloadChart');

const { cleanOrder } = require('./controllers/cleanOrder');

const app = express();

// ✅ CORS (musí byť pred všetkými routes)
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

// ✅ Healthcheck
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.get('/', (req, res) => {
  console.log('✅ GET / route hit');
  res.send('Shopify backend beží 🚀');
});

// ✅ API routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/orders', workloadChartRoute);
const ordersByStatusRoutes = require('./routes/ordersByStatus');
app.use('/api/orders', ordersByStatusRoutes);
const byAssigneeRoutes = require('./routes/byAssignee');
app.use('/api/orders', byAssigneeRoutes);

// ✅ Webhooks

// ✅ Webhook – CREATE
app.post('/webhook/order-created', async (req, res) => {
  try {
    console.log('📦 Webhook – CREATE prijatý:', req.body.order_number);

    const cleaned = cleanOrder(req.body); // použijeme transformáciu
    await Order.create(cleaned);

    res.status(200).send('Order uložená');
  } catch (err) {
    console.error('❌ Chyba v order-created:', err.message);
    res.status(500).send('Chyba pri vytváraní objednávky');
  }
});

// ✅ Webhook – UPDATE
app.post('/webhook/order-updated', async (req, res) => {
  try {
    console.log('🔁 Webhook – UPDATE prijatý:', req.body.order_number);

    const cleaned = cleanOrder(req.body);
    await Order.updateOne({ id: cleaned.id }, { $set: cleaned }, { upsert: true });

    res.status(200).send('Order aktualizovaná');
  } catch (err) {
    console.error('❌ Chyba v order-updated:', err.message);
    res.status(500).send('Chyba pri aktualizácii objednávky');
  }
});

// ✅ Mongo + Server
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

// ✅ Error handling
process.on('uncaughtException', err => {
  console.error('🧨 Uncaught Exception:', err);
});
process.on('unhandledRejection', reason => {
  console.error('🧨 Unhandled Rejection:', reason);
});
