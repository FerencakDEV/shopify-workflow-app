// src/components/StatusWidget.tsx
import React from 'react';
import '../styles/StatusWidget.css';

interface StatusWidgetProps {
  count: number;
  label: string;
  sublabel: string;
  color: string;
}

const StatusWidget: React.FC<StatusWidgetProps> = ({ count, label, sublabel, color }) => {
  return (
    <div className={`status-widget ${color}`}>
      <div className="widget-content">
        <div className="widget-count">{count}</div>
        <div className="widget-text">
          <div className="widget-label">{label}</div>
          <div className="widget-sublabel">{sublabel}</div>
        </div>
      </div>
    </div>
  );
};

export default StatusWidget;
