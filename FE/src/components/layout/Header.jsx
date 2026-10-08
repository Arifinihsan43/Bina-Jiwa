import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, CheckCircle2 } from 'lucide-react';
import BinaJiwaLogo from '../common/BinaJiwaLogo';

export default function Header({ user, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (sectionId) => (e) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand Logo */}
        <Link to="/" className="nav-brand">
          <div className="brand-icon">
            <BinaJiwaLogo size={32} />
          </div>
          <span className="brand-name">Bina Jiwa</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="nav-links">
          <a href="/" onClick={handleNavClick('fitur')} className="nav-link">Fitur Utama</a>
          <a href="/" onClick={handleNavClick('cara-kerja')} className="nav-link">Cara Kerja</a>
          <a href="/" onClick={handleNavClick('spesialisasi')} className="nav-link">Spesialisasi</a>
          <a href="/" onClick={handleNavClick('event')} className="nav-link">Event</a>
          <a href="/" onClick={handleNavClick('faq')} className="nav-link">FAQ</a>
        </div>

        {/* Right CTA Buttons */}
        <div className="nav-actions">
          {user ? (
            <div className="user-profile-badge">
              <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: 'none', padding: '6px 12px', fontSize: '13px' }}>
                Dashboard
              </Link>
              <div className="user-avatar-sm">
                <CheckCircle2 size={16} color="#0284c7" />
              </div>
              <span className="user-email-name">{user.name || user.email}</span>
              <button 
                type="button" 
                className="btn-logout" 
                onClick={onLogout}
                title="Keluar Akun"
              >
                <LogOut size={16} />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <>
              <Link 
                to="/register"
                className="btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                <User size={18} />
                <span>Daftar</span>
              </Link>
              <Link 
                to="/login"
                className="btn-primary"
                style={{ textDecoration: 'none' }}
              >
                Masuk
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <a href="/" onClick={(e) => { handleNavClick('fitur')(e); setIsMobileMenuOpen(false); }}>Fitur Utama</a>
          <a href="/" onClick={(e) => { handleNavClick('cara-kerja')(e); setIsMobileMenuOpen(false); }}>Cara Kerja</a>
          <a href="/" onClick={(e) => { handleNavClick('spesialisasi')(e); setIsMobileMenuOpen(false); }}>Spesialisasi</a>
          <a href="/" onClick={(e) => { handleNavClick('event')(e); setIsMobileMenuOpen(false); }}>Event</a>
          <a href="/" onClick={(e) => { handleNavClick('faq')(e); setIsMobileMenuOpen(false); }}>FAQ</a>
          <div className="mobile-actions">
            {user ? (
              <button 
                className="btn-logout-mobile" 
                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
              >
                <LogOut size={18} />
                <span>Keluar ({user.name || user.email})</span>
              </button>
            ) : (
              <>
                <Link 
                  to="/register"
                  className="btn-secondary" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  <User size={18} />
                  <span>Daftar</span>
                </Link> 
                <Link 
                  to="/login"
                  className="btn-primary" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ textDecoration: 'none' }}
                >
                  Masuk
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
