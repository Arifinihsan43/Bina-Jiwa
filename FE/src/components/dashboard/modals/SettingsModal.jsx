import React, { useState, useRef, useEffect } from 'react';
import { Settings, X, User, Bell, Shield, Check, Save, Camera, Trash2 } from 'lucide-react';
import { updateProfileService } from '../../../service/authService';

export default function SettingsModal({ isOpen, onClose, user, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || 'Pengguna');
  const [email] = useState(user?.email || 'user@binajiwa.id');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [dailyReminder, setDailyReminder] = useState(true);
  const [appointmentReminder, setAppointmentReminder] = useState(true);
  const [anonymousDefault, setAnonymousDefault] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || 'Pengguna');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file foto maksimal adalah 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updatedUser = await updateProfileService({
        name,
        avatar: avatar || null,
      });

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert(err.message || 'Gagal menyimpan perubahan profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mc-modal-overlay" onClick={onClose}>
      <div className="mc-modal-card settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="mc-modal-close-btn"
          onClick={onClose}
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        <div className="settings-modal-header">
          <div className="settings-icon-badge">
            <Settings size={24} color="#0284c7" />
          </div>
          <div>
            <h2 className="settings-modal-title">Pengaturan Akun &amp; Aplikasi</h2>
            <p className="settings-modal-sub">Kelola preferensi akun, notifikasi, dan privasimu.</p>
          </div>
        </div>

        <div className="settings-tab-nav">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} />
            <span>Profil</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell size={16} />
            <span>Notifikasi</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <Shield size={16} />
            <span>Privasi</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="settings-modal-body">
          {activeTab === 'profile' && (
            <div className="settings-section">
              {/* Foto Profil */}
              <div className="settings-field">
                <label className="db-field-label">Foto Profil</label>
                <div className="settings-avatar-wrapper">
                  {avatar ? (
                    <img src={avatar} alt="Preview Foto Profil" className="settings-avatar-img" />
                  ) : (
                    <div className="settings-avatar-placeholder" title="Foto Profil Polos (Default)">
                      <User size={32} />
                    </div>
                  )}

                  <div className="settings-avatar-actions">
                    <button
                      type="button"
                      className="db-btn-secondary settings-avatar-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={16} />
                      <span>{avatar ? 'Ubah Foto' : 'Unggah Foto'}</span>
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        className="settings-avatar-remove-btn"
                        onClick={() => setAvatar('')}
                        title="Hapus Foto (Kembali ke Polos)"
                      >
                        <Trash2 size={16} />
                        <span>Hapus Foto</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                <span className="settings-field-hint">Pilih foto pribadi (PNG, JPG, WebP. Maksimal 5MB) untuk mengganti foto profil polos.</span>
              </div>

              <div className="settings-field" style={{ marginTop: '16px' }}>
                <label className="db-field-label">Nama Lengkap / Tampilan</label>
                <input
                  type="text"
                  className="db-textarea"
                  style={{ height: '42px', minHeight: 'auto' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="settings-field">
                <label className="db-field-label">Email Terdaftar</label>
                <input
                  type="email"
                  className="db-textarea"
                  style={{ height: '42px', minHeight: 'auto', background: '#f1f5f9', cursor: 'not-allowed' }}
                  value={email}
                  disabled
                />
              </div>

              <div className="settings-field">
                <label className="db-field-label">Peran Akun</label>
                <span className="db-badge db-badge-cyan" style={{ display: 'inline-block', width: 'fit-content' }}>
                  {user?.role === 'doctor' ? 'Psikolog Terverifikasi' : 'Pengguna (Pasien / Klien)'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="settings-toggle-row">
                <div>
                  <span className="settings-toggle-title">Pengingat Mood Harian</span>
                  <p className="settings-toggle-desc">Terima pengingat harian untuk mencatat emosi batinmu.</p>
                </div>
                <input
                  type="checkbox"
                  className="settings-checkbox"
                  checked={dailyReminder}
                  onChange={(e) => setDailyReminder(e.target.checked)}
                />
              </div>

              <div className="settings-toggle-row">
                <div>
                  <span className="settings-toggle-title">Notifikasi Janji Temu Konseling</span>
                  <p className="settings-toggle-desc">Pengingat 15 menit sebelum sesi konseling dimulai.</p>
                </div>
                <input
                  type="checkbox"
                  className="settings-checkbox"
                  checked={appointmentReminder}
                  onChange={(e) => setAppointmentReminder(e.target.checked)}
                />
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="settings-section">
              <div className="settings-toggle-row">
                <div>
                  <span className="settings-toggle-title">Mode Anonim di Forum Komunitas</span>
                  <p className="settings-toggle-desc">Gunakan nama acak/persona secara otomatis saat membuat postingan baru.</p>
                </div>
                <input
                  type="checkbox"
                  className="settings-checkbox"
                  checked={anonymousDefault}
                  onChange={(e) => setAnonymousDefault(e.target.checked)}
                />
              </div>
            </div>
          )}

          {savedSuccess && (
            <div className="auth-success-alert" style={{ margin: '12px 0 0 0' }}>
              <Check size={16} />
              <span>Pengaturan berhasil disimpan!</span>
            </div>
          )}

          <div className="settings-modal-footer">
            <button type="button" className="db-btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </button>
            <button type="submit" className="db-btn-primary" disabled={isSubmitting}>
              <Save size={16} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

