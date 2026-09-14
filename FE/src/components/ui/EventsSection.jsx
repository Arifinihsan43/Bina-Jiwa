import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';

export default function EventsSection() {
  const events = [
    {
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80",
      dateTime: "Senin, 15 Sept • 19:00 WIB",
      category: "Webinar & Workshop",
      title: "Mengatasi Stress dan Burnout Kerja",
      description: "Sesi edukasi praktis mengenai manajemen beban kerja dan teknik pelepasan penat harian.",
      price: "Daftar Gratis Terbatas",
      isFree: true
    },
    {
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80",
      dateTime: "Kamis, 18 Sept • 15:00 WIB",
      category: "Sesi Terpandu",
      title: "Mindfulness & Self-Compassion 101",
      description: "Latihan kesadaran penuh untuk menerima dan mengasihi diri di tengah situasi sulit.",
      price: "Rp 50.000",
      isFree: false
    },
    {
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80",
      dateTime: "Sabtu, 20 Sept • 10:00 WIB",
      category: "Komunitas",
      title: "Mengatasi Kecemasan Sosial",
      description: "Diskusi kelompok terarah bersama profesional untuk meningkatkan rasa percaya diri.",
      price: "Rp 75.000",
      isFree: false
    }
  ];

  return (
    <section id="event" className="events-section">
      <div className="section-container">
        {/* Header */}
        <div className="events-header">
          <div>
            <span className="section-subtag">RUANG INTERAKSI DAN BELAJAR</span>
            <h2 className="section-title">Events & Workshop</h2>
          </div>
          <a href="#" className="header-view-all">
            <span>Lihat Seluruh Jadwal Program</span>
            <ArrowRight size={16} />
          </a>
        </div>

        {/* 3 Cards Grid */}
        <div className="events-grid">
          {events.map((event, idx) => (
            <div className="event-card" key={idx}>
              <div className="event-img-wrap">
                <img src={event.image} alt={event.title} className="event-img" />
                <div className="event-date-badge">
                  <Calendar size={13} />
                  <span>{event.dateTime}</span>
                </div>
              </div>

              <div className="event-card-body">
                <span className="event-category-tag">{event.category}</span>
                <h3 className="event-title">{event.title}</h3>
                <p className="event-desc">{event.description}</p>
                
                <div className="event-card-footer">
                  <span className={`event-price ${event.isFree ? 'free' : ''}`}>
                    {event.price}
                  </span>
                  <button className="btn-event-detail">Detail Event</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
