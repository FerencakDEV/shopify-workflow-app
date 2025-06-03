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
    <div className="bg-white rounded-xl shadow-sm p-4 w-full">
      {/* Top header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Workload</h2>
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">Print & Design</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400 cursor-pointer hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h6M4 4v6M20 20h-6M20 20v-6" />
          </svg>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 20h6M4 20v-6M20 4h-6M20 4v6" />
          </svg>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-3 text-xs font-semibold text-gray-500 px-2 pb-2 border-b">
        <div>Assignee</div>
        <div>Orders in Progress</div>
        <div>Assigned Orders</div>
      </div>

      {/* Table Rows */}
      <div className="divide-y">
        {mockData.map(({ assignee, inProgress, assigned }) => (
          <div key={assignee} className="grid grid-cols-3 items-center text-sm text-gray-800 py-2 px-2">
            <div>{assignee}</div>

            {/* In Progress */}
            <div className="flex items-center gap-2">
              <span className="text-orange-600 font-bold">{inProgress}</span>
              <div className="relative h-2 bg-orange-100 rounded w-full max-w-[150px]">
                <div
                  className="absolute top-0 left-0 h-full bg-orange-400 rounded"
                  style={{ width: `${(inProgress / (maxInProgress || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Assigned */}
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-bold">{assigned}</span>
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
