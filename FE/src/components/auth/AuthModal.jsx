import React, { useEffect, useState } from 'react';
import { X, Heart, Sparkles } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'

  // Update mode when initialMode prop changes or modal opens
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Background Decorative Glow Orbs */}
        <div className="auth-modal-glow glow-1"></div>
        <div className="auth-modal-glow glow-2"></div>

        {/* Modal Top Header Bar */}
        <div className="auth-modal-top">
          <div className="auth-brand-badge">
            <div className="brand-icon-sm">
              <Heart size={16} fill="#ffffff" color="#ffffff" />
            </div>
            <span className="brand-title">Bina Jiwa</span>
          </div>

          {/* Close button */}
          <button className="auth-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Main Tab Switcher */}
        <div className="auth-modal-tab-bar">
          <button
            type="button"
            className={`auth-modal-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            <span>Masuk</span>
          </button>
          <button
            type="button"
            className={`auth-modal-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            <span>Daftar Akun</span>
            <span className="tab-badge-new">Gratis</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="auth-modal-body">
          {mode === 'login' ? (
            <LoginForm
              onSwitchToRegister={() => setMode('register')}
              onSuccess={(user) => {
                if (onAuthSuccess) onAuthSuccess(user);
                onClose();
              }}
              onClose={onClose}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setMode('login')}
              onSuccess={(user) => {
                if (onAuthSuccess) onAuthSuccess(user);
                onClose();
              }}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
