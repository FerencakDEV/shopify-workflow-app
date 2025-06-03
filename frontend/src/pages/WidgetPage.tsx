import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface Order {
  order_number: string;
  custom_status: string;
  fulfillment_status?: string;
  metafields: Record<string, string>;
}

const WidgetPage = () => {
  const { slug } = useParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const status = slug?.replace(/-/g, " ");
        const res = await fetch(
          `https://shopify-workflow-app-backend.onrender.com/api/orders/by-status?status=${encodeURIComponent(status || "")}`
        );
        if (!res.ok) throw new Error(`Server returned ${res.status}`);

        const data = await res.json();

        if (!Array.isArray(data.orders)) {
          throw new Error("Expected an array of orders in response");
        }

        setOrders(data.orders);
      } catch (err: any) {
        console.error("Failed to fetch orders", err);
        setError(err.message || "Unknown error");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [slug]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Orders: {slug?.replace(/-/g, " ")}
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600 font-semibold">Error: {error}</p>
      ) : orders.length === 0 ? (
        <p>No orders found for this status.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-md">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="py-2 px-4 border-b">Order Number</th>
                <th className="py-2 px-4 border-b">Custom Status</th>
                <th className="py-2 px-4 border-b">Fulfillment Status</th>
                <th className="py-2 px-4 border-b">Metafields</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr key={idx} className="border-t">
                  <td className="py-2 px-4">{order.order_number}</td>
                  <td className="py-2 px-4">{order.custom_status}</td>
                  <td className="py-2 px-4">
                    {order.fulfillment_status || "N/A"}
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-600">
                    {order.metafields && Object.keys(order.metafields).length > 0
                      ? Object.entries(order.metafields)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(", ")
                      : "None"}
                  </td>
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
