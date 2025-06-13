import { useEffect, useState } from 'react';
import { MdCheckCircle, MdSearch, MdMenu } from 'react-icons/md';

interface ContentHeaderProps {
  hideSearch?: boolean;
  hideStaff?: boolean;
}

const ContentHeader = ({ hideSearch = false, hideStaff = false }: ContentHeaderProps) => {
  const [dateTime, setDateTime] = useState(new Date());
  const [apiStatus, setApiStatus] = useState<'live' | 'error'>('live');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    <div
      className={`sticky top-0 z-50 border-b bg-white shadow-sm transition-all duration-300 px-4 ${
        isScrolled ? 'py-1' : 'py-2'
      }`}
    >
      <div className={`flex flex-wrap lg:flex-nowrap items-center justify-between gap-3
        ${hideSearch && hideStaff ? 'compact-header' : ''}`}>
        {/* Left side */}
        <div className="flex items-center gap-4 shrink-0">
          <span className="text-xl font-bold text-[#008060] whitespace-nowrap">
            Reads <span className="text-black">WorkFlow</span>
          </span>
          <button className="lg:hidden text-2xl" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <MdMenu />
          </button>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <div className="bg-gray-100 text-sm text-gray-800 px-3 py-1 rounded-lg">
            {new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {` ${formattedTime.split(',')[0]}, ${formattedTime.split(',')[1]}`}
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
              apiStatus === 'live' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${apiStatus === 'live' ? 'bg-green-500 animate-pulse-live' : 'bg-red-500'}`} />
            {apiStatus === 'live' ? 'Live' : 'Error'}
          </div>

          <a
            href="https://www.shopifystatus.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 text-sm text-gray-800 hover:text-[#008060] transition-colors"
          >
            Shopify status:
            <MdCheckCircle className="text-[#008060] text-lg" />
            <span className="text-[#008060] font-medium">Online</span>
          </a>
        </div>

        {/* Right side */}
        {!hideSearch && !hideStaff && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap ml-auto">
            {!hideSearch && (
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  placeholder="Search order number..."
                  className="w-full pl-3 pr-9 py-2 bg-gray-100 text-sm rounded-md outline-none placeholder-gray-500"
                />
                <MdSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
              </div>
            )}
            {!hideStaff && (
              <button className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-sm text-gray-800 font-medium px-3 py-1.5 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM2 17a6 6 0 1112 0H2z" />
                </svg>
                <span className="font-semibold">Staff</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentHeader;
