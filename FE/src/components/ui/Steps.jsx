import React from 'react';
import { Smile, Search, Sparkles } from 'lucide-react';

export default function Steps() {
  const steps = [
    {
      number: "01",
      icon: <Smile size={22} className="step-icon" />,
      title: "Kenali Diri",
      description: "Gunakan fitur pemantau suasana hati mingguan untuk memahami pola emosi serta pemicu tekanan secara mandiri."
    },
    {
      number: "02",
      icon: <Search size={22} className="step-icon" />,
      title: "Temukan Pendamping",
      description: "Pilih psikolog atau konselor yang paling sesuai dengan kebutuhan, preferensi gaya komunikasi, serta jadwal Anda."
    },
    {
      number: "03",
      icon: <Sparkles size={22} className="step-icon" />,
      title: "Bertumbuh Bersama",
      description: "Ikuti sesi konseling berkala, terapkan latihan relaksasi harian, dan rasakan perubahan positif secara bertahap."
    }
  ];

  return (
    <section id="cara-kerja" className="steps-section">
      <div className="section-container">
        {/* Header */}
        <div className="steps-header text-center">
          <span className="section-subtag">LANGKAH SEDERHANA</span>
          <h2 className="section-title">3 Langkah Mengawali Ketenangan Batin</h2>
          <p className="section-subtitle">
            Proses cepat dan intuitif yang dirancang agar Anda bisa langsung merasakan manfaatnya tanpa hambatan.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="steps-grid">
          {steps.map((step, idx) => (
            <div className="step-card" key={idx}>
              <div className="step-card-top">
                <div className="step-icon-badge">
                  {step.icon}
                </div>
                <span className="step-number">{step.number}</span>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
