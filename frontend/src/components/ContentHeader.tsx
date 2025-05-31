import { useEffect, useState } from 'react';
import '../styles/header.css';

const ContentHeader = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [apiStatus, setApiStatus] = useState<'live' | 'error'>('live');

  // ⏱️ Tikajúci čas
  useEffect(() => {
    const interval = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🔁 Kontrola API 3seconds interval
useEffect(() => {
  const checkAPI = async () => {
    try {
      const res = await fetch('https://shopify-workflow-app-backend.onrender.com/ping');
      if (!res.ok) throw new Error('API error');
      setApiStatus('live');
    } catch {
      setApiStatus('error');
    }
  };

  checkAPI(); // inicializačný ping

  const interval = setInterval(checkAPI, 30000); // každých 30 sekúnd
  return () => clearInterval(interval);
}, []);

  const formattedTime = dateTime.toLocaleString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="content-header">
      <div className="left">
        <span className="logo">Reads <strong>WorkFlow</strong></span>

        <div className="time-status">
          <span className="time">{formattedTime}</span>
          <span className={`status ${apiStatus}`}>
            <span className="dot"></span> {apiStatus === 'live' ? 'Live' : 'Error'}
          </span>
        </div>

        <a className="shopify-status" href="https://www.shopifystatus.com/" target="_blank" rel="noreferrer">
          Shopify status: <span className="dot green"></span> Online
        </a>
      </div>

      <div className="right">
        <input type="text" placeholder="Search order number..." className="search" />
        <button className="search-btn">🔍</button>
        <button className="login-btn">👤 Staff ▾</button>
      </div>
    </div>
  );
};

export default ContentHeader;
