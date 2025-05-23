
const fs = require('fs');
const path = require('path');

const logToFile = (message) => {
  const logPath = path.join(__dirname, '../logs/backend.log');
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logPath, fullMessage, 'utf8');
};

module.exports = { logToFile };
