import React, { useState, useEffect } from 'react';
import { Bell, Calendar } from 'lucide-react';

export default function DashboardHeader({ dateInfo }) {
  const [realTimeDate, setRealTimeDate] = useState('');

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      const formatted = now.toLocaleDateString('id-ID', options);
      setRealTimeDate(`Hari ini, ${formatted}`);
    };

    updateDate();
    const interval = setInterval(updateDate, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  const fullDate = realTimeDate || dateInfo?.fullDate || 'Hari ini, Rabu 25 Oktober 2024';
  const quote = dateInfo?.quote || 'Bernapaslah dengan tenang';

  return (
    <header className="db-top-header">
      <div className="db-header-date">
        <Calendar size={16} className="db-date-icon" />
        <span className="db-date-text">{fullDate}</span>
        <span className="db-date-dot">•</span>
        <span className="db-date-quote">{quote}</span>
      </div>

      <div className="db-header-actions">
        <button type="button" className="db-notification-btn" title="Notifikasi">
          <Bell size={18} />
          <span className="db-notification-dot"></span>
        </button>
      </div>
    </header>
  );
}
