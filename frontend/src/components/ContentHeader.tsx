import { useEffect, useState } from 'react';
import { MdCheckCircle, MdOpenInFull } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

interface ContentHeaderProps {
  hideSearch?: boolean;
  hideStaff?: boolean;
  rightTitle?: string;
}

const ContentHeader = ({ hideSearch = false, hideStaff = false, rightTitle }: ContentHeaderProps) => {
  const [dateTime, setDateTime] = useState(new Date());
  const [apiStatus, setApiStatus] = useState<'live' | 'error'>('live');
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkAPI = async () => {
      try {
        const res = await fetch('https://shopify-workflow-app-backend.onrender.com/ping');
        if (!res.ok) throw new Error();
        setApiStatus('live');
      } catch {
        setApiStatus('error');
      }
    };
    checkAPI();
    const interval = setInterval(checkAPI, 30000);
    return () => clearInterval(interval);
  }, []);

  const formattedTime = dateTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="sticky top-0 z-50 border-b bg-white shadow-sm px-4 py-2 flex justify-between items-center">
      {/* Left side (logo + status) */}
      <div className="flex items-center gap-4">
        <a
          href="https://workflow.readshub.ie/"
          className="flex items-center gap-2 text-xl font-bold text-[#008060] whitespace-nowrap hover:underline"
        >
          <img
            src="/reads-icon.png"
            alt="Reads logo"
            className="h-[1.5rem] w-auto object-contain"
          />
          Reads <span className="text-black">WorkFlow</span>
        </a>

        <div className="flex items-center gap-2 bg-gray-100 text-sm text-gray-800 px-3 py-1 rounded-lg">
          {new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {` ${formattedTime.split(',')[0]}, ${formattedTime.split(',')[1]}`}
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
            apiStatus === 'live' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              apiStatus === 'live' ? 'bg-green-500 animate-pulse-live' : 'bg-red-500'
            }`}
          />
          {apiStatus === 'live' ? 'Live' : 'Error'}
        </div>

        <a
          href="https://www.shopifystatus.com/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 text-sm text-gray-800 hover:text-[#008060] transition-colors"
        >
          Shopify status:
          {/* <MdCheckCircle className="text-[#008060] text-lg" /> */}
          <span className="text-[#008060] font-medium">Online</span>
        </a>
      </div>

      {/* Right side (title with icon) */}
      {rightTitle && (
        <div
          className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black cursor-pointer"
          onClick={() => navigate('/')}
        >
          {rightTitle}
          <MdOpenInFull className="w-3 h-3 mt-[1px]" />
        </div>
      )}
    </div>
  );
};

export default ContentHeader;
