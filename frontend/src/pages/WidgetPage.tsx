import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchOrdersByStatus } from '../api/fetchOrdersByStatus'; // ✅ prispôsob cestu

const WidgetPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        const data = await fetchOrdersByStatus(slug); // ✅ použijeme tvoju funkciu
        setOrders(data || []);
        setError(null);
      } catch (err) {
        setError('⚠️ Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (!slug) {
    return <div className="p-6 text-red-600">❌ Unknown status slug</div>;
  }

  if (loading) return <div className="p-6">⏳ Loading orders...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">📦 Orders: {slug}</h2>
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
                  <td className="px-3 py-2">{order.progress_1 || order.progress?.[0] || '—'}</td>
                  <td className="px-3 py-2">{order.assignee_1 || order.assignee?.[0] || '—'}</td>
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
