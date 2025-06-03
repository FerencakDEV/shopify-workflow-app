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
  // Zistíme max hodnotu pre škálovanie barov
  const maxInProgress = Math.max(...mockData.map((x) => x.inProgress));
  const maxAssigned = Math.max(...mockData.map((x) => x.assigned));

  return (
    <div className="bg-white rounded-xl p-4 shadow w-full overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">Assignee</span>
        <span className="text-sm text-gray-500">Orders in Progress</span>
        <span className="text-sm text-gray-500">Assigned Orders</span>
      </div>

      <table className="w-full text-sm">
        <tbody>
          {mockData.map(({ assignee, inProgress, assigned }) => (
            <tr key={assignee} className="border-b last:border-none">
              <td className="py-2 font-medium text-gray-800">{assignee}</td>

              {/* In Progress */}
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <span className="w-4 text-right font-bold text-orange-500">{inProgress}</span>
                  <div className="relative h-2 bg-orange-100 rounded w-full max-w-[140px]">
                    <div
                      className="absolute top-0 left-0 h-full bg-orange-400 rounded"
                      style={{ width: `${(inProgress / maxInProgress) * 100}%` }}
                    />
                  </div>
                </div>
              </td>

              {/* Assigned */}
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <span className="w-4 text-right font-bold text-gray-500">{assigned}</span>
                  <div className="relative h-2 bg-gray-200 rounded w-full max-w-[140px]">
                    <div
                      className="absolute top-0 left-0 h-full bg-gray-500 rounded"
                      style={{ width: `${(assigned / maxAssigned) * 100}%` }}
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WorkloadChart;
