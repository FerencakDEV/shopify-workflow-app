function cleanOrder(order, metafields = []) {
  const metafieldMap = {};
  for (const mf of metafields) {
    metafieldMap[mf.key] = mf.value;
  }

  return {
    id: order.id,
    name: order.name,
    email: order.email || order.customer?.email || '',
    customer: {
      id: order.customer?.id || '',
      email: order.customer?.email || '',
      first_name: order.customer?.first_name || '',
      last_name: order.customer?.last_name || ''
    },
    financial_status: order.financial_status || '',
    fulfillment_status: order.fulfillment_status || null,
    line_items: order.line_items || [],
    created_at: order.created_at,
    updated_at: order.updated_at,
    processed_at: order.processed_at || null,
    note: order.note || null,
    order_number: order.order_number || '',
    tags: Array.isArray(order.tags) ? order.tags : [order.tags || ''],
    total_price: order.total_price || '',
    
    // ASSIGNEE
    assignee: [
      metafieldMap['assignee-1'] || '',
      metafieldMap['assignee-2'] || '',
      metafieldMap['assignee-3'] || '',
      metafieldMap['assignee-4'] || ''
    ],
    assignee_1: metafieldMap['assignee-1'] || '',
    assignee_2: metafieldMap['assignee-2'] || '',
    assignee_3: metafieldMap['assignee-3'] || '',
    assignee_4: metafieldMap['assignee-4'] || '',

    // PROGRESS
    progress: [
      metafieldMap['progress-1'] || '',
      metafieldMap['progress-2'] || '',
      metafieldMap['progress-3'] || '',
      metafieldMap['progress-4'] || ''
    ],
    progress_1: metafieldMap['progress-1'] || '',
    progress_2: metafieldMap['progress-2'] || '',
    progress_3: metafieldMap['progress-3'] || '',
    progress_4: metafieldMap['progress-4'] || '',

    // STATUS
    custom_status: '', // nastavuješ cez logiku inde (napr. CRON)
    order_status: 'new order', // alebo podľa potreby
    is_urgent: metafieldMap['urgent'] === 'true' || false,

    // Časy
    expected_time: metafieldMap['expected_time'] || '',
    expected_time_1: metafieldMap['expected_time-1'] || '',

    metafields: metafieldMap,
    changelog: [],
  };
}

module.exports = { cleanOrder };
