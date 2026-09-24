import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BinaJiwaLogo from '../common/BinaJiwaLogo';

export default function Footer() {
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

  const handlePlaceholderClick = (message) => (e) => {
    e.preventDefault();
    if (message) {
      alert(message);
    }
  };

  return (
    <footer className="footer-section">
      <div className="section-container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <Link to="/" className="nav-brand">
              <div className="brand-icon">
                <BinaJiwaLogo size={22} color="#ffffff" />
              </div>
              <span className="brand-name">Bina Jiwa</span>
            </Link>
            <p className="footer-brand-desc">
              Ruang aman psikologis terintegrasi untuk membantu masyarakat Indonesia tumbuh, pulih, dan menemukan ketenangan jiwa secara berkelanjutan.
            </p>
          </div>

          {/* Links Column 1 */}
          <div className="footer-links-col">
            <h4 className="footer-heading">LAYANAN UTAMA</h4>
            <ul className="footer-links">
              <li><a href="/" onClick={handleNavClick('spesialisasi')}>Konseling Psikologi</a></li>
              <li><a href="/" onClick={handleNavClick('fitur')}>Mood Tracker &amp; Jurnal</a></li>
              <li><a href="/" onClick={handleNavClick('event')}>Komunitas &amp; Workshop</a></li>
              <li><a href="/" onClick={handleNavClick('fitur')}>Tes Kesehatan Mental</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="footer-links-col">
            <h4 className="footer-heading">BANTUAN &amp; KONTAK</h4>
            <ul className="footer-links">
              <li><a href="/" onClick={handlePlaceholderClick('Tim Support 24/7 siap melayani Anda melalui email dan live chat.')}>Tim Support 24/7</a></li>
              <li><a href="/" onClick={handlePlaceholderClick('Silakan hubungi kami di support@binajiwa.id')}>Hubungi Kami</a></li>
              <li><a href="/" onClick={handleNavClick('faq')}>Pusat Bantuan</a></li>
              <li><a href="/" onClick={handleNavClick('spesialisasi')}>Mitra Psikolog</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="copyright">© 2026 Bina Jiwa. Seluruh Hak Cipta Dilindungi.</p>
          <div className="legal-links">
            <a href="/" onClick={handlePlaceholderClick()}>Kebijakan Privasi</a>
            <span>•</span>
            <a href="/" onClick={handlePlaceholderClick()}>Syarat &amp; Ketentuan</a>
            <span>•</span>
            <a href="/" onClick={handlePlaceholderClick()}>Kebijakan Cookie</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
