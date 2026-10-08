import React from 'react';
import { 
  PhoneCall, 
  ShieldAlert, 
  Clock, 
  Wind, 
  LifeBuoy, 
  Building2 
} from 'lucide-react';
import DashboardHeader from '../components/dashboard/navigation/DashboardHeader';

export default function BantuanKrisisPage({ onToggleSidebar }) {
  const hotlines = [
    {
      name: 'Hotline Kesehatan Jiwa Kemenkes RI',
      number: '119 (Tekan 8)',
      desc: 'Layanan tanggap darurat krisis 24 jam bebas pulsa resmi Kementerian Kesehatan Indonesia.',
      tel: 'tel:119',
      primary: true,
      badge: 'Bebas Pulsa • 24 Jam',
    },
    {
      name: 'Sehat Jiwa Kemenkes',
      number: '1500-454',
      desc: 'Layanan konseling darurat dan pertolongan pertama krisis psikologis Kemenkes RI.',
      tel: 'tel:1500454',
      primary: false,
      badge: 'Resmi Kemenkes',
    },
    {
      name: 'LISA Helpline (Suicide Prevention)',
      number: '0811-3855-472',
      desc: 'Dukungan pencegahan krisis emosional & pendampingan jiwa 24/7 (Bahasa Indonesia & English).',
      tel: 'tel:08113855472',
      primary: true,
      badge: 'Support 24/7',
    },
    {
      name: 'Yayasan Pulih',
      number: '0811-8436-633',
      desc: 'Layanan bantuan psikologis pemulihan trauma krisis & konseling bencana.',
      tel: 'tel:08118436633',
      primary: false,
      badge: 'Konseling Trauma',
    },
    {
      name: 'Panggilan Darurat Umum RI',
      number: '112',
      desc: 'Nomor tunggal darurat nasional untuk bantuan polisi, ambulans, dan pemadam kebakaran.',
      tel: 'tel:112',
      primary: false,
      badge: 'Darurat Umum',
    }
  ];

  const groundingSteps = [
    { num: '5', text: 'Lihat 5 benda di sekitarmu dan sebutkan nama benda tersebut.' },
    { num: '4', text: 'Sentuh 4 benda fisik di dekatmu dan rasakan teksturnya.' },
    { num: '3', text: 'Dengarkan 3 suara lembut di ruangan atau luar lingkunganmu.' },
    { num: '2', text: 'Hirup 2 aroma (bisa aroma minyak angin, teh, atau udara segar).' },
    { num: '1', text: 'Rasakan 1 sensasi rasa (seseguk air putih atau napas dalam).' },
  ];

  return (
    <div className="db-main-content">
      <DashboardHeader onToggleSidebar={onToggleSidebar} />

      <div className="db-scrollable-body">
        {/* Page Banner Header */}
        <div className="db-page-banner crisis-page-banner">
          <div className="db-page-banner-icon crisis-banner-icon">
            <ShieldAlert size={32} color="#e11d48" />
          </div>
          <div>
            <div className="crisis-badge-pill">
              <Clock size={14} />
              <span>Layanan Tanggap Darurat Siaga 24 Jam</span>
            </div>
            <h1 className="db-page-title crisis-title">Pusat Bantuan Krisis &amp; Tanggap Darurat</h1>
            <p className="db-page-subtitle">
              Kamu tidak sendirian. Jika emosi terasa sangat berat atau membahayakan diri, pendamping profesional siap mendengarkan tanpa prasangka.
            </p>
          </div>
        </div>

        {/* Highlight Main Hotline Card */}
        <div className="crisis-hero-card">
          <div className="crisis-hero-info">
            <div className="crisis-hero-tag">
              <LifeBuoy size={18} />
              <span>PILIHAN UTAMA DARURAT 24 JAM</span>
            </div>
            <h2 className="crisis-hero-heading">Kementerian Kesehatan RI — Layanan 119</h2>
            <p className="crisis-hero-desc">
              Hubungi layanan tanggap darurat krisis jiwa gratis dari telepon seluler maupun telepon rumah di seluruh Indonesia.
            </p>
          </div>
          <a href="tel:119" className="crisis-hero-btn">
            <PhoneCall size={20} />
            <span>Panggil 119 (Tekan 8)</span>
          </a>
        </div>

        {/* Hotline List Grid */}
        <div className="crisis-grid-container">
          <div className="crisis-section-left">
            <h2 className="crisis-section-title">
              <PhoneCall size={20} color="#e11d48" />
              <span>Daftar Hotline Bantuan Krisis &amp; Hotline Resmi</span>
            </h2>

            <div className="crisis-hotlines-grid">
              {hotlines.map((h, i) => (
                <div key={i} className={`crisis-card-item ${h.primary ? 'primary' : ''}`}>
                  <div className="crisis-card-header">
                    <span className="crisis-card-badge">{h.badge}</span>
                  </div>
                  <h3 className="crisis-card-name">{h.name}</h3>
                  <span className="crisis-card-number">{h.number}</span>
                  <p className="crisis-card-desc">{h.desc}</p>

                  <a href={h.tel} className="crisis-card-call-btn">
                    <PhoneCall size={16} />
                    <span>Hubungi Sekarang</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Right Section: Grounding First Aid */}
          <div className="crisis-section-right">
            <div className="crisis-side-card grounding-card">
              <div className="grounding-card-header">
                <Wind size={22} color="#0284c7" />
                <h3>Pertolongan Pertama Emosional (Grounding 5-4-3-2-1)</h3>
              </div>
              <p className="grounding-card-intro">
                Jika pikiran terasa kewalahan atau kepanikan melanda, gunakan teknik ini untuk menyegarkan fokus batinmu kembali ke momen ini:
              </p>

              <div className="grounding-steps-list">
                {groundingSteps.map((s, idx) => (
                  <div key={idx} className="grounding-step-item">
                    <div className="grounding-step-num">{s.num}</div>
                    <span className="grounding-step-text">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="crisis-side-card emergency-rs-card">
              <div className="emergency-rs-header">
                <Building2 size={22} color="#e11d48" />
                <h3>Penanganan Darurat Medis &amp; UGD</h3>
              </div>
              <p className="emergency-rs-desc">
                Jika terdapat risiko kecelakaan fisik atau luka yang membutuhkan penanganan medis segera, mohon langsung datangi <strong>Unit Gawat Darurat (UGD) Rumah Sakit terdekat</strong> atau hubungi nomor telepon darurat daerahmu (112).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
