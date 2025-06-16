import React from 'react';
import { useNavigate } from 'react-router-dom';
import WorkloadChart from '../components/WorkloadChart';
import ContentHeader from '../components/ContentHeader';
import { MdFullscreenExit } from 'react-icons/md'; // alebo Minimize2 z lucide-react

const WorkloadFullscreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* Sticky header with time + API status only */}
      <div className="sticky top-0 z-50 border-b">
        <ContentHeader
          hideSearch
          hideStaff
          rightTitle={
            <div
              className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black cursor-pointer"
              onClick={() => navigate('/')}
            >
              <MdFullscreenExit className="w-4 h-4" />
            </div>
          }
        />
      </div>

      {/* Nadpis sekcie */}
      <div className="flex justify-between items-end px-6 pt-4">
        <div className="text-2xl font-bold text-gray-800">Workload</div>
        <div className="text-sm text-gray-500 font-normal">Print &amp; Design</div>
      </div>

      {/* Fullscreen Workload content */}
      <div className="flex-grow overflow-auto px-6 py-4">
        <WorkloadChart fullscreen={true} />
      </div>
    </div>
  );
};

export default WorkloadFullscreen;
