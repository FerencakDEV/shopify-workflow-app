// backend/models/CronLog.js
const mongoose = require('mongoose');

const CronLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  added: [String],
  updated: [String],
  unchanged: [String],
  runBy: { type: String, default: 'system-cron' }
});

module.exports = mongoose.model('CronLog', CronLogSchema);
