// WorkloadChart.tsx
import React from 'react';
import '../styles/WorkloadChart.css';

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
    ordersAssigned: ['#66346', '#66347', '#66348'],
  },
  {
    assignee: 'Q3',
    inProgress: 0,
    assigned: 4,
    ordersInProgress: [],
    ordersAssigned: ['#66350', '#66351', '#66352', '#66353'],
  },
  {
    assignee: 'Design 2',
    inProgress: 1,
    assigned: 2,
    ordersInProgress: ['#66360'],
    ordersAssigned: ['#66361', '#66362'],
  },
  {
    assignee: 'Online',
    inProgress: 2,
    assigned: 4,
    ordersInProgress: ['#66370', '#66371'],
    ordersAssigned: ['#66372', '#66373', '#66374', '#66375'],
  },
  {
    assignee: 'Magic T.',
    inProgress: 1,
    assigned: 4,
    ordersInProgress: ['#66380'],
    ordersAssigned: ['#66381', '#66382', '#66383', '#66384'],
  },
  {
    assignee: 'Posters',
    inProgress: 3,
    assigned: 4,
    ordersInProgress: ['#66390', '#66391', '#66392'],
    ordersAssigned: ['#66393', '#66394', '#66395', '#66396'],
  },
  {
    assignee: 'Thesis',
    inProgress: 1,
    assigned: 5,
    ordersInProgress: ['#66400'],
    ordersAssigned: ['#66401', '#66402', '#66403', '#66404', '#66405'],
  },
];

const WorkloadChart = () => {
  return (
    <div className="workload-container">
      <div className="workload-header">
        <h2 className="workload-title">
          Workload <span className="workload-subtitle">Real-Time</span>
        </h2>
        <span className="workload-badge">Print & Design</span>
      </div>

      <div className="workload-chart">
        {mockData.map((item, index) => (
          <div key={index} className="chart-column">
            <div className="chart-bars">
              <div
                className="bar-inprogress"
                style={{ height: `${item.inProgress * 20}px` }}
              ></div>
              <div
                className="bar-assigned"
                style={{ height: `${item.assigned * 20}px` }}
              ></div>
            </div>

            <div className="chart-assignee">{item.assignee}</div>

            <div className="chart-counts">
              <span className="count-inprogress">{item.inProgress}</span>
              <span className="count-divider">|</span>
              <span className="count-assigned">{item.assigned}</span>
            </div>

            <div className="chart-orders">
              {item.ordersInProgress.map((order, i) => (
                <div key={i} className="order-inprogress">{order}</div>
              ))}
              {item.ordersAssigned.map((order, i) => (
                <div key={i} className="order-assigned">{order}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkloadChart;
