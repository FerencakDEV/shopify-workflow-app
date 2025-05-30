const mongoose = require('mongoose');

const changelogEntrySchema = new mongoose.Schema({
  type: String,
  field: String,
  action: String,
  oldValue: String,
  newValue: String,
  timestamp: { type: Date, default: Date.now },
});

const lineItemSchema = new mongoose.Schema({
  name: String,
  title: String,
  quantity: Number,
  price: String,
  product_id: mongoose.Schema.Types.Mixed,
  sku: String,
  vendor: String,
});

const customerSchema = new mongoose.Schema({
  id: mongoose.Schema.Types.Mixed,
  email: String,
  first_name: String,
  last_name: String,
});

const orderSchema = new mongoose.Schema({
  // 📦 Identifikátory
  id: { type: mongoose.Schema.Types.Mixed, required: true, unique: true },
  order_number: Number,
  name: String,
  email: String,

  // 🕒 Časy
  created_at: Date,
  updated_at: Date,
  processed_at: Date,

  // 💳 Shopify statusy
  financial_status: String,
  fulfillment_status: String,
  custom_status: String,
  order_status: String, // 🆕 Pridané

  // 🔖 Tagy
  tags: [String],

  // 🧠 Metafields (custom)
  metafields: {
    type: Map,
    of: String,
  },
  assignee: [String],
  progress: [String],
  expected_time: String,

  assignee_1: String,
  assignee_2: String,
  assignee_3: String,
  assignee_4: String,

  progress_1: String,
  progress_2: String,
  progress_3: String,
  progress_4: String,

  expected_time_1: String,
  total_price: String,

  // 🧾 Zákazník
  customer: customerSchema,

  // 🛒 Produkty
  line_items: [lineItemSchema],

  // 📝 Poznámky
  note: String,

  is_urgent: Boolean,

  // 🔄 História zmien
  changelog: [changelogEntrySchema],
}, {
  timestamps: false,
});

module.exports = mongoose.model('Order', orderSchema);
