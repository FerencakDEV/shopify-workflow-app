import React, { useEffect, useState } from 'react';

interface WorkloadData {
  assignee: string;
  inProgress: number;
  assigned: number;
}

const WorkloadChart = () => {
  const [data, setData] = useState<WorkloadData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://shopify-workflow-app-backend.onrender.com/api/orders/workload-chart');
        const json = await res.json();
        setData(json.data || []);
      } catch (err) {
        console.error('Failed to load workload data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const maxInProgress = Math.max(...data.map((x) => x.inProgress), 1);
  const maxAssigned = Math.max(...data.map((x) => x.assigned), 1);

  if (loading) return <div className="px-3 py-5 text-sm text-gray-500">Loading workload...</div>;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Table Header */}
      <div className="grid grid-cols-[1fr_2fr_2fr] text-[15px] font-semibold text-gray-600 px-3 pb-3 border-b">
        <div>Assignee</div>
        <div>Orders in Progress</div>
        <div>Assigned Orders</div>
      </div>

      {/* Rows */}
      <div className="divide-y flex-grow">
        {data.map(({ assignee, inProgress, assigned }) => (
          <div
            key={assignee}
            className="grid grid-cols-[1fr_2fr_2fr] items-center px-3 py-3 text-[15px]"
          >
            <div className="text-gray-800 font-medium">{assignee}</div>

            {/* In Progress */}
            <div className="flex items-center gap-2">
              <span className="text-orange-600 font-semibold">{inProgress}</span>
              <div className="relative h-3 bg-orange-100 rounded w-full max-w-[180px]">
                <div
                  className="absolute top-0 left-0 h-full bg-orange-500 rounded"
                  style={{
                    width: `${Math.max((inProgress / maxInProgress) * 100, 5)}%`
                  }}
                />
              </div>
            </div>

            {/* Assigned */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-semibold">{assigned}</span>
              <div className="relative h-3 bg-gray-200 rounded w-full max-w-[180px]">
                <div
                  className="absolute top-0 left-0 h-full bg-gray-700 rounded"
                  style={{
                    width: `${Math.max((assigned / maxAssigned) * 100, 5)}%`
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkloadChart;
