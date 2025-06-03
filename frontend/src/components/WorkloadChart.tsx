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
    <div className="w-full">
      {/* Table Header */}
      <div className="grid grid-cols-3 text-[13px] font-semibold text-gray-500 px-2 pb-2 border-b">
        <div>Assignee</div>
        <div>Orders in Progress</div>
        <div>Assigned Orders</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y">
        {mockData.map(({ assignee, inProgress, assigned }) => (
          <div
            key={assignee}
            className="grid grid-cols-3 items-center text-[13px] text-gray-800 py-2 px-2"
          >
            <div>{assignee}</div>

            {/* In Progress */}
            <div className="flex items-center gap-2">
              <span className="text-orange-600 font-semibold">{inProgress}</span>
              <div className="relative h-2 bg-orange-100 rounded w-full max-w-[150px]">
                <div
                  className="absolute top-0 left-0 h-full bg-orange-400 rounded"
                  style={{ width: `${(inProgress / (maxInProgress || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Assigned */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-semibold">{assigned}</span>
              <div className="relative h-2 bg-gray-200 rounded w-full max-w-[150px]">
                <div
                  className="absolute top-0 left-0 h-full bg-gray-500 rounded"
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
