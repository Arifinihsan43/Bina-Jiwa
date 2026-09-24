import React from 'react';
import { PhoneCall, ShieldAlert } from 'lucide-react';

export default function HotlineAlertCard() {
  const handleHotlineClick = () => {
    alert('Menghubungkan ke Layanan Tanggap Darurat Krisis 119 (Bina Jiwa & Kemenkes RI)...');
  };

  return (
    <div className="db-hotline-card">
      <div className="db-hotline-icon-wrapper">
        <ShieldAlert size={22} color="#e11d48" />
      </div>

      <div className="db-hotline-content">
        <h3 className="db-hotline-title">
          Merasa terlalu berat dan butuh teman bicara saat ini?
        </h3>
        <p className="db-hotline-subtitle">
          Layanan dukungan krisis tanggap darurat Bina Jiwa &amp; Kementerian Kesehatan RI selalu siaga 24 jam gratis.
        </p>
      </div>

      <button type="button" className="db-hotline-btn" onClick={handleHotlineClick}>
        <PhoneCall size={16} />
        <span>Hubungi Hotline 119</span>
      </button>
    </div>
  );
}
