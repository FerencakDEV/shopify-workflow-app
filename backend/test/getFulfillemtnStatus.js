// getFulfillmentStatus.js
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Načíta .env súbor z backend priečinka
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const { SHOPIFY_API_URL, SHOPIFY_TOKEN } = process.env;

if (!SHOPIFY_API_URL || !SHOPIFY_TOKEN) {
  console.error('❌ SHOPIFY_API_URL alebo SHOPIFY_TOKEN chýba v .env súbore');
  process.exit(1);
}

// Funkcia na získanie fulfillment_status
const getFulfillmentStatus = async (orderId) => {
  try {
    const url = `${SHOPIFY_API_URL}/orders/${orderId}.json`;

    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    const order = response.data.order;
    console.log(`✅ Order #${order.name} → fulfillment_status: ${order.fulfillment_status}`);
  } catch (error) {
    console.error(`❌ Chyba pri získavaní objednávky ${orderId}:`, error.message);
  }
};

// 💡 Tu zadaj ID objednávky (Shopify order ID, nie číslo objednávky!)
const ORDER_ID = '10132811841860';
getFulfillmentStatus(ORDER_ID);
