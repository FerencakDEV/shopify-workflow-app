import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Order {
  order_number: string;
  metafields: Record<string, any>;
  custom_status: string;
}

const WidgetPage = () => {
  const { key } = useParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`https://shopify-workflow-app-backend.onrender.com/api/orders/by-status/${key}`);
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [key]);

  if (loading) return <div className="p-6">Loading orders...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 capitalize">{key?.replace('-', ' ')}</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Order Number</th>
              <th className="p-3">Custom Status</th>
              <th className="p-3">Metafields</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.order_number} className="border-t">
                <td className="p-3">{order.order_number}</td>
                <td className="p-3">{order.custom_status}</td>
                <td className="p-3">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(order.metafields, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WidgetPage;
