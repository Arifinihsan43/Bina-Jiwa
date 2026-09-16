import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export default function CtaBanner() {
  return (
    <section className="cta-section">
      <div className="section-container">
        <div className="cta-card">
          {/* Subtle background heart decoration */}
          <div className="cta-bg-heart">
            <Heart size={280} fill="rgba(255, 255, 255, 0.06)" color="transparent" />
          </div>

          <div className="cta-content">
            <span className="cta-subtag">TRANSFORMASI KESEHATAN MENTAL</span>
            <h2 className="cta-title">Mulailah Merawat Dirimu Hari Ini.</h2>
            <p className="cta-desc">
              Bina Jiwa hadir mendampingi langkahmu. Temukan kedamaian, tingkatkan ketahanan mental, dan mulailah berdialog dengan nyaman.
            </p>

            <div className="cta-actions">
              <Link to="/register" className="btn-cta-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                Coba Sekarang, Gratis!
              </Link>
              <Link to="/login" className="btn-cta-secondary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                Konsultasi Sekarang
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
