import React from 'react';
import WorkloadChart from '../components/WorkloadChart';
import ContentHeader from '../components/ContentHeader';

const WorkloadFullscreen: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 border-b">
        <ContentHeader hideSearch hideStaff />
      </div>

      {/* Nadpis a badge vedľa seba */}
      <div className="flex items-center gap-3 px-6 pt-4">
        <div className="text-2xl font-bold text-gray-800">Workload</div>
        <div className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          Print &amp; Design
        </div>
      </div>

      {/* Obsah */}
      <div className="flex-grow overflow-auto px-6 py-4">
        <WorkloadChart fullscreen={true} />
      </div>
    </div>
  );
};

export default WorkloadFullscreen;
