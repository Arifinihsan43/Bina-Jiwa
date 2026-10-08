import React, { createContext, useContext } from 'react';

const DashboardNavContext = createContext({
  isSidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  openCrisisModal: () => {},
  openSettingsModal: () => {},
});

export function DashboardNavProvider({ children, value }) {
  return (
    <DashboardNavContext.Provider value={value}>
      {children}
    </DashboardNavContext.Provider>
  );
}

export function useDashboardNav() {
  return useContext(DashboardNavContext);
}
