import React, { useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import '../components/events/Events.css';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  Users,
  Search,
  Filter,
  Sparkles,
  ShieldCheck,
  Award,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Share2,
  X,
  FileText,
  UserCheck,
  Check,
  ArrowRight
} from 'lucide-react';

const FEATURED_MASTERCLASS = {
  id: 'masterclass-1',
  tagBadge: 'Lokakarya Pilihan Ini',
  certBadge: 'HIMPSI Certified CPD',
  title: 'Masterclass: Mengatasi Burnout & Regulasi Emosi di Tempat Kerja',
  sub: 'Pelajari protokol psikologis berbasis Cognitive Behavioral Therapy (CBT) dan Acceptance-Commitment Therapy (ACT) untuk merelevansi vitalitas kerja tanpa mengorbankan stabilitas mental Anda.',
  speakers: [
    {
      name: 'dr. Dimas Wicaksono, Sp.KJ & Nadia Pratiwi, M.Psi.',
      title: 'Spesialis Kesehatan Jiwa Kerja & Psikolog Trauma & Konsultan Workplace Wellbeing',
      avatar1: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
      avatar2: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    }
  ],
  date: 'Sabtu, 2 November 2024',
  time: '09.00 - 12.00 WIB (3 Jam)',
  location: 'Via Zoom Live + Rekaman Sesi 30 Hari',
  includes: 'Worksheet Panduan Regulasi Diri & e-Sertifikat',
  ticketType: 'EARLY BIRD TICKET',
  discountBadge: 'Hemat 60%',
  price: 'Rp 99.000',
  originalPrice: 'Rp 250.000',
  seatsLeft: 12,
  totalSeats: 100,
  checklist: [
    'Akses Interaktif Q&A studi kasus 1-on-1',
    'Akses grup diskusi eksklusif Telegram',
    'e-Sertifikat resmi terakreditasi HIMPSI'
  ],
  syllabus: [
    'Modul 1: Pemetaan Sumber Stressor & Saraf Autonomik Pekerja',
    'Modul 2: Teknik Grounding 5-4-3-2-1 saat Panik di Kantor',
    'Modul 3: Manajemen Boundary Komunikasi Beban Kerja',
    'Modul 4: Pembuatan Cetak Biru (Blueprint) Self-Care Harian'
  ]
};

