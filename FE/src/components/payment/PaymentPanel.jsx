import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  QrCode,
  Landmark,
  Wallet,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  X,
} from 'lucide-react';
import {
  PAYMENT_METHODS,
  createPayment,
  findActivePayment,
  formatRupiah,
  getQuote,
  methodOf,
  paymentSteps,
  simulatePaid,
} from '../../service/paymentService';
// Modal & tombol dasar (modal-card, confirm-booking-submit-btn) ada di psikolog.css.
import '../../styles/psikolog.css';
import '../../styles/payment.css';

const GROUP_ICON = { QRIS: QrCode, 'Virtual Account': Landmark, 'E-Wallet': Wallet };
const GROUPS = ['QRIS', 'Virtual Account', 'E-Wallet'];

const timeFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const pad = (n) => String(n).padStart(2, '0');
const formatCountdown = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

/** QR tiruan (bukan QR asli) yang konsisten untuk kode bayar yang sama. */
function FakeQr({ value }) {
  const size = 25;
  const cells = useMemo(() => {
    let seed = 0;
    for (const ch of value) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) >>> 0;
      return seed / 2 ** 32;
    };
    const finder = (x, y) =>
      [[0, 0], [size - 7, 0], [0, size - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    const out = [];
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (!finder(x, y) && rand() > 0.5) out.push([x, y]);
      }
    }
    return out;
  }, [value]);

  const finderAt = (x, y) => (
    <g key={`f${x}${y}`}>
      <rect x={x} y={y} width="7" height="7" fill="#0f172a" />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill="#0f172a" />
    </g>
  );

  return (
    <svg className="pay-qr" viewBox={`-1 -1 ${size + 2} ${size + 2}`} role="img" aria-label="Kode QR simulasi">
      <rect x="-1" y="-1" width={size + 2} height={size + 2} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0f172a" />
      ))}
      {finderAt(0, 0)}
      {finderAt(size - 7, 0)}
      {finderAt(0, size - 7)}
    </svg>
  );
}

function CostBreakdown({ subtotal, biayaLayanan, total, label }) {
  return (
    <div className="pay-breakdown">
      <div className="pay-row">
        <span>{label}</span>
        <span>{formatRupiah(subtotal)}</span>
      </div>
      <div className="pay-row">
        <span>Biaya layanan</span>
        <span>{formatRupiah(biayaLayanan)}</span>
      </div>
      <div className="pay-row pay-row-total">
        <span>Total Pembayaran</span>
        <span>{formatRupiah(total)}</span>
      </div>
    </div>
  );
}

/**
 * Alur pembayaran simulasi: pilih metode -> instruksi bayar -> lunas.
 * target: { jenis: 'APPOINTMENT', id_appointment } | { jenis: 'EVENT', id_event }
 * onPaid(payment) dipanggil begitu lunas (untuk memuat ulang data induk).
 * onDone() dipanggil dari tombol di layar sukses.
 */
