const mongoose = require('mongoose');

const pendingUpdateSchema = new mongoose.Schema({
  orderId: { type: Number, required: true, unique: true },
  reason: { type: String },
  receivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PendingUpdate', pendingUpdateSchema);