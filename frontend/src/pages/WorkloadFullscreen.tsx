import React from 'react';
import WorkloadChart from '../components/WorkloadChart';
import ContentHeader from '../components/ContentHeader';

const WorkloadFullscreen: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* Sticky header with time + status */}
      <div className="sticky top-0 z-50">
        <ContentHeader />
      </div>

      {/* Fullscreen content */}
      <div className="flex-grow overflow-auto px-6 py-4">
        <WorkloadChart fullscreen={true} />
      </div>
    </div>
  );
};

export default WorkloadFullscreen;