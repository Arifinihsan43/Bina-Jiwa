import React, { useEffect } from 'react';
import { LogOut, X, User, ShieldCheck } from 'lucide-react';
import './LogoutConfirmModal.css';

export default function LogoutConfirmModal({
  user,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) {
  // ESC key listener to cancel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, isSubmitting]);

  // Lock body scroll while modal is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onCancel();
    }
  };

  return (
    <div
      className="logout-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div className="logout-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="logout-close-btn"
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Tutup modal"
          title="Batal"
        >
          <X size={18} />
        </button>

        {/* Warning / Logout Icon Header */}
        <div className="logout-icon-container">
          <LogOut size={28} strokeWidth={2.2} />
        </div>

        {/* Title & Subtitle */}
        <h3 id="logout-modal-title" className="logout-modal-title">
          Keluar dari Akun?
        </h3>
        <p className="logout-modal-subtitle">
          Apakah Anda yakin ingin mengakhiri sesi ini? Anda perlu masuk kembali untuk mengakses dashboard Anda.
        </p>

        {/* User Profile Preview Card */}
        <div className="logout-user-preview">
          <div className="logout-user-row">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.name || 'User Profile'}
                className="logout-user-avatar"
              />
            ) : (
              <div className="logout-user-avatar-placeholder">
                <User size={22} />
              </div>
            )}
            <div className="logout-user-details">
              <span className="logout-user-name">
                {user?.name || 'Pengguna Bina Jiwa'}
              </span>
              <span className="logout-user-meta">
                <span className="logout-status-dot"></span>
                <span>{user?.status || 'Sesi Aktif'}</span>
              </span>
            </div>
          </div>
          <div className="logout-user-note">
            <ShieldCheck size={14} color="#059669" />
            <span>Data & riwayat konsultasi Anda tetap tersimpan aman.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="logout-modal-actions">
          <button
            type="button"
            className="logout-btn-cancel"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            className="logout-btn-confirm"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="logout-spinner"></span>
                <span>Mengeluarkan...</span>
              </>
            ) : (
              <>
                <LogOut size={16} />
                <span>Ya, Keluar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
