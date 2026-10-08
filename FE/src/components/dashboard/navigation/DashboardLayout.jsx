import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import { DashboardNavProvider } from '../../../context/DashboardNavContext';

export default function DashboardLayout({ user, onLogout, onUpdateUser, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return false;
    }
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });

  // Automatically close sidebar drawer on route change on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const getActiveMenu = () => {
    const path = location.pathname.replace(/^\//, '');
    if (!path || path === 'dashboard') return 'dashboard';
    return path;
  };

  const activeMenu = getActiveMenu();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarOpen', String(next));
      return next;
    });
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    localStorage.setItem('sidebarOpen', 'false');
  };

  const navContextValue = {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar: handleCloseSidebar,
    openCrisisModal: () => navigate('/krisis'),
    openSettingsModal: () => navigate('/pengaturan'),
  };

  return (
    <DashboardNavProvider value={navContextValue}>
      <div className={`db-layout-wrapper ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        {/* Mobile Backdrop Overlay */}
        {isSidebarOpen && (
          <div
            className="db-sidebar-overlay"
            onClick={handleCloseSidebar}
          />
        )}

        {/* Main Shared Left Sidebar */}
        <DashboardSidebar
          isOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
          onCloseSidebar={handleCloseSidebar}
          activeMenu={activeMenu}
          user={user}
          onLogout={onLogout}
        />

        {/* Main Page Content */}
        {children}
      </div>
    </DashboardNavProvider>
  );
}