const EVENTS_LIST = [
  {
    id: 1,
    categoryBadge: 'Workshop Interaktif',
    typeBadge: 'Zoom Meeting',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    date: 'Minggu, 3 Nov 2024 • 15.00 WIB',
    title: 'Seni Berdamai dengan Diri Sendiri (Self-Compassion)',
    description: 'Eksplorasi langkah praktis melepaskan kritik batin berlebih dan membangun hubungan yang hangat dengan pikiran sendiri.',
    speakerName: 'Annisa Rahma, M.Psi., Psikolog',
    speakerTitle: 'Psikolog Klinis Dewasa',
    speakerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    price: 'Gratis',
    isFree: true,
    seatsLeft: 42,
    btnLabel: 'Daftar Gratis',
    btnVariant: 'primary'
  },
  {
    id: 2,
    categoryBadge: 'Meditasi & Mindful',
    typeBadge: 'Hybrid (Jakarta & Online)',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80',
    date: 'Rabu, 6 Nov 2024 • 19.30 WIB',
    title: 'Mindful Breathing & Somatic Healing untuk Ketenangan',
    description: 'Teknik aktivasi saraf vagus dan pelepasan ketegangan fisik saat mengalami akumulasi kecemasan sehari-hari.',
    speakerName: 'Rina Sastri, CWT.',
    speakerTitle: 'Praktisi Meditasi & Somatic',
    speakerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    price: 'Rp 75.000',
    isFree: false,
    seatsLeft: 25,
    btnLabel: 'Daftar Sesi',
    btnVariant: 'outline'
  },
  {
    id: 3,
    categoryBadge: 'Support Group Tertutup',
    typeBadge: 'Tatap Muka (Jakarta)',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80',
    date: 'Sabtu, 9 Nov 2024 • 13.00 WIB',
    title: 'Support Group Terpandu: Melepaskan Beban Trauma Masa Lalu',
    description: 'Ruang pemulihan emosional aman dengan NDA kerahasiaan ketat, didampingi psikolog spesialis trauma.',
    speakerName: 'Nadia Pratiwi, M.Psi., Psikolog',
    speakerTitle: 'Trauma & Recovery Specialist',
    speakerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    price: 'Rp 120.000',
    isFree: false,
    seatsLeft: 3,
    isAlmostFull: true,
    btnLabel: 'Reservasi Tempat',
    btnVariant: 'dark'
  },
  {
    id: 4,
    categoryBadge: 'Webinar Klinis',
    typeBadge: 'Zoom Live',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=600&auto=format&fit=crop&q=80',
    date: 'Selasa, 12 Nov 2024 • 20.00 WIB',
    title: 'Sleep Hygiene & Manajemen Insomnia Tanpa Obat',
    description: 'Pembentukan pola tidur sehat untuk memutus siklus insomnia, cemas malam hari, dan keletihan kronis.',
    speakerName: 'dr. Ferian Malik, Sp.KJ',
    speakerTitle: 'Spesialis Kedokteran Jiwa',
    speakerAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    price: 'Rp 50.000',
    isFree: false,
    seatsLeft: 55,
    btnLabel: 'Daftar Sesi',
    btnVariant: 'outline'
  },
  {
    id: 5,
    categoryBadge: 'Workshop Tatap Muka',
    typeBadge: 'Tatap Muka (Bandung)',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=600&auto=format&fit=crop&q=80',
    date: 'Sabtu, 16 Nov 2024 • 10.00 - 16.00 WIB',
    title: 'Creative Art Therapy: Melukis Rasa untuk Menyembuhkan Diri',
    description: 'Sesi tatap muka ekspresi menggunakan medium cat akrilik dan kanvas untuk menyuarakan emosi yang tersumbat.',
    speakerName: 'Winya Larasati, S.Sn.',
    speakerTitle: 'Certified Art Psychotherapist',
    speakerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    price: 'Rp 185.000',
    isFree: false,
    seatsLeft: 8,
    btnLabel: 'Daftar Workshop',
    btnVariant: 'outline'
  },
  {
    id: 6,
    categoryBadge: 'Edukasi Komunitas',
    typeBadge: 'Zoom Workshop',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
    date: 'Minggu, 24 Nov 2024 • 14.00 WIB',
    title: 'Psikoedukasi Keluarga: Mendampingi Kerabat dengan Gangguan Cemas',
    description: 'Panduan komunikasi suportif bagi anggota keluarga agar terhindar dari burnout perawat (caregiver fatigue).',
    speakerName: 'Tim Psikolog Klinis Bina Jiwa',
    speakerTitle: 'Konsultan Psikoedukasi Publik',
    speakerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    price: 'Gratis',
    isFree: true,
    seatsLeft: 120,
    btnLabel: 'Daftar Gratis',
    btnVariant: 'primary'
  }
];

