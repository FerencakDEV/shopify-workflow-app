const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // Shopify order ID
  order_number: Number,
  name: String,
  email: String,
  fulfillment_status: String,
  custom_status: String,
  assignee: String,
  progress: String,
  metafields: {
    type: Map,
    of: String,
  },
  tags: [String],
  created_at: Date,
  updated_at: Date,
  line_items: [
    {
      title: String,
      quantity: Number,
      price: String,
    },
  ],
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

