import React, { useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import MoodReflectionHero from '../components/dashboard/MoodReflectionHero';
import MoodCalendarGrid from '../components/dashboard/MoodCalendarGrid';
import MoodCheckInCard from '../components/dashboard/MoodCheckInCard';
import EmotionTrendChart from '../components/dashboard/EmotionTrendChart';
import DailyQuoteCard from '../components/dashboard/DailyQuoteCard';
import { saveTodayMoodLog, hasFilledToday } from '../service/dashboardService';
import { X } from 'lucide-react';

export default function MoodReflectionPage({ user, onLogout, activeMenu = 'mood', setActiveMenu }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [key, setKey] = useState(0); // Trigger re-render of calendar

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleOpenCheckIn = () => {
    if (hasFilledToday()) {
      alert('Anda sudah mengisi catatan mood untuk hari ini! Setiap hari hanya dapat diisi 1 kali.');
      return;
    }
    setIsCheckInModalOpen(true);
  };

  const handleSaveMood = async (moodData) => {
    try {
      await saveTodayMoodLog(moodData);
      setIsCheckInModalOpen(false);
      setKey((prev) => prev + 1); // Refresh calendar
    } catch (err) {
      alert(err.message || 'Gagal menyimpan catatan mood.');
    }
  };

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
        activeMenu={activeMenu || 'mood'}
        setActiveMenu={setActiveMenu}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="db-main-content">
        <DashboardHeader />

        <div className="db-scrollable-body">
          {/* Hero Banner */}
          <MoodReflectionHero />

          {/* Real-time Monthly Calendar Grid */}
          <MoodCalendarGrid key={key} onOpenCheckIn={handleOpenCheckIn} />

          {/* 30-Day Emotion Trend Chart */}
          <EmotionTrendChart />

          {/* Daily Wisdom Quote Card */}
          <DailyQuoteCard />
        </div>
      </div>

      {/* Mood Check-In Modal Overlay */}
      {isCheckInModalOpen && (
        <div className="mc-modal-overlay" onClick={() => setIsCheckInModalOpen(false)}>
          <div className="mc-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="mc-modal-close-btn"
              onClick={() => setIsCheckInModalOpen(false)}
            >
              <X size={20} />
            </button>
            <MoodCheckInCard onSave={handleSaveMood} />
          </div>
        </div>
      )}
    </div>
  );
}
