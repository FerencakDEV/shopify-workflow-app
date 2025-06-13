import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusWidget } from '../components/StatusWidget';

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
  const [counts, setCounts] = useState<Counts | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('https://shopify-workflow-app-backend.onrender.com/api/dashboard/status-counts');
        const resData: { counts: Counts } = await res.json();
        setCounts(resData.counts);
      } catch (err) {
        console.error('Failed to fetch order counts');
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-white px-6 py-4">
      <div className="grid grid-cols-5 grid-rows-2 gap-[1px] bg-gray-200 h-full">
        {statusWidgets.map((widget) => (
          <StatusWidget
            key={widget.key}
            statusKey={widget.key}
            label={widget.label}
            sublabel={widget.sub}
            color={widget.color}
            count={counts?.[widget.key as keyof Counts] ?? 0}
            onClick={() => navigate(`/status/${slugMap[widget.key]}`)}
            fullscreen={true}
          />
        ))}
      </div>
    </div>
  );
};

export default OrdersFullscreen;
