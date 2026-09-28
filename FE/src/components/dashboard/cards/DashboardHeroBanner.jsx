import React from 'react';
import { Sparkles, HeartPulse } from 'lucide-react';

export default function DashboardHeroBanner({ user }) {
  const firstName = user?.name ? user.name.split(' ')[0] : 'Rani';

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 3 && hour < 11) {
      return { greeting: 'Selamat pagi', edition: 'Edisi Pagi' };
    }
    if (hour >= 11 && hour < 15) {
      return { greeting: 'Selamat siang', edition: 'Edisi Siang' };
    }
    if (hour >= 15 && hour < 19) {
      return { greeting: 'Selamat sore', edition: 'Edisi Sore' };
    }
    return { greeting: 'Selamat malam', edition: 'Edisi Malam' };
  };

  const { greeting, edition } = getTimeGreeting();

  return (
    <div className="db-hero-banner">
      <div className="db-hero-left">
        <div className="db-hero-pill">
          <Sparkles size={14} />
          <span>Ruang Teduh Diri • {edition}</span>
        </div>

        <h1 className="db-hero-title">
          {greeting}, {firstName}! Bagaimana perasaanmu hari ini?
        </h1>

        <p className="db-hero-subtitle">
          “Setiap emosi yang kamu rasakan adalah valid dan layak didengarkan. Ambil napas, nikmati harimu perlahan.”
        </p>
      </div>

      <div className="db-hero-widget">
        <div className="db-widget-glass">
          <div className="db-widget-icon">
            <HeartPulse size={24} color="#ffffff" />
          </div>
          <div className="db-widget-text">
            <span className="db-widget-label">INDEKS KESEIMBANGAN</span>
            <span className="db-widget-value">Stabil &amp; Bertumbuh</span>
          </div>
        </div>
      </div>
    </div>
  );
}
