import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
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
  const [isOrdersFullscreen, setIsOrdersFullscreen] = useState(false);
  const [isWorkloadFullscreen, setIsWorkloadFullscreen] = useState(false);

  const navigate = useNavigate();
  const ordersRef = useRef<HTMLDivElement>(null);
  const workloadRef = useRef<HTMLDivElement>(null);

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

  const toggleFullscreen = (type: 'orders' | 'workload') => {
    if (type === 'orders') {
      setIsOrdersFullscreen(!isOrdersFullscreen);
    } else {
      setIsWorkloadFullscreen(!isWorkloadFullscreen);
    }
  };

  if (loading) return <div className="p-6 text-sm">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600 text-sm">Error: {error}</div>;

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

  return (
    <div className="h-screen flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 flex flex-col lg:flex-row justify-between items-start lg:items-center px-4 transition-all duration-300 border-b bg-white shadow-sm gap-3 lg:gap-0 py-2">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 w-full">
          <div className="flex justify-between items-center w-full lg:w-auto">
            <span className="text-xl font-bold text-[#008060] whitespace-nowrap">
              Reads <span className="text-black">WorkFlow</span>
            </span>
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-gray-100 text-sm text-gray-800 px-3 py-1 rounded-lg mt-1 lg:mt-0">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Friday, June 13
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm mt-1 lg:mt-0 bg-gray-100 text-gray-800">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-live" />
              Live
            </div>

            <a
              href="https://www.shopifystatus.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 text-sm text-gray-800 mt-1 lg:mt-0 hover:text-[#008060] transition-colors duration-200"
            >
              Shopify status:
              <span className="text-[#008060] font-medium">Online</span>
            </a>
          </div>
        </div>

        {!isWorkloadFullscreen && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                placeholder="Search order number..."
                className="w-full pl-3 pr-9 py-2 bg-gray-100 text-sm rounded-md outline-none placeholder-gray-500"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.4-5.65a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
            </div>

            <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-sm text-gray-800 font-medium px-3 py-1.5 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM2 17a6 6 0 1112 0H2z" />
              </svg>
              <span className="font-semibold">Staff</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-grow overflow-auto p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Orders */}
          <div ref={ordersRef} className={isOrdersFullscreen ? 'lg:col-span-12' : 'lg:col-span-5 relative'}>
            <button
              onClick={() => toggleFullscreen('orders')}
              className="absolute top-0 right-0 z-10 p-2 text-gray-600 hover:text-black"
            >
              {isOrdersFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            {!isOrdersFullscreen && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-semibold text-gray-900">Orders</h2>
                  <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded">
                    By Status
                  </span>
                </div>
              </div>
            )}

            <div
              className={`grid w-full transition-all duration-300 ${
                isOrdersFullscreen
                  ? 'grid-cols-5 grid-rows-2 gap-[1px] bg-gray-200 min-h-[calc(90vh-64px)]'
                  : 'grid-rows-5 grid-cols-2 gap-4'
              }`}
            >
              {statusWidgets.map((widget) => (
                <StatusWidget
                  key={widget.key}
                  statusKey={widget.key}
                  label={widget.label}
                  sublabel={widget.sub}
                  color={widget.color}
                  count={counts?.[widget.key as keyof Counts] ?? 0}
                  onClick={() => navigate(`/status/${slugMap[widget.key]}`)}
                  fullscreen={isOrdersFullscreen}
                />
              ))}
            </div>
          </div>

          {/* Workload */}
          <div
            ref={workloadRef}
            className={`relative ${
              isOrdersFullscreen
                ? 'hidden'
                : isWorkloadFullscreen
                ? 'fixed inset-0 top-[64px] z-50 bg-white overflow-auto'
                : 'lg:col-span-7 flex flex-col h-full'
            }`}
          >
            <button
              onClick={() => toggleFullscreen('workload')}
              className="absolute top-0 right-0 z-10 p-2 text-gray-600 hover:text-black"
              title={isWorkloadFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isWorkloadFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
            </button>

            {!isWorkloadFullscreen && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-semibold text-gray-900">Workload</h2>
                  <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded">
                    Print & Design
                  </span>
                </div>
              </div>
            )}

            <div
              className={`transition-all duration-300 ${
                isWorkloadFullscreen
                  ? 'p-6 min-h-[calc(100vh-64px)] w-screen'
                  : 'bg-white rounded-xl shadow p-4 h-full'
              }`}
            >
              <WorkloadChart fullscreen={isWorkloadFullscreen} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
