const mongoose = require('mongoose');

const PendingUpdateSchema = new mongoose.Schema({
  orderId: Number,
  receivedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PendingUpdate', PendingUpdateSchema);
