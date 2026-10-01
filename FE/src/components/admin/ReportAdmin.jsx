import React, { useEffect, useMemo, useState } from 'react';
import { Flag, EyeOff, Check, X, AlertCircle, Inbox, Clock, ShieldCheck, ShieldX } from 'lucide-react';
import { adminListReports, adminModerateReport } from '../../service/adminService';

const TABS = [
  { id: 'PENDING', label: 'Menunggu', icon: Clock },
  { id: 'RESOLVED', label: 'Ditindak', icon: ShieldCheck },
  { id: 'REJECTED', label: 'Ditolak', icon: ShieldX },
];

const TARGET_LABEL = { POST: 'Cerita', ANSWER: 'Balasan', ANSWER_COMMENT: 'Tanggapan', USER: 'Akun' };
const CONTENT_STATUS = { PUBLISHED: 'Masih tayang', HIDDEN: 'Disembunyikan', DELETED: 'Dihapus penulis' };

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/** Moderasi laporan konten Komunitas. onError(err) menangani 401 (kunci panel). */
export default function ReportAdmin({ onError }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminListReports()
      .then((rows) => !cancelled && setReports(rows))
      .catch((err) => !cancelled && (onError(err) || setError(err.message)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [onError]);

  const counts = useMemo(() => {
    const c = { PENDING: 0, RESOLVED: 0, REJECTED: 0 };
    reports.forEach((r) => { if (c[r.status] !== undefined) c[r.status] += 1; });
    return c;
  }, [reports]);

  const visible = reports.filter((r) => r.status === tab);

  const moderate = async (report, status, hide) => {
    setBusyId(report.id_report);
    setError('');
    try {
      const updated = await adminModerateReport(report.id_report, status, hide);
      // Laporan lain untuk konten yang sama ikut diselesaikan di backend.
      setReports((prev) =>
        prev.map((r) => {
          if (r.id_report === updated.id_report) return updated;
          if (r.target_id === report.target_id && r.status === 'PENDING') {
            return { ...r, status, konten: updated.konten };
          }
          return r.target_id === report.target_id ? { ...r, konten: updated.konten } : r;
        })
      );
    } catch (err) {
      if (!onError(err)) setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="av-section">
      <div className="av-tabs" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`av-tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={15} />
            <span>{label}</span>
            <span className="av-tab-count">{counts[id]}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="auth-error-alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="psikolog-empty-state">Memuat laporan…</div>
      ) : visible.length === 0 ? (
        <div className="psikolog-empty-state">
          <Inbox size={28} />
          <strong>{tab === 'PENDING' ? 'Tidak ada laporan yang menunggu' : 'Belum ada laporan di sini'}</strong>
        </div>
      ) : (
        <div className="av-list">
          {visible.map((r) => (
            <article key={r.id_report} className="av-card">
              <div className="av-card-main">
                <div className="av-card-head">
                  <div>
                    <h3 className="av-name">
                      <Flag size={15} /> {r.reason}
                    </h3>
                    <p className="av-location">
                      {TARGET_LABEL[r.target_type]} oleh <b>{r.konten?.nama_persona || 'Anonim'}</b>
                      {r.jumlah_laporan_konten > 1 && ` • dilaporkan ${r.jumlah_laporan_konten}×`}
                    </p>
                  </div>
                  <span className="av-date">{dateFmt.format(new Date(r.created_at))}</span>
                </div>

                {r.description && <p className="av-bio">Keterangan pelapor: “{r.description}”</p>}

                {r.konten ? (
                  <blockquote className="av-reported-content">
                    {r.konten.judul && <strong>{r.konten.judul}</strong>}
                    <span>{r.konten.isi}</span>
                    <em className={`av-content-status ${r.konten.status.toLowerCase()}`}>
                      {CONTENT_STATUS[r.konten.status]}
                    </em>
                  </blockquote>
                ) : (
                  <p className="pp-muted">Konten sudah tidak tersedia.</p>
                )}
              </div>

              {r.status === 'PENDING' && (
                <div className="av-card-actions">
                  <button
                    type="button"
                    className="av-btn-approve"
                    disabled={busyId === r.id_report || r.konten?.status !== 'PUBLISHED'}
                    onClick={() => moderate(r, 'RESOLVED', true)}
                    title="Sembunyikan konten dari komunitas"
                  >
                    <EyeOff size={16} />
                    <span>Sembunyikan</span>
                  </button>
                  <button
                    type="button"
                    className="av-btn-reject-outline"
                    disabled={busyId === r.id_report}
                    onClick={() => moderate(r, 'RESOLVED', false)}
                  >
                    <Check size={16} />
                    <span>Tandai Selesai</span>
                  </button>
                  <button
                    type="button"
                    className="av-btn-reject-outline"
                    disabled={busyId === r.id_report}
                    onClick={() => moderate(r, 'REJECTED', false)}
                  >
                    <X size={16} />
                    <span>Tolak Laporan</span>
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
