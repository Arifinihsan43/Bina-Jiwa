import React, { useEffect, useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardHeroBanner from '../components/dashboard/DashboardHeroBanner';
import MoodCheckInCard from '../components/dashboard/MoodCheckInCard';
import QuickReflectionCard from '../components/dashboard/QuickReflectionCard';
import StatsAndScheduleGrid from '../components/dashboard/StatsAndScheduleGrid';
import HotlineAlertCard from '../components/dashboard/HotlineAlertCard';
import MoodReflectionPage from './MoodReflectionPage';
import { getDashboardData, saveMoodCheckIn, saveReflection } from '../service/dashboardService';

export default function DashboardPage({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDashboardData().then((data) => {
      setDashboardData(data);
      setIsLoading(false);
    });
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSaveMood = async (moodData) => {
    await saveMoodCheckIn(moodData);
  };

  const handleSaveReflectionText = async (text) => {
    await saveReflection(text);
  };

  const currentUser = user || dashboardData?.user;

  if (activeMenu === 'mood') {
    return (
      <MoodReflectionPage
        user={currentUser}
        onLogout={onLogout}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />
    );
  }

  return (
    <div className={`db-layout-wrapper ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="db-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        user={currentUser}
        onLogout={onLogout}
      />

      {/* Main Dashboard Content Area */}
      <div className="db-main-content">
        <DashboardHeader dateInfo={dashboardData?.dateInfo} />

        <div className="db-scrollable-body">
          {/* Top Hero Banner */}
          <DashboardHeroBanner user={currentUser} />

          {/* Middle Row: Mood Check-in (Left) + Quick Reflection (Right) */}
          <div className="db-middle-grid">
            <MoodCheckInCard
              initialData={dashboardData?.moodCheckIn}
              onSave={handleSaveMood}
            />
            <QuickReflectionCard
              initialPrompt={dashboardData?.reflection?.question}
              onSave={handleSaveReflectionText}
            />
          </div>

          {/* Bottom Grid: Stats (2 cards) + Upcoming Session (1 card) */}
          <StatsAndScheduleGrid
            weeklyStats={dashboardData?.weeklyStats}
            consistency={dashboardData?.consistency}
            upcomingSession={dashboardData?.upcomingSession}
          />

          {/* Hotline Emergency Alert Card */}
          <HotlineAlertCard />
        </div>
      </div>
    </div>
  );
}
