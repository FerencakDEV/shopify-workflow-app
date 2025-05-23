const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Zabezpečenie priečinka logs/
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log('📁 Vytvorený priečinok logs/');
}

// ✅ Middleware
app.use(express.json());

const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const msg = `CORS policy: Origin ${origin} not allowed`;
    console.error(msg);
    return callback(new Error(msg), false);
  },
  credentials: true,
}));

// ✅ Pripojenie k MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ Routes
const orderRoutes = require('./routes/orders');
app.use('/orders', orderRoutes);

// ✅ Úvodná routa
app.get('/', (req, res) => {
  res.send('Shopify backend beží 🚀');
});

// ✅ Spustenie servera
app.listen(PORT, () => {
  console.log(`Server beží na porte ${PORT}`);
});
