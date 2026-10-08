import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Inbox, Wallet, Clock, CheckCircle2, Undo2, Ban, Stethoscope, CalendarDays } from 'lucide-react';
import { adminListPayments, adminPaymentSummary } from '../../service/adminService';
import { PAYMENT_STATUS, formatRupiah, methodOf } from '../../service/paymentService';
import '../../styles/payment.css';

const TABS = [
  { id: 'PAID', label: 'Lunas', icon: CheckCircle2 },
  { id: 'PENDING', label: 'Menunggu', icon: Clock },
  { id: 'REFUNDED', label: 'Dikembalikan', icon: Undo2 },
  { id: 'CLOSED', label: 'Batal / Kedaluwarsa', icon: Ban },
];

const inTab = (p, tab) => (tab === 'CLOSED' ? ['CANCELLED', 'EXPIRED'].includes(p.status) : p.status === tab);

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Riwayat transaksi simulasi & pendapatan Bina Jiwa. onError(err) menangani 401 (kunci panel). */
export default function PaymentAdmin({ onError }) {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PAID');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminListPayments(), adminPaymentSummary()])
      .then(([rows, sum]) => {
        if (cancelled) return;
        setPayments(rows);
        setSummary(sum);
      })
      .catch((err) => !cancelled && (onError(err) || setError(err.message)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [onError]);

  const counts = useMemo(() => {
    const c = {};
    TABS.forEach(({ id }) => { c[id] = payments.filter((p) => inTab(p, id)).length; });
    return c;
  }, [payments]);

  const visible = payments.filter((p) => inTab(p, tab));

  return (
    <div className="av-section">
      {summary && (
        <div className="pay-stats-grid">
          <div className="pay-stat highlight">
            <span className="pay-stat-label">Pendapatan Bina Jiwa</span>
            <span className="pay-stat-value">{formatRupiah(summary.pendapatan_bina_jiwa)}</span>
            <span className="pay-stat-label">
              Komisi {formatRupiah(summary.total_komisi)} + biaya layanan {formatRupiah(summary.total_biaya_layanan)}
            </span>
          </div>
          <div className="pay-stat">
            <span className="pay-stat-label">Total Dibayar Pengguna</span>
            <span className="pay-stat-value">{formatRupiah(summary.total_dibayar)}</span>
            <span className="pay-stat-label">{summary.jumlah_transaksi} transaksi lunas</span>
          </div>
          <div className="pay-stat">
            <span className="pay-stat-label">Diteruskan ke Mitra</span>
            <span className="pay-stat-value">{formatRupiah(summary.total_pendapatan_mitra)}</span>
            <span className="pay-stat-label">psikolog &amp; penyelenggara event</span>
          </div>
        </div>
      )}

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
        <div className="psikolog-empty-state">Memuat transaksi…</div>
      ) : visible.length === 0 ? (
        <div className="psikolog-empty-state">
          <Inbox size={28} />
          <strong>Belum ada transaksi di sini</strong>
        </div>
      ) : (
        <div className="av-list">
          {visible.map((p) => {
            const status = PAYMENT_STATUS[p.status];
            const JenisIcon = p.jenis === 'EVENT' ? CalendarDays : Stethoscope;
            return (
              <article key={p.id_payment} className="av-card">
                <div className="av-card-main">
                  <div className="av-card-head">
                    <div>
                      <h3 className="av-name">
                        <JenisIcon size={15} /> {p.tujuan?.judul || (p.jenis === 'EVENT' ? 'Event' : 'Sesi konsultasi')}
                      </h3>
                      <p className="av-location">
                        <Wallet size={13} /> {methodOf(p.metode)?.label} · <span className="pay-mono">{p.kode_bayar}</span>
                      </p>
                    </div>
                    <span className={`pay-status ${status.cls}`}>{status.label}</span>
                  </div>

                  <dl className="pay-split">
                    <dt>Total dibayar</dt>
                    <dd>{formatRupiah(p.total)}</dd>
                    <dt>Komisi ({Number(p.persen_komisi)}%)</dt>
                    <dd>{formatRupiah(p.komisi_platform)}</dd>
                    <dt>Biaya layanan</dt>
                    <dd>{formatRupiah(p.biaya_layanan)}</dd>
                    <dt>Untuk mitra</dt>
                    <dd>{formatRupiah(p.pendapatan_mitra)}</dd>
                  </dl>

                  <span className="av-date">
                    Dibuat {dateFmt.format(new Date(p.created_at))}
                    {p.paid_at && ` · Dibayar ${dateFmt.format(new Date(p.paid_at))}`}
                    {p.refunded_at && ` · Dikembalikan ${dateFmt.format(new Date(p.refunded_at))}`}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
