import React, { useState, useEffect } from 'react';
import { Calendar, Menu } from 'lucide-react';
import { useDashboardNav } from '../../../context/DashboardNavContext';

export default function DashboardHeader({ dateInfo, onToggleSidebar }) {
  const navContext = useDashboardNav();
  const handleToggle = onToggleSidebar || navContext?.toggleSidebar;
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

  const fullDate = realTimeDate || dateInfo?.fullDate || 'Hari ini';
  const quote = dateInfo?.quote || 'Bernapaslah dengan tenang';

  return (
    <header className="db-top-header">
      <div className="db-header-left">
        <button
          type="button"
          className="db-mobile-menu-toggle"
          onClick={handleToggle}
          title="Buka Menu Sidebar"
          aria-label="Buka Menu Sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="db-header-date">
          <Calendar size={16} className="db-date-icon" />
          <span className="db-date-text">{fullDate}</span>
          <span className="db-date-dot">•</span>
          <span className="db-date-quote">{quote}</span>
        </div>
      </div>
    </header>
  );
}


