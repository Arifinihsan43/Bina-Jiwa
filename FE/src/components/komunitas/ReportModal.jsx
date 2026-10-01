import React, { useState } from 'react';
import { X, Flag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { REPORT_REASONS, reportContent } from '../../service/forumService';

const TARGET_LABEL = { POST: 'cerita', ANSWER: 'balasan', ANSWER_COMMENT: 'tanggapan' };

/** target: { type: 'POST' | 'ANSWER' | 'ANSWER_COMMENT', id } */
export default function ReportModal({ target, onClose }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setSending(true);
    setError('');
    try {
      await reportContent(target.type, target.id, reason, description);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="komunitas-modal-backdrop" onClick={onClose}>
      <div className="komunitas-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="komunitas-modal-header">
          <h3>
            <Flag size={16} /> Laporkan {TARGET_LABEL[target.type]}
          </h3>
          <button type="button" className="komunitas-modal-close" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="komunitas-modal-done">
            <CheckCircle2 size={36} className="text-emerald-500" />
            <strong>Terima kasih sudah menjaga ruang ini tetap aman.</strong>
            <span>Tim Bina Jiwa akan meninjau laporanmu. Identitasmu tidak ditampilkan ke penulis.</span>
            <button type="button" className="submit-post-btn" onClick={onClose}>Tutup</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="komunitas-modal-body">
            <p className="komunitas-modal-sub">Apa yang membuat {TARGET_LABEL[target.type]} ini tidak pantas?</p>
            <div className="report-reason-list">
              {REPORT_REASONS.map((r) => (
                <label key={r} className={`report-reason ${reason === r ? 'active' : ''}`}>
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
                  <span>{r}</span>
                </label>
              ))}
            </div>
            <textarea
              className="add-comment-input report-description"
              rows={3}
              maxLength={1000}
              placeholder="Keterangan tambahan (opsional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {reason === 'Konten menyakiti diri' && (
              <p className="report-crisis-note">
                Jika penulis tampak dalam bahaya, kamu juga bisa menyarankan layanan darurat di menu Bantuan &amp; Krisis.
              </p>
            )}
            {error && (
              <div className="auth-error-alert" style={{ marginBottom: 0 }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            <button type="submit" className="submit-post-btn" disabled={!reason || sending}>
              <Flag size={14} />
              <span>{sending ? 'Mengirim…' : 'Kirim Laporan'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
