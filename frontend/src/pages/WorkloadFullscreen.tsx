import React from 'react';
import WorkloadChart from '../components/WorkloadChart';
import ContentHeader from '../components/ContentHeader';

const WorkloadFullscreen: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* Sticky header with time + API status only */}
      <div className="sticky top-0 z-50 border-b">
        <ContentHeader
          hideSearch
          hideStaff
          rightTitle={
            <div className="text-right leading-tight">
              <div className="text-xl font-bold text-gray-700">Workload</div>
              <div className="text-sm font-normal text-gray-500">Print &amp; Design</div>
            </div>
          }
        />
      </div>

      {/* Fullscreen Workload content */}
      <div className="flex-grow overflow-auto px-6 py-4">
        <WorkloadChart fullscreen={true} />
      </div>
    </div>
  );
};

export default WorkloadFullscreen;
