import React from 'react';
import { Sparkles, HeartPulse } from 'lucide-react';

// Label singkat dari indeks suasana hati 7 hari (0–100, 50 = netral).
const balanceLabel = (avg) => {
  if (avg === null || avg === undefined) return 'Mulai check-in harianmu';
  if (avg >= 70) return 'Stabil & Bertumbuh';
  if (avg >= 55) return 'Cukup Seimbang';
  if (avg >= 40) return 'Naik Turun Wajar';
  return 'Butuh Ruang Istirahat';
};

export default function DashboardHeroBanner({ user, weeklyAverage = null }) {
  const firstName = user?.name ? user.name.split(' ')[0] : '';

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
          {greeting}{firstName ? `, ${firstName}` : ''}! Bagaimana perasaanmu hari ini?
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
            <span className="db-widget-value">{balanceLabel(weeklyAverage)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
