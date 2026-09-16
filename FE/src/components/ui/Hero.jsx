import React from 'react';
import { ArrowUpRight, Sparkles, Star } from 'lucide-react';

export default function Hero({ onOpenAuth }) {
  return (
    <section className="hero-section">
      {/* Dynamic Animated Background Container (Blue & White Ambient Glow) */}
      <div className="hero-bg-animated" aria-hidden="true">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-orb bg-orb-4"></div>
        <div className="bg-mesh-grid"></div>
        <div className="bg-light-beam"></div>
      </div>

      <div className="hero-container">
        {/* Left Hero Content */}
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="badge-icon" />
            <span>Program Kesehatan Mental Terintegrasi</span>
          </div>

          <h1 className="hero-title">
            Ruang Aman untuk <span className="highlight-text animated-glow">Tumbuh,</span>{' '}
            <span className="highlight-text animated-glow delay-1">Pulih,</span> dan Menemukan Ketenangan Jiwa
          </h1>

          <p className="hero-description">
            Mari berpindah ke tempat yang lebih aman dan tenang. Konseling psikologi, pelacakan suasana hati harian, serta relaksasi terpandu, semua dalam satu aplikasi.
          </p>

          <div className="hero-cta-group">
            <button className="btn-hero-primary" onClick={() => onOpenAuth && onOpenAuth('register')}>
              Mulai Konsultasi <ArrowUpRight size={18} />
            </button>
            <a href="#fitur" className="btn-hero-secondary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
              Pelajari Fitur <ArrowUpRight size={18} />
            </a>
          </div>

          {/* Stats Bar */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">15.000+</span>
              <span className="stat-label">Akses Terbuka</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">250+</span>
              <span className="stat-label">Psikolog/Ahli</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Privasi Terjamin</span>
            </div>
          </div>
        </div>

        {/* Right Hero Image Card (Gambar Orang Konsultasi + Floating Badges) */}
        <div className="hero-graphic-wrap">
          {/* Decorative Glowing Blue Aura Ring */}
          <div className="hero-card-glow-ring"></div>

          <div className="consultation-card">
            {/* Image Wrapper */}
            <div className="consultation-img-container">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80" 
                alt="Sesi Konsultasi Psikologi Online"
                className="consultation-img"
              />
              <div className="consultation-img-overlay"></div>
            </div>

            {/* Floating Live Badge 1 (Top Left) */}
            <div className="hero-floating-badge badge-top-left">
              <div className="pulse-indicator">
                <span className="pulse-dot"></span>
                <span className="pulse-ring"></span>
              </div>
              <div className="badge-text-group">
                <span className="badge-title">250+ Psikolog Online</span>
                <span className="badge-sub">Siap mendampingi 24/7</span>
              </div>
            </div>

            {/* Floating Live Badge 2 (Bottom Right) */}
            <div className="hero-floating-badge badge-bottom-right">
              <div className="star-rating">
                <Star size={16} className="star-icon" fill="#0284c7" color="#0284c7" />
                <span className="rating-num">4.9 / 5</span>
              </div>
              <span className="badge-sub">Tingkat Kepuasan Pasien</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
