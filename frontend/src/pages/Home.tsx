// src/pages/Home.tsx
import React from 'react';
import StatusWidget from '../components/StatusWidget';
import WorkloadChart from '../components/WorkloadChart';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="dashboard-container">
      <div className="widgets-section">
        <StatusWidget count={17} label="New Orders" sublabel="To be assigned" color="blue" />
        <StatusWidget count={2} label="Urgent New Orders" sublabel="To be assigned" color="red-dark" />
        <StatusWidget count={11} label="Assigned Orders" sublabel="Not started" color="blue-light" />
        <StatusWidget count={10} label="In Progress" sublabel="Print & Design" color="orange" />
        <StatusWidget count={33} label="Printed-Done" sublabel="Processed" color="green-light" />
        <StatusWidget count={16} label="Finishing & Binding" sublabel="" color="brown" />
        <StatusWidget count={13} label="To be Checked" sublabel="Before delivery" color="purple" />
        <StatusWidget count={4} label="On Hold" sublabel="Progress Paused" color="pink" />
        <StatusWidget count={19} label="Ready for Dispatch" sublabel="Post, Courier, Taxi" color="dark" />
        <StatusWidget count={7} label="Need Attention" sublabel="Orders with errors" color="red" />
        <StatusWidget count={41} label="Ready for Pickup" sublabel="Collections" color="black" />
        <StatusWidget count={54695} label="All Orders" sublabel="" color="green" />
      </div>

      
      <div className="chart-section">
        <WorkloadChart />
      </div>
    </div>
  );
};

export default Home;