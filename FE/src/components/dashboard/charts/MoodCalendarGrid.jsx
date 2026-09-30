import React from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, Check, Plus } from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const pad = (n) => String(n).padStart(2, '0');

/**
 * Kalender mood satu bulan.
 * - year, month (0-11): bulan yang ditampilkan
 * - logs: { 'YYYY-MM-DD': log } untuk bulan tsb
 * - todayKey: 'YYYY-MM-DD' hari ini (WIB)
 */
export default function MoodCalendarGrid({
  year,
  month,
  logs,
  loading,
  todayKey,
  onPrevMonth,
  onNextMonth,
  onOpenCheckIn,
  onSelectDay,
}) {
  const monthKey = `${year}-${pad(month + 1)}`;
  const isCurrentOrFutureMonth = monthKey >= todayKey.slice(0, 7);

  const firstDayIndex = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0 = Minggu
  const totalDays = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const prevMonthDays = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const todayLog = logs[todayKey];
  const isTodayFilled = Boolean(todayLog);

  // Persentase dihitung dari hari yang sudah lewat (termasuk hari ini), bukan seluruh bulan.
  const elapsedDays = Array.from({ length: totalDays }, (_, i) => `${monthKey}-${pad(i + 1)}`)
    .filter((key) => key <= todayKey).length;
  const filledCount = Object.keys(logs).filter((key) => key.startsWith(monthKey)).length;
  const filledPercentage = elapsedDays ? Math.round((filledCount / elapsedDays) * 100) : 0;

  return (
    <div className="mc-calendar-card">
      {/* Calendar Header Controls */}
      <div className="mc-cal-top-bar">
        <div className="mc-cal-nav">
          <button type="button" className="mc-cal-arrow" onClick={onPrevMonth} title="Bulan Sebelumnya">
            <ChevronLeft size={16} />
          </button>
          <span className="mc-cal-month-title">
            🗓️ {MONTH_NAMES[month]} {year}
          </span>
          <button
            type="button"
            className="mc-cal-arrow"
            onClick={onNextMonth}
            title="Bulan Selanjutnya"
            disabled={isCurrentOrFutureMonth}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mc-cal-stat-pill">
          <span className="mc-stat-dot">●</span>
          <span>
            {loading
              ? 'Memuat…'
              : `${filledCount} Hari Terisi Bulan Ini${elapsedDays ? ` (${filledPercentage}%)` : ''}`}
          </span>
        </div>
      </div>

      {/* Title & Legend */}
      <div className="mc-cal-title-row">
        <h2 className="mc-cal-heading">Distribusi Mood Harian</h2>

        <div className="mc-legend-group">
          <span className="mc-legend-item legend-tenang">● Tenang</span>
          <span className="mc-legend-item legend-bahagia">● Bahagia</span>
          <span className="mc-legend-item legend-biasa">● Biasa</span>
          <span className="mc-legend-item legend-cemas">● Cemas / Lelah</span>
          <span className="mc-legend-item legend-sedih">● Sedih</span>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="mc-grid-header">
        {DAY_NAMES.map((day, idx) => (
          <div key={day} className={`mc-grid-day-name ${idx === 0 ? 'sunday' : ''}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Cells Grid */}
      <div className="mc-grid-body">
        {Array.from({ length: firstDayIndex }).map((_, idx) => (
          <div key={`prev-${idx}`} className="mc-cell muted">
            <span className="mc-cell-num">{prevMonthDays - firstDayIndex + idx + 1}</span>
          </div>
        ))}

        {Array.from({ length: totalDays }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateKey = `${monthKey}-${pad(dayNum)}`;
          const log = logs[dateKey];
          const isToday = dateKey === todayKey;
          const isFuture = dateKey > todayKey;

          return (
            <div
              key={dateKey}
              className={`mc-cell ${isToday ? 'today' : ''} ${log ? 'filled' : ''} ${isFuture ? 'future' : ''}`}
              style={log ? { backgroundColor: isToday ? '#0284c7' : log.color, cursor: 'pointer' } : {}}
              onClick={() => log && onSelectDay(dateKey)}
              onKeyDown={(e) => log && (e.key === 'Enter' || e.key === ' ') && onSelectDay(dateKey)}
              role={log ? 'button' : undefined}
              tabIndex={log ? 0 : undefined}
              title={log ? 'Klik untuk melihat detail check-in' : ''}
            >
              <div className="mc-cell-top">
                <span className={`mc-cell-num ${isToday ? 'today-num' : ''}`}>
                  {dayNum} {isToday ? <span className="mc-today-tag">Hari ini</span> : null}
                </span>
                {log && <span className="mc-cell-icon">{log.icon}</span>}
              </div>

              {log ? (
                <div className="mc-cell-mood-info">
                  <span className={`mc-cell-mood-text ${isToday ? 'today-text' : ''}`}>{log.mood}</span>
                  <span className="mc-cell-score">Skor {log.intensity}/5</span>
                </div>
              ) : isToday ? (
                <div className="mc-cell-today-action">
                  <button
                    type="button"
                    className="mc-today-fill-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCheckIn();
                    }}
                    disabled={loading}
                  >
                    <Plus size={14} />
                    <span>Isi Mood</span>
                  </button>
                </div>
              ) : isFuture ? (
                <div className="mc-cell-future-label">—</div>
              ) : (
                <div className="mc-cell-empty-label">{loading ? '' : 'Belum diisi'}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Info Bar / Lock Status */}
      <div className="mc-cal-bottom-bar">
        <div className="mc-bottom-info">
          <HelpCircle size={18} color="#0284c7" />
          <span>
            {isTodayFilled
              ? `Hari ini kamu telah mencatat mood: "${todayLog.mood}". Catatan hari ini telah terkunci.`
              : 'Hari ini belum diisi. Luangkan waktu sejenak untuk mendengarkan perasaanmu.'}
          </span>
        </div>

        <button
          type="button"
          className="mc-btn-update"
          onClick={() => (isTodayFilled ? onSelectDay(todayKey) : onOpenCheckIn())}
          disabled={loading}
        >
          {isTodayFilled ? (
            <>
              <Check size={16} />
              <span>Lihat Detail Hari Ini</span>
            </>
          ) : (
            <>
              <Plus size={16} />
              <span>Isi Mood Hari Ini</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
