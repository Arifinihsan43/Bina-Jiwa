import React, { useEffect, useState } from 'react';
import {
  DashboardHeader,
  MoodReflectionHero,
  MoodCalendarGrid,
  MoodCheckInCard,
  EmotionTrendChart,
  DailyQuoteCard,
  MoodDetailModal,
} from '../components/dashboard';
import { addDaysKey, getMoodLogs, getReflections, saveTodayMood, wibDateKey } from '../service/moodService';
import { AlertCircle, X } from 'lucide-react';

const pad = (n) => String(n).padStart(2, '0');
const lastDayOfMonth = (year, month) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

export default function MoodReflectionPage({ onToggleSidebar }) {
  const [todayKey] = useState(() => wibDateKey());
  const [view, setView] = useState(() => ({
    year: Number(todayKey.slice(0, 4)),
    month: Number(todayKey.slice(5, 7)) - 1,
  }));
  const [monthLogs, setMonthLogs] = useState({});
  const [trendLogs, setTrendLogs] = useState({});
  const [loadingMonth, setLoadingMonth] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [detail, setDetail] = useState(null); // { log, reflections }

  // Log bulan yang sedang ditampilkan di kalender.
  useEffect(() => {
    let cancelled = false;
    const monthKey = `${view.year}-${pad(view.month + 1)}`;
    getMoodLogs(`${monthKey}-01`, `${monthKey}-${pad(lastDayOfMonth(view.year, view.month))}`)
      .then((logs) => {
        if (!cancelled) {
          setMonthLogs(logs);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingMonth(false);
      });
    return () => {
      cancelled = true;
    };
  }, [view, reloadKey]);

  // Log 30 hari terakhir untuk grafik tren.
  useEffect(() => {
    let cancelled = false;
    getMoodLogs(addDaysKey(todayKey, -29), todayKey)
      .then((logs) => {
        if (!cancelled) setTrendLogs(logs);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingTrend(false);
      });
    return () => {
      cancelled = true;
    };
  }, [todayKey, reloadKey]);

  const changeMonth = (delta) => {
    setLoadingMonth(true);
    setView(({ year, month }) => {
      const d = new Date(Date.UTC(year, month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  };

  const handleOpenCheckIn = () => {
    if (monthLogs[todayKey]) return;
    setIsCheckInOpen(true);
  };

  const handleSaveMood = async (data) => {
    await saveTodayMood(data);
    setIsCheckInOpen(false);
    setLoadingMonth(true);
    setLoadingTrend(true);
    setReloadKey((k) => k + 1);
  };

  const handleSelectDay = (dateKey) => {
    const log = monthLogs[dateKey];
    if (!log) return;
    setDetail({ log, reflections: [] });
    getReflections(dateKey, dateKey)
      .then((reflections) => setDetail((d) => (d?.log.dateKey === dateKey ? { ...d, reflections } : d)))
      .catch(() => {});
  };

  return (
    <div className="db-main-content">
      <DashboardHeader onToggleSidebar={onToggleSidebar} />

      <div className="db-scrollable-body">
        <MoodReflectionHero />

        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <MoodCalendarGrid
          year={view.year}
          month={view.month}
          logs={monthLogs}
          loading={loadingMonth}
          todayKey={todayKey}
          onPrevMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
          onOpenCheckIn={handleOpenCheckIn}
          onSelectDay={handleSelectDay}
        />

        <EmotionTrendChart logs={trendLogs} todayKey={todayKey} loading={loadingTrend} />

        <DailyQuoteCard />
      </div>

      {isCheckInOpen && (
        <div className="mc-modal-overlay" onClick={() => setIsCheckInOpen(false)}>
          <div className="mc-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="mc-modal-close-btn"
              onClick={() => setIsCheckInOpen(false)}
              aria-label="Tutup"
            >
              <X size={20} />
            </button>
            <MoodCheckInCard onSave={handleSaveMood} />
          </div>
        </div>
      )}

      {detail && (
        <MoodDetailModal log={detail.log} reflections={detail.reflections} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}
