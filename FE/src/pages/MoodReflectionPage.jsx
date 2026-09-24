import React, { useState } from 'react';
import {
  DashboardHeader,
  MoodReflectionHero,
  MoodCalendarGrid,
  MoodCheckInCard,
  EmotionTrendChart,
  DailyQuoteCard
} from '../components/dashboard';
import { saveTodayMoodLog, hasFilledToday } from '../service/dashboardService';
import { X } from 'lucide-react';

export default function MoodReflectionPage() {
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [key, setKey] = useState(0); // Trigger re-render of calendar

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