export default function EventsPage({ user, onLogout, activeMenu = 'events', setActiveMenu }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'my_events'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState('Semua Topik');
  const [selectedEventModal, setSelectedEventModal] = useState(null);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [registeredEvents, setRegisteredEvents] = useState([1]); // Default registered in Event #1
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleRegisterEvent = (eventObj) => {
    setSelectedEventModal(eventObj);
    setRegistrationSuccess(false);
  };

  const handleConfirmRegistration = (e) => {
    e.preventDefault();
    if (selectedEventModal) {
      if (!registeredEvents.includes(selectedEventModal.id)) {
        setRegisteredEvents([...registeredEvents, selectedEventModal.id]);
      }
    }
    setRegistrationSuccess(true);
    setTimeout(() => {
      setSelectedEventModal(null);
      setRegistrationSuccess(false);
    }, 2000);
  };

  // Filter events
  const filteredEvents = EVENTS_LIST.filter((evt) => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = evt.title.toLowerCase().includes(q);
      const matchSpeaker = evt.speakerName.toLowerCase().includes(q);
      const matchDesc = evt.description.toLowerCase().includes(q);
      if (!matchTitle && !matchSpeaker && !matchDesc) return false;
    }

    // Topic Filter
    if (activeTopic === 'Gratis' && !evt.isFree) return false;
    if (activeTopic === 'Berbayar' && evt.isFree) return false;
    if (activeTopic === 'Zoom / Online' && !evt.typeBadge.toLowerCase().includes('zoom') && !evt.typeBadge.toLowerCase().includes('online')) return false;
    if (activeTopic === 'Tatap Muka' && !evt.typeBadge.toLowerCase().includes('tatap muka') && !evt.typeBadge.toLowerCase().includes('hybrid')) return false;

    // Tab filter
    if (activeTab === 'my_events' && !registeredEvents.includes(evt.id)) return false;

    return true;
  });

  return (
    <div className={`db-layout-wrapper ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="db-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Left Sidebar */}
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        activeMenu={activeMenu || 'events'}
        setActiveMenu={setActiveMenu}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="db-main-content">
        <DashboardHeader />

        <div className="events-page-container">
          <div className="events-content-wrapper">
            
            {/* Top Badge & Hero Title Section */}
            <div className="events-hero-section">
              <div className="events-hero-left">
                <div className="events-safe-badge">
                  <Sparkles size={14} className="text-sky-600" />
                  <span>Eksplorasi Pembelajaran &amp; Pemulihan Jiwa</span>
                </div>
                <h1 className="events-hero-title">Events &amp; Workshop Kesehatan Mental</h1>
                <p className="events-hero-sub">
                  Ikuti lokakarya interaktif, webinar klinis bersama psikolog bersertifikat, dan sesi
                  meditasi terpandu untuk merawat pikiran dan jiwa dalam ruang yang aman dan terpercaya.
                </p>
              </div>

              <div className="events-hero-sort-group">
                <span className="sort-label">Urutkan:</span>
                <select className="sort-select">
                  <option value="terdekat">Jadwal Terdekat</option>
                  <option value="populer">Paling Populer</option>
                  <option value="gratis">Sesi Gratis Pertama</option>
                </select>
              </div>
            </div>

            {/* Search & Quick Filter Chips Row */}
            <div className="events-search-bar-card">
              <div className="search-input-box">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  className="search-event-input"
                  placeholder="Cari topik, narasumber spesialis, atau tanggal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="clear-btn" onClick={() => setSearchQuery('')}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="topic-chips-row">
                {['Semua Topik', 'Gratis', 'Berbayar', 'Zoom / Online', 'Tatap Muka'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={`topic-chip-btn ${activeTopic === chip ? 'active' : ''}`}
                    onClick={() => setActiveTopic(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Masterclass Highlight Banner */}
            <div className="featured-masterclass-card">
              <div className="masterclass-left">
                <div className="masterclass-badges-row">
                  <span className="badge-highlight">
                    <Sparkles size={13} /> {FEATURED_MASTERCLASS.tagBadge}
                  </span>
                  <span className="badge-certified">
                    <ShieldCheck size={13} /> {FEATURED_MASTERCLASS.certBadge}
                  </span>
                </div>

                <h2 className="masterclass-title">{FEATURED_MASTERCLASS.title}</h2>
                <p className="masterclass-sub">{FEATURED_MASTERCLASS.sub}</p>

                {/* Speakers Info Box */}
                <div className="speakers-box">
                  <div className="stacked-avatars">
                    <img
                      src={FEATURED_MASTERCLASS.speakers[0].avatar1}
                      alt="Speaker 1"
                      className="speaker-avatar"
                    />
                    <img
                      src={FEATURED_MASTERCLASS.speakers[0].avatar2}
                      alt="Speaker 2"
                      className="speaker-avatar overlap"
                    />
                  </div>
                  <div className="speaker-details">
                    <span className="speaker-name">{FEATURED_MASTERCLASS.speakers[0].name}</span>
                    <span className="speaker-title-text">{FEATURED_MASTERCLASS.speakers[0].title}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="masterclass-details-grid">
                  <div className="detail-item">
                    <Calendar size={16} className="text-sky-600" />
                    <span>{FEATURED_MASTERCLASS.date}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={16} className="text-sky-600" />
                    <span>{FEATURED_MASTERCLASS.time}</span>
                  </div>
                  <div className="detail-item">
                    <Video size={16} className="text-sky-600" />
                    <span>{FEATURED_MASTERCLASS.location}</span>
                  </div>
                  <div className="detail-item">
                    <FileText size={16} className="text-sky-600" />
                    <span>{FEATURED_MASTERCLASS.includes}</span>
                  </div>
                </div>
              </div>

              {/* Right Side Ticket Box */}
              <div className="masterclass-ticket-box">
                <div className="ticket-top-badge-row">
                  <span className="ticket-type">{FEATURED_MASTERCLASS.ticketType}</span>
                  <span className="discount-tag">{FEATURED_MASTERCLASS.discountBadge}</span>
                </div>

                <div className="ticket-price-row">
                  <span className="current-price">{FEATURED_MASTERCLASS.price}</span>
                  <span className="original-price">{FEATURED_MASTERCLASS.originalPrice}</span>
                </div>

                {/* Seats indicator */}
                <div className="seats-progress-wrapper">
                  <div className="seats-text-row">
                    <span>Ketersediaan Kursi</span>
                    <span className="seats-highlight">Sisa {FEATURED_MASTERCLASS.seatsLeft} dari {FEATURED_MASTERCLASS.totalSeats} Kursi</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${(FEATURED_MASTERCLASS.seatsLeft / FEATURED_MASTERCLASS.totalSeats) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="ticket-checklist">
                  {FEATURED_MASTERCLASS.checklist.map((item, i) => (
                    <div key={i} className="checklist-item">
                      <CheckCircle2 size={15} className="text-sky-600 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="ticket-actions-row">
                  <button
                    type="button"
                    className="daftar-sekarang-btn"
                    onClick={() => handleRegisterEvent(FEATURED_MASTERCLASS)}
                  >
                    Daftar Sekarang
                  </button>
                  <button
                    type="button"
                    className="lihat-silabus-btn"
                    onClick={() => setShowSyllabusModal(true)}
                  >
                    <BookOpen size={15} />
                    <span>Lihat Silabus</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="events-tabs-row">
              <div className="tabs-group">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  <Calendar size={16} />
                  <span>Akan Datang (Upcoming)</span>
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'my_events' ? 'active' : ''}`}
                  onClick={() => setActiveTab('my_events')}
                >
                  <UserCheck size={16} />
                  <span>Sesi Terdaftar Saya</span>
                  <span className="tab-count-badge">{registeredEvents.length}</span>
                </button>
              </div>

              <span className="events-count-text">
                Menampilkan {filteredEvents.length} Lokakarya Terpilih
              </span>
            </div>

            {/* Events Grid (6 Cards) */}
            <div className="events-cards-grid">
              {filteredEvents.map((evt) => {
                const isRegistered = registeredEvents.includes(evt.id);

                return (
                  <article key={evt.id} className="event-card">
                    {/* Header Image Box */}
                    <div className="event-image-box">
                      <img src={evt.image} alt={evt.title} className="event-card-img" />
                      <span className="event-cat-badge">{evt.categoryBadge}</span>
                      <span className="event-type-badge">{evt.typeBadge}</span>
                    </div>

                    {/* Content Box */}
                    <div className="event-card-body">
                      <div className="event-date-row">
                        <Calendar size={13} className="text-sky-600" />
                        <span>{evt.date}</span>
                      </div>

                      <h3 className="event-card-title">{evt.title}</h3>
                      <p className="event-card-desc">{evt.description}</p>

                      {/* Speaker Box */}
                      <div className="event-speaker-row">
                        <img
                          src={evt.speakerAvatar}
                          alt={evt.speakerName}
                          className="speaker-thumb-img"
                        />
                        <div className="speaker-thumb-meta">
                          <span className="speaker-thumb-name">{evt.speakerName}</span>
                          <span className="speaker-thumb-title">{evt.speakerTitle}</span>
                        </div>
                      </div>

                      {/* Footer Row */}
                      <div className="event-card-footer">
                        <div className="price-seats-group">
                          <span className="card-price-text">{evt.price}</span>
                          <span className={`seats-left-tag ${evt.isAlmostFull ? 'almost-full' : ''}`}>
                            Sisa {evt.seatsLeft} kursi
                          </span>
                        </div>

                        <button
                          type="button"
                          className={`event-action-btn btn-${evt.btnVariant} ${isRegistered ? 'registered' : ''}`}
                          onClick={() => handleRegisterEvent(evt)}
                        >
                          {isRegistered ? 'Terdaftar ✓' : evt.btnLabel}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Bottom Collaboration Banner */}
            <div className="events-collab-banner">
              <div className="collab-content-left">
                <span className="collab-sub-tag">KOLABORASI BERSAMA BINA JIWA</span>
                <h2 className="collab-title">
                  Tertarik Menjadi Fasilitator atau Mengadakan Workshop di Komunitasmu?
                </h2>
                <p className="collab-desc">
                  Kami membuka kemitraan bagi praktisi kesehatan mental berlisensi (Psikolog, Psikiater, Art/Music Therapist) dan perusahaan yang ingin menyelenggarakan sesi Employee Assistance Program.
                </p>
              </div>

              <div className="collab-actions-right">
                <button type="button" className="ajukan-kolaborasi-btn">
                  Ajukan Proposal Kolaborasi
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Syllabus Modal */}
      {showSyllabusModal && (
        <div className="modal-backdrop" onClick={() => setShowSyllabusModal(false)}>
          <div className="modal-card syllabus-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <h3 className="modal-title">Silabus Masterclass Burnout &amp; Regulasi Emosi</h3>
                <span className="modal-sub">Kurikulum Klinis Terakreditasi HIMPSI</span>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setShowSyllabusModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="syllabus-body">
              {FEATURED_MASTERCLASS.syllabus.map((mod, idx) => (
                <div key={idx} className="syllabus-item">
                  <div className="syllabus-num">{idx + 1}</div>
                  <span className="syllabus-text">{mod}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="confirm-booking-submit-btn"
              onClick={() => {
                setShowSyllabusModal(false);
                handleRegisterEvent(FEATURED_MASTERCLASS);
              }}
            >
              Daftar Sekarang (Rp 99.000)
            </button>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {selectedEventModal && (
        <div className="modal-backdrop" onClick={() => setSelectedEventModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <h3 className="modal-title">Pendaftaran Sesi Workshop</h3>
                <span className="modal-sub">{selectedEventModal.title}</span>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setSelectedEventModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            {registrationSuccess ? (
              <div className="booking-success-state">
                <div className="success-icon-circle">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <h4 className="success-title">Pendaftaran Berhasil!</h4>
                <p className="success-sub">
                  Tautan Zoom Meeting, e-Worksheet, dan kode akses telah dikirimkan ke email serta pesan akun Bina Jiwa Anda.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmRegistration} className="registration-form">
                <div className="event-modal-summary">
                  <div className="summary-row">
                    <span>Jadwal Pelaksanaan</span>
                    <span className="font-bold text-slate-800">{selectedEventModal.date}</span>
                  </div>
                  <div className="summary-row">
                    <span>Biaya Pendaftaran</span>
                    <span className="font-bold text-sky-600">{selectedEventModal.price}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Peserta (Sesuai e-Sertifikat)</label>
                  <input
                    type="text"
                    className="form-input-text"
                    defaultValue={user?.name || 'Rani Kartika'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Penerima Tiket &amp; Rekaman Sesi</label>
                  <input
                    type="email"
                    className="form-input-text"
                    defaultValue={user?.email || 'ranikartika@gmail.com'}
                    required
                  />
                </div>

                <button type="submit" className="confirm-booking-submit-btn">
                  Konfirmasi Pendaftaran Sesi
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
