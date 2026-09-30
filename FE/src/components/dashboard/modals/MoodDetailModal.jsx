import React from 'react';
import { X, Calendar, CheckCircle2, Clock, Sparkles, BookOpen } from 'lucide-react';
import { intensityLabel, formatWibTime } from '../../../service/moodService';

const dateLabelFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC', // dateKey sudah tanggal WIB; jangan digeser lagi
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Detail check-in satu hari + refleksi yang ditulis di hari yang sama.
 * - log: log mood hari tsb
 * - reflections: jurnal di hari tsb (boleh kosong)
 */
export default function MoodDetailModal({ log, reflections = [], onClose }) {
  if (!log) return null;

  const dateDisplay = dateLabelFmt.format(new Date(`${log.dateKey}T00:00:00Z`));

  return (
    <div className="mc-modal-overlay" onClick={onClose}>
      <div className="mc-modal-card mc-detail-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mc-modal-close-btn" onClick={onClose} title="Tutup Detail">
          <X size={18} />
        </button>

        <div className="mc-detail-header">
          <div className="mc-detail-header-badge">
            <Calendar size={14} color="#0284c7" />
            <span>Riwayat Check-In</span>
          </div>
          <h2 className="mc-detail-title">{dateDisplay}</h2>
          <p className="mc-detail-subtitle">
            <Clock size={13} color="#64748b" />
            <span>Tercatat pada {formatWibTime(log.timestamp)}</span>
          </p>
        </div>

        <div className="mc-detail-mood-banner" style={{ backgroundColor: log.color }}>
          <div className="mc-detail-mood-icon-box">
            <span className="mc-detail-emoji">{log.icon}</span>
          </div>
          <div className="mc-detail-mood-info">
            <span className="mc-detail-mood-tag">Suasana Hati Utama</span>
            <h3 className="mc-detail-mood-name">{log.mood}</h3>
          </div>
          <div className="mc-detail-mood-status">
            <CheckCircle2 size={18} color="#0284c7" />
            <span>Terkunci</span>
          </div>
        </div>

        <div className="mc-detail-section">
          <div className="mc-detail-section-header">
            <span className="mc-detail-label">Intensitas Emosi</span>
            <span className="db-badge db-badge-cyan">{intensityLabel(log.intensity)}</span>
          </div>
          <div className="mc-detail-intensity-bar">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <div key={lvl} className={`mc-intensity-segment ${lvl <= log.intensity ? 'active' : ''}`} />
            ))}
          </div>
          <div className="mc-intensity-bar-labels">
            <span>Samar (1)</span>
            <span>Sedang (3)</span>
            <span>Sangat Kuat (5)</span>
          </div>
        </div>

        <div className="mc-detail-section">
          <span className="mc-detail-label">Faktor yang Mempengaruhi Hari Ini:</span>
          <div className="db-chips-group" style={{ marginTop: '8px' }}>
            {log.factors.length > 0 ? (
              log.factors.map((factor) => (
                <span key={factor} className="db-chip selected">{factor}</span>
              ))
            ) : (
              <span className="mc-detail-empty">Tidak ada faktor yang dipilih.</span>
            )}
          </div>
        </div>

        {log.note && (
          <div className="mc-detail-note-box">
            <div className="mc-detail-note-header">
              <Sparkles size={16} color="#0284c7" />
              <span>Catatan Check-in</span>
            </div>
            <p className="mc-detail-note-text">{log.note}</p>
          </div>
        )}

        {reflections.map((r) => (
          <div key={r.id_journal} className="mc-detail-note-box">
            <div className="mc-detail-note-header">
              <BookOpen size={16} color="#0284c7" />
              <span>Refleksi • {formatWibTime(r.created_at)}</span>
            </div>
            <p className="mc-detail-note-question">{r.judul}</p>
            <p className="mc-detail-note-text">{r.isi}</p>
          </div>
        ))}

        <div className="mc-detail-footer">
          <button type="button" className="db-btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center' }}>
            Tutup Riwayat
          </button>
        </div>
      </div>
    </div>
  );
}
