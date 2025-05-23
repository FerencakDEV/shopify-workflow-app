function cleanOrder(order) {
  return {
    // 🔑 Identifikačné údaje
    id: order.id,
    name: order.name,
    order_number: order.order_number,
    email: order.email,
    created_at: order.created_at,
    updated_at: order.updated_at,
    processed_at: order.processed_at,

    // 📦 Stav objednávky
    financial_status: order.financial_status,
    fulfillment_status: order.fulfillment_status,
    tags: order.tags,
    note: order.note,

    // 🔁 Custom logika (z metafields)
    custom_status: order.custom_status,
    assignee: order.assignee,
    assignee_1: order.assignee_1,
    assignee_2: order.assignee_2,
    assignee_3: order.assignee_3,
    assignee_4: order.assignee_4,
    progress: order.progress,
    progress_1: order.progress_1,
    progress_2: order.progress_2,
    progress_3: order.progress_3,
    progress_4: order.progress_4,
    expected_time: order.expected_time,
    expected_time_1: order.expected_time_1,
    expected_time_2: order.expected_time_2,
    expected_time_3: order.expected_time_3,
    expected_time_4: order.expected_time_4,

    // 💰 Cena
    total_price: order.total_price,

    // 👤 Zákazník
    customer: {
      id: order.customer?.id,
      email: order.customer?.email,
      first_name: order.customer?.first_name,
      last_name: order.customer?.last_name,
    },

    // 🛒 Produkty
    line_items: order.line_items?.map(item => ({
      name: item.name,
      title: item.title,      
      product_id: item.product_id,
      
      
    })),
  };
}
module.exports = { cleanOrder };
