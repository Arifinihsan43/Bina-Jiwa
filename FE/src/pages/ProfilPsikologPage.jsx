import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/dashboard';
import LocationPicker from '../components/psikolog/LocationPicker';
import '../styles/psikolog.css';
import '../styles/profil-psikolog.css';
import '../styles/payment.css';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Eye,
  EyeOff,
  MapPin,
  Stethoscope,
  FileBadge,
  CalendarClock,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  LocateFixed,
  Search,
  Wallet,
} from 'lucide-react';
import {
  DAY_NAMES,
  formatTime,
  splitSpecializations,
  getMyPsychologistProfile,
  saveMyPsychologistProfile,
  getSchedules,
  addSchedule,
  updateSchedule,
  deleteSchedule,
} from '../service/psychologistService';
import {
  BIAYA_LAYANAN,
  KOMISI_PERSEN_PSIKOLOG,
  formatRupiah,
  netForPsychologist,
} from '../service/paymentService';

const EMPTY_FORM = {
  nama_profesional: '',
  spesialisasi: '',
  bio: '',
  kota: '',
  alamat_praktik: '',
  latitude: null,
  longitude: null,
  nomor_himpsi: '',
  nomor_sipp: '',
  dokumen_verifikasi_url: '',
  tarif_sesi: '0',
  status: 'ACTIVE',
};

const LICENSE_FIELDS = ['nomor_himpsi', 'nomor_sipp', 'dokumen_verifikasi_url'];

function profileToForm(profile) {
  return {
    ...EMPTY_FORM,
    ...Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, profile[k] ?? EMPTY_FORM[k]])),
    latitude: profile.latitude !== null && profile.latitude !== undefined ? Number(profile.latitude) : null,
    longitude: profile.longitude !== null && profile.longitude !== undefined ? Number(profile.longitude) : null,
    tarif_sesi: String(Number(profile.tarif_sesi) || 0),
  };
}

function VisibilityBanner({ profile }) {
  if (!profile) {
    return (
      <div className="pp-banner pp-banner-info">
        <AlertCircle size={20} />
        <div>
          <strong>Profil praktik belum dibuat.</strong>
          <span>Lengkapi data di bawah lalu simpan. Setelah diverifikasi admin, profil Anda akan tampil di halaman Cari Psikolog.</span>
        </div>
      </div>
    );
  }
  if (profile.verification_status === 'PENDING') {
    return (
      <div className="pp-banner pp-banner-warning">
        <Clock size={20} />
        <div>
          <strong>Menunggu verifikasi admin.</strong>
          <span>Profil belum tampil di Cari Psikolog sampai nomor HIMPSI / SIPP Anda diverifikasi.</span>
        </div>
      </div>
    );
  }
  if (profile.verification_status === 'REJECTED') {
    return (
      <div className="pp-banner pp-banner-danger">
        <ShieldAlert size={20} />
        <div>
          <strong>Verifikasi ditolak.</strong>
          {profile.catatan_verifikasi && <span><b>Alasan dari admin:</b> {profile.catatan_verifikasi}</span>}
          <span>Perbaiki nomor HIMPSI, SIPP, atau link dokumen, lalu simpan untuk mengajukan verifikasi ulang.</span>
        </div>
      </div>
    );
  }
  if (profile.status === 'INACTIVE') {
    return (
      <div className="pp-banner pp-banner-muted">
        <EyeOff size={20} />
        <div>
          <strong>Profil disembunyikan.</strong>
          <span>Profil Anda sudah terverifikasi, tetapi sedang tidak ditampilkan di Cari Psikolog.</span>
        </div>
      </div>
    );
  }
  return (
    <div className="pp-banner pp-banner-success">
      <CheckCircle2 size={20} />
      <div>
        <strong>Profil sudah tampil di Cari Psikolog.</strong>
        <span>Perubahan yang Anda simpan langsung terlihat oleh pengguna.</span>
      </div>
    </div>
  );
}

