import React from 'react';
import { HeartPulse, Clock, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

export default function Features() {
  const featureList = [
    {
      icon: <HeartPulse size={24} className="feature-icon" />,
      title: "Respon Cepat Mengkhawatirkan",
      description: "Sistem deteksi dini membantu merespons lonjakan kecemasan atau krisis emosional dengan tindakan yang terukur.",
      linkText: "Pelajari Deteksi Dini"
    },
    {
      icon: <Clock size={24} className="feature-icon" />,
      title: "Akomodasi dan Masa Saji",
      description: "Akses materi relaksasi dan modul pendamping kapan saja, disesuaikan dengan ritme dan waktu luang Anda.",
      linkText: "Jelajahi Ruang Dengar"
    },
    {
      icon: <ShieldCheck size={24} className="feature-icon" />,
      title: "Privasi & Teman Tak Terbatas",
      description: "Enkripsi tingkat tinggi memastikan privasi cerita Anda terjaga penuh, tanpa rasa takut dihakimi.",
      linkText: "Pendekatan 100% Aman"
    },
    {
      icon: <UserCheck size={24} className="feature-icon" />,
      title: "Tersambung Ahli 24/7",
      description: "Terhubung langsung dengan tim psikolog terverifikasi yang siap mendampingi setiap tahap proses pemulihan.",
      linkText: "Daftar Ahli Terverifikasi"
    }
  ];

  return (
    <section id="fitur" className="features-section">
      <div className="section-container">
        {/* Section Header */}
        <div className="features-header">
          <div className="features-title-col">
            <span className="section-subtag">BEBERAPA KEUNGGULAN</span>
            <h2 className="section-title">Pondasi Rasa Teduh di Bina Jiwa</h2>
          </div>
          <div className="features-desc-col">
            <p className="section-lead">
              Kami merancang setiap fitur dengan penuh empati dan perhatian detail untuk mendukung perjalanan kesehatan mental Anda.
            </p>
          </div>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="features-grid">
          {featureList.map((item, idx) => (
            <div className="feature-card" key={idx}>
              <div className="feature-icon-box">
                {item.icon}
              </div>
              <h3 className="feature-title">{item.title}</h3>
              <p className="feature-desc">{item.description}</p>
              <a href="#" className="feature-link">
                <span>{item.linkText}</span>
                <ArrowRight size={16} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
