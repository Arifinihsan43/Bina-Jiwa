import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Apakah kerahasiaan cerita saya benar-benar terjamin?",
      answer: "Ya, Bina Jiwa menerapkan enkripsi data tingkat tinggi end-to-end serta standar etika kerahasiaan psikologi medis yang ketat. Semua sesi dan catatan pribadi Anda tersimpan secara anonim dan aman."
    },
    {
      question: "Bagaimana cara memilih psikolog yang tepat untuk saya?",
      answer: "Aplikasi kami memiliki fitur pencocokan pintar berdasarkan spesialisasi masalah (seperti kecemasan, depresi, karir, atau hubungan), gaya komunikasi yang Anda sukai, serta ketersediaan jadwal."
    },
    {
      question: "Apakah layanan konseling di Bina Jiwa menerima asuransi BPJS?",
      answer: "Saat ini Bina Jiwa menyediakan layanan konseling mandiri terjangkau dan kerjasama dengan beberapa asuransi swasta mitra. Kami juga terus berupaya memperluas integrasi dengan jaminan kesehatan nasional."
    }
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq-section">
      <div className="section-container">
        {/* Header */}
        <div className="faq-header text-center">
          <span className="section-subtag">PERTANYAAN POPULER</span>
          <h2 className="section-title">Jawaban untuk Keraguanmu</h2>
        </div>

        {/* Accordion Container */}
        <div className="faq-accordion">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx} 
                className={`faq-item ${isOpen ? 'open' : ''}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="faq-question-row">
                  <h3 className="faq-question">{faq.question}</h3>
                  <div className={`faq-chevron ${isOpen ? 'rotate' : ''}`}>
                    <ChevronDown size={20} />
                  </div>
                </div>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
