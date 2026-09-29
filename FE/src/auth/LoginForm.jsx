import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserCheck, Stethoscope, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginService } from '../service/authService';

export default function LoginForm({ onSwitchToRegister, onSuccess, notice }) {
  const [role, setRole] = useState('user'); // 'user' | 'doctor'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Mohon isi semua bidang yang diperlukan.');
      return;
    }

    setIsLoading(true);
    
    try {
      const userData = await loginService({ email, password, role, rememberMe });
      setIsLoading(false);
      if (onSuccess) {
        onSuccess(userData);
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Gagal masuk. Silakan coba lagi.');
    }
  };

  return (
    <div className="auth-form-container">
      {/* Header */}
      <div className="auth-form-header">
        <span className="auth-subtitle-tag">Selamat Datang Kembali</span>
        <h2 className="auth-title">Masuk ke Bina Jiwa</h2>
        <p className="auth-description">
          Lanjutkan perjalanan kesehatan mental Anda bersama konselor & komunitas aman kami.
        </p>
      </div>

      {/* Role Selection Tabs */}
      <div className="auth-role-tabs">
        <button
          type="button"
          className={`auth-role-tab ${role === 'user' ? 'active' : ''}`}
          onClick={() => setRole('user')}
        >
          <UserCheck size={18} />
          <span>Pengguna Umum</span>
        </button>
        <button
          type="button"
          className={`auth-role-tab ${role === 'doctor' ? 'active' : ''}`}
          onClick={() => setRole('doctor')}
        >
          <Stethoscope size={18} />
          <span>Psikolog / Konselor</span>
        </button>
      </div>

      {/* Info notice (mis. setelah registrasi) */}
      {notice && !error && (
        <div className="auth-success-alert">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {/* Alert Error if any */}
      {error && (
        <div className="auth-error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Email Field */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-email">
            Alamat Email
          </label>
          <div className="auth-input-wrapper">
            <Mail className="auth-field-icon" size={19} />
            <input
              id="login-email"
              type="email"
              className="auth-input"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="auth-field">
          <div className="auth-label-row">
            <label className="auth-label" htmlFor="login-password">
              Kata Sandi
            </label>
            <a href="#forgot" className="auth-forgot-link" onClick={(e) => { e.preventDefault(); alert('Link pemulihan kata sandi telah dikirim ke email Anda.'); }}>
              Lupa Kata Sandi?
            </a>
          </div>
          <div className="auth-input-wrapper">
            <Lock className="auth-field-icon" size={19} />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Masukkan kata sandi Anda"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="auth-options-row">
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              className="auth-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Ingat saya di perangkat ini</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`auth-btn-primary ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="btn-spinner"></span>
          ) : (
            <>
              <span>Masuk Sekarang</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="auth-divider">
        <span>atau masuk dengan</span>
      </div>

      {/* Social Login */}
      <div className="auth-social-group">
        <button
          type="button"
          className="auth-social-btn"
          onClick={() => alert('Login dengan Google disimulasikan! Berhasil masuk.')}
        >
          <svg className="google-icon" width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Lanjutkan dengan Google</span>
        </button>
      </div>

      {/* Switch to Register footer */}
      <div className="auth-footer-note">
        Belum memiliki akun Bina Jiwa?{' '}
        <button type="button" className="auth-switch-btn" onClick={onSwitchToRegister}>
          Daftar Gratis
        </button>
      </div>
    </div>
  );
}
