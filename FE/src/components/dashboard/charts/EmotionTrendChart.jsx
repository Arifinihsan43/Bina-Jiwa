import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { addDaysKey } from '../../../service/moodService';

const DAYS = 30;
const W = 800;
const H = 200;
const PAD = { top: 16, right: 16, bottom: 12, left: 16 };
const LINE_COLOR = '#0284c7';

const shortDate = new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', day: 'numeric', month: 'short' });
const fmtKey = (key) => shortDate.format(new Date(`${key}T00:00:00Z`));

const x = (i) => PAD.left + (i * (W - PAD.left - PAD.right)) / (DAYS - 1);
const y = (score) => PAD.top + ((100 - score) * (H - PAD.top - PAD.bottom)) / 100;

const avg = (vals) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);

/**
 * Tren indeks suasana hati 30 hari terakhir (0 = sangat berat, 50 = netral, 100 = sangat baik).
 * Hari tanpa check-in dibiarkan kosong (garis terputus), tidak diinterpolasi.
 */
export default function EmotionTrendChart({ logs, todayKey, loading }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const days = Array.from({ length: DAYS }, (_, i) => {
    const key = addDaysKey(todayKey, i - (DAYS - 1));
    return { key, log: logs[key] || null };
  });
  const filled = days.filter((d) => d.log);

  // Garis terputus di hari yang kosong.
  let path = '';
  days.forEach((d, i) => {
    if (!d.log) return;
    const prevFilled = i > 0 && days[i - 1].log;
    path += `${prevFilled ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(d.log.score).toFixed(1)} `;
  });

  const last7 = days.slice(-7).filter((d) => d.log).map((d) => d.log.score);
  const prev7 = days.slice(-14, -7).filter((d) => d.log).map((d) => d.log.score);
  const avg30 = avg(filled.map((d) => d.log.score));
  const delta = last7.length && prev7.length ? Math.round(avg(last7) - avg(prev7)) : null;

  const xTicks = [0, 7, 14, 21, DAYS - 1];
  const hovered = hoverIdx !== null ? days[hoverIdx] : null;

  let insight;
  if (loading) {
    insight = 'Memuat data suasana hati…';
  } else if (filled.length < 2) {
    insight = 'Isi check-in mood minimal 2 hari untuk mulai melihat pola suasana hatimu di sini.';
  } else if (delta === null) {
    insight = `Rata-rata indeks suasana hatimu ${Math.round(avg30)} dari 100 selama ${filled.length} hari tercatat. Terus isi check-in agar perbandingan mingguan bisa dihitung.`;
  } else if (delta > 0) {
    insight = `Indeks suasana hatimu naik ${delta} poin dibanding pekan sebelumnya. Pertahankan kebiasaan baik yang sedang kamu jalani.`;
  } else if (delta < 0) {
    insight = `Indeks suasana hatimu turun ${Math.abs(delta)} poin dibanding pekan sebelumnya. Tidak apa-apa — pertimbangkan bicara dengan orang terdekat atau psikolog.`;
  } else {
    insight = 'Suasana hatimu stabil dibanding pekan sebelumnya.';
  }
  const InsightIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

  return (
    <div className="mc-chart-card">
      <div className="mc-chart-header">
        <div className="mc-chart-title-group">
          <h3 className="mc-chart-title">Tren Suasana Hati (30 Hari Terakhir)</h3>
          <p className="mc-chart-sub">
            Indeks 0–100 dari mood &amp; intensitas check-in harian • 50 = netral • {filled.length} hari tercatat
          </p>
        </div>
      </div>

      <div className="mc-chart-canvas-wrapper mc-trend-wrapper">
        <div className="mc-trend-plot" onMouseLeave={() => setHoverIdx(null)}>
          <span className="mc-trend-ylabel top">Sangat baik</span>
          <span className="mc-trend-ylabel mid">Netral</span>
          <span className="mc-trend-ylabel bottom">Berat</span>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mc-wave-svg"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Tren indeks suasana hati 30 hari terakhir, ${filled.length} hari tercatat${avg30 !== null ? `, rata-rata ${Math.round(avg30)}` : ''}.`}
          >
            <line x1={PAD.left} x2={W - PAD.right} y1={y(100)} y2={y(100)} stroke="#f1f5f9" />
            <line x1={PAD.left} x2={W - PAD.right} y1={y(50)} y2={y(50)} stroke="#cbd5e1" strokeDasharray="4 4" />
            <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="#f1f5f9" />

            {hovered && (
              <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={PAD.top} y2={H - PAD.bottom} stroke="#94a3b8" strokeWidth="1" />
            )}

            {path && (
              <path
                d={path}
                fill="none"
                stroke={LINE_COLOR}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Area hover per hari (lebih lebar dari titiknya) */}
            {days.map((d, i) => (
              <rect
                key={d.key}
                x={x(i) - (W - PAD.left - PAD.right) / (DAYS - 1) / 2}
                y={0}
                width={(W - PAD.left - PAD.right) / (DAYS - 1)}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
                tabIndex={d.log ? 0 : -1}
                aria-label={d.log ? `${fmtKey(d.key)}: ${d.log.mood}, indeks ${d.log.score}` : undefined}
              />
            ))}
          </svg>

          {/* Titik data sebagai HTML agar tetap bulat walau SVG diregangkan */}
          {filled.map((d) => {
            const i = days.indexOf(d);
            return (
              <span
                key={d.key}
                className={`mc-trend-dot ${hoverIdx === i ? 'active' : ''}`}
                style={{ left: `${(x(i) / W) * 100}%`, top: `${(y(d.log.score) / H) * 100}%` }}
              />
            );
          })}

          {hovered && (
            <div
              className={`mc-trend-tooltip ${hoverIdx > DAYS * 0.7 ? 'left' : ''}`}
              style={{ left: `${(x(hoverIdx) / W) * 100}%` }}
            >
              <strong>{fmtKey(hovered.key)}</strong>
              {hovered.log ? (
                <>
                  <span>{hovered.log.icon} {hovered.log.mood} • intensitas {hovered.log.intensity}/5</span>
                  <span>Indeks {hovered.log.score}</span>
                </>
              ) : (
                <span className="muted">Tidak ada check-in</span>
              )}
            </div>
          )}

          {!loading && filled.length === 0 && (
            <div className="mc-trend-empty">Belum ada check-in dalam 30 hari terakhir.</div>
          )}
        </div>

        <div className="mc-chart-x-labels mc-trend-xlabels">
          {xTicks.map((i) => (
            <span
              key={i}
              className={i === DAYS - 1 ? 'mc-x-active' : ''}
              style={{ left: `${(x(i) / W) * 100}%` }}
            >
              {i === DAYS - 1 ? 'Hari ini' : fmtKey(days[i].key)}
            </span>
          ))}
        </div>

        {/* Tabel untuk pembaca layar */}
        <table className="mc-visually-hidden">
          <caption>Check-in mood 30 hari terakhir</caption>
          <thead>
            <tr><th>Tanggal</th><th>Mood</th><th>Intensitas</th><th>Indeks</th></tr>
          </thead>
          <tbody>
            {filled.map((d) => (
              <tr key={d.key}>
                <td>{fmtKey(d.key)}</td>
                <td>{d.log.mood}</td>
                <td>{d.log.intensity}</td>
                <td>{d.log.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mc-insight-box">
        <div className="mc-insight-icon">
          <InsightIcon size={20} color="#ffffff" />
        </div>
        <div className="mc-insight-text">
          <span className="mc-insight-tag">INSIGHT SUASANA HATI</span>
          <p className="mc-insight-desc">{insight}</p>
        </div>
      </div>
    </div>
  );
}
