import React from 'react';

const mockData = [
  { assignee: 'Q1', inProgress: 2, assigned: 3, ordersInProgress: ['#66321', '#66324'], ordersAssigned: ['#66340', '#66343', '#66345'] },
  { assignee: 'Q2', inProgress: 5, assigned: 3, ordersInProgress: ['#66325', '#66326', '#66327', '#66328', '#66329'], ordersAssigned: ['#66346', '#66347', '#66348'] },
  { assignee: 'Design 2', inProgress: 1, assigned: 2, ordersInProgress: ['#66360'], ordersAssigned: ['#66361', '#66362'] },
  { assignee: 'Online', inProgress: 2, assigned: 4, ordersInProgress: ['#66370', '#66371'], ordersAssigned: ['#66372', '#66373', '#66374', '#66375'] },
  { assignee: 'Magic T.', inProgress: 1, assigned: 4, ordersInProgress: ['#66380'], ordersAssigned: ['#66381', '#66382', '#66383', '#66384'] },
  { assignee: 'Posters', inProgress: 3, assigned: 4, ordersInProgress: ['#66390', '#66391', '#66392'], ordersAssigned: ['#66393', '#66394', '#66395', '#66396'] },
  { assignee: 'Thesis', inProgress: 1, assigned: 5, ordersInProgress: ['#66400'], ordersAssigned: ['#66401', '#66402', '#66403', '#66404', '#66405'] },
];

const WorkloadChart = () => (
  <div className="p-4 bg-gray-900 text-white rounded-xl shadow-lg">
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold">
        Workload <span className="text-sm text-gray-400">Real-Time</span>
      </h2>
      <span className="bg-blue-700 text-white text-xs px-2 py-1 rounded">Print & Design</span>
    </div>

    <div className="overflow-x-auto">
      <div className="flex gap-6">
        {mockData.map((item, i) => (
          <div key={i} className="flex flex-col items-center bg-gray-800 p-2 rounded-lg w-36 min-w-36">
            <div className="flex flex-col justify-end h-32 w-full mb-2">
              <div
                className="bg-yellow-500 rounded-t w-full"
                style={{ height: `${item.inProgress * 10}px` }}
              ></div>
              <div
                className="bg-blue-500 rounded-b w-full mt-1"
                style={{ height: `${item.assigned * 10}px` }}
              ></div>
            </div>
            <div className="text-sm font-medium text-center">{item.assignee}</div>
            <div className="text-xs text-gray-400 mb-2">
              <span className="text-yellow-400">{item.inProgress}</span>
              <span className="mx-1">|</span>
              <span className="text-blue-400">{item.assigned}</span>
            </div>
            <div className="text-xs space-y-1 text-center">
              {item.ordersInProgress.map((order, j) => (
                <div key={j} className="text-yellow-300">{order}</div>
              ))}
              {item.ordersAssigned.map((order, j) => (
                <div key={j} className="text-blue-300">{order}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default WorkloadChart;
