import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer-section">
      <div className="section-container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <a href="#" className="nav-brand">
              <div className="brand-icon">
                <Heart size={20} fill="#ffffff" color="#ffffff" />
              </div>
              <span className="brand-name">Bina Jiwa</span>
            </a>
            <p className="footer-brand-desc">
              Ruang aman psikologis terintegrasi untuk membantu masyarakat Indonesia tumbuh, pulih, dan menemukan ketenangan jiwa secara berkelanjutan.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="footer-links-col">
            <h4 className="footer-heading">LAYANAN UTAMA</h4>
            <ul className="footer-links">
              <li><a href="#spesialisasi">Konseling Psikologi</a></li>
              <li><a href="#fitur">Mood Tracker & Jurnal</a></li>
              <li><a href="#event">Komunitas & Workshop</a></li>
              <li><a href="#fitur">Tes Kesehatan Mental</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="footer-links-col">
            <h4 className="footer-heading">BANTUAN & KONTAK</h4>
            <ul className="footer-links">
              <li><a href="#">Tim Support 24/7</a></li>
              <li><a href="#">Hubungi Kami</a></li>
              <li><a href="#">Pusat Bantuan</a></li>
              <li><a href="#">Mitra Psikolog</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="copyright">© 2026 Bina Jiwa. Seluruh Hak Cipta Dilindungi.</p>
          <div className="legal-links">
            <a href="#">Kebijakan Privasi</a>
            <span>•</span>
            <a href="#">Syarat & Ketentuan</a>
            <span>•</span>
            <a href="#">Kebijakan Cookie</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
