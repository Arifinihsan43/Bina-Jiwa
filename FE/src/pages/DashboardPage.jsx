import React, { useEffect, useState } from 'react';
import {
  DashboardHeader,
  DashboardHeroBanner,
  MoodCheckInCard,
  QuickReflectionCard,
  StatsAndScheduleGrid,
  HotlineAlertCard,
} from '../components/dashboard';
import {
  addDaysKey,
  getMoodLogs,
  getReflections,
  promptOfTheDay,
  saveReflection,
  saveTodayMood,
  summarize,
  wibDateKey,
} from '../service/moodService';
import { listMyAppointments } from '../service/appointmentService';

// Cukup panjang untuk menghitung streak menuju target 14 hari & perbandingan mingguan.
const HISTORY_DAYS = 60;

export default function DashboardPage({ user, onToggleSidebar }) {
  const [todayKey] = useState(() => wibDateKey());
  const [question] = useState(() => promptOfTheDay());
  const [logs, setLogs] = useState({});
  const [loadingMood, setLoadingMood] = useState(true);
  const [reflectionsToday, setReflectionsToday] = useState(0);
  const [upcoming, setUpcoming] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMoodLogs(addDaysKey(todayKey, -(HISTORY_DAYS - 1)), todayKey)
      .then((rows) => {
        if (!cancelled) setLogs(rows);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingMood(false);
      });

    getReflections(todayKey, todayKey)
      .then((rows) => {
        if (!cancelled) setReflectionsToday(rows.length);
      })
      .catch(() => {});

    listMyAppointments()
      .then((rows) => {
        if (cancelled) return;
        const now = Date.now();
        const next = rows
          .filter((a) => ['PENDING', 'CONFIRMED'].includes(a.status) && new Date(a.tanggal_selesai).getTime() > now)
          .sort((a, b) => new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai))[0];
        setUpcoming(next || null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [todayKey]);

  const handleSaveMood = async (data) => {
    const log = await saveTodayMood(data);
    setLogs((prev) => ({ ...prev, [log.dateKey]: log }));
  };

  const handleSaveReflection = async (q, text) => {
    await saveReflection(q, text);
    setReflectionsToday((n) => n + 1);
  };

  const summary = summarize(logs, todayKey);

  return (
    <div className="db-main-content">
      <DashboardHeader onToggleSidebar={onToggleSidebar} />

      <div className="db-scrollable-body">
        <DashboardHeroBanner user={user} weeklyAverage={loadingMood ? null : summary.weekly.average} />

        <div className="db-middle-grid">
          <MoodCheckInCard
            todayLog={logs[todayKey] || null}
            loading={loadingMood}
            onSave={handleSaveMood}
            showCalendarLink
          />
          <QuickReflectionCard question={question} onSave={handleSaveReflection} savedToday={reflectionsToday} />
        </div>

        <StatsAndScheduleGrid
          summary={summary}
          loading={loadingMood || loadingSession}
          upcoming={upcoming}
          userId={user?.id}
        />

        <HotlineAlertCard />
      </div>
    </div>
  );
}
