import { useEffect, useState } from 'react';
import { MdCheckCircle, MdSearch } from 'react-icons/md';

const ContentHeader = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [apiStatus, setApiStatus] = useState<'live' | 'error'>('live');

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
    <div className="flex justify-between items-center px-6 py-3 border-b bg-white shadow-sm">
      {/* Left section: logo, time, status */}
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-green-600">
          Reads <span className="text-black">WorkFlow</span>
        </span>

        <div className="flex items-center gap-2 bg-gray-100 text-sm text-gray-800 px-3 py-1 rounded-lg">
          {new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {` ${formattedTime.split(',')[0]}, ${formattedTime.split(',')[1]}`}
        </div>

        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${
            apiStatus === 'live'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              apiStatus === 'live' ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          {apiStatus === 'live' ? 'Live' : 'Error'}
        </div>

        <a
          href="https://www.shopifystatus.com/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 text-sm text-gray-800"
        >
          Shopify status:
          <MdCheckCircle className="text-green-600 text-lg" />
          <span className="text-green-600 font-medium">Online</span>
        </a>
      </div>

      {/* Right section: search + staff */}
      <div className="flex items-center gap-4">
        {/* Search input with icon */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search order number..."
            className="pl-3 pr-9 py-2 bg-gray-100 rounded-md text-sm w-56 placeholder-gray-500 focus:outline-none"
          />
          <MdSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
        </div>

        {/* Staff button */}
        <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-800">
          <span className="text-lg">👤</span>
          <span>Staff</span>
          <span className="text-xs">▾</span>
        </button>
      </div>
    </div>
  );
};

export default ContentHeader;
