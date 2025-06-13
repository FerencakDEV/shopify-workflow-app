import { useEffect, useState } from 'react';
import { StatusWidget } from '../components/StatusWidget';
import ContentHeader from '../components/ContentHeader';

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

const OrdersFullscreen = () => {
  const [counts, setCounts] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      console.log('📡 Fetching counts...');
      try {
        const res = await fetch('https://shopify-workflow-app-backend.onrender.com/api/dashboard/status-counts');
        console.log('✅ Response status:', res.status);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        console.log('✅ Parsed data:', data);

        if (!data.counts) throw new Error('Missing `counts` in response');
        setCounts(data.counts);
        setError(null);
      } catch (err: any) {
        console.error('❌ Fetch failed:', err);
        setError(err.message || 'Unknown error');
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      <div className="sticky top-0 z-50 border-b">
<ContentHeader hideSearch hideStaff rightTitle="Orders By Status" />
      </div>

      <div className="flex-grow px-6 py-4">
        {error && (
          <div className="text-red-600 font-medium text-sm bg-red-100 p-4 rounded mb-4">
            ❌ Error loading counts: {error}
          </div>
        )}

        {!counts ? (
          <div className="text-gray-500 text-sm">Loading counts...</div>
        ) : (
          <div className="grid grid-cols-5 grid-rows-2 gap-[1px] bg-gray-200 h-full">
            {statusWidgets.map((widget) => (
              <StatusWidget
                key={widget.key}
                statusKey={widget.key}
                label={widget.label}
                sublabel={widget.sub}
                color={widget.color}
                count={counts[widget.key] ?? 0}
                fullscreen
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersFullscreen;
