export const fetchOrdersByStatus = async (statusSlug: string) => {
  try {
    const res = await fetch(`https://shopify-workflow-app-backend.onrender.com/api/orders/by-status?status=${statusSlug}`);
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();
    return data.orders;
  } catch (err) {
    console.error('❌ Error fetching orders:', err);
    return [];
  }
};