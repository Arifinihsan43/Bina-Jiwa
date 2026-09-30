import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Video, Clock, X, CheckCircle2, AlertCircle, CalendarCheck } from 'lucide-react';
import {
  buildSlots,
  createAppointment,
  formatAppointmentRange,
  getBusySlots,
  hariOf,
  todayWib,
} from '../../service/appointmentService';

const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const MAX_DAYS_AHEAD = 60;

// Tanggal terdekat (mulai hari ini) yang punya jadwal praktik.
function firstPracticeDate(jadwal) {
  const today = todayWib();
  const days = new Set(jadwal.map((s) => s.hari));
  for (let i = 0; i < 14; i += 1) {
    const d = addDays(today, i);
    if (days.has(hariOf(d)) && buildSlots(jadwal, d).length > 0) return d;
  }
  return today;
}

export default function BookingModal({ psychologist, onClose }) {
  const navigate = useNavigate();
  const canOffline = Boolean(psychologist.address);
  const today = todayWib();

  const [mode, setMode] = useState(canOffline ? 'OFFLINE' : 'ONLINE');
  const [date, setDate] = useState(() => firstPracticeDate(psychologist.jadwal));
  const [busy, setBusy] = useState([]);
  const [loadingBusy, setLoadingBusy] = useState(true);
  const [slot, setSlot] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const [busyReload, setBusyReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getBusySlots(psychologist.id, date)
      .then((rows) => {
        if (!cancelled) setBusy(rows);
      })
      .catch(() => {
        // Gagal memuat jam terisi — tetap tampilkan slot; bentrok akan ditolak server.
        if (!cancelled) setBusy([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [psychologist.id, date, busyReload]);

  const slots = useMemo(() => buildSlots(psychologist.jadwal, date, busy), [psychologist.jadwal, date, busy]);

  const handleDateChange = (value) => {
    setDate(value);
    setSlot(null);
    setError('');
    setLoadingBusy(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!slot) return;
    setSubmitting(true);
    setError('');
    try {
      const appointment = await createAppointment({
        psychologistId: psychologist.id,
        date,
        slot,
        type: mode,
        catatan,
      });
      setCreated(appointment);
    } catch (err) {
      setError(err.message);
      if (err.status === 409) {
        setSlot(null);
        setLoadingBusy(true);
        setBusyReload((n) => n + 1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <h3 className="modal-title">Buat Janji Konsultasi</h3>
            <span className="modal-sub">{psychologist.name}</span>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {created ? (
          <div className="booking-success-state">
            <div className="success-icon-circle">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h4 className="success-title">Permintaan Janji Temu Terkirim!</h4>
            <p className="success-sub">
              {formatAppointmentRange(created.tanggal_mulai, created.tanggal_selesai)}.
              <br />
              Status: <b>Menunggu konfirmasi psikolog</b>. Pantau perkembangannya di halaman Janji Temu.
            </p>
            <button
              type="button"
              className="confirm-booking-submit-btn"
              onClick={() => navigate('/janji-temu')}
            >
              <CalendarCheck size={16} /> Lihat Janji Temu Saya
            </button>
          </div>
        ) : psychologist.jadwal.length === 0 ? (
          <div className="booking-form">
            <p className="pp-muted">Psikolog ini belum membuka jadwal praktik. Silakan cek kembali nanti.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-group">
              <label className="form-label">Mode Sesi Konsultasi</label>
              <div className="mode-toggle-group">
                <button
                  type="button"
                  className={`mode-btn ${mode === 'OFFLINE' ? 'active' : ''}`}
                  onClick={() => setMode('OFFLINE')}
                  disabled={!canOffline}
                  title={canOffline ? undefined : 'Psikolog belum mencantumkan alamat praktik'}
                >
                  <MapPin size={15} /> Tatap Muka (Klinik)
                </button>
                <button
                  type="button"
                  className={`mode-btn ${mode === 'ONLINE' ? 'active' : ''}`}
                  onClick={() => setMode('ONLINE')}
                >
                  <Video size={15} /> Online Video Call
                </button>
              </div>
              {mode === 'OFFLINE' && canOffline && (
                <span className="pp-muted">
                  <MapPin size={12} /> {[psychologist.address, psychologist.city].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="booking-date">Pilih Tanggal Sesi</label>
              <input
                id="booking-date"
                type="date"
                className="form-input-date"
                value={date}
                min={today}
                max={addDays(today, MAX_DAYS_AHEAD)}
                onChange={(e) => e.target.value && handleDateChange(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pilih Jam (WIB, sesi 60 menit)</label>
              <div className="slot-chips-group">
                {loadingBusy ? (
                  <span className="pp-muted">Memeriksa jam yang tersedia…</span>
                ) : slots.length === 0 ? (
                  <span className="pp-muted">Tidak ada jam tersedia di tanggal ini. Coba tanggal lain.</span>
                ) : (
                  slots.map((s) => (
                    <button
                      key={s.start}
                      type="button"
                      className={`slot-chip-btn ${slot?.start === s.start ? 'active' : ''}`}
                      onClick={() => setSlot(s)}
                    >
                      <Clock size={13} /> {s.start.replace(':', '.')}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="booking-note">Ceritakan singkat keluhan Anda (opsional)</label>
              <textarea
                id="booking-note"
                className="pp-input pp-textarea"
                rows={3}
                maxLength={1000}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Sulit tidur dan sering cemas menjelang presentasi kerja."
              />
            </div>

            {error && (
              <div className="auth-error-alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="confirm-booking-submit-btn" disabled={!slot || submitting}>
              {submitting ? 'Mengirim…' : 'Kirim Permintaan Janji Temu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
