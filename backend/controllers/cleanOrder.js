const cleanOrder = (order, metafields = []) => {
  const getMeta = (key, fallbackKey = null) => {
    const found = metafields.find((m) => m.key === key);
    if (found && typeof found.value === 'string') return found.value.trim();
    if (fallbackKey) {
      const fallback = metafields.find((m) => m.key === fallbackKey);
      if (fallback && typeof fallback.value === 'string') return fallback.value.trim();
    }
    return '';
  };

  const custom_status_meta = getMeta('order-custom-status');
  let fulfillment_status = order.fulfillment_status ?? 'unfulfilled';
  const custom_status = custom_status_meta || fulfillment_status;

  if (!custom_status_meta) {
    console.warn(`⚠️ cleanOrder: custom_status_meta is empty for order ${order.id}`);
  }

  // 🎯 Úprava fulfillment_status podľa custom_status
  if (custom_status === 'On Hold') {
    fulfillment_status = 'on-hold';
  } else if (custom_status === 'Ready for Pickup') {
    fulfillment_status = 'ready-for-pickup';
  }

  return {
    id: Number(order.id),
    order_number: order.order_number,
    name: order.name || '',
    email: order.email || '',
    note: order.note || '',
    tags: order.tags || [],
    total_price: order.total_price || '',
    financial_status: order.financial_status || '',
    fulfillment_status,

    created_at: new Date(order.created_at),
    updated_at: new Date(order.updated_at),
    processed_at: new Date(order.processed_at),

    assignee: [
      getMeta('assignee-1', 'assignee'),
      getMeta('assignee-2'),
      getMeta('assignee-3'),
      getMeta('assignee-4'),
    ],
    assignee_1: getMeta('assignee-1', 'assignee'),
    assignee_2: getMeta('assignee-2'),
    assignee_3: getMeta('assignee-3'),
    assignee_4: getMeta('assignee-4'),

    progress: [
      getMeta('progress-1', 'progress'),
      getMeta('progress-2'),
      getMeta('progress-3'),
      getMeta('progress-4'),
    ],
    progress_1: getMeta('progress-1', 'progress'),
    progress_2: getMeta('progress-2'),
    progress_3: getMeta('progress-3'),
    progress_4: getMeta('progress-4'),

    custom_status,
    expected_time: getMeta('expected-time'),
    is_urgent: getMeta('is-urgent') === 'true',

    line_items: (order.line_items || []).map((item) => ({
      title: item.title,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      sku: item.sku,
      vendor: item.vendor,
      product_id: item.product_id,
    })),

    customer: {
      id: order.customer?.id,
      email: order.customer?.email,
      first_name: order.customer?.first_name,
      last_name: order.customer?.last_name,
    },

    changelog: [],
    metafields: metafields.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {}),
  };
};

module.exports = { cleanOrder };
