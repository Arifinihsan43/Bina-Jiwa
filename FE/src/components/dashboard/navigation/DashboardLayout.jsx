import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';

export default function DashboardLayout({ user, onLogout, children }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });

  // Determine active menu from URL pathname
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

  return (
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
        activeMenu={activeMenu}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Page Content */}
      {children}
    </div>
  );
}
