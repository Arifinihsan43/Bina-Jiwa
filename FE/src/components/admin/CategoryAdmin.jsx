import React, { useEffect, useState } from 'react';
import { Plus, Sparkles, Eye, EyeOff, AlertCircle, Tags } from 'lucide-react';
import {
  adminCreateCategory,
  adminListCategories,
  adminSeedCategories,
  adminUpdateCategory,
} from '../../service/adminService';

/** Kelola kategori (topik) Komunitas. onError(err) menangani 401 (kunci panel). */
export default function CategoryAdmin({ onError }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminListCategories()
      .then((rows) => !cancelled && setCategories(rows))
      .catch((err) => !cancelled && (onError(err) || setError(err.message)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [onError]);

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      if (!onError(err)) setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!nama.trim()) return;
    run(async () => {
      const created = await adminCreateCategory({ nama, deskripsi });
      setCategories((prev) => [...prev, created].sort((a, b) => a.nama_kategori.localeCompare(b.nama_kategori)));
      setNama('');
      setDeskripsi('');
    });
  };

  const handleToggle = (cat) =>
    run(async () => {
      const updated = await adminUpdateCategory(cat.id_category, { is_active: !cat.is_active });
      setCategories((prev) => prev.map((c) => (c.id_category === updated.id_category ? updated : c)));
    });

  return (
    <div className="av-section">
      {error && (
        <div className="auth-error-alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form className="pp-card av-inline-form" onSubmit={handleCreate}>
        <div className="pp-card-header">
          <Tags size={18} />
          <div>
            <h2 className="pp-card-title">Tambah Topik Komunitas</h2>
            <p className="pp-card-sub">Topik aktif muncul sebagai filter dan pilihan saat pengguna menulis cerita.</p>
          </div>
        </div>
        <div className="pp-row">
          <input className="pp-input" placeholder="Nama topik, mis. Curhat Anonim" value={nama} maxLength={50} onChange={(e) => setNama(e.target.value)} />
          <input className="pp-input" placeholder="Deskripsi singkat (opsional)" value={deskripsi} maxLength={500} onChange={(e) => setDeskripsi(e.target.value)} />
        </div>
        <div className="av-inline-actions">
          <button type="submit" className="pp-btn-secondary" disabled={busy || !nama.trim()}>
            <Plus size={15} /> Tambah Topik
          </button>
          <button type="button" className="pp-btn-secondary" disabled={busy} onClick={() => run(async () => setCategories(await adminSeedCategories()))}>
            <Sparkles size={15} /> Tambahkan Topik Bawaan
          </button>
        </div>
      </form>

      {loading ? (
        <div className="psikolog-empty-state">Memuat topik…</div>
      ) : categories.length === 0 ? (
        <div className="psikolog-empty-state">
          <Tags size={28} />
          <strong>Belum ada topik</strong>
          <span>Klik “Tambahkan Topik Bawaan” untuk membuat 5 topik awal sekaligus.</span>
        </div>
      ) : (
        <ul className="pp-schedule-list">
          {categories.map((c) => (
            <li key={c.id_category} className={`pp-schedule-row ${c.is_active ? '' : 'inactive'}`}>
              <span className="av-cat-name">{c.nama_kategori}</span>
              <span className="pp-schedule-time">{c.deskripsi || <em className="pp-muted">Tanpa deskripsi</em>}</span>
              <span className={`av-cat-status ${c.is_active ? 'on' : ''}`}>{c.is_active ? 'Aktif' : 'Nonaktif'}</span>
              <button
                type="button"
                className="pp-icon-btn"
                disabled={busy}
                onClick={() => handleToggle(c)}
                title={c.is_active ? 'Nonaktifkan topik' : 'Aktifkan topik'}
              >
                {c.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
