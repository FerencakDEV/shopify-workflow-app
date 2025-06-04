const cleanOrder = (order, metafields = []) => {
  const getMeta = (key, fallbackKey = null) => {
    const found = metafields.find((m) => m.key === key);
    if (found) return found.value?.trim() || '';
    if (fallbackKey) {
      const fallback = metafields.find((m) => m.key === fallbackKey);
      return fallback?.value?.trim() || '';
    }
    return '';
  };

  const fulfillment_status = order.fulfillment_status ?? 'unfulfilled';
  const custom_status_meta = getMeta('order-custom-status');

  // Prioritizuj custom_status, inak fallback na fulfillment_status
  const custom_status = custom_status_meta || fulfillment_status;

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
