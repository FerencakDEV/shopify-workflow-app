import React from 'react';

const mockData = [
  {
    assignee: 'Q1',
    inProgress: 2,
    assigned: 3,
    ordersInProgress: ['#66321', '#66324'],
    ordersAssigned: ['#66340', '#66343', '#66345'],
  },
  {
    assignee: 'Q2',
    inProgress: 5,
    assigned: 3,
    ordersInProgress: ['#66325', '#66326', '#66327', '#66328', '#66329'],
    ordersAssigned: ['#66330', '#66331', '#66332'],
  },
  {
    assignee: 'design2',
    inProgress: 0,
    assigned: 4,
    ordersInProgress: [],
    ordersAssigned: ['#66371', '#66374', '#66370', '#66373'],
  },
  {
    assignee: 'online',
    inProgress: 2,
    assigned: 4,
    ordersInProgress: ['#66321', '#66324'],
    ordersAssigned: ['#66340', '#66343', '#66345', '#66348'],
  },
  {
    assignee: 'magic t.',
    inProgress: 1,
    assigned: 4,
    ordersInProgress: ['#66329'],
    ordersAssigned: ['#66340', '#66343', '#66345', '#66348'],
  },
  {
    assignee: 'posters',
    inProgress: 3,
    assigned: 4,
    ordersInProgress: ['#66321', '#66324', '#66340'],
    ordersAssigned: ['#66343', '#66345', '#66347', '#66348'],
  },
  {
    assignee: 'thesis',
    inProgress: 1,
    assigned: 5,
    ordersInProgress: ['#66321'],
    ordersAssigned: ['#66324', '#66340', '#66343', '#66345', '#66348'],
  },
];

const WorkloadChart = () => {
  return (
    <div className="p-6 bg-white rounded shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold">Workload <span className="text-sm text-gray-500">Real-Time</span></h2>
        </div>
        <span className="text-xs text-white bg-teal-400 px-2 py-1 rounded">Print & Design</span>
      </div>

      <div className="flex gap-6 overflow-x-auto">
        {mockData.map((item, index) => (
          <div key={index} className="flex flex-col items-center min-w-[120px]">
            <div className="flex gap-1 mb-1">
              <span className="text-orange-500 font-semibold">{item.inProgress}</span>
              <span className="text-gray-500 font-semibold">|</span>
              <span className="text-gray-400 font-semibold">{item.assigned}</span>
            </div>

            <div className="flex items-end h-32 gap-2">
              <div className="w-6 bg-orange-500" style={{ height: `${item.inProgress * 20}px` }}></div>
              <div className="w-6 bg-gray-300" style={{ height: `${item.assigned * 20}px` }}></div>
            </div>

            <div className="text-sm mt-2 font-semibold">{item.assignee}</div>

            <div className="mt-2 text-xs text-center">
              {item.ordersInProgress.map((order, i) => (
                <div key={i} className="text-orange-500">{order}</div>
              ))}
              {item.ordersAssigned.map((order, i) => (
                <div key={i} className="text-gray-400">{order}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkloadChart;
