import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BinaJiwaLogo from '../components/common/BinaJiwaLogo';
import '../styles/psikolog.css';
import '../styles/profil-psikolog.css';
import '../styles/admin-verifikasi.css';
import {
  ShieldCheck,
  ShieldX,
  Clock,
  FileText,
  MapPin,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Inbox,
  Search,
  ArrowLeft,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { splitSpecializations, safeExternalUrl } from '../service/psychologistService';
import {
  adminKeyStore,
  checkAdminKey,
  adminListPsychologists,
  verifyPsychologist,
} from '../service/adminService';
import { ApiError } from '../service/apiClient';

const TABS = [
  { id: 'PENDING', label: 'Menunggu', icon: Clock },
  { id: 'VERIFIED', label: 'Disetujui', icon: ShieldCheck },
  { id: 'REJECTED', label: 'Ditolak', icon: ShieldX },
];

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function RejectModal({ psychologist, onClose, onConfirm, busy }) {
  const [reason, setReason] = useState(psychologist.catatan_verifikasi || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Tuliskan alasan penolakan agar psikolog tahu apa yang perlu diperbaiki.');
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <h3 className="modal-title">Tolak Verifikasi</h3>
            <span className="modal-sub">{psychologist.nama_profesional}</span>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          <label className="pp-field">
            <span className="pp-label">Alasan penolakan (ditampilkan ke psikolog)</span>
            <textarea
              className="pp-input pp-textarea"
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Contoh: Nomor SIPP tidak ditemukan di database HIMPSI. Mohon unggah ulang dokumen SIPP yang masih berlaku."
              maxLength={1000}
              autoFocus
            />
          </label>

          {error && (
            <div className="auth-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="av-modal-actions">
            <button type="button" className="pp-btn-secondary" onClick={onClose} disabled={busy}>
              Batal
            </button>
            <button type="submit" className="av-btn-reject" disabled={busy}>
              <ShieldX size={16} />
              <span>{busy ? 'Menyimpan…' : 'Tolak Verifikasi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PsychologistReviewCard({ p, busy, onApprove, onReject }) {
  const tags = splitSpecializations(p.spesialisasi);
  const docUrl = safeExternalUrl(p.dokumen_verifikasi_url);

  return (
    <article className="av-card">
      <div className="av-card-main">
        <div className="av-card-head">
          <div>
            <h3 className="av-name">{p.nama_profesional}</h3>
            {(p.alamat_praktik || p.kota) && (
              <p className="av-location">
                <MapPin size={13} />
                {[p.alamat_praktik, p.kota].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <span className="av-date">Diperbarui {formatDate(p.updated_at)}</span>
        </div>

        {tags.length > 0 && (
          <div className="specialization-tags-group">
            {tags.map((t) => (
              <span key={t} className="spec-tag">{t}</span>
            ))}
          </div>
        )}

        <dl className="av-license-grid">
          <div>
            <dt>No. HIMPSI</dt>
            <dd>{p.nomor_himpsi || <em>Tidak diisi</em>}</dd>
          </div>
          <div>
            <dt>No. SIPP</dt>
            <dd>{p.nomor_sipp || <em>Tidak diisi</em>}</dd>
          </div>
          <div>
            <dt>Dokumen</dt>
            <dd>
              {docUrl ? (
                <a href={docUrl} target="_blank" rel="noopener noreferrer" className="av-doc-link">
                  <FileText size={14} />
                  Buka dokumen
                </a>
              ) : p.dokumen_verifikasi_url ? (
                <em>Link tidak valid</em>
              ) : (
                <em>Tidak dilampirkan</em>
              )}
            </dd>
          </div>
        </dl>

        {p.bio && <p className="av-bio">{p.bio}</p>}

        {p.verification_status === 'REJECTED' && p.catatan_verifikasi && (
          <div className="pp-banner pp-banner-danger pp-banner-compact">
            <AlertCircle size={16} />
            <span><b>Alasan ditolak:</b> {p.catatan_verifikasi}</span>
          </div>
        )}
      </div>

      <div className="av-card-actions">
        {p.verification_status !== 'VERIFIED' && (
          <button type="button" className="av-btn-approve" onClick={() => onApprove(p)} disabled={busy}>
            <ShieldCheck size={16} />
            <span>Setujui</span>
          </button>
        )}
        {p.verification_status !== 'REJECTED' && (
          <button type="button" className="av-btn-reject-outline" onClick={() => onReject(p)} disabled={busy}>
            <ShieldX size={16} />
            <span>{p.verification_status === 'VERIFIED' ? 'Cabut Verifikasi' : 'Tolak'}</span>
          </button>
        )}
      </div>
    </article>
  );
}

function AdminTopNav({ onLock }) {
  return (
    <header className="auth-page-nav av-page-nav">
      <Link to="/" className="auth-back-btn">
        <ArrowLeft size={18} />
        <span>Kembali ke Beranda</span>
      </Link>

      <div className="av-nav-right">
        {onLock && (
          <button type="button" className="auth-back-btn" onClick={onLock}>
            <LogOut size={16} />
            <span>Kunci Panel</span>
          </button>
        )}
        <Link to="/" className="nav-brand">
          <div className="brand-icon">
            <BinaJiwaLogo size={22} color="#ffffff" />
          </div>
          <span className="brand-name">Bina Jiwa</span>
        </Link>
      </div>
    </header>
  );
}

function AccessGate({ onUnlock }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    setChecking(true);
    setError('');
    try {
      await checkAdminKey(key.trim());
      adminKeyStore.set(key.trim());
      onUnlock();
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="av-gate-wrapper">
      <form className="pp-card av-gate-card" onSubmit={handleSubmit}>
        <div className="av-gate-icon">
          <KeyRound size={26} />
        </div>
        <h1 className="av-gate-title">Panel Admin Bina Jiwa</h1>
        <p className="pp-card-sub">Masukkan kode akses admin untuk meninjau verifikasi psikolog.</p>

        <input
          type="password"
          className="pp-input"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setError('');
          }}
          placeholder="Kode akses admin"
          autoComplete="current-password"
          autoFocus
        />

        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="pp-btn-primary" disabled={checking || !key.trim()}>
          <ShieldCheck size={17} />
          <span>{checking ? 'Memeriksa…' : 'Masuk Panel Admin'}</span>
        </button>
      </form>
    </div>
  );
}

export default function AdminVerifikasiPage() {
  const [unlocked, setUnlocked] = useState(() => Boolean(adminKeyStore.get()));
  const [psychologists, setPsychologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const lock = () => {
    adminKeyStore.clear();
    setUnlocked(false);
    setPsychologists([]);
    setRejectTarget(null);
  };

  // Kode akses diganti / dihapus di backend -> kembali ke form kode akses.
  const handleError = (err) => {
    if (err instanceof ApiError && err.status === 401) {
      lock();
      return;
    }
    setError(err.message);
  };

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    adminListPsychologists()
      .then((rows) => {
        if (!cancelled) {
          setPsychologists(rows);
          setError('');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          adminKeyStore.clear();
          setUnlocked(false);
        } else {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [unlocked, reloadKey]);

  const counts = useMemo(() => {
    const c = { PENDING: 0, VERIFIED: 0, REJECTED: 0 };
    psychologists.forEach((p) => { c[p.verification_status] += 1; });
    return c;
  }, [psychologists]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return psychologists.filter((p) => {
      if (p.verification_status !== activeTab) return false;
      if (!q) return true;
      return [p.nama_profesional, p.kota, p.nomor_himpsi, p.nomor_sipp, p.spesialisasi]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [psychologists, activeTab, search]);

  const applyUpdate = (updated) => {
    setPsychologists((prev) => prev.map((p) => (p.id_psychologist === updated.id_psychologist ? updated : p)));
  };

  const handleApprove = async (p) => {
    setBusyId(p.id_psychologist);
    setError('');
    try {
      applyUpdate(await verifyPsychologist(p.id_psychologist, 'VERIFIED'));
      setToast(`${p.nama_profesional} disetujui dan kini tampil di Cari Psikolog.`);
    } catch (err) {
      handleError(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (reason) => {
    const p = rejectTarget;
    setBusyId(p.id_psychologist);
    setError('');
    try {
      applyUpdate(await verifyPsychologist(p.id_psychologist, 'REJECTED', reason));
      setToast(`Verifikasi ${p.nama_profesional} ditolak.`);
      setRejectTarget(null);
    } catch (err) {
      handleError(err);
    } finally {
      setBusyId(null);
    }
  };

  if (!unlocked) {
    return (
      <div className="av-page">
        <AdminTopNav />
        <AccessGate
          onUnlock={() => {
            setLoading(true);
            setUnlocked(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="av-page">
      <AdminTopNav onLock={lock} />

      <div className="av-page-content">
        <div className="psikolog-content-wrapper">
          <div className="psikolog-hero-section">
            <div className="psikolog-hero-left">
              <div className="psikolog-safe-badge">
                <ShieldCheck size={14} />
                <span>PANEL ADMIN</span>
              </div>
              <h1 className="psikolog-hero-title">Verifikasi Psikolog</h1>
              <p className="psikolog-hero-sub">
                Periksa nomor HIMPSI, SIPP, dan dokumen sebelum menyetujui. Hanya psikolog yang disetujui
                yang tampil di halaman Cari Psikolog.
              </p>
            </div>

            <div className="psikolog-hero-stat-card">
              <div className="stat-card-icon-box">
                <Clock size={22} className="text-sky-600" />
              </div>
              <div className="stat-card-info">
                <span className="stat-card-title">{counts.PENDING} Menunggu</span>
                <span className="stat-card-sub">pengajuan perlu ditinjau</span>
              </div>
            </div>
          </div>

          <div className="av-toolbar">
            <div className="av-tabs" role="tablist">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === id}
                  className={`av-tab ${activeTab === id ? 'active' : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                  <span className="av-tab-count">{counts[id]}</span>
                </button>
              ))}
            </div>

            <div className="av-toolbar-right">
              <div className="av-search">
                <Search size={15} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, kota, nomor HIMPSI/SIPP…"
                />
              </div>
              <button
                type="button"
                className="pp-icon-btn"
                title="Muat ulang"
                onClick={() => {
                  setLoading(true);
                  setReloadKey((k) => k + 1);
                }}
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {toast && (
            <div className="auth-success-alert av-toast">
              <CheckCircle2 size={18} />
              <span>{toast}</span>
              <button type="button" className="av-toast-close" onClick={() => setToast('')} aria-label="Tutup">
                <X size={14} />
              </button>
            </div>
          )}
          {error && (
            <div className="auth-error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="psikolog-empty-state">Memuat pengajuan…</div>
          ) : visible.length === 0 ? (
            <div className="psikolog-empty-state">
              <Inbox size={28} />
              <strong>
                {search ? 'Tidak ada hasil yang cocok' : {
                  PENDING: 'Tidak ada pengajuan yang menunggu',
                  VERIFIED: 'Belum ada psikolog yang disetujui',
                  REJECTED: 'Tidak ada pengajuan yang ditolak',
                }[activeTab]}
              </strong>
            </div>
          ) : (
            <div className="av-list">
              {visible.map((p) => (
                <PsychologistReviewCard
                  key={p.id_psychologist}
                  p={p}
                  busy={busyId === p.id_psychologist}
                  onApprove={handleApprove}
                  onReject={setRejectTarget}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {rejectTarget && (
        <RejectModal
          psychologist={rejectTarget}
          busy={busyId === rejectTarget.id_psychologist}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
        />
      )}
    </div>
  );
}
