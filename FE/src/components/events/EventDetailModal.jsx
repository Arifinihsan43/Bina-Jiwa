import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, Clock, Video, MapPin, Users, ExternalLink, AlertCircle, Ticket } from 'lucide-react';
import {
  cancelRegistration,
  formatDuration,
  formatEventDay,
  formatEventShort,
  formatEventTime,
  formatPrice,
  getEvent,
  isFree,
  registerEvent,
} from '../../service/eventService';
import PaymentPanel from '../payment/PaymentPanel';

const isHttp = (url) => /^https?:\/\//i.test(url || '');

/**
 * Detail event + pendaftaran / pembatalan.
 * onChange(updatedEvent) dipanggil setelah daftar atau batal.
 */
export default function EventDetailModal({ event, user, now, onClose, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [justRegistered, setJustRegistered] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [paying, setPaying] = useState(false);
  const paidEvent = !isFree(event);

  const registered = ['REGISTERED', 'ATTENDED'].includes(event.status_pendaftaran_saya);
  const started = new Date(event.tanggal_mulai).getTime() <= now;
  const deadline = event.batas_pendaftaran || event.tanggal_mulai;

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      const updated = await fn();
      onChange(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    // Event berbayar: peserta terdaftar otomatis setelah pembayaran lunas.
    if (paidEvent) {
      setError('');
      setPaying(true);
      return;
    }
    const updated = await run(() => registerEvent(event.id_event));
    if (updated) setJustRegistered(true);
  };

  const handlePaid = async () => {
    const updated = await run(() => getEvent(event.id_event));
    setPaying(false);
    if (updated) setJustRegistered(true);
  };

  const handleCancel = async () => {
    const updated = await run(() => cancelRegistration(event.id_event));
    if (updated) setConfirmCancel(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card event-detail-modal pay-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <h3 className="modal-title">
              {registered ? 'Tiket Event Kamu' : paying ? 'Pembayaran Tiket Event' : 'Pendaftaran Sesi Workshop'}
            </h3>
            <span className="modal-sub">{event.judul}</span>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {justRegistered && (
          <div className="booking-success-state compact">
            <div className="success-icon-circle">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>
            <h4 className="success-title">{paidEvent ? 'Pembayaran Berhasil, Kamu Terdaftar!' : 'Pendaftaran Berhasil!'}</h4>
            <p className="success-sub">Detail akses sesi ada di bawah. Kamu juga bisa melihatnya kapan saja di tab “Sesi Terdaftar Saya”.</p>
          </div>
        )}

        {paying ? (
          <>
            <PaymentPanel
              target={{ jenis: 'EVENT', id_event: event.id_event }}
              itemLabel="Harga tiket"
              onPaid={handlePaid}
            />
            <button type="button" className="event-text-btn" onClick={() => setPaying(false)}>
              Kembali ke detail event
            </button>
          </>
        ) : (
        <>
        <div className="event-modal-summary">
          <div className="summary-row">
            <span><Calendar size={13} /> Tanggal</span>
            <span className="font-bold text-slate-800">{formatEventDay(event.tanggal_mulai)}</span>
          </div>
          <div className="summary-row">
            <span><Clock size={13} /> Waktu</span>
            <span className="font-bold text-slate-800">
              {formatEventTime(event.tanggal_mulai, event.tanggal_selesai)} ({formatDuration(event.tanggal_mulai, event.tanggal_selesai)})
            </span>
          </div>
          <div className="summary-row">
            <span>{event.type === 'ONLINE' ? <Video size={13} /> : <MapPin size={13} />} Format</span>
            <span className="font-bold text-slate-800">
              {event.type === 'ONLINE' ? 'Online' : event.lokasi || 'Tatap muka'}
            </span>
          </div>
          <div className="summary-row">
            <span><Users size={13} /> Kuota</span>
            <span className="font-bold text-slate-800">
              {event.kapasitas ? `${event.jumlah_peserta}/${event.kapasitas} terisi` : `${event.jumlah_peserta} peserta`}
            </span>
          </div>
          <div className="summary-row">
            <span><Ticket size={13} /> Biaya</span>
            <span className="font-bold text-sky-600">{formatPrice(event.harga)}</span>
          </div>
          {!registered && event.pendaftaran_dibuka && (
            <div className="summary-row">
              <span>Pendaftaran ditutup</span>
              <span className="font-bold text-slate-800">{formatEventShort(deadline)}</span>
            </div>
          )}
        </div>

        {event.deskripsi && <p className="event-modal-desc">{event.deskripsi}</p>}

        {registered && (
          <div className="event-access-box">
            <strong>Akses Sesi</strong>
            {event.type === 'ONLINE' ? (
              isHttp(event.link_meeting) ? (
                <a href={event.link_meeting} target="_blank" rel="noopener noreferrer" className="event-access-link">
                  <Video size={15} /> Buka tautan meeting <ExternalLink size={13} />
                </a>
              ) : (
                <span>Tautan meeting akan dibagikan penyelenggara sebelum sesi dimulai. Cek kembali halaman ini.</span>
              )
            ) : (
              <span><MapPin size={14} /> {event.lokasi}</span>
            )}
            {paidEvent && (
              <span className="event-access-note">Tiket berbayar: pembayaran {formatPrice(event.harga)} sudah lunas.</span>
            )}
          </div>
        )}

        {error && (
          <div className="auth-error-alert" style={{ marginBottom: 0 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {registered ? (
          event.status_pendaftaran_saya === 'REGISTERED' && !started && event.status === 'PUBLISHED' && (
            confirmCancel ? (
              <div className="event-cancel-confirm">
                <span>
                  Batalkan pendaftaran? Kursimu akan diberikan ke peserta lain.
                  {paidEvent && ' Pembayaranmu akan dikembalikan (simulasi).'}
                </span>
                <div>
                  <button type="button" className="event-action-btn btn-dark" onClick={handleCancel} disabled={busy}>
                    {busy ? 'Membatalkan…' : 'Ya, Batalkan'}
                  </button>
                  <button type="button" className="event-action-btn btn-outline" onClick={() => setConfirmCancel(false)}>
                    Tidak
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="event-text-btn" onClick={() => setConfirmCancel(true)}>
                Batalkan pendaftaran
              </button>
            )
          )
        ) : event.pendaftaran_dibuka ? (
          <form onSubmit={handleRegister} className="registration-form">
            <div className="form-group">
              <label className="form-label" htmlFor="evt-name">Nama Peserta</label>
              <input id="evt-name" type="text" className="form-input-text" value={user?.name || ''} readOnly />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="evt-email">Email Akun</label>
              <input id="evt-email" type="email" className="form-input-text" value={user?.email || ''} readOnly />
              <span className="form-hint">Data diambil dari akun Bina Jiwa kamu dan hanya dibagikan ke penyelenggara.</span>
            </div>
            <button type="submit" className="confirm-booking-submit-btn" disabled={busy}>
              {busy
                ? 'Mendaftarkan…'
                : paidEvent
                  ? `Lanjut ke Pembayaran (${formatPrice(event.harga)})`
                  : 'Konfirmasi Pendaftaran'}
            </button>
          </form>
        ) : (
          <p className="event-closed-note">
            {event.status === 'CANCELLED'
              ? 'Event ini dibatalkan oleh penyelenggara.'
              : event.sisa_kursi === 0
                ? 'Kursi untuk event ini sudah penuh.'
                : 'Pendaftaran untuk event ini sudah ditutup.'}
          </p>
        )}
        </>
        )}
      </div>
    </div>
  );
}
