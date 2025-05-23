const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { cleanOrder } = require('../utils/cleanOrder'); // uprav cestu podľa tvojej štruktúry

const MONGO_URI = 'mongodb+srv://WorFlowAdmin:MmeJ1GByjgzLmaAU@workflow-db.bs2sgt5.mongodb.net/?retryWrites=true&w=majority&appName=WorkFlow-db'; // <- sem vlož svoje Mongo URI
const DB_NAME = 'shopify';
const COLLECTION_NAME = 'orders';

async function main() {
  console.log('🔗 Connecting to MongoDB...');
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const OrdersCollection = db.collection(COLLECTION_NAME);

    const statsBefore = await OrdersCollection.stats();
    console.log('📦 Storage before cleanup:', statsBefore.storageSize, 'bytes');

    const orders = await OrdersCollection.find().toArray();
    console.log(`🔍 Loaded orders: ${orders.length}`);

    for (const [index, order] of orders.entries()) {
      const cleaned = cleanOrder(order);
      await OrdersCollection.updateOne({ _id: order._id }, { $set: cleaned });

      if ((index + 1) % 100 === 0 || index === orders.length - 1) {
        console.log(`✅ Cleaned: ${index + 1}/${orders.length}`);
      }
    }

    const statsAfter = await OrdersCollection.stats();
    console.log('📦 Storage after cleanup:', statsAfter.storageSize, 'bytes');
    console.log('🎉 Cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await client.close();
  }
}

main();
