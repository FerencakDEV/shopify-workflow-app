const { MongoClient } = require('mongodb');
const fs = require('fs');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb+srv://WorFlowAdmin:G3G4NHDV9ASP@workflow-db.bs2sgt5.mongodb.net/?retryWrites=true&w=majority&appName=WorkFlow-db';
const client = new MongoClient(uri);

const run = async () => {
  try {
    await client.connect();
    const db = client.db('orders');
    const collection = db.collection('test');

    const orders = await collection.find(
      {},
      {
        projection: {
          order_number: 1,
          custom_status: 1,
          assignee_1: 1,
          assignee_2: 1,
          assignee_3: 1,
          assignee_4: 1,
          progress_1: 1,
          progress_2: 1,
          progress_3: 1,
          progress_4: 1,
          metafields: 1
        }
      }
    )
    .sort({ createdAt: -1 })
    .limit(5000)
    .toArray();

    fs.writeFileSync('export_selected_orders.json', JSON.stringify(orders, null, 2), 'utf-8');
    console.log(`✅ Export completed: export_selected_orders.json (${orders.length} orders)`);

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.close();
  }
};

run();
