import { useEffect, useState } from 'react';
import { MdCheckCircle, MdError } from 'react-icons/md';

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
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-green-600">Reads <span className="text-black">WorkFlow</span></span>

        <div className="flex items-center gap-2 bg-gray-100 text-sm text-gray-800 px-3 py-1 rounded-lg">
          {new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {` ${formattedTime.split(',')[0]}, ${formattedTime.split(',')[1]}`}
        </div>

        <div className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm ${apiStatus === 'live' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
          {apiStatus === 'live' ? (
            <>
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Live
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              Error
            </>
          )}
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

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Search order number..."
          className="px-3 py-1 border border-gray-300 rounded-md text-sm w-52"
        />
        <button className="text-base">🔍</button>
        <button className="ml-2 px-3 py-1 border rounded-md bg-gray-100 hover:bg-gray-200 text-sm">👤 Staff ▾</button>
      </div>
    </div>
  );
};

export default ContentHeader;
