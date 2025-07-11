import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Maximize2 } from 'lucide-react';
import { StatusWidget } from '../components/StatusWidget';
import WorkloadChart from '../components/WorkloadChart';

interface Counts {
  newOrders: number;
  urgentNewOrders: number;
  assignedOrders: number;
  inProgress: number;
  finishingBinding: number;
  toBeChecked: number;
  onHold: number;
  readyForDispatch: number;
  needAttention: number;
  readyForPickup: number;
  allOrders: number;
}

const slugMap: Record<string, string> = {
  newOrders: 'new-orders',
  urgentNewOrders: 'urgent-new-orders',
  assignedOrders: 'assigned-orders',
  inProgress: 'in-progress',
  printedDone: 'printed-done',
  finishingBinding: 'finishing-binding',
  toBeChecked: 'to-be-checked',
  onHold: 'on-hold',
  readyForDispatch: 'ready-for-dispatch',
  readyForPickup: 'ready-for-pickup',
  needAttention: 'need-attention',
};

const Home = () => {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('https://shopify-workflow-app-backend.onrender.com/api/dashboard/status-counts');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const resData: { counts: Counts } = await res.json();
        setCounts(resData.counts);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusWidgets = [
    { key: 'newOrders', label: 'New Orders', sub: 'To be assigned', color: '#BCECE0' },
    { key: 'urgentNewOrders', label: 'Urgent New Orders', sub: 'To be assigned', color: '#FFC2C7' },
    { key: 'assignedOrders', label: 'Assigned Orders', sub: 'Not started', color: '#D4D4D4' },
    { key: 'inProgress', label: 'In Progress', sub: 'Print & Design', color: '#FFBD62' },
    { key: 'finishingBinding', label: 'Finishing & Binding', sub: 'Completing Orders', color: '#FFF4BD' },
    { key: 'toBeChecked', label: 'To be Checked', sub: 'Before delivery', color: '#D4F1F4' },
    { key: 'readyForDispatch', label: 'Ready for Dispatch', sub: 'Post, Courier, Taxi', color: '#E5DDC8' },
    { key: 'readyForPickup', label: 'Ready for Pickup', sub: 'Collections', color: '#FBE5C8' },
    { key: 'onHold', label: 'On Hold', sub: 'Progress Paused', color: '#F7D6D0' },
    { key: 'needAttention', label: 'Need Attention', sub: 'Orders with errors', color: '#D3BBDD' },
  ];

  if (loading) return <div className="p-6 text-sm">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600 text-sm">Error: {error}</div>;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-grow overflow-auto p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Orders Section */}
          <div className="lg:col-span-5 relative">
            <button
              onClick={() => navigate('/orders/fullscreen')}
              className="absolute top-0 right-0 z-10 p-2 text-gray-600 hover:text-black"
              title="Fullscreen"
            >
              <Maximize2 size={20} />
            </button>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-semibold text-gray-900">Orders</h2>
                <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded">
                  By Status
                </span>
              </div>
            </div>

            <div className="grid w-full grid-rows-5 grid-cols-2 gap-4">
              {statusWidgets.map((widget) => (
                <StatusWidget
                  key={widget.key}
                  statusKey={widget.key}
                  label={widget.label}
                  sublabel={widget.sub}
                  color={widget.color}
                  count={counts?.[widget.key as keyof Counts] ?? 0}
                  onClick={() => navigate(`/status/${slugMap[widget.key]}`)}
                />
              ))}
            </div>
          </div>

          {/* Workload Section */}
          <div className="lg:col-span-7 flex flex-col h-full relative">
            <button
              onClick={() => navigate('/workload/fullscreen')}
              className="absolute top-0 right-0 z-10 p-2 text-gray-600 hover:text-black"
              title="Fullscreen"
            >
              <Maximize2 size={20} />
            </button>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-semibold text-gray-900">Workload</h2>
                <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded">
                  Print & Design
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-4 h-full">
              <WorkloadChart
                fullscreen={false}
                rowClassName="py-3"
                assigneeTextClassName="text-[15px]"
                barHeightClassName="h-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
