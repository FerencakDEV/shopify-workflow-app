const fs = require('fs');
const path = require('path');

// ✅ Absolútna bezpečnosť – ak priečinok/log neexistuje, vytvorí sa
const logDir = path.join(__dirname, '../logs');
const logFile = path.join(logDir, 'backend.log');

function ensureLogPath() {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
  }
}

function logToFile(message) {
  try {
    ensureLogPath(); // zavolá sa vždy, pred každým logovaním
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
  } catch (err) {
    console.error('❌ Nepodarilo sa zapísať do logu:', err.message);
  }
}

module.exports = { logToFile };
