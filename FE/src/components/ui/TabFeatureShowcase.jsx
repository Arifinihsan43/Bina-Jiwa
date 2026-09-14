import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, MessageSquareHeart } from 'lucide-react';

export default function TabFeatureShowcase() {
  const [activeTab, setActiveTab] = useState('mood-tracker');

  const tabsData = {
    'mood-tracker': {
      tag: "Bina Emosi",
      title: "Pahami Pola Emosi Harianmu Tanpa Rumit",
      description: "Tuliskan perasaanmu, lacak perkembangan tingkat stres, dan dapatkan ringkasan wawasan harian dari asisten pintar.",
      checklist: [
        "Pendataan emosi harian hanya 1 menit",
        "Evaluasi pemicu kecemasan bulanan",
        "Laporan perkembangan yang mudah dipahami"
      ],
      widgetTitle: "Frekuensi Emosi Minggu Ini",
      daysData: [
        { day: "Sen", emoji: "😊", label: "Tenang", val: 80, color: "#0284c7" },
        { day: "Sel", emoji: "😔", label: "Cemas", val: 45, color: "#f59e0b" },
        { day: "Rab", emoji: "😐", label: "Netral", val: 65, color: "#64748b" },
        { day: "Kam", emoji: "😄", label: "Bahagia", val: 90, color: "#10b981" },
        { day: "Jum", emoji: "😊", label: "Tenang", val: 85, color: "#0284c7" },
        { day: "Sab", emoji: "😄", label: "Bahagia", val: 95, color: "#10b981" },
        { day: "Min", emoji: "😊", label: "Rileks", val: 88, color: "#0284c7" }
      ],
      insightText: 'Minggu ini kamu menunjukkan stabilitas emosi yang baik. Tetap pertahankan pola tidur 7-8 jam per hari.'
    },
    'exercise': {
      tag: "Relaksasi Mandiri",
      title: "Latihan Pernapasan & Audio Meditasi Terpandu",
      description: "Nikmati koleksi audio relaksasi, musik penurunan stres, dan panduan pernapasan yang disusun oleh profesional.",
      checklist: [
        "Lebih dari 50+ audio meditasi pilihan",
        "Sesi pernapasan kilat 3-5 menit",
        "Panduan tidur nyenyak & suara alam"
      ],
      widgetTitle: "Modul Populer Minggu Ini",
      daysData: [
        { day: "Tidur", emoji: "🌙", label: "Deep Sleep", val: 92, color: "#6366f1" },
        { day: "Fokus", emoji: "🎧", label: "Deep Work", val: 78, color: "#0284c7" },
        { day: "Cemas", emoji: "🍃", label: "Calm Mind", val: 88, color: "#10b981" },
        { day: "Stres", emoji: "🧘", label: "Release", val: 82, color: "#f59e0b" }
      ],
      insightText: 'Mendengarkan relaksasi 10 menit sebelum tidur terbukti meningkatkan kualitas tidur sebesar 35%.'
    },
    'prevention': {
      tag: "Proteksi Emosional",
      title: "Deteksi Dini Stres & Bantuan Respon Kapan Saja",
      description: "Sistem cerdas Bina Jiwa memberikan peringatan dini ketika mendeteksi pemicu stres berlebih dan menghubungkan Anda dengan saluran bantuan.",
      checklist: [
        "Notifikasi perawatan diri otomatis",
        "Saluran bantuan darurat 24/7",
        "Pemberitahuan privasi berlapis"
      ],
      widgetTitle: "Indikator Kesehatan Mental",
      daysData: [
        { day: "Minggu 1", emoji: "🛡️", label: "Aman", val: 85, color: "#10b981" },
        { day: "Minggu 2", emoji: "🛡️", label: "Stabil", val: 88, color: "#0284c7" },
        { day: "Minggu 3", emoji: "🛡️", label: "Prima", val: 92, color: "#10b981" },
        { day: "Minggu 4", emoji: "🛡️", label: "Sangat Baik", val: 94, color: "#0284c7" }
      ],
      insightText: 'Sistem proteksi aktif memastikan Anda selalu memiliki ruang aman kapan pun membutuhkan dukungan.'
    }
  };

  const current = tabsData[activeTab];

  return (
    <section id="spesialisasi" className="tab-showcase-section">
      <div className="section-container">
        {/* Header */}
        <div className="text-center showcase-header">
          <span className="section-subtag">FITUR UTAMA TERINTEGRASI</span>
          <h2 className="section-title">Didesain untuk Menemani Setiap Tahap Pikiranmu</h2>
        </div>

        {/* Tab Buttons */}
        <div className="tab-buttons-wrap">
          <button 
            className={`tab-btn ${activeTab === 'mood-tracker' ? 'active' : ''}`}
            onClick={() => setActiveTab('mood-tracker')}
          >
            Jurnal & Mood Tracker
          </button>
          <button 
            className={`tab-btn ${activeTab === 'exercise' ? 'active' : ''}`}
            onClick={() => setActiveTab('exercise')}
          >
            Self-Guided Exercise
          </button>
          <button 
            className={`tab-btn ${activeTab === 'prevention' ? 'active' : ''}`}
            onClick={() => setActiveTab('prevention')}
          >
            Pencegahan Risiko Emosi
          </button>
        </div>

        {/* Dynamic Interactive Card Display */}
        <div className="showcase-card">
          {/* Left Column: Details */}
          <div className="showcase-info-col">
            <span className="info-tag">{current.tag}</span>
            <h3 className="showcase-title">{current.title}</h3>
            <p className="showcase-desc">{current.description}</p>

            <ul className="showcase-checklist">
              {current.checklist.map((item, idx) => (
                <li key={idx}>
                  <CheckCircle2 size={18} className="check-icon" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Visual Tracker/Chart Widget */}
          <div className="showcase-widget-col">
            <div className="widget-box">
              <div className="widget-header">
                <h4>{current.widgetTitle}</h4>
                <a href="#" className="widget-link">
                  Lihat Selengkapnya <ArrowRight size={14} />
                </a>
              </div>

              {/* Bar Chart / Indicators */}
              <div className="chart-grid">
                {current.daysData.map((d, i) => (
                  <div className="chart-bar-item" key={i}>
                    <span className="bar-emoji">{d.emoji}</span>
                    <div className="bar-track">
                      <div 
                        className="bar-fill" 
                        style={{ height: `${d.val}%`, backgroundColor: d.color }}
                      ></div>
                    </div>
                    <span className="bar-label">{d.day}</span>
                  </div>
                ))}
              </div>

              {/* Insight Box */}
              <div className="insight-box">
                <MessageSquareHeart size={20} className="insight-icon" />
                <div className="insight-content">
                  <span className="insight-author">Pesan dari Psikolog Bina Jiwa:</span>
                  <p className="insight-quote">"{current.insightText}"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
