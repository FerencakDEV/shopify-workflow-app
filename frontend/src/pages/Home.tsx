import { useEffect, useState } from 'react';
import StatusWidget from '../components/StatusWidget';
import WorkloadChart from '../components/WorkloadChart';

interface Counts {
  newOrders: number;
  urgentNewOrders: number;
  assignedOrders: number;
  inProgress: number;
  printedDone: number;
  finishingBinding: number;
  toBeChecked: number;
  onHold: number;
  readyForDispatch: number;
  needAttention: number;
  readyForPickup: number;
  allOrders: number;
}

const Home = () => {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('https://shopify-workflow-app-backend.onrender.com/api/dashboard/status-counts');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: Counts = await res.json();
        setCounts(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  useEffect(() => {
    if (!selectedStatus) return;

    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch(`https://shopify-workflow-app-backend.onrender.com/api/orders/by-status?status=${selectedStatus}`);
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [selectedStatus]);

  if (loading) return <div className="p-6 text-sm">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600 text-sm">Error: {error}</div>;

  const statusWidgets = [
    { key: 'newOrders', label: 'New Orders', sub: 'To be assigned', color: '#BCECE0' },
    { key: 'urgentNewOrders', label: 'Urgent New Orders', sub: 'To be assigned', color: '#FFC2C7' },
    { key: 'assignedOrders', label: 'Assigned Orders', sub: 'Not started', color: '#D4D4D4' },
    { key: 'inProgress', label: 'In Progress', sub: 'Print & Design', color: '#FFBD62' },
    { key: 'printedDone', label: 'Printed-Done', sub: 'Processed', color: '#C1F5C0' },
    { key: 'finishingBinding', label: 'Finishing & Binding', sub: 'Completing Orders', color: '#FFF4BD' },
    { key: 'toBeChecked', label: 'To be Checked', sub: 'Before delivery', color: '#D4F1F4' },
    { key: 'onHold', label: 'On Hold', sub: 'Progress Paused', color: '#F7D6D0' },
    { key: 'readyForDispatch', label: 'Ready for Dispatch', sub: 'Post, Courier, Taxi', color: '#E5DDC8' },
    { key: 'needAttention', label: 'Need Attention', sub: 'Orders with errors', color: '#D3BBDD' },
  ];

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Orders */}
        <div className="lg:col-span-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-semibold text-gray-900">Orders</h2>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded">By Status</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 h-full">
            <div className="grid grid-rows-5 grid-cols-2 gap-4">
              {statusWidgets.map((widget) => (
                <StatusWidget
                  key={widget.key}
                  count={counts?.[widget.key as keyof Counts] ?? 0}
                  label={widget.label}
                  sublabel={widget.sub}
                  color={widget.color}
                  onClick={() => setSelectedStatus(widget.key)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Workload */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-[18px] font-semibold text-gray-900">Workload</h2>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded">Print & Design</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 h-full">
            <WorkloadChart />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {selectedStatus && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Orders: {selectedStatus.replace(/([A-Z])/g, ' $1')}
          </h3>

          {loadingOrders ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
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
      )}
    </div>
  );
};

export default Home;
