import React from 'react';
import { Flower2 } from 'lucide-react';

export default function MoodReflectionHero() {
  return (
    <div className="mc-hero-card">
      <div className="mc-hero-pill">
        <Flower2 size={15} color="#0284c7" />
        <span>RUANG KESADARAN DIRI</span>
      </div>

      <h1 className="mc-hero-title">Mood &amp; Kalender Refleksi</h1>

      <p className="mc-hero-desc">
        Setiap helaan napas dan getaran rasa berharga. Telusuri ritme batinmu dan tuliskan kejujuran hari ini tanpa penghakiman.
      </p>
    </div>
  );
}
