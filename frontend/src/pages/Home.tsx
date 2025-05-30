// src/pages/Home.tsx
import React, { useEffect, useState } from 'react';
import StatusWidget from '../components/StatusWidget';
import WorkloadChart from '../components/WorkloadChart';
import '../styles/Home.css';

interface Counts {
  newOrders: number;
  urgentNewOrders: number;
  assignedOrders: number;
  inProgress: number;
  printedDone: number;
  finishingBinding: number;
  toBeChecked: number;
  onHold: number;
  readyForDispatch: number;
  needAttention: number;
  readyForPickup: number;
  allOrders: number;
}

const Home = () => {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('https://shopify-workflow-app-backend.onrender.com/api/dashboard'); // alebo tvoj správny endpoint
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: Counts = await res.json();
        setCounts(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <div className="widgets-section">
        <StatusWidget count={counts?.newOrders ?? 0} label="New Orders" sublabel="To be assigned" color="blue" />
        <StatusWidget count={counts?.urgentNewOrders ?? 0} label="Urgent New Orders" sublabel="To be assigned" color="red-dark" />
        <StatusWidget count={counts?.assignedOrders ?? 0} label="Assigned Orders" sublabel="Not started" color="blue-light" />
        <StatusWidget count={counts?.inProgress ?? 0} label="In Progress" sublabel="Print & Design" color="orange" />
        <StatusWidget count={counts?.printedDone ?? 0} label="Printed-Done" sublabel="Processed" color="green-light" />
        <StatusWidget count={counts?.finishingBinding ?? 0} label="Finishing & Binding" sublabel="" color="brown" />
        <StatusWidget count={counts?.toBeChecked ?? 0} label="To be Checked" sublabel="Before delivery" color="purple" />
        <StatusWidget count={counts?.onHold ?? 0} label="On Hold" sublabel="Progress Paused" color="pink" />
        <StatusWidget count={counts?.readyForDispatch ?? 0} label="Ready for Dispatch" sublabel="Post, Courier, Taxi" color="dark" />
        <StatusWidget count={counts?.needAttention ?? 0} label="Need Attention" sublabel="Orders with errors" color="red" />
        <StatusWidget count={counts?.readyForPickup ?? 0} label="Ready for Pickup" sublabel="Collections" color="black" />
        <StatusWidget count={counts?.allOrders ?? 0} label="All Orders" sublabel="" color="green" />
      </div>

      <div className="chart-section">
        <WorkloadChart />
      </div>
    </div>
  );
};

export default Home;
