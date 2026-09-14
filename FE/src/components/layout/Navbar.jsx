import React, { useState } from 'react';
import { Heart, Menu, X, User } from 'lucide-react';

export default function Navbar() {
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
        </div>

        {/* Right CTA Buttons */}
        <div className="nav-actions">
          <button className="btn-secondary">
            <User size={18} />
            <span>Daftar</span>
          </button>
          <button className="btn-primary">Masuk</button>
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
          <div className="mobile-actions">
            <button className="btn-secondary">
              <User size={18} />
              <span>Daftar</span>
            </button> 
            <button className="btn-primary">Masuk</button>
          </div>
        </div>
      )}
    </nav>
  );
}

