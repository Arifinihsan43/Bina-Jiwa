import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { handleOAuthCallback } from '../service/authService';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2, Shield } from 'lucide-react';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import BinaJiwaLogo from '../components/common/BinaJiwaLogo';

export default function AuthCallbackPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const processOAuth = async () => {
      try {
        const userData = await handleOAuthCallback();
        if (!isMounted) return;

        setStatus('success');
        setTimeout(() => {
          if (onAuthSuccess) {
            onAuthSuccess(userData);
          } else {
            navigate('/dashboard', { replace: true });
          }
        }, 800);
      } catch (err) {
        if (!isMounted) return;
        console.error('OAuth Callback Error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'Gagal memproses autentikasi Google. Silakan coba masuk kembali.');
      }
    };

    processOAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate, onAuthSuccess]);

  return (
    <div className="auth-page-wrapper">
      <AnimatedBackground />

      <header className="auth-page-nav">
        <Link to="/login" className="auth-back-btn">
          <ArrowLeft size={18} />
          <span>Kembali ke Halaman Masuk</span>
        </Link>

        <div className="auth-nav-right">
          <Link to="/" className="nav-brand">
            <div className="brand-icon">
              <BinaJiwaLogo size={32} />
            </div>
            <span className="brand-name">Bina Jiwa</span>
          </Link>
        </div>
      </header>

      <main className="auth-callback-container">
        <div className="auth-callback-card">
          {status === 'loading' && (
            <div className="callback-loading-box">
              <div className="callback-icon-box loading">
                <div className="callback-pulse-ring" />
                <Loader2 className="animate-spin" size={32} color="#0284c7" />
              </div>
              <h2 className="auth-title" style={{ fontSize: '1.45rem', marginBottom: '8px', color: '#0f172a' }}>
                Menghubungkan Akun Google...
              </h2>
              <p className="auth-description" style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto' }}>
                Mohon tunggu sejenak, kami sedang menyiapkan ruang aman dan sesi masuk Anda ke Bina Jiwa.
              </p>

              <div className="callback-progress-track">
                <div className="callback-progress-bar" />
              </div>

              <div style={{ marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                <Shield size={14} color="#0284c7" />
                <span>Koneksi aman terenkripsi SSL 256-bit</span>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="callback-success-box">
              <div className="callback-icon-box success">
                <CheckCircle2 size={36} color="#10b981" />
              </div>
              <h2 className="auth-title" style={{ fontSize: '1.45rem', color: '#047857', marginBottom: '8px' }}>
                Berhasil Masuk!
              </h2>
              <p className="auth-description" style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto' }}>
                Autentikasi akun Google berhasil. Mengalihkan Anda ke halaman dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="callback-error-box">
              <div className="callback-icon-box error">
                <AlertCircle size={36} color="#ef4444" />
              </div>
              <h2 className="auth-title" style={{ fontSize: '1.35rem', color: '#b91c1c', marginBottom: '10px' }}>
                Gagal Menghubungkan Google
              </h2>
              <p className="auth-description" style={{ fontSize: '0.92rem', marginBottom: '24px', color: '#475569', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto' }}>
                {errorMessage}
              </p>
              <Link
                to="/login"
                className="auth-btn-primary"
                style={{ display: 'inline-flex', textDecoration: 'none', justifyContent: 'center', width: 'auto', padding: '12px 24px', margin: '0 auto' }}
              >
                Kembali ke Halaman Masuk
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
