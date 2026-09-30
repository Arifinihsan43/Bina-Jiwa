import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/dashboard';
import '../styles/janji-temu.css';
import {
  Clock,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  X,
  Check,
  Search,
  Link2,
  CalendarX,
  RefreshCw,
} from 'lucide-react';
import {
  formatAppointmentRange,
  listMyAppointments,
  updateAppointment,
} from '../service/appointmentService';

const STATUS_META = {
  PENDING: { cls: 'menunggu', label: 'Menunggu konfirmasi' },
  CONFIRMED: { cls: 'dikonfirmasi', label: 'Dikonfirmasi' },
  COMPLETED: { cls: 'selesai', label: 'Selesai' },
  CANCELLED: { cls: 'dibatalkan', label: 'Dibatalkan' },
};

const TABS = [
  { id: 'ALL', label: 'Semua' },
  { id: 'PENDING', label: 'Menunggu Konfirmasi' },
  { id: 'CONFIRMED', label: 'Dikonfirmasi' },
  { id: 'COMPLETED', label: 'Selesai' },
  { id: 'CANCELLED', label: 'Dibatalkan' },
];

const initialsOf = (name = '') =>
  name
    .split(',')[0]
    .split(/\s+/)
    .filter((w) => w && !w.endsWith('.'))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

