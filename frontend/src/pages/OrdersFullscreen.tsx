import { useEffect, useState } from 'react';
import { StatusWidget } from '../components/StatusWidget';
import ContentHeader from '../components/ContentHeader';

const OrdersFullscreen = () => {
  const [counts, setCounts] = useState<any>(null);

  useEffect(() => {
    setCounts({
      newOrders: 5,
      urgentNewOrders: 1,
      assignedOrders: 8,
      inProgress: 3,
      finishingBinding: 2,
      toBeChecked: 4,
      onHold: 1,
      readyForDispatch: 6,
      readyForPickup: 2,
      needAttention: 0,
    });
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      <div className="sticky top-0 z-50">
        <ContentHeader />
      </div>

      <div className="flex-grow px-6 py-4">
        {counts ? (
          <div className="grid grid-cols-5 grid-rows-2 gap-[1px] bg-gray-200 h-full">
            {Object.entries(counts).map(([key, val]) => (
              <StatusWidget
                key={key}
                statusKey={key}
                label={key}
                sublabel=""
                color="#D4D4D4"
                count={val as number}
                fullscreen
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Loading...</p>
        )}
      </div>
    </div>
  );
};

export default OrdersFullscreen;
