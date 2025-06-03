import { useEffect, useState } from 'react';
import { MdCheckCircle, MdSearch, MdMenu, MdPerson } from 'react-icons/md';

const ContentHeader = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [apiStatus, setApiStatus] = useState<'live' | 'error'>('live');
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center px-4 py-3 border-b bg-white shadow-sm gap-3 lg:gap-0">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 w-full">
        <div className="flex justify-between items-center w-full lg:w-auto">
          <span className="text-xl font-bold text-green-600 whitespace-nowrap">
            Reads <span className="text-black">WorkFlow</span>
          </span>
          <button className="lg:hidden text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
            <MdMenu />
          </button>
        </div>

        {(menuOpen || window.innerWidth >= 1024) && (
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-gray-100 text-sm text-gray-800 px-3 py-1 rounded-lg mt-1 lg:mt-0">
              {new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {` ${formattedTime.split(',')[0]}, ${formattedTime.split(',')[1]}`}
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm mt-1 lg:mt-0 ${
                apiStatus === 'live' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
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
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 text-sm text-gray-800 mt-1 lg:mt-0"
            >
              Shopify status:
              <MdCheckCircle className="text-green-600 text-lg" />
              <span className="text-green-600 font-medium">Online</span>
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 w-full lg:w-auto">
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-full lg:w-52">
          <input
            type="text"
            placeholder="Search order number..."
            className="px-3 py-1 text-sm w-full outline-none"
          />
          <button className="px-2 text-lg text-gray-600">
            <MdSearch />
          </button>
        </div>
        <button className="flex items-center gap-1 px-3 py-1 border rounded-md bg-gray-100 hover:bg-gray-200 text-sm">
          <MdPerson />
          Staff ▾
        </button>
      </div>
    </div>
  );
};

export default ContentHeader;