function AppointmentCard({ apt, userId, now, busy, onUpdate }) {
  const navigate = useNavigate();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [editingLink, setEditingLink] = useState(false);
  const [linkValue, setLinkValue] = useState('');

  const asClient = apt.id_user === userId;
  const counterpart = asClient
    ? { name: apt.psikolog?.nama_profesional || 'Psikolog', role: 'Psikolog' }
    : { name: apt.klien?.nama_lengkap || 'Klien', role: 'Klien' };
  const status = STATUS_META[apt.status];
  const isUpcoming = new Date(apt.tanggal_selesai).getTime() > now;
  const hasStarted = new Date(apt.tanggal_mulai).getTime() <= now;
  const isActive = apt.status === 'PENDING' || apt.status === 'CONFIRMED';

  const submitLink = (e) => {
    e.preventDefault();
    if (!linkValue.trim()) return;
    onUpdate(apt, { lokasi: linkValue.trim() }).then((ok) => ok && setEditingLink(false));
  };

  return (
    <div className="jt-card">
      <div className="jt-card-header">
        <div className="jt-doctor-group">
          <div className="jt-avatar-initials">{initialsOf(counterpart.name)}</div>
          <div>
            <span className="jt-doctor-name">{counterpart.name}</span>
            <span className="jt-doctor-title">{counterpart.role}</span>
          </div>
        </div>
        <div className={`jt-status-badge ${status.cls}`}>
          <span className="jt-status-dot"></span>
          <span>{status.label}</span>
        </div>
      </div>

      <div className="jt-card-meta">
        <div className="jt-meta-row">
          <Clock size={16} className="jt-meta-icon" />
          <span>{formatAppointmentRange(apt.tanggal_mulai, apt.tanggal_selesai)}</span>
        </div>
        <div className="jt-mode-row">
          <span className={`jt-mode-badge ${apt.type === 'ONLINE' ? 'online' : 'offline'}`}>
            {apt.type === 'ONLINE' ? '• ONLINE' : 'OFFLINE'}
          </span>
          {/^https?:\/\//i.test(apt.lokasi || '') ? (
            <a className="jt-venue-text jt-venue-link" href={apt.lokasi} target="_blank" rel="noopener noreferrer">
              {apt.lokasi}
            </a>
          ) : (
            <span className="jt-venue-text">{apt.lokasi}</span>
          )}
        </div>
      </div>

      {apt.catatan && (
        <div className="jt-notes-box">
          <MessageSquare size={16} className="jt-notes-icon" />
          <span>Catatan{asClient ? ' Anda' : ' klien'}: "{apt.catatan}"</span>
        </div>
      )}

      {apt.status === 'CANCELLED' && asClient && (
        <div className="jt-cancel-alert">
          <div className="jt-cancel-info">
            <AlertCircle size={15} />
            <span>Janji temu ini dibatalkan.</span>
          </div>
          <button type="button" className="jt-replace-btn" onClick={() => navigate('/psikolog')}>
            <Search size={14} /> Cari Jadwal Lain
          </button>
        </div>
      )}

      {editingLink && (
        <form className="jt-link-form" onSubmit={submitLink}>
          <input
            type="url"
            className="jt-link-input"
            placeholder="https://meet.google.com/..."
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            autoFocus
            required
          />
          <button type="submit" className="jt-btn-outline" disabled={busy}>Simpan</button>
          <button type="button" className="jt-btn-cancel" onClick={() => setEditingLink(false)}>Batal</button>
        </form>
      )}

      {/* Aksi pemesan */}
      {asClient && isActive && isUpcoming && (
        <div className="jt-actions-row">
          <div className="jt-actions-left">
            {apt.status === 'CONFIRMED' && !confirmCancel && (
              <button
                type="button"
                className="jt-btn-outline"
                onClick={() => navigate(`/pesan?psikolog=${apt.id_psychologist}&klien=${apt.id_user}`)}
              >
                <MessageSquare size={14} /> Kirim Pesan
              </button>
            )}
            {confirmCancel ? (
              <>
                <span className="jt-confirm-text">Batalkan janji temu ini?</span>
                <button
                  type="button"
                  className="jt-btn-cancel"
                  disabled={busy}
                  onClick={() => onUpdate(apt, { status: 'CANCELLED' })}
                >
                  <X size={15} /> Ya, Batalkan
                </button>
                <button type="button" className="jt-btn-outline" onClick={() => setConfirmCancel(false)}>
                  Tidak
                </button>
              </>
            ) : (
              <button type="button" className="jt-btn-cancel" onClick={() => setConfirmCancel(true)}>
                <X size={15} /> Batalkan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Aksi psikolog */}
      {!asClient && apt.status === 'PENDING' && (
        <div className="jt-actions-row">
          <div className="jt-actions-left">
            <button
              type="button"
              className="jt-btn-confirm"
              disabled={busy}
              onClick={() => onUpdate(apt, { status: 'CONFIRMED' })}
            >
              <Check size={15} /> Konfirmasi
            </button>
            <button
              type="button"
              className="jt-btn-cancel"
              disabled={busy}
              onClick={() => onUpdate(apt, { status: 'CANCELLED' })}
            >
              <X size={15} /> Tolak
            </button>
          </div>
        </div>
      )}

      {!asClient && apt.status === 'CONFIRMED' && (
        <div className="jt-actions-row">
          <div className="jt-actions-left">
            {hasStarted && (
              <button
                type="button"
                className="jt-btn-confirm"
                disabled={busy}
                onClick={() => onUpdate(apt, { status: 'COMPLETED' })}
              >
                <CheckCircle2 size={15} /> Tandai Selesai
              </button>
            )}
            <button
              type="button"
              className="jt-btn-outline"
              onClick={() => navigate(`/pesan?psikolog=${apt.id_psychologist}&klien=${apt.id_user}`)}
            >
              <MessageSquare size={14} /> Kirim Pesan
            </button>
            {apt.type === 'ONLINE' && !editingLink && (
              <button
                type="button"
                className="jt-btn-outline"
                onClick={() => {
                  setLinkValue(/^https?:\/\//i.test(apt.lokasi || '') ? apt.lokasi : '');
                  setEditingLink(true);
                }}
              >
                <Link2 size={14} /> Atur Tautan Sesi
              </button>
            )}
            {confirmCancel ? (
              <>
                <span className="jt-confirm-text">Batalkan sesi ini?</span>
                <button
                  type="button"
                  className="jt-btn-cancel"
                  disabled={busy}
                  onClick={() => onUpdate(apt, { status: 'CANCELLED' })}
                >
                  Ya, Batalkan
                </button>
                <button type="button" className="jt-btn-outline" onClick={() => setConfirmCancel(false)}>
                  Tidak
                </button>
              </>
            ) : (
              <button type="button" className="jt-btn-cancel" onClick={() => setConfirmCancel(true)}>
                <X size={15} /> Batalkan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JanjiTemuPage({ user }) {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [busyId, setBusyId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    listMyAppointments()
      .then((rows) => {
        if (!cancelled) {
          setAppointments(rows);
          setNow(Date.now());
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const counts = useMemo(() => {
    const c = { ALL: appointments.length, PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
    appointments.forEach((a) => { c[a.status] += 1; });
    return c;
  }, [appointments]);

  // Yang akan datang lebih dulu (terdekat), lalu riwayat (terbaru).
  const visible = useMemo(() => {
    const rows = appointments.filter((a) => activeTab === 'ALL' || a.status === activeTab);
    const upcoming = rows
      .filter((a) => new Date(a.tanggal_selesai).getTime() > now)
      .sort((a, b) => new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai));
    const past = rows
      .filter((a) => new Date(a.tanggal_selesai).getTime() <= now)
      .sort((a, b) => new Date(b.tanggal_mulai) - new Date(a.tanggal_mulai));
    return [...upcoming, ...past];
  }, [appointments, activeTab, now]);

  const handleUpdate = async (apt, patch) => {
    setBusyId(apt.id_appointment);
    setError('');
    try {
      const updated = await updateAppointment(apt.id_appointment, patch);
      setAppointments((prev) => prev.map((a) => (a.id_appointment === updated.id_appointment ? updated : a)));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="db-main-content">
      <DashboardHeader />

      <div className="db-scrollable-body">
        <div className="jt-container">
          <div className="jt-filter-bar">
            <div className="jt-filter-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`jt-tab-btn ${tab.id === 'CANCELLED' ? 'tab-dibatalkan' : ''} ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label} <span className="jt-tab-count">{counts[tab.id]}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="jt-period-btn"
              onClick={() => {
                setLoading(true);
                setReloadKey((k) => k + 1);
              }}
            >
              <RefreshCw size={16} />
              <span>Muat Ulang</span>
            </button>
          </div>

          {error && (
            <div className="auth-error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="jt-list">
            {loading ? (
              <div className="jt-empty">Memuat janji temu…</div>
            ) : visible.length === 0 ? (
              <div className="jt-empty">
                <CalendarX size={32} />
                <strong>
                  {appointments.length === 0 ? 'Belum ada janji temu' : 'Tidak ada janji temu di kategori ini'}
                </strong>
                {appointments.length === 0 && user?.role !== 'doctor' && (
                  <>
                    <span>Temukan psikolog yang cocok lalu buat janji konsultasi pertama Anda.</span>
                    <button type="button" className="jt-btn-confirm" onClick={() => navigate('/psikolog')}>
                      <Search size={15} /> Cari Psikolog
                    </button>
                  </>
                )}
                {appointments.length === 0 && user?.role === 'doctor' && (
                  <span>Permintaan janji temu dari klien akan muncul di sini.</span>
                )}
              </div>
            ) : (
              visible.map((apt) => (
                <AppointmentCard
                  key={apt.id_appointment}
                  apt={apt}
                  userId={user?.id}
                  now={now}
                  busy={busyId === apt.id_appointment}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
