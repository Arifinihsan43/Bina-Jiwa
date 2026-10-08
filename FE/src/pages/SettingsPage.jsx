import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Check, 
  Save, 
  Camera, 
  Trash2 
} from 'lucide-react';
import DashboardHeader from '../components/dashboard/navigation/DashboardHeader';
import { updateProfileService } from '../service/authService';

export default function SettingsPage({ user, onUpdateUser, onToggleSidebar }) {
  const [name, setName] = useState(user?.name || 'Pengguna');
  const [email] = useState(user?.email || 'user@binajiwa.id');
  const [city, setCity] = useState(user?.city || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || 'Pengguna');
      setAvatar(user.avatar || '');
      setCity(user.city || '');
    }
  }, [user]);

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
        city: city || null,
      });

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3500);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert(err.message || 'Gagal menyimpan perubahan profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="db-main-content">
      <DashboardHeader onToggleSidebar={onToggleSidebar} />

      <div className="db-scrollable-body">
        {/* Page Banner Header */}
        <div className="db-page-banner">
          <div className="db-page-banner-icon settings-banner-icon">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="db-page-title">Pengaturan Akun &amp; Profil</h1>
            <p className="db-page-subtitle">
              Kelola profil diri, foto tampilan, dan informasi akunmu.
            </p>
          </div>
        </div>

        {/* Settings Form Card */}
        <div className="settings-page-card">
          <form onSubmit={handleSave} className="settings-page-form">
            {savedSuccess && (
              <div className="auth-success-alert" style={{ marginBottom: '20px' }}>
                <Check size={18} />
                <span>Pengaturan profil kamu berhasil diperbarui!</span>
              </div>
            )}

            <div className="settings-section">
              <h3 className="settings-section-title">Foto Profil &amp; Identitas Diri</h3>

              {/* Avatar Uploader */}
              <div className="settings-field">
                <label className="db-field-label">Foto Profil Tampilan</label>
                <div className="settings-avatar-wrapper settings-page-avatar-wrapper">
                  {avatar ? (
                    <img src={avatar} alt="Preview Foto Profil" className="settings-avatar-img settings-page-avatar-img" />
                  ) : (
                    <div className="settings-avatar-placeholder settings-page-avatar-placeholder" title="Foto Profil Polos (Default)">
                      <User size={36} />
                    </div>
                  )}

                  <div className="settings-avatar-actions">
                    <button
                      type="button"
                      className="db-btn-secondary settings-avatar-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={16} />
                      <span>{avatar ? 'Ubah Foto' : 'Unggah Foto Baru'}</span>
                    </button>
                    {avatar && (
                      <button
                        type="button"
                        className="settings-avatar-remove-btn"
                        onClick={() => setAvatar('')}
                        title="Kembali ke foto polos"
                      >
                        <Trash2 size={16} />
                        <span>Hapus Foto (Gunakan Polos)</span>
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
                <span className="settings-field-hint">
                  Format file gambar didukung: PNG, JPG, WebP. Ukuran maksimal 5MB. Foto polos digunakan bila foto dihapus.
                </span>
              </div>

              <div className="settings-grid-2">
                <div className="settings-field">
                  <label className="db-field-label">Nama Lengkap / Tampilan</label>
                  <input
                    type="text"
                    className="db-textarea"
                    style={{ height: '44px', minHeight: 'auto' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="settings-field">
                  <label className="db-field-label">Kota Tempat Tinggal</label>
                  <input
                    type="text"
                    className="db-textarea"
                    style={{ height: '44px', minHeight: 'auto' }}
                    placeholder="Contoh: Jakarta Selatan, Yogyakarta"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="settings-grid-2">
                <div className="settings-field">
                  <label className="db-field-label">Email Terdaftar</label>
                  <input
                    type="email"
                    className="db-textarea"
                    style={{ height: '44px', minHeight: 'auto', background: '#f1f5f9', cursor: 'not-allowed' }}
                    value={email}
                    disabled
                  />
                </div>

                <div className="settings-field">
                  <label className="db-field-label">Peran Akun Sistem</label>
                  <div style={{ paddingTop: '6px' }}>
                    <span className="db-badge db-badge-cyan" style={{ fontSize: '13px', padding: '6px 14px' }}>
                      {user?.role === 'doctor' ? 'Psikolog Terverifikasi' : 'Pengguna (Pasien / Klien)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-page-footer">
              <button type="submit" className="db-btn-primary settings-submit-btn" disabled={isSubmitting}>
                <Save size={18} />
                <span>{isSubmitting ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
