import React from 'react';
import { PhoneCall, ShieldAlert, X, HeartHandshake, ExternalLink } from 'lucide-react';

export default function CrisisModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const hotlines = [
    {
      name: 'Hotline Kesehatan Jiwa Kemenkes RI',
      number: '119 (Tekan 8)',
      desc: 'Layanan tanggap darurat krisis 24 jam bebas pulsa.',
      tel: 'tel:119',
      primary: true,
    },
    {
      name: 'Sehat Jiwa Kemenkes',
      number: '1500-454',
      desc: 'Konseling kesehatan jiwa darurat resmi Kemenkes RI.',
      tel: 'tel:1500454',
    },
    {
      name: 'LISA Helpline (Prevention Helpline)',
      number: '0811-3855-472',
      desc: 'Dukungan kesehatan mental & pencegahan krisis 24/7 (Bahasa Indonesia & English).',
      tel: 'tel:08113855472',
    },
    {
      name: 'Yayasan Pulih',
      number: '0811-8436-633',
      desc: 'Layanan bantuan psikologis pemulihan trauma & krisis.',
      tel: 'tel:08118436633',
    },
  ];

  return (
    <div className="mc-modal-overlay" onClick={onClose}>
      <div className="mc-modal-card crisis-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="mc-modal-close-btn"
          onClick={onClose}
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        <div className="crisis-modal-header">
          <div className="crisis-icon-badge">
            <ShieldAlert size={28} color="#e11d48" />
          </div>
          <div>
            <h2 className="crisis-modal-title">Pusat Bantuan Krisis &amp; Darurat</h2>
            <p className="crisis-modal-sub">
              Kamu tidak sendirian. Layanan tanggap darurat ini siap mendengarkan tanpa prasangka 24/7.
            </p>
          </div>
        </div>

        <div className="crisis-hotlines-list">
          {hotlines.map((h, i) => (
            <div key={i} className={`crisis-hotline-item ${h.primary ? 'primary' : ''}`}>
              <div className="crisis-hotline-info">
                <span className="crisis-hotline-name">{h.name}</span>
                <span className="crisis-hotline-number">{h.number}</span>
                <p className="crisis-hotline-desc">{h.desc}</p>
              </div>
              <a href={h.tel} className="crisis-call-btn">
                <PhoneCall size={16} />
                <span>Panggil</span>
              </a>
            </div>
          ))}
        </div>

        <div className="crisis-modal-footer">
          <div className="crisis-footer-note">
            <HeartHandshake size={18} color="#0284c7" />
            <span>Jika terjadi situasi darurat medis, segera kunjungi UGD atau RS terdekat.</span>
          </div>
          <button type="button" className="db-btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
