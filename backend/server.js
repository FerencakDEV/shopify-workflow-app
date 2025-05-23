const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));
const app = express();
const PORT = process.env.PORT || 5000;

// Definuj povolené originy (frontend URL)
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];

// Middleware na parsovanie JSON
app.use(express.json());

// CORS middleware s callbackom na kontrolu originov
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // povoliť requesty bez originu (napr. Postman)
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy: Origin ${origin} not allowed`;
      console.error(msg);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Testovacia domovská stránka
app.get('/', (req, res) => {
  res.send('Shopify backend beží 🚀');
});

// Routes
const orderRoutes = require('./routes/orders');
app.use('/orders', orderRoutes);

// Server štart
app.listen(PORT, () => {
  console.log(`Server beží na porte ${PORT}`);
});
