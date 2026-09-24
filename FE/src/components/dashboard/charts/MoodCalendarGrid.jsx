import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, Check, Plus, AlertCircle } from 'lucide-react';
import { getTodayDateKey, getStoredMoodLogs } from '../../../service/dashboardService';
import MoodDetailModal from '../modals/MoodDetailModal';

export default function MoodCalendarGrid({ onOpenCheckIn }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [moodLogs, setMoodLogs] = useState(getStoredMoodLogs());
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calculate calendar grid cells
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDateNum = today.getDate();
  const todayKey = getTodayDateKey();

  const isTodayFilled = Boolean(moodLogs[todayKey]);
  const todayLog = moodLogs[todayKey];

  // Count filled days this month
  let filledCount = 0;
  for (let d = 1; d <= totalDays; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (moodLogs[key]) filledCount++;
  }
  const filledPercentage = Math.round((filledCount / totalDays) * 100);

  const refreshLogs = () => {
    setMoodLogs(getStoredMoodLogs());
  };

  return (
    <div className="mc-calendar-card">
      {/* Calendar Header Controls */}
      <div className="mc-cal-top-bar">
        <div className="mc-cal-nav">
          <button type="button" className="mc-cal-arrow" onClick={prevMonth} title="Bulan Sebelumnya">
            <ChevronLeft size={16} />
          </button>
          <span className="mc-cal-month-title">
            🗓️ {monthNames[month]} {year}
          </span>
          <button type="button" className="mc-cal-arrow" onClick={nextMonth} title="Bulan Selanjutnya">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="mc-cal-stat-pill">
          <span className="mc-stat-dot">●</span>
          <span>{filledCount} Hari Terisi Bulan Ini ({filledPercentage}%)</span>
        </div>
      </div>

      {/* Title & Legend */}
      <div className="mc-cal-title-row">
        <h2 className="mc-cal-heading">Distribusi Mood Harian</h2>

        <div className="mc-legend-group">
          <span className="mc-legend-item legend-tenang">● Tenang</span>
          <span className="mc-legend-item legend-bahagia">● Bahagia</span>
          <span className="mc-legend-item legend-biasa">● Biasa</span>
          <span className="mc-legend-item legend-cemas">● Cemas</span>
          <span className="mc-legend-item legend-sedih">● Sedih</span>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="mc-grid-header">
        {dayNames.map((day, idx) => (
          <div key={day} className={`mc-grid-day-name ${idx === 0 ? 'sunday' : ''}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Cells Grid */}
      <div className="mc-grid-body">
        {/* Empty cells from previous month */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => {
          const prevDate = prevMonthDays - firstDayIndex + idx + 1;
          return (
            <div key={`prev-${idx}`} className="mc-cell muted">
              <span className="mc-cell-num">{prevDate}</span>
            </div>
          );
        })}

        {/* Current month days */}
        {Array.from({ length: totalDays }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const log = moodLogs[dateKey];
          const isToday = isCurrentMonth && dayNum === todayDateNum;
          const isPast = isCurrentMonth ? dayNum < todayDateNum : year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth());
          const isFuture = isCurrentMonth ? dayNum > todayDateNum : year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());

          return (
            <div
              key={dateKey}
              className={`mc-cell ${isToday ? 'today' : ''} ${log ? 'filled' : ''} ${isFuture ? 'future' : ''}`}
              style={log ? { backgroundColor: isToday ? '#0284c7' : log.color, cursor: log ? 'pointer' : 'default' } : {}}
              onClick={() => {
                if (log) {
                  setSelectedLogDetail({ dateKey, dayNum, year, month, log });
                }
              }}
              title={log ? "Klik untuk melihat detail riwayat check-in" : ""}
            >
              <div className="mc-cell-top">
                <span className={`mc-cell-num ${isToday ? 'today-num' : ''}`}>
                  {dayNum} {isToday ? <span className="mc-today-tag">Hari ini</span> : null}
                </span>
                {log && <span className="mc-cell-icon">{log.icon || '😊'}</span>}
              </div>

              {log ? (
                <div className="mc-cell-mood-info">
                  <span className={`mc-cell-mood-text ${isToday ? 'today-text' : ''}`}>
                    {log.mood || log.type}
                  </span>
                  {log.intensity && <span className="mc-cell-score">Skor {log.intensity}/5</span>}
                </div>
              ) : isToday ? (
                <div className="mc-cell-today-action">
                  <button
                    type="button"
                    className="mc-today-fill-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenCheckIn) onOpenCheckIn();
                    }}
                  >
                    <Plus size={14} />
                    <span>Isi Mood</span>
                  </button>
                </div>
              ) : isFuture ? (
                <div className="mc-cell-future-label">Rencana</div>
              ) : (
                <div className="mc-cell-empty-label">Belum diisi</div>
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
              ? `Hari ini kamu telah mencatat mood: "${todayLog?.mood || 'Tenang'}". Catatan hari ini telah terkunci.`
              : 'Hari ini belum diisi. Luangkan waktu sejenak untuk mendengarkan perasaanmu.'}
          </span>
        </div>

        <button
          type="button"
          className={`mc-btn-update ${isTodayFilled ? 'disabled' : ''}`}
          onClick={() => {
            if (isTodayFilled) {
              setSelectedLogDetail({ dateKey: todayKey, dayNum: todayDateNum, year, month, log: todayLog });
            } else if (onOpenCheckIn) {
              onOpenCheckIn();
            }
          }}
        >
          {isTodayFilled ? (
            <>
              <Check size={16} />
              <span>Lihat Detail Hari Ini</span>
            </>
          ) : (
            <>
              <Plus size={16} />
              <span>Perbarui Mood Hari Ini</span>
            </>
          )}
        </button>
      </div>

      {/* Detail History Modal Popup */}
      {selectedLogDetail && (
        <MoodDetailModal
          logData={selectedLogDetail}
          onClose={() => setSelectedLogDetail(null)}
        />
      )}
    </div>
  );
}
