import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Pencil, Send, Ban, CheckCircle2, Users, UserCheck, Mail, Undo2 } from 'lucide-react';
import { formatEventShort, formatEventTime } from '../../service/eventService';
import { adminListEventParticipants, adminSetAttendance, adminUpdateEvent } from '../../service/adminService';

const STATUS_LABEL = { DRAFT: 'Draf', PUBLISHED: 'Dipublikasikan', CANCELLED: 'Dibatalkan', COMPLETED: 'Selesai' };
const PARTICIPANT_LABEL = { REGISTERED: 'Terdaftar', ATTENDED: 'Hadir', CANCELLED: 'Batal' };

/**
 * Admin: status event, daftar peserta (dengan email), dan absensi.
 * onError(err) → true bila error sudah ditangani (mis. kode akses ditolak).
 */
export default function ManageEventModal({ event, now, onClose, onEdit, onChange, onError }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const started = new Date(event.tanggal_mulai).getTime() <= now;
  const editable = event.status === 'DRAFT' || event.status === 'PUBLISHED';

  useEffect(() => {
    let cancelled = false;
    adminListEventParticipants(event.id_event)
      .then((rows) => !cancelled && setParticipants(rows))
      .catch((err) => !cancelled && !onError?.(err) && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [event.id_event, onError]);

  const changeStatus = async (status) => {
    setBusy('status');
    setError('');
    try {
      onChange(await adminUpdateEvent(event.id_event, { status }));
      setConfirmCancel(false);
    } catch (err) {
      if (!onError?.(err)) setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const toggleAttendance = async (p) => {
    setBusy(p.id_user);
    setError('');
    try {
      const updated = await adminSetAttendance(event.id_event, p.id_user, p.status !== 'ATTENDED');
      setParticipants((prev) => prev.map((x) => (x.id_user === updated.id_user ? updated : x)));
    } catch (err) {
      if (!onError?.(err)) setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const active = participants.filter((p) => p.status !== 'CANCELLED');
  const attended = participants.filter((p) => p.status === 'ATTENDED').length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card event-form-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <h3 className="modal-title">Kelola Event</h3>
            <span className="modal-sub">{event.judul}</span>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className="event-modal-summary">
          <div className="summary-row">
            <span>Status</span>
            <span className={`event-status-pill status-${event.status.toLowerCase()}`}>{STATUS_LABEL[event.status]}</span>
          </div>
          <div className="summary-row">
            <span>Jadwal</span>
            <span className="font-bold text-slate-800">
              {formatEventShort(event.tanggal_mulai)} ({formatEventTime(event.tanggal_mulai, event.tanggal_selesai)})
            </span>
          </div>
          <div className="summary-row">
            <span>Peserta</span>
            <span className="font-bold text-slate-800">
              {active.length}{event.kapasitas ? `/${event.kapasitas}` : ''} terdaftar • {attended} hadir
            </span>
          </div>
        </div>

        {editable && (
          <div className="event-manage-actions">
            <button type="button" className="event-action-btn btn-outline" onClick={onEdit}>
              <Pencil size={14} /> Ubah Detail
            </button>
            {event.status === 'PUBLISHED' && !started && (
              <button type="button" className="event-action-btn btn-outline" disabled={busy === 'status'} onClick={() => changeStatus('DRAFT')}>
                <Undo2 size={14} /> Tarik ke Draf
              </button>
            )}
            {event.status === 'DRAFT' && (
              <button type="button" className="event-action-btn btn-primary" disabled={busy === 'status'} onClick={() => changeStatus('PUBLISHED')}>
                <Send size={14} /> Publikasikan
              </button>
            )}
            {event.status === 'PUBLISHED' && started && (
              <button type="button" className="event-action-btn btn-primary" disabled={busy === 'status'} onClick={() => changeStatus('COMPLETED')}>
                <CheckCircle2 size={14} /> Tandai Selesai
              </button>
            )}
            {confirmCancel ? (
              <span className="event-cancel-inline">
                Batalkan event untuk semua peserta?
                <button type="button" className="event-action-btn btn-dark" disabled={busy === 'status'} onClick={() => changeStatus('CANCELLED')}>Ya</button>
                <button type="button" className="event-action-btn btn-outline" onClick={() => setConfirmCancel(false)}>Tidak</button>
              </span>
            ) : (
              <button type="button" className="event-text-btn danger" onClick={() => setConfirmCancel(true)}>
                <Ban size={14} /> Batalkan Event
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="auth-error-alert" style={{ marginBottom: 0 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="event-participants">
          <h4><Users size={15} /> Daftar Peserta</h4>
          {loading ? (
            <p className="pp-muted">Memuat peserta…</p>
          ) : participants.length === 0 ? (
            <p className="pp-muted">Belum ada peserta yang mendaftar.</p>
          ) : (
            <ul>
              {participants.map((p) => (
                <li key={p.id_user} className={p.status === 'CANCELLED' ? 'cancelled' : ''}>
                  <span className="participant-name">
                    {p.nama_lengkap}
                    {p.email && <a href={`mailto:${p.email}`} className="participant-email">{p.email}</a>}
                  </span>
                  <span className={`participant-status ${p.status.toLowerCase()}`}>{PARTICIPANT_LABEL[p.status]}</span>
                  {p.status !== 'CANCELLED' && started && event.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      className="event-text-btn"
                      disabled={busy === p.id_user}
                      onClick={() => toggleAttendance(p)}
                    >
                      <UserCheck size={14} /> {p.status === 'ATTENDED' ? 'Batal hadir' : 'Tandai hadir'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {active.length > 0 && (
            <a
              className="event-action-btn btn-outline participant-mail-all"
              href={`mailto:?bcc=${active.map((p) => p.email).filter(Boolean).join(',')}&subject=${encodeURIComponent(`Info sesi: ${event.judul}`)}`}
            >
              <Mail size={14} /> Email semua peserta aktif
            </a>
          )}
          {!started && participants.length > 0 && (
            <p className="form-hint">Kehadiran bisa ditandai setelah event dimulai.</p>
          )}
        </div>
      </div>
    </div>
  );
}
