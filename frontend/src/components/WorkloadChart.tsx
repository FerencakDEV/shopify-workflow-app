// src/components/WorkloadChart.tsx
import React from 'react';
import '../styles/WorkloadChart.css';

const WorkloadChart = () => {
  const data = [
    { label: 'Q1', inProgress: 2, assigned: 3, orders: ['#66321', '#66324'] },
    { label: 'Q2', inProgress: 5, assigned: 3, orders: ['#66325', '#66326', '#66327', '#66328', '#66329'] },
    { label: 'design2', inProgress: 0, assigned: 4, orders: [] },
    { label: 'online', inProgress: 2, assigned: 4, orders: ['#66321', '#66324'] },
    { label: 'magic t.', inProgress: 1, assigned: 4, orders: ['#66329'] },
    { label: 'posters', inProgress: 3, assigned: 4, orders: ['#66321', '#66324', '#66340'] },
    { label: 'thesis', inProgress: 1, assigned: 5, orders: ['#66321'] },
  ];

  return (
    <div className="workload-chart">
      <div className="chart-header">
        <span className="in-progress-label">10 Orders in Progress</span>
        <span className="assigned-label">11 Assigned Orders</span>
      </div>
      <div className="chart-bars">
        {data.map((item, idx) => (
          <div className="bar-group" key={idx}>
            <div className="bar">
              <div className="bar-in-progress" style={{ height: `${item.inProgress * 10}px` }}></div>
              <div className="bar-assigned" style={{ height: `${item.assigned * 10}px` }}></div>
            </div>
            <div className="bar-labels">
              <span className="label-inprog">{item.inProgress} | {item.assigned}</span>
              <span className="label-text">{item.label}</span>
              <div className="order-numbers">
                {item.orders.map((ord, i) => (
                  <div key={i} className="order-number">{ord}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkloadChart;
