import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Heart, ArrowLeft, Shield, Users, Star, Sparkles } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import AnimatedBackground from '../components/ui/AnimatedBackground';

export default function AuthPage({ initialMode = 'login', onAuthSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState(() => {
    if (location.pathname === '/register') return 'register';
    return initialMode;
  });

  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register');
    } else if (location.pathname === '/login') {
      setMode('login');
    }
  }, [location.pathname]);

  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    navigate(newMode === 'register' ? '/register' : '/login');
  };

  const handleBackToHome = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="auth-page-wrapper">
      <AnimatedBackground />

      {/* Top Bar Navigation */}
      <header className="auth-page-nav">
        <button type="button" className="auth-back-btn" onClick={handleBackToHome}>
          <ArrowLeft size={18} />
          <span>Kembali ke Beranda</span>
        </button>

        <Link to="/" className="nav-brand">
          <div className="brand-icon">
            <Heart size={20} fill="#ffffff" color="#ffffff" />
          </div>
          <span className="brand-name">Bina Jiwa</span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="auth-page-container">
        {/* Left Side: Branding / Value Prop Badges */}
        <div className="auth-page-hero">
          <div className="auth-hero-pill">
            <Sparkles size={16} />
            <span>Platform Kesehatan Mental Terintegrasi</span>
          </div>

          <h1 className="auth-hero-title">
            Ruang Aman untuk <span className="text-highlight">Tumbuh</span>, <span className="text-highlight">Pulih</span>, &amp; Menemukan Ketenangan.
          </h1>

          <p className="auth-hero-desc">
            Bergabunglah bersama ribuan orang yang telah memulai langkah penyembuhan jiwa dengan pendampingan psikolog profesional 24/7.
          </p>

          {/* Floating Trust Cards */}
          <div className="auth-trust-cards">
            <div className="trust-card">
              <div className="trust-icon-box">
                <Users size={20} color="#0284c7" />
              </div>
              <div className="trust-text">
                <span className="trust-val">250+ Psikolog</span>
                <span className="trust-lbl">Siap mendampingi 24/7</span>
              </div>
            </div>

            <div className="trust-card">
              <div className="trust-icon-box">
                <Shield size={20} color="#0284c7" />
              </div>
              <div className="trust-text">
                <span className="trust-val">100% Privasi</span>
                <span className="trust-lbl">Data terenkripsi aman</span>
              </div>
            </div>

            <div className="trust-card">
              <div className="trust-icon-box">
                <Star size={20} color="#eab308" fill="#eab308" />
              </div>
              <div className="trust-text">
                <span className="trust-val">4.9 / 5</span>
                <span className="trust-lbl">Tingkat kepuasan pasien</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Glassmorphic Auth Form */}
        <div className="auth-page-card-container">
          <div className="auth-page-card">
            {/* Mode Switcher Tabs */}
            <div className="auth-modal-tab-bar">
              <button
                type="button"
                className={`auth-modal-tab-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => handleSwitchMode('login')}
              >
                <span>Masuk</span>
              </button>
              <button
                type="button"
                className={`auth-modal-tab-btn ${mode === 'register' ? 'active' : ''}`}
                onClick={() => handleSwitchMode('register')}
              >
                <span>Daftar Akun</span>
                <span className="tab-badge-new">Gratis</span>
              </button>
            </div>

            {mode === 'login' ? (
              <LoginForm
                onSwitchToRegister={() => handleSwitchMode('register')}
                onSuccess={(user) => {
                  if (onAuthSuccess) onAuthSuccess(user);
                  navigate('/');
                }}
                onClose={handleBackToHome}
              />
            ) : (
              <RegisterForm
                onSwitchToLogin={() => handleSwitchMode('login')}
                onSuccess={(user) => {
                  if (onAuthSuccess) onAuthSuccess(user);
                  navigate('/');
                }}
                onClose={handleBackToHome}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
