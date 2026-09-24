import React from 'react';
import { Activity, Flame, Calendar, Video } from 'lucide-react';

export default function StatsAndScheduleGrid({ weeklyStats, consistency, upcomingSession }) {
  const percent = weeklyStats?.percentage || 78;
  const streakDays = consistency?.streakDays || 12;
  const progressPercent = consistency?.progressPercent || 85;
  const doctor = upcomingSession || {
    doctorName: 'Nadia Pratiwi, M.Psi',
    doctorTitle: 'Psikolog Klinis Dewasa',
    doctorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    timeSlot: 'Besok, 14:00 – 15:00 WIB',
    status: 'Terkonfirmasi',
  };

  return (
    <div className="db-bottom-grid">
      {/* Card 1: Weekly Average */}
      <div className="db-card db-stat-card">
        <div className="db-card-header">
          <span className="db-card-small-tag">RATA-RATA MINGGU INI</span>
          <div className="db-card-icon-badge">
            <Activity size={18} color="#0284c7" />
          </div>
        </div>

        <div className="db-stat-main">
          <span className="db-stat-number">{percent}%</span>
          <span className="db-badge db-badge-cyan">{weeklyStats?.label || 'Dominan Tenang'}</span>
        </div>

        <p className="db-stat-desc">
          {weeklyStats?.growthNote || 'Peningkatan ketenangan +14% dibandingkan minggu lalu setelah rutinitas nafas pagi.'}
        </p>

        {/* Sparkline Curve */}
        <div className="db-sparkline-wrapper">
          <div className="db-sparkline-days">
            <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
          </div>
          <svg viewBox="0 0 300 40" className="db-sparkline-svg">
            <path
              d="M 10 32 Q 50 25, 90 28 T 170 18 T 250 14 T 290 10"
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M 10 32 Q 50 25, 90 28 T 170 18 T 250 14 T 290 10 L 290 40 L 10 40 Z"
              fill="url(#sparkline-grad)"
              opacity="0.2"
            />
            <defs>
              <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Card 2: Reflection Consistency */}
      <div className="db-card db-stat-card">
        <div className="db-card-header">
          <span className="db-card-small-tag">KONSISTENSI REFLEKSI</span>
          <div className="db-card-icon-badge">
            <Flame size={18} color="#0284c7" />
          </div>
        </div>

        <div className="db-stat-main">
          <span className="db-stat-number">{streakDays} Hari</span>
          <span className="db-badge db-badge-cyan">Berturut-turut</span>
        </div>

        <p className="db-stat-desc">
          Hebat! Kamu tinggal 2 hari lagi untuk meraih lencana kebiasaan "Hati yang Berakar".
        </p>

        {/* Progress Bar */}
        <div className="db-progress-section">
          <div className="db-progress-header">
            <span>Progres Menuju 14 Hari</span>
            <span className="db-progress-val">{progressPercent}%</span>
          </div>
          <div className="db-progress-track">
            <div className="db-progress-bar" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Card 3: Upcoming Session Schedule */}
      <div className="db-card db-stat-card">
        <div className="db-card-header">
          <span className="db-card-small-tag">JADWAL SESI MENDATANG</span>
          <span className="db-badge db-badge-cyan">{doctor.status}</span>
        </div>

        <div className="db-doctor-profile">
          <img
            src={doctor.doctorAvatar}
            alt={doctor.doctorName}
            className="db-doctor-avatar"
          />
          <div className="db-doctor-info">
            <h3 className="db-doctor-name">{doctor.doctorName}</h3>
            <span className="db-doctor-title">{doctor.doctorTitle}</span>
          </div>
        </div>

        <div className="db-session-time-pill">
          <Calendar size={16} color="#0284c7" />
          <span>{doctor.timeSlot}</span>
        </div>

        <div className="db-session-actions">
          <button type="button" className="db-btn-secondary">
            Detail Sesi
          </button>
          <button type="button" className="db-btn-primary">
            <Video size={16} />
            <span>Ruang Konsul</span>
          </button>
        </div>
      </div>
    </div>
  );
}
