import React, { useState } from 'react';
import { X, AlertCircle, Save, Send } from 'lucide-react';
import { isoToWibInput, wibInputToIso } from '../../service/eventService';
import { adminCreateEvent, adminUpdateEvent } from '../../service/adminService';

const emptyForm = {
  judul: '',
  penyelenggara: '',
  penyelenggara_info: '',
  deskripsi: '',
  type: 'ONLINE',
  tanggal_mulai: '',
  tanggal_selesai: '',
  batas_pendaftaran: '',
  lokasi: '',
  link_meeting: '',
  harga: '0',
  kapasitas: '',
  gambar_url: '',
};

const toForm = (event) => ({
  judul: event.judul,
  penyelenggara: event.penyelenggara?.nama || '',
  penyelenggara_info: event.penyelenggara?.keterangan || '',
  deskripsi: event.deskripsi || '',
  type: event.type,
  tanggal_mulai: isoToWibInput(event.tanggal_mulai),
  tanggal_selesai: isoToWibInput(event.tanggal_selesai),
  batas_pendaftaran: isoToWibInput(event.batas_pendaftaran),
  lokasi: event.lokasi || '',
  link_meeting: event.link_meeting || '',
  harga: String(Number(event.harga) || 0),
  kapasitas: event.kapasitas ? String(event.kapasitas) : '',
  gambar_url: event.gambar_url || '',
});

/**
 * Admin: buat event baru dari proposal (event = null) atau ubah event.
 * onError(err) → true bila error sudah ditangani (mis. kode akses ditolak).
 */
