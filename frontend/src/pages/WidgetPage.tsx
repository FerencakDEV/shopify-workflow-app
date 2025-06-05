import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const statusMap: Record<string, string> = {
  'new-orders': 'newOrders',
  'urgent-new-orders': 'urgentNewOrders',
  'assigned-orders': 'assignedOrders',
  'in-progress': 'inProgress',
  'printed-done': 'printedDone',
  'finishing-binding': 'finishingBinding',
  'to-be-checked': 'toBeChecked',
  'on-hold': 'onHold',
  'ready-for-dispatch': 'readyForDispatch',
  'need-attention': 'needAttention',
};

const WidgetPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const backendStatus = slug ? statusMap[slug] : undefined;

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!backendStatus) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(
          `https://shopify-workflow-app-backend.onrender.com/api/orders/by-status?status=${encodeURIComponent(backendStatus)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        setError('Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [backendStatus]);

  if (!backendStatus) {
    return <div className="p-6 text-red-600">❌ Unknown status slug: {slug}</div>;
  }

  if (loading) return <div className="p-6">⏳ Loading orders...</div>;
  if (error) return <div className="p-6 text-red-600">⚠️ {error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">📦 Orders: {backendStatus}</h2>
      {orders.length === 0 ? (
        <p>No orders found for this status.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border border-gray-300">
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
        </div>
      )}
    </div>
  );
};

export default WidgetPage;
