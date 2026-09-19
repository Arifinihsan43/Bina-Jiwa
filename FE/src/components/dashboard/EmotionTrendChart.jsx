import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';

export default function EmotionTrendChart() {
  return (
    <div className="mc-chart-card">
      <div className="mc-chart-header">
        <div className="mc-chart-title-group">
          <h3 className="mc-chart-title">Tren Keseimbangan Emosi (30 Hari Terakhir)</h3>
          <p className="mc-chart-sub">Fluktuasi tingkat ketenangan batin versus stres kerja harian</p>
        </div>

        <div className="mc-chart-legend">
          <span className="mc-chart-legend-item legend-batin">
            <span className="legend-line line-batin"></span> Kedamaian Batin
          </span>
          <span className="mc-chart-legend-item legend-stres">
            <span className="legend-line line-stres"></span> Tingkat Stres
          </span>
        </div>
      </div>

      {/* Smooth Wave Canvas Container */}
      <div className="mc-chart-canvas-wrapper">
        <div className="mc-chart-x-labels">
          <span>1 Okt</span>
          <span>7 Okt</span>
          <span>14 Okt</span>
          <span>21 Okt</span>
          <span className="mc-x-active">25 Okt (Hari Ini)</span>
          <span>31 Okt</span>
        </div>

        <svg viewBox="0 0 800 180" className="mc-wave-svg">
          {/* Grid lines */}
          <line x1="0" y1="30" x2="800" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
          <line x1="0" y1="90" x2="800" y2="90" stroke="#f1f5f9" strokeDasharray="4 4" />
          <line x1="0" y1="150" x2="800" y2="150" stroke="#f1f5f9" strokeDasharray="4 4" />

          {/* Area Fill for Batin (Blue) */}
          <path
            d="M 20 130 Q 150 50, 300 100 T 600 60 T 780 40 L 780 170 L 20 170 Z"
            fill="url(#batin-grad)"
            opacity="0.25"
          />

          {/* Area Fill for Stres (Teal) */}
          <path
            d="M 20 155 Q 160 130, 310 140 T 610 110 T 780 95 L 780 170 L 20 170 Z"
            fill="url(#stres-grad)"
            opacity="0.15"
          />

          {/* Line 1: Kedamaian Batin (Blue Line) */}
          <path
            d="M 20 130 Q 150 50, 300 100 T 600 60 T 780 40"
            fill="none"
            stroke="#0284c7"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Line 2: Tingkat Stres (Teal Line) */}
          <path
            d="M 20 155 Q 160 130, 310 140 T 610 110 T 780 95"
            fill="none"
            stroke="#14b8a6"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Active Data Points */}
          <circle cx="630" cy="65" r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
          <circle cx="630" cy="112" r="5" fill="#14b8a6" stroke="#ffffff" strokeWidth="2" />

          <defs>
            <linearGradient id="batin-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="stres-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom Insight Card */}
      <div className="mc-insight-box">
        <div className="mc-insight-icon">
          <TrendingUp size={20} color="#ffffff" />
        </div>
        <div className="mc-insight-text">
          <span className="mc-insight-tag">INSIGHT KESTABILAN JIWA</span>
          <p className="mc-insight-desc">
            Stabilitas batinmu meningkat <strong style={{ color: '#0284c7' }}>18%</strong> dibandingkan pekan lalu setelah kamu mulai rutin berjalan sore tanpa gawai selama 20 menit.
          </p>
        </div>
      </div>
    </div>
  );
}
