import React from 'react';
import { X, Calendar, Heart, Sun, Cloud, Wind, CloudRain, Zap, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function MoodDetailModal({ logData, onClose }) {
  if (!logData || !logData.log) return null;

  const { dateKey, dayNum, year, month, log } = logData;

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Parse Date for Indonesian Display
  const parsedDate = dateKey ? new Date(dateKey) : new Date(year, month, dayNum);
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayOfWeekStr = dayNames[parsedDate.getDay()] || 'Hari';
  const monthStr = monthNames[parsedDate.getMonth() !== undefined ? parsedDate.getMonth() : month];
  const dateDisplay = `${dayOfWeekStr}, ${dayNum} ${monthStr} ${year}`;

  const getIntensityLabel = (lvl) => {
    if (lvl <= 1) return 'Tingkat 1 (Sangat Samar)';
    if (lvl === 2) return 'Tingkat 2 (Samar)';
    if (lvl === 3) return 'Tingkat 3 (Sedang)';
    if (lvl === 4) return 'Tingkat 4 (Nyaman & Tenang)';
    return 'Tingkat 5 (Sangat Kuat)';
  };

  const moodIconMap = {
    'Sangat Baik': Sun,
    'Tenang': Heart,
    'Biasa': Cloud,
    'Cemas': Wind,
    'Sedih': CloudRain,
    'Lelah': Zap,
    'Sendu': CloudRain,
    'Lega': Heart,
    'Bahagia': Sun,
    'Damai': Heart,
    'Puas': Sun,
    'Segar': Zap,
    'Santai': Heart,
  };

  const MoodIconComponent = moodIconMap[log.mood || log.type] || Heart;

  const timeFormatted = log.timestamp
    ? new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    : '08:30 WIB';

  return (
    <div className="mc-modal-overlay" onClick={onClose}>
      <div className="mc-modal-card mc-detail-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Close Button */}
        <button type="button" className="mc-modal-close-btn" onClick={onClose} title="Tutup Detail">
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="mc-detail-header">
          <div className="mc-detail-header-badge">
            <Calendar size={14} color="#0284c7" />
            <span>Riwayat Check-In</span>
          </div>
          <h2 className="mc-detail-title">{dateDisplay}</h2>
          <p className="mc-detail-subtitle">
            <Clock size={13} color="#64748b" />
            <span>Tercatat pada {timeFormatted} • Berhasil Tersinkronisasi</span>
          </p>
        </div>

        {/* Mood Overview Card Banner */}
        <div className="mc-detail-mood-banner" style={{ backgroundColor: log.color || '#e0f2fe' }}>
          <div className="mc-detail-mood-icon-box">
            <span className="mc-detail-emoji">{log.icon || '😊'}</span>
          </div>
          <div className="mc-detail-mood-info">
            <span className="mc-detail-mood-tag">Suasana Hati Utama</span>
            <h3 className="mc-detail-mood-name">{log.mood || log.type}</h3>
          </div>
          <div className="mc-detail-mood-status">
            <CheckCircle2 size={18} color="#0284c7" />
            <span>Terkunci</span>
          </div>
        </div>

        {/* Intensity Meter */}
        <div className="mc-detail-section">
          <div className="mc-detail-section-header">
            <span className="mc-detail-label">Intensitas Emosi</span>
            <span className="db-badge db-badge-cyan">{getIntensityLabel(log.intensity || 4)}</span>
          </div>
          
          <div className="mc-detail-intensity-bar">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const isActive = lvl <= (log.intensity || 4);
              return (
                <div
                  key={lvl}
                  className={`mc-intensity-segment ${isActive ? 'active' : ''}`}
                />
              );
            })}
          </div>
          <div className="mc-intensity-bar-labels">
            <span>Samar (1)</span>
            <span>Sedang (3)</span>
            <span>Sangat Kuat (5)</span>
          </div>
        </div>

        {/* Factors Section */}
        <div className="mc-detail-section">
          <span className="mc-detail-label">Faktor yang Mempengaruhi Hari Ini:</span>
          <div className="db-chips-group" style={{ marginTop: '8px' }}>
            {log.factors && log.factors.length > 0 ? (
              log.factors.map((factor) => (
                <span key={factor} className="db-chip selected">
                  {factor}
                </span>
              ))
            ) : (
              <span className="db-chip selected">Keluarga • Rumah</span>
            )}
          </div>
        </div>

        {/* Daily Note / Reflection Quote */}
        <div className="mc-detail-note-box">
          <div className="mc-detail-note-header">
            <Sparkles size={16} color="#0284c7" />
            <span>Catatan Refleksi Harian</span>
          </div>
          <p className="mc-detail-note-text">
            {log.note || `"${log.mood || 'Tenang'} hari ini membawa kesadaran akan pentingnya menjaga keseimbangan batin dan melangkah dengan tenang."`}
          </p>
        </div>

        {/* Modal Footer */}
        <div className="mc-detail-footer">
          <button type="button" className="db-btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
            Tutup Riwayat
          </button>
        </div>
      </div>
    </div>
  );
}
