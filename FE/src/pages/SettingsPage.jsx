import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Check, 
  Save, 
  Camera, 
  Trash2,
  AlertCircle,
} from 'lucide-react';
import DashboardHeader from '../components/dashboard/navigation/DashboardHeader';
import { updateProfileService } from '../service/authService';
import {
  PROFILE_IMAGE_BUCKET,
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_TYPES,
  uploadFile,
} from '../service/storageService';

export default function SettingsPage({ user, onUpdateUser, onToggleSidebar }) {
  const [name, setName] = useState(user?.name || 'Pengguna');
  const [email] = useState(user?.email || 'user@binajiwa.id');
  const [city, setCity] = useState(user?.city || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // File baru yang belum diunggah; diunggah ke Supabase Storage saat disimpan.
  const [pendingFile, setPendingFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || 'Pengguna');
      setAvatar(user.avatar || '');
      setCity(user.city || '');
    }
  }, [user]);

  // Lepaskan URL pratinjau lokal saat diganti / halaman ditutup.
  useEffect(() => {
    if (!avatar.startsWith('blob:')) return undefined;
    return () => URL.revokeObjectURL(avatar);
  }, [avatar]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // agar file yang sama bisa dipilih lagi
    if (!file) return;
    setError('');

    if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
      setError('Format foto harus PNG, JPG, atau WebP.');
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      setError('Ukuran file foto maksimal adalah 5MB.');
      return;
    }

    setPendingFile(file);
    setAvatar(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setPendingFile(null);
    setAvatar('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const avatarUrl = pendingFile ? await uploadFile(PROFILE_IMAGE_BUCKET, pendingFile) : avatar;
      const updatedUser = await updateProfileService({
        name,
        avatar: avatarUrl || null,
        city: city || null,
      });
      setPendingFile(null);
      setAvatar(updatedUser.avatar || '');

      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3500);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan perubahan profil.');
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
            {error && (
              <div className="auth-error-alert" style={{ marginBottom: '20px' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
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
                        onClick={handleRemoveAvatar}
                        title="Kembali ke foto polos"
                      >
                        <Trash2 size={16} />
                        <span>Hapus Foto (Gunakan Polos)</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={PROFILE_IMAGE_TYPES.join(',')}
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
