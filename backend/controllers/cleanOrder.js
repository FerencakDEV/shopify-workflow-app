function cleanOrder(order, metafields = []) {
  const metafieldMap = {};
  for (const mf of metafields) {
    metafieldMap[mf.key] = mf.value;
  }

  const orderStatusRaw = metafieldMap['order-custom-status'] || '';
  const orderStatus = orderStatusRaw.toLowerCase();
  const isUrgent = metafieldMap['urgent'] === 'true';

  // Fallback fulfillment_status
  let fulfillmentStatus = order.fulfillment_status || null;
  if (!fulfillmentStatus || fulfillmentStatus === 'null') {
    if (orderStatus === 'cancelled') {
      fulfillmentStatus = 'fulfilled';
    } else if (orderStatus === 'on hold') {
      fulfillmentStatus = 'on hold';
    } else if (orderStatus === 'ready for pickup') {
      fulfillmentStatus = 'ready for pickup';
    } else {
      fulfillmentStatus = 'unfulfilled';
    }
  }

  // custom_status podľa widgetovej logiky
  let customStatus = 'New Order';

  if (orderStatus === 'cancelled') {
    customStatus = 'Cancelled';
  } else if (fulfillmentStatus === 'fulfilled') {
    customStatus = 'Fulfilled';
  } else if (fulfillmentStatus === 'partial') {
    customStatus = 'Partially Fulfilled';
  } else if (orderStatus === 'on hold' || fulfillmentStatus === 'on hold') {
    fulfillmentStatus = 'on hold';
    customStatus = 'On Hold';
  } else if (orderStatus === 'ready for pickup' || fulfillmentStatus === 'ready for pickup') {
    fulfillmentStatus = 'ready for pickup';
    customStatus = 'Ready for Pickup';
  } else if (isUrgent || orderStatus === 'urgent new order') {
    customStatus = 'Urgent New Order';
  } else if (orderStatus === 'assigned order') {
    customStatus = 'Assigned Order';
  } else if (orderStatus === 'finishing & binding') {
    customStatus = 'Finishing & Binding';
  } else if (orderStatus === 'to be checked') {
    customStatus = 'To be Checked';
  } else if (orderStatus === 'in progress') {
    customStatus = 'In Progress';
  } else if (orderStatus === 'ready for dispatch') {
    customStatus = 'Ready for Dispatch';
  } else if (orderStatus === 'need attention') {
    customStatus = 'Need Attention';
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
    fulfillment_status: fulfillmentStatus,
    line_items: order.line_items || [],
    created_at: order.created_at,
    updated_at: order.updated_at,
    processed_at: order.processed_at || null,
    note: order.note || null,
    order_number: order.order_number || '',
    tags: Array.isArray(order.tags) ? order.tags : [order.tags || ''],
    total_price: order.total_price || '',

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

    custom_status: customStatus,
    order_status: orderStatusRaw || 'New Order',
    is_urgent: isUrgent,

    expected_time: metafieldMap['expected_time'] || '',
    expected_time_1: metafieldMap['expected_time-1'] || '',

    metafields: metafieldMap,
    changelog: [],
  };
}

module.exports = { cleanOrder };
