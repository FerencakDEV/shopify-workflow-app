import React from 'react';

const mockData = [
  { assignee: 'Q1', inProgress: 2, assigned: 4 },
  { assignee: 'Q2', inProgress: 3, assigned: 3 },
  { assignee: 'Online', inProgress: 1, assigned: 2 },
  { assignee: 'Thesis', inProgress: 0, assigned: 0 },
  { assignee: 'Design', inProgress: 2, assigned: 4 },
  { assignee: 'Design 2', inProgress: 1, assigned: 2 },
  { assignee: 'MagicTouch', inProgress: 4, assigned: 6 },
  { assignee: 'Posters', inProgress: 2, assigned: 1 }
];

const WorkloadChart = () => {
  const maxInProgress = Math.max(...mockData.map((x) => x.inProgress));
  const maxAssigned = Math.max(...mockData.map((x) => x.assigned));

  return (
    <div className="w-full h-full flex flex-col">
      {/* Table Header */}
      <div className="grid grid-cols-3 text-[15px] font-semibold text-gray-600 px-3 pb-3 border-b">
        <div>Assignee</div>
        <div>Orders in Progress</div>
        <div>Assigned Orders</div>
      </div>

      {/* Dynamically spaced rows */}
      <div className="grid grid-rows-8 divide-y flex-grow">
        {mockData.map(({ assignee, inProgress, assigned }) => (
          <div key={assignee} className="grid grid-cols-3 items-center px-3">
            <div className="text-[15px] text-gray-800 font-medium">{assignee}</div>

            {/* In Progress */}
            <div className="flex items-center gap-3">
              <span className="text-orange-600 font-semibold text-[16px]">{inProgress}</span>
              <div className="relative h-3 bg-orange-100 rounded w-full max-w-[180px]">
                <div
                  className="absolute top-0 left-0 h-full bg-orange-500 rounded"
                  style={{ width: `${(inProgress / (maxInProgress || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Assigned */}
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-semibold text-[16px]">{assigned}</span>
              <div className="relative h-3 bg-gray-200 rounded w-full max-w-[180px]">
                <div
                  className="absolute top-0 left-0 h-full bg-gray-700 rounded"
                  style={{ width: `${(assigned / (maxAssigned || 1)) * 100}%` }}
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