export default function EventFormModal({ event, onClose, onSaved, onError }) {
  const isEdit = Boolean(event);
  const [form, setForm] = useState(() => (event ? toForm(event) : emptyForm));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const buildPayload = () => ({
    judul: form.judul.trim(),
    penyelenggara: form.penyelenggara.trim(),
    penyelenggara_info: form.penyelenggara_info.trim() || null,
    deskripsi: form.deskripsi.trim() || null,
    type: form.type,
    tanggal_mulai: wibInputToIso(form.tanggal_mulai),
    tanggal_selesai: wibInputToIso(form.tanggal_selesai),
    batas_pendaftaran: wibInputToIso(form.batas_pendaftaran),
    lokasi: form.lokasi.trim() || null,
    link_meeting: form.link_meeting.trim() || null,
    harga: Number(form.harga) || 0,
    kapasitas: form.kapasitas ? Number(form.kapasitas) : null,
    gambar_url: form.gambar_url.trim() || null,
  });

  const save = async (status) => {
    setError('');
    if (form.judul.trim().length < 3) return setError('Judul minimal 3 karakter.');
    if (form.penyelenggara.trim().length < 2) return setError('Nama penyelenggara wajib diisi.');
    if (!form.tanggal_mulai || !form.tanggal_selesai) return setError('Isi waktu mulai dan selesai.');
    if (form.tanggal_selesai <= form.tanggal_mulai) return setError('Waktu selesai harus setelah waktu mulai.');
    if (form.batas_pendaftaran && form.batas_pendaftaran > form.tanggal_mulai) {
      return setError('Batas pendaftaran tidak boleh setelah event dimulai.');
    }
    if (form.type === 'OFFLINE' && !form.lokasi.trim()) return setError('Lokasi wajib diisi untuk event tatap muka.');

    setSaving(true);
    try {
      const payload = buildPayload();
      const saved = isEdit
        ? await adminUpdateEvent(event.id_event, status ? { ...payload, status } : payload)
        : await adminCreateEvent({ ...payload, status });
      onSaved(saved);
    } catch (err) {
      if (!onError?.(err)) setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card event-form-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <h3 className="modal-title">{isEdit ? 'Ubah Event' : 'Buat Event Baru'}</h3>
            <span className="modal-sub">Semua waktu dalam WIB</span>
          </div>
          <button type="button" className="close-modal-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <form className="event-form" onSubmit={(e) => { e.preventDefault(); save(isEdit ? null : 'PUBLISHED'); }}>
          <label className="form-group">
            <span className="form-label">Judul *</span>
            <input className="form-input-text" value={form.judul} maxLength={200} onChange={set('judul')} required />
          </label>

          <div className="event-form-row two">
            <label className="form-group">
              <span className="form-label">Penyelenggara *</span>
              <input className="form-input-text" value={form.penyelenggara} maxLength={150} onChange={set('penyelenggara')} placeholder="Nama fasilitator / komunitas" required />
            </label>
            <label className="form-group">
              <span className="form-label">Keterangan penyelenggara</span>
              <input className="form-input-text" value={form.penyelenggara_info} maxLength={200} onChange={set('penyelenggara_info')} placeholder="Mis. Psikolog Klinis, Komunitas Peduli Jiwa" />
            </label>
          </div>

          <label className="form-group">
            <span className="form-label">Deskripsi</span>
            <textarea className="form-input-text event-form-textarea" rows={4} maxLength={5000} value={form.deskripsi} onChange={set('deskripsi')} placeholder="Apa yang akan dipelajari peserta, untuk siapa sesi ini, dan apa yang perlu disiapkan." />
          </label>

          <div className="event-form-row">
            <label className="form-group">
              <span className="form-label">Format *</span>
              <select className="form-input-text" value={form.type} onChange={set('type')}>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Tatap muka</option>
              </select>
            </label>
            <label className="form-group">
              <span className="form-label">Biaya (Rp)</span>
              <input className="form-input-text" type="number" min="0" step="1000" value={form.harga} onChange={set('harga')} />
            </label>
            <label className="form-group">
              <span className="form-label">Kuota peserta</span>
              <input className="form-input-text" type="number" min="1" value={form.kapasitas} onChange={set('kapasitas')} placeholder="Tanpa batas" />
            </label>
          </div>

          <div className="event-form-row">
            <label className="form-group">
              <span className="form-label">Mulai *</span>
              <input className="form-input-text" type="datetime-local" value={form.tanggal_mulai} onChange={set('tanggal_mulai')} required />
            </label>
            <label className="form-group">
              <span className="form-label">Selesai *</span>
              <input className="form-input-text" type="datetime-local" value={form.tanggal_selesai} onChange={set('tanggal_selesai')} required />
            </label>
            <label className="form-group">
              <span className="form-label">Batas daftar</span>
              <input className="form-input-text" type="datetime-local" value={form.batas_pendaftaran} onChange={set('batas_pendaftaran')} />
            </label>
          </div>

          {form.type === 'OFFLINE' ? (
            <label className="form-group">
              <span className="form-label">Lokasi *</span>
              <input className="form-input-text" value={form.lokasi} maxLength={500} onChange={set('lokasi')} placeholder="Nama tempat & alamat lengkap" />
            </label>
          ) : (
            <label className="form-group">
              <span className="form-label">Tautan meeting</span>
              <input className="form-input-text" type="url" value={form.link_meeting} maxLength={500} onChange={set('link_meeting')} placeholder="https://zoom.us/j/... (hanya terlihat oleh peserta terdaftar)" />
            </label>
          )}

          <label className="form-group">
            <span className="form-label">URL gambar sampul</span>
            <input className="form-input-text" type="url" value={form.gambar_url} maxLength={500} onChange={set('gambar_url')} placeholder="https://... (opsional)" />
          </label>

          {error && (
            <div className="auth-error-alert" style={{ marginBottom: 0 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="event-form-actions">
            {isEdit ? (
              <>
                <button type="submit" className="confirm-booking-submit-btn" disabled={saving}>
                  <Save size={15} /> {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                </button>
                {event.status === 'DRAFT' && (
                  <button type="button" className="event-action-btn btn-outline" disabled={saving} onClick={() => save('PUBLISHED')}>
                    <Send size={14} /> Simpan & Publikasikan
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="submit" className="confirm-booking-submit-btn" disabled={saving}>
                  <Send size={15} /> {saving ? 'Menyimpan…' : 'Publikasikan'}
                </button>
                <button type="button" className="event-action-btn btn-outline" disabled={saving} onClick={() => save('DRAFT')}>
                  Simpan sebagai Draf
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
