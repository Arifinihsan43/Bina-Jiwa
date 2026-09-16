import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, UserCheck, Stethoscope, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { registerService } from '../service/authService';

export default function RegisterForm({ onSwitchToLogin, onSuccess, onClose }) {
  const [role, setRole] = useState('user'); // 'user' | 'doctor'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Helper for password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: '', score: 0, color: '#e2e8f0' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8 && /[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score === 1) return { label: 'Lemah', score: 33, color: '#f87171' };
    if (score === 2) return { label: 'Sedang', score: 66, color: '#fbbf24' };
    if (score >= 3) return { label: 'Sangat Kuat', score: 100, color: '#34d399' };
    return { label: 'Lemah', score: 25, color: '#f87171' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Mohon lengkapi seluruh formulir pendaftaran.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!agreedTerms) {
      setError('Anda harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi.');
      return;
    }

    setIsLoading(true);

    try {
      const userData = await registerService({ name, email, phone, password, role });
      setIsLoading(false);
      if (onSuccess) {
        onSuccess(userData);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
    }
  };

  return (
    <div className="auth-form-container">
      {/* Header */}
      <div className="auth-form-header">
        <span className="auth-subtitle-tag">Bergabung Sekarang</span>
        <h2 className="auth-title">Buat Akun Bina Jiwa</h2>
        <p className="auth-description">
          Dapatkan akses konseling pribadi, pelacakan suasana hati, dan materi relaksasi.
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
          <span>Daftar Mitra Psikolog</span>
        </button>
      </div>

      {/* Alert Error if any */}
      {error && (
        <div className="auth-error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Full Name */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-name">
            Nama Lengkap
          </label>
          <div className="auth-input-wrapper">
            <User className="auth-field-icon" size={19} />
            <input
              id="reg-name"
              type="text"
              className="auth-input"
              placeholder="Contoh: Anisa Rahmawati"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-email">
            Alamat Email
          </label>
          <div className="auth-input-wrapper">
            <Mail className="auth-field-icon" size={19} />
            <input
              id="reg-email"
              type="email"
              className="auth-input"
              placeholder="nama@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* WhatsApp Phone Number */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-phone">
            Nomor WhatsApp (Opsional)
          </label>
          <div className="auth-input-wrapper">
            <Phone className="auth-field-icon" size={19} />
            <input
              id="reg-phone"
              type="tel"
              className="auth-input"
              placeholder="081234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-password">
            Kata Sandi
          </label>
          <div className="auth-input-wrapper">
            <Lock className="auth-field-icon" size={19} />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Minimal 8 karakter"
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

          {/* Password Strength Meter */}
          {password && (
            <div className="password-strength-container">
              <div className="password-strength-bar-bg">
                <div
                  className="password-strength-bar-fill"
                  style={{
                    width: `${strength.score}%`,
                    backgroundColor: strength.color
                  }}
                ></div>
              </div>
              <span className="password-strength-text" style={{ color: strength.color }}>
                Kekuatan: {strength.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="reg-confirm-password">
            Konfirmasi Kata Sandi
          </label>
          <div className="auth-input-wrapper">
            <Lock className="auth-field-icon" size={19} />
            <input
              id="reg-confirm-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Ulangi kata sandi Anda"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {confirmPassword && password === confirmPassword && (
              <CheckCircle2 className="auth-match-icon" size={18} color="#0284c7" />
            )}
          </div>
        </div>

        {/* Terms & Conditions Checkbox */}
        <div className="auth-options-row">
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              className="auth-checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              required
            />
            <span>
              Saya menyetujui{' '}
              <a href="#terms" className="auth-inline-link" onClick={(e) => e.preventDefault()}>
                Syarat & Ketentuan
              </a>{' '}
              serta{' '}
              <a href="#privacy" className="auth-inline-link" onClick={(e) => e.preventDefault()}>
                Kebijakan Privasi
              </a>{' '}
              Bina Jiwa.
            </span>
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
              <span>Daftar Akun Gratis</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Privacy guarantee badge */}
      <div className="auth-privacy-badge">
        <ShieldCheck size={16} />
        <span>100% Data & Privasi Anda Terenkripsi dengan Aman</span>
      </div>

      {/* Switch to Login footer */}
      <div className="auth-footer-note">
        Sudah memiliki akun Bina Jiwa?{' '}
        <button type="button" className="auth-switch-btn" onClick={onSwitchToLogin}>
          Masuk di sini
        </button>
      </div>
    </div>
  );
}
