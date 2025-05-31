function cleanOrder(order, metafields = []) {
  const metafieldMap = {};
  for (const mf of metafields) {
    metafieldMap[mf.key] = mf.value;
  }

  return {
    id: order.id,
    name: order.name,
    email: order.email || order.customer?.email || '',
    fulfillment_status: order.fulfillment_status || null,
    created_at: order.created_at,
    updated_at: order.updated_at,
    line_items: order.line_items || [],
    total_price: order.total_price || '',
    currency: order.currency || '',
    tags: order.tags || '',
    assignee: [
      metafieldMap['assignee-1'] || '',
      metafieldMap['assignee-2'] || '',
      metafieldMap['assignee-3'] || '',
      metafieldMap['assignee-4'] || '',
    ],
    progress: [
      metafieldMap['progress-1'] || '',
      metafieldMap['progress-2'] || '',
      metafieldMap['progress-3'] || '',
      metafieldMap['progress-4'] || '',
    ],
    urgent: metafieldMap['urgent'] === 'true' || false,
    metafields: metafieldMap,
  };
}

module.exports = { cleanOrder };
