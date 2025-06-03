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

  if (loading) return <div className="p-6 text-sm">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600 text-sm">Error: {error}</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Grid layout: 4 / 8 = 1/3 a 2/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SIDE */}
        <div className="lg:col-span-4 space-y-2">
          {/* Nadpis nad kartou */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded">By Status</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h6M4 4v6M20 20h-6M20 20v-6" />
              </svg>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20h6M4 20v-6M20 4h-6M20 4v6" />
              </svg>
            </div>
          </div>

          {/* Karta widgetov */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="grid grid-rows-5 grid-cols-2 gap-4">
              <StatusWidget count={counts?.newOrders ?? 0} label="New Orders" sublabel="To be assigned" color="#BCECE0" />
              <StatusWidget count={counts?.urgentNewOrders ?? 0} label="Urgent New Orders" sublabel="To be assigned" color="#FFC2C7" />
              <StatusWidget count={counts?.assignedOrders ?? 0} label="Assigned Orders" sublabel="Not started" color="#D4D4D4" />
              <StatusWidget count={counts?.inProgress ?? 0} label="In Progress" sublabel="Print & Design" color="#FFBD62" />
              <StatusWidget count={counts?.printedDone ?? 0} label="Printed-Done" sublabel="Processed" color="#C1F5C0" />
              <StatusWidget count={counts?.finishingBinding ?? 0} label="Finishing & Binding" sublabel="Completing Orders" color="#FFF4BD" />
              <StatusWidget count={counts?.toBeChecked ?? 0} label="To be Checked" sublabel="Before delivery" color="#D4F1F4" />
              <StatusWidget count={counts?.onHold ?? 0} label="On Hold" sublabel="Progress Paused" color="#F7D6D0" />
              <StatusWidget count={counts?.readyForDispatch ?? 0} label="Ready for Dispatch" sublabel="Post, Courier, Taxi" color="#E5DDC8" />
              <StatusWidget count={counts?.needAttention ?? 0} label="Need Attention" sublabel="Orders with errors" color="#D3BBDD" />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="lg:col-span-8 space-y-2">
          {/* Nadpis nad kartou */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Workload</h2>
              <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded">Print & Design</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h6M4 4v6M20 20h-6M20 20v-6" />
              </svg>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20h6M4 20v-6M20 4h-6M20 4v6" />
              </svg>
            </div>
          </div>

          {/* Karta workload grafu */}
          <div className="bg-white rounded-xl shadow p-4">
            <WorkloadChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
