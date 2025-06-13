const MAX_PAGES = 4;
const LIMIT = 250;

const runCronSync = async () => {
  console.log('🔧 CRON štartuje...');
  const added = [], updated = [], unchanged = [];

  try {
    let nextUrl = `${SHOPIFY_API_URL}/orders.json?limit=${LIMIT}&status=any&order=created_at desc`;

    for (let page = 0; page < MAX_PAGES && nextUrl; page++) {
      const response = await axios.get(nextUrl, { headers: HEADERS });
      const orders = response.data.orders;

      for (const order of orders) {
        const existing = await Order.findOne({ id: Number(order.id) });
        await delay(300);

        const metafields = await fetchMetafields(order.id);
        const cleaned = cleanOrder(order, metafields);

        if (!cleaned.fulfillment_status || cleaned.fulfillment_status === 'null') {
          const status = cleaned.custom_status?.toLowerCase() || '';
          if (status.includes('cancelled')) cleaned.fulfillment_status = 'fulfilled';
          else if (status.includes('ready for pickup')) cleaned.fulfillment_status = 'ready for pickup';
          else if (status.includes('on hold')) cleaned.fulfillment_status = 'on hold';
          else cleaned.fulfillment_status = 'unfulfilled';
        }

        if (!existing) {
          await Order.create(cleaned);
          added.push(cleaned.order_number || cleaned.id);
          console.log(`✅ Pridaná NOVÁ objednávka: ${cleaned.order_number}`);
        } else {
          const changed =
            JSON.stringify(existing.assignee) !== JSON.stringify(cleaned.assignee) ||
            JSON.stringify(existing.progress) !== JSON.stringify(cleaned.progress) ||
            existing.order_number !== cleaned.order_number ||
            existing.fulfillment_status !== cleaned.fulfillment_status ||
            existing.custom_status !== cleaned.custom_status;

          if (changed) {
            await Order.updateOne({ id: order.id }, { $set: cleaned });
            updated.push(cleaned.order_number || cleaned.id);
            console.log(`🔄 Aktualizovaná objednávka: ${cleaned.order_number}`);
          } else {
            unchanged.push(cleaned.order_number || cleaned.id);
          }
        }
      }

      // pagination - Shopify API provides `link` header
      const linkHeader = response.headers.link;
      if (linkHeader) {
        const match = linkHeader.match(/<([^>]+)>; rel="next"/);
        nextUrl = match ? match[1] : null;
      } else {
        nextUrl = null;
      }
    }

    await CronLog.create({
      timestamp: new Date(),
      added,
      updated,
      unchanged,
      runBy: 'render-cron',
    });

    console.log(`\n📊 Súhrn CRON:`)
    console.log(`➕ Pridané: ${added.length}`);
    console.log(`🔄 Aktualizované: ${updated.length}`);
    console.log(`⏭️ Nezmenené: ${unchanged.length}`);
  } catch (err) {
    console.error('❌ Chyba CRON behu:', err.message);
  }
};
