import React, { useState, useEffect } from 'react';

interface WorkloadEntry {
  assignee: string;
  inProgress: number;
  assigned: number;
}

interface OrderEntry {
  order_number: number;
  custom_status: string;
  fulfillment_status: string;
  assignees?: string[];
  progress?: string[];
}

const assigneeOrder = ['Q1', 'Q2', 'Online', 'Thesis', 'Design', 'Design 2', 'MagicTouch', 'Posters'];

const WorkloadChart = () => {
  const [workloadData, setWorkloadData] = useState<WorkloadEntry[]>([]);
  const [expandedAssignee, setExpandedAssignee] = useState<string | null>(null);
  const [orders, setOrders] = useState<Record<string, OrderEntry[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://shopify-workflow-app-backend.onrender.com/api/orders/by-assignee-summary');

        const json = await res.json();
        setWorkloadData(json.data);
      } catch (error) {
        console.error('Error fetching workload data:', error);
      }
    };
    fetchData();
  }, []);

  const toggleAssignee = async (assignee: string) => {
    if (expandedAssignee === assignee) {
      setExpandedAssignee(null);
    } else {
      if (!orders[assignee]) {
        try {
          const res = await fetch(`https://shopify-workflow-app-backend.onrender.com/api/orders/by-assignee/${assignee}`);
          const json = await res.json();
          setOrders(prev => ({ ...prev, [assignee]: json.data }));
        } catch (error) {
          console.error(`Error fetching orders for ${assignee}:`, error);
        }
      }
      setExpandedAssignee(assignee);
    }
  };

  const maxInProgress = Math.max(...workloadData.map((x) => x.inProgress), 1);
  const maxAssigned = Math.max(...workloadData.map((x) => x.assigned), 1);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="grid grid-cols-[1fr_2fr_2fr] text-[15px] font-semibold text-gray-600 px-3 pb-3 border-b">
        <div>Assignee</div>
        <div>Orders in Progress</div>
        <div>Assigned Orders</div>
      </div>

      <div className="divide-y flex-grow">
        {assigneeOrder.map(assignee => {
          const entry = workloadData.find(x => x.assignee === assignee) || { inProgress: 0, assigned: 0 };

          return (
            <React.Fragment key={assignee}>
              <div
                className="grid grid-cols-[1fr_2fr_2fr] items-center px-3 py-3 text-[15px] hover:bg-gray-100 cursor-pointer"
                onClick={() => toggleAssignee(assignee)}
              >
                <div className="text-gray-800 font-medium">{assignee}</div>

                <div className="flex items-center gap-2">
                  <span className="text-orange-600 font-semibold">{entry.inProgress}</span>
                  <div className="relative h-3 bg-orange-100 rounded w-full max-w-[180px]">
                    <div
                      className="absolute top-0 left-0 h-full bg-orange-500 rounded"
                      style={{ width: `${(entry.inProgress / maxInProgress) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-semibold">{entry.assigned}</span>
                  <div className="relative h-3 bg-gray-200 rounded w-full max-w-[180px]">
                    <div
                      className="absolute top-0 left-0 h-full bg-gray-700 rounded"
                      style={{ width: `${(entry.assigned / maxAssigned) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {expandedAssignee === assignee && (
                <div className="px-3 py-2 bg-gray-50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 font-semibold border-b">
                        <th className="py-1">Order #</th>
                        <th>Status</th>
                        <th>Fulfillment</th>
                        <th>Assignees</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders[assignee]
                        ?.sort((a, b) => {
                          const aHasInProgress = a.progress?.some(p => String(p).toLowerCase() === 'in progress') ?? false;
                          const bHasInProgress = b.progress?.some(p => String(p).toLowerCase() === 'in progress') ?? false;
                          return (bHasInProgress ? 1 : 0) - (aHasInProgress ? 1 : 0);
                        })
                        .map(order => {
                          const assigneeList = order.assignees ?? [];
                          const progressList = order.progress ?? [];

                          const isInProgress = progressList.some(p => String(p).toLowerCase() === 'in progress');
                          const isAssigned = progressList.some(p => String(p).toLowerCase() === 'assigned');

                          const rowClass = isInProgress
                            ? 'bg-orange-100 text-orange-600'
                            : isAssigned
                            ? 'bg-gray-200 text-gray-700'
                            : '';

                          return (
                            <tr key={order.order_number} className={`border-b hover:bg-gray-100 ${rowClass}`}>
                              <td className="py-1">{order.order_number}</td>
                              <td>{order.custom_status}</td>
                              <td>{order.fulfillment_status}</td>
                              <td>{assigneeList.join(', ')}</td>
                              <td>{progressList.join(', ')}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WorkloadChart;