function ScheduleManager({ profile }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ hari: '1', jam_mulai: '09:00', jam_selesai: '17:00' });
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSchedules(profile.id_psychologist)
      .then((rows) => {
        if (!cancelled) setSchedules(rows);
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
  }, [profile.id_psychologist]);

  const sortSchedules = (rows) =>
    [...rows].sort((a, b) => a.hari - b.hari || a.jam_mulai.localeCompare(b.jam_mulai));

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (draft.jam_selesai <= draft.jam_mulai) {
      setError('Jam selesai harus setelah jam mulai.');
      return;
    }
    setBusyId('new');
    try {
      const created = await addSchedule(draft);
      setSchedules((prev) => sortSchedules([...prev, created]));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (schedule) => {
    setError('');
    setBusyId(schedule.id_schedule);
    try {
      const updated = await updateSchedule(schedule.id_schedule, { is_active: !schedule.is_active });
      setSchedules((prev) => prev.map((s) => (s.id_schedule === updated.id_schedule ? updated : s)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (schedule) => {
    setError('');
    setBusyId(schedule.id_schedule);
    try {
      await deleteSchedule(schedule.id_schedule);
      setSchedules((prev) => prev.filter((s) => s.id_schedule !== schedule.id_schedule));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="pp-card">
      <div className="pp-card-header">
        <CalendarClock size={18} />
        <div>
          <h2 className="pp-card-title">Jadwal Praktik Mingguan</h2>
          <p className="pp-card-sub">Ditampilkan sebagai slot ketersediaan di Cari Psikolog.</p>
        </div>
      </div>

      {error && (
        <div className="auth-error-alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p className="pp-muted">Memuat jadwal…</p>
      ) : schedules.length === 0 ? (
        <p className="pp-muted">Belum ada jadwal. Tambahkan jadwal praktik pertama Anda di bawah.</p>
      ) : (
        <ul className="pp-schedule-list">
          {schedules.map((s) => (
            <li key={s.id_schedule} className={`pp-schedule-row ${s.is_active ? '' : 'inactive'}`}>
              <span className="pp-schedule-day">{DAY_NAMES[s.hari - 1]}</span>
              <span className="pp-schedule-time">
                {formatTime(s.jam_mulai)} – {formatTime(s.jam_selesai)}
              </span>
              <button
                type="button"
                className="pp-icon-btn"
                onClick={() => handleToggle(s)}
                disabled={busyId === s.id_schedule}
                title={s.is_active ? 'Nonaktifkan sementara' : 'Aktifkan'}
              >
                {s.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              <button
                type="button"
                className="pp-icon-btn danger"
                onClick={() => handleDelete(s)}
                disabled={busyId === s.id_schedule}
                title="Hapus jadwal"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="pp-schedule-add" onSubmit={handleAdd}>
        <select
          className="pp-input"
          value={draft.hari}
          onChange={(e) => setDraft((d) => ({ ...d, hari: e.target.value }))}
          aria-label="Hari"
        >
          {DAY_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>{name}</option>
          ))}
        </select>
        <input
          type="time"
          className="pp-input"
          value={draft.jam_mulai}
          onChange={(e) => setDraft((d) => ({ ...d, jam_mulai: e.target.value }))}
          aria-label="Jam mulai"
          required
        />
        <input
          type="time"
          className="pp-input"
          value={draft.jam_selesai}
          onChange={(e) => setDraft((d) => ({ ...d, jam_selesai: e.target.value }))}
          aria-label="Jam selesai"
          required
        />
        <button type="submit" className="pp-btn-secondary" disabled={busyId === 'new'}>
          <Plus size={16} />
          <span>Tambah</span>
        </button>
      </form>
    </section>
  );
}

export default function ProfilPsikologPage({ user, onToggleSidebar }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locating, setLocating] = useState(false);

  const isDoctor = user?.role === 'doctor';

  useEffect(() => {
    if (!isDoctor) return;
    let cancelled = false;
    getMyPsychologistProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setForm(data ? profileToForm(data) : { ...EMPTY_FORM, nama_profesional: user?.name || '' });
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
  }, [isDoctor, user?.name]);

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSuccess('');
  };

  const setLocation = (latitude, longitude) => {
    setForm((f) => ({ ...f, latitude, longitude }));
    setSuccess('');
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser Anda tidak mendukung deteksi lokasi.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(Number(pos.coords.latitude.toFixed(7)), Number(pos.coords.longitude.toFixed(7)));
        setLocating(false);
      },
      () => {
        setError('Tidak dapat mengambil lokasi. Izinkan akses lokasi atau klik titik di peta.');
        setLocating(false);
      }
    );
  };

  const licenseChanged =
    profile?.verification_status === 'VERIFIED' &&
    LICENSE_FIELDS.some((k) => (form[k] || '') !== (profile[k] || ''));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.nama_profesional.trim()) {
      setError('Nama profesional wajib diisi.');
      return;
    }
    if (!profile && !form.nomor_himpsi.trim() && !form.nomor_sipp.trim()) {
      setError('Isi minimal nomor HIMPSI atau SIPP agar profil dapat diverifikasi.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveMyPsychologistProfile(
        { ...form, tarif_sesi: Number(form.tarif_sesi) || 0 },
        { isNew: !profile }
      );
      setProfile(saved);
      setForm(profileToForm(saved));
      setSuccess(profile ? 'Perubahan profil praktik berhasil disimpan.' : 'Profil praktik berhasil dibuat dan diajukan untuk verifikasi.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isDoctor) {
    return (
      <div className="db-main-content">
        <DashboardHeader onToggleSidebar={onToggleSidebar} />
        <div className="psikolog-page-container">
          <div className="pp-banner pp-banner-info">
            <Stethoscope size={20} />
            <div>
              <strong>Halaman ini khusus untuk mitra psikolog.</strong>
              <span>Daftar sebagai Mitra Psikolog untuk mengelola profil praktik.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tags = splitSpecializations(form.spesialisasi);

  return (
    <div className="db-main-content">
      <DashboardHeader onToggleSidebar={onToggleSidebar} />

      <div className="psikolog-page-container">
        <div className="psikolog-content-wrapper">
          {/* Hero */}
          <div className="psikolog-hero-section">
            <div className="psikolog-hero-left">
              <div className="psikolog-safe-badge">
                <Stethoscope size={14} />
                <span>MITRA PSIKOLOG BINA JIWA</span>
              </div>
              <h1 className="psikolog-hero-title">Profil Praktik Saya</h1>
              <p className="psikolog-hero-sub">
                Data ini yang dilihat pengguna saat mencari psikolog. Lengkapi keahlian, lokasi, dan
                jadwal praktik Anda agar mudah ditemukan.
              </p>
            </div>

            {profile && (
              <div className="psikolog-hero-stat-card">
                <div className="stat-card-icon-box">
                  {profile.verification_status === 'VERIFIED' ? (
                    <ShieldCheck size={22} className="text-sky-600" />
                  ) : (
                    <Clock size={22} className="text-sky-600" />
                  )}
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-title">
                    {{ VERIFIED: 'Terverifikasi', PENDING: 'Menunggu Verifikasi', REJECTED: 'Verifikasi Ditolak' }[profile.verification_status]}
                  </span>
                  <span className="stat-card-sub">
                    {profile.status === 'ACTIVE' ? 'Profil aktif' : 'Profil disembunyikan'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <p className="pp-muted">Memuat profil praktik…</p>
          ) : (
            <>
              <VisibilityBanner profile={profile} />

              <div className="pp-grid">
                {/* Form utama */}
                <form className="pp-form-column" onSubmit={handleSubmit}>
                  <section className="pp-card">
                    <div className="pp-card-header">
                      <Stethoscope size={18} />
                      <div>
                        <h2 className="pp-card-title">Data Profesional</h2>
                        <p className="pp-card-sub">Nama dan keahlian yang tampil di kartu psikolog.</p>
                      </div>
                    </div>

                    <label className="pp-field">
                      <span className="pp-label">Nama Profesional (dengan gelar) *</span>
                      <input
                        className="pp-input"
                        value={form.nama_profesional}
                        onChange={setField('nama_profesional')}
                        placeholder="Contoh: Nadia Pratiwi, M.Psi., Psikolog"
                        maxLength={100}
                        required
                      />
                    </label>

                    <label className="pp-field">
                      <span className="pp-label">Spesialisasi / Fokus Penanganan</span>
                      <input
                        className="pp-input"
                        value={form.spesialisasi}
                        onChange={setField('spesialisasi')}
                        placeholder="Pisahkan dengan koma, contoh: Kecemasan, Burnout, Trauma"
                        maxLength={150}
                      />
                      {tags.length > 0 && (
                        <div className="specialization-tags-group pp-tags-preview">
                          {tags.map((t) => (
                            <span key={t} className="spec-tag">{t}</span>
                          ))}
                        </div>
                      )}
                    </label>

                    <label className="pp-field">
                      <span className="pp-label">Bio &amp; Pengalaman</span>
                      <textarea
                        className="pp-input pp-textarea"
                        value={form.bio}
                        onChange={setField('bio')}
                        placeholder="Ceritakan pengalaman, pendekatan terapi, dan siapa saja yang Anda dampingi."
                        rows={4}
                      />
                    </label>
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-header">
                      <MapPin size={18} />
                      <div>
                        <h2 className="pp-card-title">Lokasi Praktik</h2>
                        <p className="pp-card-sub">Cari alamat atau klik peta untuk menandai lokasi klinik. Tanpa titik lokasi, profil tidak muncul di peta Cari Psikolog.</p>
                      </div>
                    </div>

                    <div className="pp-row">
                      <label className="pp-field">
                        <span className="pp-label">Kota</span>
                        <input
                          className="pp-input"
                          value={form.kota}
                          onChange={setField('kota')}
                          placeholder="Contoh: Jakarta Selatan"
                          maxLength={50}
                        />
                      </label>
                      <label className="pp-field">
                        <span className="pp-label">Alamat Praktik / Nama Klinik</span>
                        <input
                          className="pp-input"
                          value={form.alamat_praktik}
                          onChange={setField('alamat_praktik')}
                          placeholder="Klinik Jiwa Harmoni, Jl. ..."
                        />
                      </label>
                    </div>

                    <LocationPicker
                      lat={form.latitude}
                      lng={form.longitude}
                      onChange={setLocation}
                      suggestedQuery={[form.alamat_praktik, form.kota].filter(Boolean).join(', ')}
                    />

                    <div className="pp-location-actions">
                      <span className="pp-muted">
                        {form.latitude !== null && form.longitude !== null
                          ? `Titik: ${form.latitude}, ${form.longitude}`
                          : 'Belum ada titik lokasi.'}
                      </span>
                      <div className="pp-location-buttons">
                        {form.latitude !== null && (
                          <button type="button" className="pp-link-btn" onClick={() => setLocation(null, null)}>
                            Hapus titik
                          </button>
                        )}
                        <button type="button" className="pp-btn-secondary" onClick={handleUseMyLocation} disabled={locating}>
                          <LocateFixed size={15} />
                          <span>{locating ? 'Mencari…' : 'Gunakan lokasi saya'}</span>
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-header">
                      <Wallet size={18} />
                      <div>
                        <h2 className="pp-card-title">Tarif Konsultasi</h2>
                        <p className="pp-card-sub">Tarif per sesi 60 menit yang dibayar klien saat membuat janji temu. Isi 0 untuk sesi gratis.</p>
                      </div>
                    </div>

                    <label className="pp-field">
                      <span className="pp-label">Tarif per Sesi (Rp)</span>
                      <input
                        type="number"
                        className="pp-input"
                        value={form.tarif_sesi}
                        onChange={setField('tarif_sesi')}
                        min={0}
                        max={10000000}
                        step={1000}
                        inputMode="numeric"
                      />
                    </label>

                    {Number(form.tarif_sesi) > 0 && (
                      <dl className="pay-split">
                        <dt>Dibayar klien</dt>
                        <dd>{formatRupiah(Number(form.tarif_sesi) + BIAYA_LAYANAN)}</dd>
                        <dt>Komisi Bina Jiwa ({KOMISI_PERSEN_PSIKOLOG}%)</dt>
                        <dd>{formatRupiah(Number(form.tarif_sesi) - netForPsychologist(form.tarif_sesi))}</dd>
                        <dt>Anda terima per sesi</dt>
                        <dd>{formatRupiah(netForPsychologist(form.tarif_sesi))}</dd>
                      </dl>
                    )}
                  </section>

                  <section className="pp-card">
                    <div className="pp-card-header">
                      <FileBadge size={18} />
                      <div>
                        <h2 className="pp-card-title">Legalitas &amp; Verifikasi</h2>
                        <p className="pp-card-sub">Dipakai admin untuk memverifikasi Anda. Link dokumen tidak ditampilkan ke publik.</p>
                      </div>
                    </div>

                    <div className="pp-row">
                      <label className="pp-field">
                        <span className="pp-label">Nomor Anggota HIMPSI</span>
                        <input className="pp-input" value={form.nomor_himpsi} onChange={setField('nomor_himpsi')} maxLength={50} />
                      </label>
                      <label className="pp-field">
                        <span className="pp-label">Nomor SIPP</span>
                        <input className="pp-input" value={form.nomor_sipp} onChange={setField('nomor_sipp')} maxLength={50} />
                      </label>
                    </div>

                    <label className="pp-field">
                      <span className="pp-label">Link Dokumen Verifikasi (STR / SIPP / Ijazah)</span>
                      <input
                        type="url"
                        className="pp-input"
                        value={form.dokumen_verifikasi_url}
                        onChange={setField('dokumen_verifikasi_url')}
                        placeholder="https://drive.google.com/..."
                        maxLength={500}
                      />
                    </label>

                    {licenseChanged && (
                      <div className="pp-banner pp-banner-warning pp-banner-compact">
                        <AlertCircle size={16} />
                        <span>Mengubah data legalitas akan mengembalikan status ke <b>Menunggu Verifikasi</b> dan profil disembunyikan sementara.</span>
                      </div>
                    )}
                  </section>

                  <section className="pp-card">
                    <label className="pp-toggle-row">
                      <div>
                        <span className="pp-card-title">Tampilkan di Cari Psikolog</span>
                        <p className="pp-card-sub">Matikan bila Anda sedang cuti atau tidak menerima klien baru.</p>
                      </div>
                      <input
                        type="checkbox"
                        className="pp-switch"
                        checked={form.status === 'ACTIVE'}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, status: e.target.checked ? 'ACTIVE' : 'INACTIVE' }));
                          setSuccess('');
                        }}
                      />
                    </label>
                  </section>

                  {error && (
                    <div className="auth-error-alert">
                      <AlertCircle size={18} />
                      <span>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className="auth-success-alert">
                      <CheckCircle2 size={18} />
                      <span>{success}</span>
                    </div>
                  )}

                  <button type="submit" className="pp-btn-primary" disabled={saving}>
                    <Save size={17} />
                    <span>{saving ? 'Menyimpan…' : profile ? 'Simpan Perubahan' : 'Buat Profil & Ajukan Verifikasi'}</span>
                  </button>
                </form>

                {/* Kolom kanan: jadwal */}
                <div className="pp-side-column">
                  {profile ? (
                    <ScheduleManager profile={profile} />
                  ) : (
                    <section className="pp-card">
                      <div className="pp-card-header">
                        <CalendarClock size={18} />
                        <div>
                          <h2 className="pp-card-title">Jadwal Praktik Mingguan</h2>
                          <p className="pp-card-sub">Simpan profil praktik terlebih dahulu untuk mengatur jadwal.</p>
                        </div>
                      </div>
                    </section>
                  )}

                  <button type="button" className="pp-btn-secondary pp-full" onClick={() => navigate('/psikolog')}>
                    <Search size={16} />
                    <span>Lihat halaman Cari Psikolog</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