export default function PaymentPanel({ target, itemLabel = 'Biaya', onPaid, onDone, doneLabel = 'Selesai' }) {
  const [step, setStep] = useState('loading'); // loading | checkout | instruksi | paid | error
  const [quote, setQuote] = useState(null);
  const [payment, setPayment] = useState(null);
  const [metode, setMetode] = useState('QRIS');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    const t = { jenis: target.jenis, id_appointment: target.id_appointment, id_event: target.id_event };
    // Lanjutkan tagihan yang masih aktif bila ada; selain itu tampilkan checkout.
    Promise.allSettled([findActivePayment(t), getQuote(t)]).then(([active, q]) => {
      if (cancelled) return;
      if (q.status === 'fulfilled') setQuote(q.value);
      if (active.status === 'fulfilled' && active.value) {
        setPayment(active.value);
        setMetode(active.value.metode);
        setStep('instruksi');
      } else if (q.status === 'fulfilled') {
        setStep('checkout');
      } else {
        setError(q.reason?.message || 'Gagal memuat rincian pembayaran.');
        setStep('error');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [target.jenis, target.id_appointment, target.id_event]);

  // Hitung mundur batas bayar.
  useEffect(() => {
    if (step !== 'instruksi') return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step]);

  const remaining = payment ? new Date(payment.expired_at).getTime() - now : 0;
  const expired = step === 'instruksi' && remaining <= 0;

  const handleCreate = async () => {
    setBusy(true);
    setError('');
    try {
      const created = await createPayment(
        { jenis: target.jenis, id_appointment: target.id_appointment, id_event: target.id_event },
        metode
      );
      setPayment(created);
      setNow(Date.now());
      setStep('instruksi');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSimulate = async () => {
    setBusy(true);
    setError('');
    try {
      const paid = await simulatePaid(payment.id_payment);
      setPayment(paid);
      setStep('paid');
      onPaid?.(paid);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(payment.kode_bayar);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard tidak tersedia — pengguna bisa menyalin manual.
    }
  };

  const errorBox = error && (
    <div className="auth-error-alert pay-error">
      <AlertCircle size={16} />
      <span>{error}</span>
    </div>
  );

  if (step === 'loading') {
    return <div className="pay-panel pay-loading">Menyiapkan pembayaran…</div>;
  }

  if (step === 'error') {
    return <div className="pay-panel">{errorBox}</div>;
  }

  if (step === 'paid') {
    const m = methodOf(payment.metode);
    return (
      <div className="pay-panel">
        <div className="booking-success-state pay-success">
          <div className="success-icon-circle">
            <CheckCircle2 size={36} className="text-emerald-500" />
          </div>
          <h4 className="success-title">Pembayaran Berhasil!</h4>
          <p className="success-sub">{payment.tujuan?.judul}</p>
        </div>
        <div className="pay-receipt">
          <div className="pay-row"><span>Metode</span><span>{m?.label}</span></div>
          <div className="pay-row"><span>Kode bayar</span><span className="pay-mono">{payment.kode_bayar}</span></div>
          <div className="pay-row"><span>Waktu bayar</span><span>{timeFmt.format(new Date(payment.paid_at))} WIB</span></div>
          <div className="pay-row pay-row-total"><span>Total</span><span>{formatRupiah(payment.total)}</span></div>
        </div>
        {onDone && (
          <button type="button" className="confirm-booking-submit-btn" onClick={onDone}>
            {doneLabel}
          </button>
        )}
      </div>
    );
  }

  if (step === 'instruksi') {
    const m = methodOf(payment.metode);
    return (
      <div className="pay-panel">
        <div className="pay-sim-badge">
          <Sparkles size={13} /> Mode simulasi — tidak ada uang sungguhan yang ditransfer
        </div>

        <div className="pay-amount-card">
          <span className="pay-amount-label">Total Pembayaran</span>
          <span className="pay-amount">{formatRupiah(payment.total)}</span>
          <span className={`pay-countdown ${expired ? 'over' : ''}`}>
            <Clock size={13} />
            {expired
              ? 'Batas waktu pembayaran sudah lewat'
              : `Bayar dalam ${formatCountdown(remaining)} (sebelum ${timeFmt.format(new Date(payment.expired_at))} WIB)`}
          </span>
        </div>

        <div className="pay-code-box">
          <span className="pay-code-label">{m?.group === 'QRIS' ? 'Scan QRIS' : m?.group === 'Virtual Account' ? 'Nomor Virtual Account' : `Kode Pembayaran ${m?.label}`}</span>
          {m?.group === 'QRIS' && <FakeQr value={payment.kode_bayar} />}
          <div className="pay-code-row">
            <span className="pay-mono pay-code">{payment.kode_bayar}</span>
            <button type="button" className="pay-copy-btn" onClick={copyCode} aria-label="Salin kode">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>
        </div>

        <ol className="pay-steps">
          {paymentSteps(payment.metode, payment.kode_bayar, payment.total).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>

        <details className="pay-details">
          <summary>Rincian biaya</summary>
          <CostBreakdown subtotal={payment.subtotal} biayaLayanan={payment.biaya_layanan} total={payment.total} label={itemLabel} />
        </details>

        {errorBox}

        {expired ? (
          <button
            type="button"
            className="confirm-booking-submit-btn"
            onClick={() => {
              setPayment(null);
              setError('');
              setStep('checkout');
            }}
            disabled={!quote}
          >
            Buat Tagihan Baru
          </button>
        ) : (
          <>
            <button type="button" className="confirm-booking-submit-btn pay-sim-btn" onClick={handleSimulate} disabled={busy}>
              <ShieldCheck size={16} /> {busy ? 'Memproses…' : 'Simulasikan Pembayaran Berhasil'}
            </button>
            <button
              type="button"
              className="pay-link-btn"
              onClick={() => {
                setError('');
                setStep('checkout');
              }}
              disabled={busy || !quote}
            >
              <ArrowLeft size={14} /> Ganti metode pembayaran
            </button>
          </>
        )}
      </div>
    );
  }

  // checkout
  return (
    <div className="pay-panel">
      <div className="pay-item-title">{quote.judul}</div>
      <CostBreakdown subtotal={quote.subtotal} biayaLayanan={quote.biaya_layanan} total={quote.total} label={itemLabel} />

      <div className="form-group">
        <span className="form-label">Pilih Metode Pembayaran</span>
        {GROUPS.map((group) => {
          const Icon = GROUP_ICON[group];
          return (
            <div key={group} className="pay-method-group">
              <span className="pay-method-group-label">
                <Icon size={13} /> {group}
              </span>
              <div className="pay-method-grid">
                {PAYMENT_METHODS.filter((m) => m.group === group).map((m) => (
                  <label key={m.id} className={`pay-method ${metode === m.id ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="pay-method"
                      value={m.id}
                      checked={metode === m.id}
                      onChange={() => setMetode(m.id)}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {payment && (
        <p className="pay-note">
          <AlertCircle size={12} /> Tagihan sebelumnya akan dibatalkan dan diganti dengan metode baru.
        </p>
      )}

      {errorBox}

      <button type="button" className="confirm-booking-submit-btn" onClick={handleCreate} disabled={busy}>
        {busy ? 'Membuat tagihan…' : `Bayar ${formatRupiah(quote.total)}`}
      </button>
    </div>
  );
}

/** PaymentPanel dalam modal sendiri (dipakai dari halaman Janji Temu). */
export function PaymentModal({ title = 'Pembayaran', subtitle, onClose, ...panelProps }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card pay-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <h3 className="modal-title">{title}</h3>
            {subtitle && <span className="modal-sub">{subtitle}</span>}
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>
        <PaymentPanel onDone={onClose} {...panelProps} />
      </div>
    </div>
  );
}
