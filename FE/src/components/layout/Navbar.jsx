import React, { useState } from 'react';
import { Heart, Menu, X, User, LogOut, CheckCircle2 } from 'lucide-react';

export default function Navbar({ onOpenLogin, onOpenRegister, user, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Brand Logo */}
        <a href="#" className="nav-brand">
          <div className="brand-icon">
            <Heart size={20} fill="#ffffff" color="#ffffff" />
          </div>
          <span className="brand-name">Bina Jiwa</span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="nav-links">
          <a href="#fitur" className="nav-link">Fitur Utama</a>
          <a href="#cara-kerja" className="nav-link">Cara Kerja</a>
          <a href="#spesialisasi" className="nav-link">Spesialisasi</a>
          <a href="#event" className="nav-link">Event</a>
          <a href="#faq" className="nav-link">FAQ</a>
        </div>

        {/* Right CTA Buttons */}
        <div className="nav-actions">
          {user ? (
            <div className="user-profile-badge">
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
              <button 
                className="btn-secondary"
                onClick={onOpenRegister}
              >
                <User size={18} />
                <span>Daftar</span>
              </button>
              <button 
                className="btn-primary"
                onClick={onOpenLogin}
              >
                Masuk
              </button>
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
          <a href="#fitur" onClick={() => setIsMobileMenuOpen(false)}>Fitur Utama</a>
          <a href="#cara-kerja" onClick={() => setIsMobileMenuOpen(false)}>Cara Kerja</a>
          <a href="#spesialisasi" onClick={() => setIsMobileMenuOpen(false)}>Spesialisasi</a>
          <a href="#event" onClick={() => setIsMobileMenuOpen(false)}>Event</a>
          <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>
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
                <button 
                  className="btn-secondary" 
                  onClick={() => { onOpenRegister(); setIsMobileMenuOpen(false); }}
                >
                  <User size={18} />
                  <span>Daftar</span>
                </button> 
                <button 
                  className="btn-primary" 
                  onClick={() => { onOpenLogin(); setIsMobileMenuOpen(false); }}
                >
                  Masuk
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
