import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Flame, Calendar, MessageSquare, Search } from 'lucide-react';
import { formatAppointmentRange } from '../../../service/appointmentService';

const STREAK_TARGET = 14;
const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const initialsOf = (name = '') =>
  name
    .split(',')[0]
    .split(/\s+/)
    .filter((w) => w && !w.endsWith('.'))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

/** Sparkline 7 hari; hari tanpa check-in membuat garis terputus. */
function Sparkline({ series }) {
  const W = 300;
  const H = 40;
  const px = (i) => 10 + (i * (W - 20)) / (series.length - 1);
  const py = (score) => 4 + ((100 - score) * (H - 8)) / 100;

  let path = '';
  series.forEach((d, i) => {
    if (d.score === null) return;
    const prev = i > 0 && series[i - 1].score !== null;
    path += `${prev ? 'L' : 'M'} ${px(i).toFixed(1)} ${py(d.score).toFixed(1)} `;
  });

  return (
    <div className="db-sparkline-wrapper">
      <div className="db-sparkline-days">
        {series.map((d) => (
          <span key={d.dateKey}>{DAY_SHORT[new Date(`${d.dateKey}T00:00:00Z`).getUTCDay()]}</span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="db-sparkline-svg" aria-hidden="true">
        <line x1="10" x2={W - 10} y1={py(50)} y2={py(50)} stroke="#e2e8f0" strokeDasharray="3 3" />
        {path && <path d={path} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {series.map((d, i) =>
          d.score === null ? null : (
            <circle key={d.dateKey} cx={px(i)} cy={py(d.score)} r="3.5" fill="#0ea5e9" stroke="#ffffff" strokeWidth="1.5">
              <title>{`${d.mood} • indeks ${d.score}`}</title>
            </circle>
          )
        )}
      </svg>
    </div>
  );
}

export default function StatsAndScheduleGrid({ summary, loading, upcoming, userId }) {
  const navigate = useNavigate();
  const weekly = summary?.weekly;
  const streak = summary?.streak ?? 0;
  const streakProgress = Math.min(100, Math.round((streak / STREAK_TARGET) * 100));

  let weeklyNote;
  if (!weekly || weekly.filledDays === 0) {
    weeklyNote = 'Belum ada check-in minggu ini. Isi mood harianmu untuk melihat ritme suasana hati.';
  } else if (weekly.delta === null) {
    weeklyNote = `Dihitung dari ${weekly.filledDays} hari check-in dalam 7 hari terakhir.`;
  } else if (weekly.delta > 0) {
    weeklyNote = `Naik ${weekly.delta} poin dibanding minggu lalu. Kebiasaan baikmu mulai terasa.`;
  } else if (weekly.delta < 0) {
    weeklyNote = `Turun ${Math.abs(weekly.delta)} poin dibanding minggu lalu. Beri ruang untuk dirimu beristirahat.`;
  } else {
    weeklyNote = 'Stabil dibanding minggu lalu.';
  }

  let streakNote;
  if (streak === 0) streakNote = 'Mulai check-in hari ini untuk membangun kebiasaan mendengarkan perasaanmu.';
  else if (streak >= STREAK_TARGET) streakNote = 'Luar biasa! Kamu telah meraih lencana kebiasaan "Hati yang Berakar".';
  else streakNote = `Tinggal ${STREAK_TARGET - streak} hari lagi untuk meraih lencana kebiasaan "Hati yang Berakar".`;

  const asClient = upcoming && upcoming.id_user === userId;
  const counterpartName = upcoming
    ? asClient
      ? upcoming.psikolog?.nama_profesional || 'Psikolog'
      : upcoming.klien?.nama_lengkap || 'Klien'
    : '';

  return (
    <div className="db-bottom-grid">
      {/* Card 1: Weekly Average */}
      <div className="db-card db-stat-card">
        <div className="db-card-header">
          <span className="db-card-small-tag">INDEKS SUASANA HATI • 7 HARI</span>
          <div className="db-card-icon-badge">
            <Activity size={18} color="#0284c7" />
          </div>
        </div>

        <div className="db-stat-main">
          <span className="db-stat-number">
            {loading ? '…' : weekly?.average ?? '—'}
            {!loading && weekly?.average !== null && weekly?.average !== undefined && (
              <span className="db-stat-unit">/100</span>
            )}
          </span>
          {weekly?.dominant && <span className="db-badge db-badge-cyan">Dominan {weekly.dominant}</span>}
        </div>

        <p className="db-stat-desc">{loading ? 'Memuat…' : weeklyNote}</p>

        {weekly && <Sparkline series={weekly.series} />}
      </div>

      {/* Card 2: Check-in Consistency */}
      <div className="db-card db-stat-card">
        <div className="db-card-header">
          <span className="db-card-small-tag">KONSISTENSI CHECK-IN</span>
          <div className="db-card-icon-badge">
            <Flame size={18} color="#0284c7" />
          </div>
        </div>

        <div className="db-stat-main">
          <span className="db-stat-number">{loading ? '…' : `${streak} Hari`}</span>
          <span className="db-badge db-badge-cyan">Berturut-turut</span>
        </div>

        <p className="db-stat-desc">{loading ? 'Memuat…' : streakNote}</p>

        <div className="db-progress-section">
          <div className="db-progress-header">
            <span>Progres Menuju {STREAK_TARGET} Hari</span>
            <span className="db-progress-val">{streakProgress}%</span>
          </div>
          <div className="db-progress-track">
            <div className="db-progress-bar" style={{ width: `${streakProgress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Card 3: Upcoming Session */}
      <div className="db-card db-stat-card">
        <div className="db-card-header">
          <span className="db-card-small-tag">JADWAL SESI MENDATANG</span>
          {upcoming && (
            <span className="db-badge db-badge-cyan">
              {upcoming.status === 'CONFIRMED' ? 'Terkonfirmasi' : 'Menunggu konfirmasi'}
            </span>
          )}
        </div>

        {upcoming ? (
          <>
            <div className="db-doctor-profile">
              <div className="db-doctor-avatar db-doctor-initials">{initialsOf(counterpartName)}</div>
              <div className="db-doctor-info">
                <h3 className="db-doctor-name">{counterpartName}</h3>
                <span className="db-doctor-title">
                  {asClient ? 'Psikolog' : 'Klien'} • {upcoming.type === 'ONLINE' ? 'Sesi online' : 'Tatap muka'}
                </span>
              </div>
            </div>

            <div className="db-session-time-pill">
              <Calendar size={16} color="#0284c7" />
              <span>{formatAppointmentRange(upcoming.tanggal_mulai, upcoming.tanggal_selesai)}</span>
            </div>

            <div className="db-session-actions">
              <button type="button" className="db-btn-secondary" onClick={() => navigate('/janji-temu')}>
                Detail Sesi
              </button>
              {upcoming.status === 'CONFIRMED' && (
                <button
                  type="button"
                  className="db-btn-primary"
                  onClick={() => navigate(`/pesan?psikolog=${upcoming.id_psychologist}&klien=${upcoming.id_user}`)}
                >
                  <MessageSquare size={16} />
                  <span>Kirim Pesan</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="db-stat-desc">
              {loading ? 'Memuat…' : 'Belum ada sesi konsultasi yang dijadwalkan.'}
            </p>
            {!loading && (
              <div className="db-session-actions">
                <button type="button" className="db-btn-primary" onClick={() => navigate('/psikolog')}>
                  <Search size={16} />
                  <span>Cari Psikolog</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
