import React, { useEffect, useState } from 'react';
import {
  DashboardHeader,
  DashboardHeroBanner,
  MoodCheckInCard,
  QuickReflectionCard,
  StatsAndScheduleGrid,
  HotlineAlertCard
} from '../components/dashboard';
import { getDashboardData, saveMoodCheckIn, saveReflection } from '../service/dashboardService';

export default function DashboardPage({ user }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDashboardData().then((data) => {
      setDashboardData(data);
      setIsLoading(false);
    });
  }, []);

  const handleSaveMood = async (moodData) => {
    await saveMoodCheckIn(moodData);
  };

  const handleSaveReflectionText = async (text) => {
    await saveReflection(text);
  };

  const currentUser = user || dashboardData?.user;

  return (
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
  );
}
