const axios = require("axios");
require("dotenv").config();

const SHOPIFY_API_URL = "https://reasons-ie.myshopify.com/admin/api/2023-10";
const HEADERS = {
  "X-Shopify-Access-Token": process.env.SHOPIFY_TOKEN,
  "Content-Type": "application/json"
};

const testOrderId = "10120536817988"; // 👈 sem daj nové ID

(async () => {
  try {
    const res = await axios.get(`${SHOPIFY_API_URL}/orders/${testOrderId}/metafields.json`, {
      headers: HEADERS
    });

    console.log("✅ Úspech:");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("❌ ERROR");
    console.error("Status:", err.response?.status);
    console.error("Data:", err.response?.data || err.message);
  }
})();
