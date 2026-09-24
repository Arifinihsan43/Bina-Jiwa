import React, { useState } from 'react';
import { Bookmark, Share2 } from 'lucide-react';

export default function DailyQuoteCard() {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Bina Jiwa - Pesan Harian',
        text: '“Perasaan bukanlah sesuatu yang perlu kamu kalahkan, melainkan ombak yang perlu kamu pelajari cara mengarunginya.” — Pesan Harian dari Tim Psikolog Bina Jiwa',
        url: window.location.href,
      });
    } else {
      alert('Pesan harian berhasil disalin ke clipboard!');
    }
  };

  return (
    <div className="mc-quote-card">
      <div className="mc-quote-box">
        <div className="mc-quote-mark">“ ”</div>
        <div className="mc-quote-content">
          <p className="mc-quote-body">
            “Perasaan bukanlah sesuatu yang perlu kamu kalahkan, melainkan ombak yang perlu kamu pelajari cara mengarunginya.”
          </p>
          <span className="mc-quote-author">— Pesan Harian dari Tim Psikolog Bina Jiwa</span>
        </div>
      </div>

      <div className="mc-quote-actions">
        <button
          type="button"
          className={`mc-quote-btn ${isBookmarked ? 'active' : ''}`}
          onClick={() => setIsBookmarked(!isBookmarked)}
          title="Simpan Kutipan"
        >
          <Bookmark size={18} fill={isBookmarked ? '#0284c7' : 'none'} color={isBookmarked ? '#0284c7' : '#64748b'} />
        </button>
        <button
          type="button"
          className="mc-quote-btn"
          onClick={handleShare}
          title="Bagikan"
        >
          <Share2 size={18} color="#64748b" />
        </button>
      </div>
    </div>
  );
}
