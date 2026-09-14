import React from 'react';
import { ArrowUpRight, Sparkles, CheckCircle2, ShieldCheck, Video, Mic } from 'lucide-react';

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-container">
        {/* Left Hero Content */}
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="badge-icon" />
            <span>Program Kesehatan Mental Terintegrasi</span>
          </div>

          <h1 className="hero-title">
            Ruang Aman untuk <span className="highlight-text">Tumbuh,</span> <span className="highlight-text">Pulih,</span> dan Menemukan Ketenangan Jiwa
          </h1>

          <p className="hero-description">
            Mari berpindah ke tempat yang lebih aman dan tenang. Konseling psikologi, pelacakan suasana hati harian, serta relaksasi terpandu, semua dalam satu aplikasi.
          </p>

          <div className="hero-cta-group">
            <button className="btn-hero-primary">
              Mulai Konsultasi <ArrowUpRight size={18} />
            </button>
            <button className="btn-hero-secondary">
              Pelajari Fitur <ArrowUpRight size={18} />
            </button>
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

        {/* Right Hero Image Card (Gambar Orang Konsultasi) */}
        <div className="hero-graphic-wrap">
          <div className="consultation-card">
            {/* Image Wrapper */}
            <div className="consultation-img-container">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80" 
                alt="Sesi Konsultasi Psikologi Online"
                className="consultation-img"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
