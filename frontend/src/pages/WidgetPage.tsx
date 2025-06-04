import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const statusMap: Record<string, string> = {
  'new-orders': 'New Order',
  'urgent-new-orders': 'Urgent New Order',
  'assigned-orders': 'Assigned Order',
  'in-progress': 'In Progress',
  'printed-done': 'Printed-Done',
  'finishing-binding': 'Finishing & Binding',
  'to-be-checked': 'To be Checked',
  'on-hold': 'On Hold',
  'ready-for-dispatch': 'Ready for Dispatch',
  'need-attention': 'Need Attention',
};

const WidgetPage = () => {
  const { slug } = useParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendKey = statusMap[slug || ''] || '';

  useEffect(() => {
    if (!backendKey) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(`https://shopify-workflow-app-backend.onrender.com/api/orders/by-status?status=${encodeURIComponent(backendKey)}`);
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        setError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [backendKey]);

  if (!backendKey) return <div className="p-6">Unknown status slug: {slug}</div>;
  if (loading) return <div className="p-6">Loading orders...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Orders: {backendKey}</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <table className="w-full text-sm text-left border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border-b">Order #</th>
              <th className="px-3 py-2 border-b">Status</th>
              <th className="px-3 py-2 border-b">Progress</th>
              <th className="px-3 py-2 border-b">Assignee</th>
              <th className="px-3 py-2 border-b">Fulfillment</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-t">
                <td className="px-3 py-2">{order.order_number}</td>
                <td className="px-3 py-2">{order.custom_status || '—'}</td>
                <td className="px-3 py-2">{order.progress || '—'}</td>
                <td className="px-3 py-2">{(order.assignee || []).join(', ') || '—'}</td>
                <td className="px-3 py-2">{order.fulfillment_status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default WidgetPage;
