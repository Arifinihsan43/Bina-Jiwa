import React, { useState } from 'react';
import { DashboardHeader } from '../components/dashboard';
import PsikologLeafletMap from '../components/psikolog/PsikologLeafletMap';
import '../styles/psikolog.css';
import {
  Search,
  MapPin,
  Filter,
  Star,
  Calendar,
  Clock,
  MessageSquare,
  ShieldCheck,
  Video,
  Users,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  Navigation,
  ExternalLink,
  Lock,
  CheckCircle2,
  X,
  Phone,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

const PSYCHOLOGISTS = [
  {
    id: 1,
    name: 'Nadia Pratiwi, M.Psi., Psikolog',
    title: 'Psikolog Klinis Dewasa',
    clinic: 'Klinik Jiwa Harmoni, Menteng',
    type: 'Tatap Muka & Daring',
    distance: '< 1.2 km',
    lat: -6.195,
    lng: 106.832,
    locationName: 'Menteng, Jakarta Pusat',
    rating: 4.9,
    reviewsCount: 124,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    tags: ['Kecemasan', 'Burnout', 'Trauma Emosional'],
    fee: 'Rp 250.000',
    feeRaw: 250000,
    duration: '/ 60 min',
    availableToday: true,
    slots: ['15.30', '19.00'],
    isHimpsiVerified: true,
    bio: 'Berpengalaman 7+ tahun membantu individu mengatasi gangguan kecemasan, kelelahan kerja (burnout), serta pemulihan trauma emosional.'
  },
  {
    id: 2,
    name: 'Bambang Wicaksono, M.Psi., Psikolog',
    title: 'Konselor Pernikahan & Hubungan',
    clinic: 'Kebayoran Healing Space',
    type: 'Khusus Konseling Tatap Muka',
    distance: '< 2.8 km',
    lat: -6.244,
    lng: 106.793,
    locationName: 'Kebayoran Baru, Jakarta Selatan',
    rating: 4.8,
    reviewsCount: 118,
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    tags: ['Hubungan & Pernikahan', 'Self-Esteem', 'Grief & Kehilangan'],
    fee: 'Rp 300.000',
    feeRaw: 300000,
    duration: '/ 60 min',
    availableToday: false,
    availableNext: 'Besok: 10.00 & 14.30',
    slots: ['Besok 10.00', 'Besok 14.30'],
    isHimpsiVerified: true,
    bio: 'Fokus pada dinamika relasi pasangan, krisis harga diri, serta pendampingan melewati masa duka dan kehilangan.'
  },
  {
    id: 3,
    name: 'Siti Rahmawati, S.Psi., M.Psi.',
    title: 'Psikolog Klinis & Mindfulness Practitioner',
    clinic: 'Pusat Terapi Senopati',
    type: 'Tatap Muka & Video Call HD',
    distance: '< 3.5 km',
    lat: -6.231,
    lng: 106.809,
    locationName: 'Senopati, Jakarta Selatan',
    rating: 5.0,
    reviewsCount: 95,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    tags: ['Mindfulness', 'Depresi Ringan-Sedang', 'Kecemasan Karir'],
    fee: 'Rp 275.000',
    feeRaw: 275000,
    duration: '/ 60 min',
    availableToday: true,
    slots: ['17.00'],
    isHimpsiVerified: true,
    bio: 'Pendekatan holistik berbasis CBT & Mindfulness untuk meredakan kecemasan karir serta depresi ringan hingga sedang.'
  },
  {
    id: 4,
    name: 'Dr. Aris Munandar, Sp.KJ',
    title: 'Psikiater & Konsultan Kesehatan Jiwa',
    clinic: 'Rumah Medika Tebet',
    type: 'Konseling Online & Offline',
    distance: '< 4.1 km',
    lat: -6.226,
    lng: 106.848,
    locationName: 'Tebet, Jakarta Selatan',
    rating: 4.9,
    reviewsCount: 142,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    tags: ['Depresi Berat', 'Gangguan Tidur', 'Insomnia'],
    fee: 'Rp 350.000',
    feeRaw: 350000,
    duration: '/ 60 min',
    availableToday: true,
    slots: ['18.30', '20.00'],
    isHimpsiVerified: true,
    bio: 'Praktisi psikiatri klinis berpengalaman 10+ tahun, memadukan terapi perilaku dan pemulihan medis profesional.'
  }
];

export default function PsikologPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRadius, setSelectedRadius] = useState('Jakarta Selatan (Radius 5 km)');
  const [activeChip, setActiveChip] = useState('Semua');
  const [onlyAvailableToday, setOnlyAvailableToday] = useState(false);
  const [selectedPsikologModal, setSelectedPsikologModal] = useState(null);
  const [infoModalPsikolog, setInfoModalPsikolog] = useState(null);
  const [activePinId, setActivePinId] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-09-25');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedMode, setSelectedMode] = useState('offline');

  // Filter psychologists
  const filteredPsychologists = PSYCHOLOGISTS.filter((p) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchClinic = p.clinic.toLowerCase().includes(q);
      const matchTags = p.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchClinic && !matchTags) return false;
    }

    // Category Chip filter
    if (activeChip === 'Psikolog Klinik Dewasa' && !p.title.includes('Dewasa')) return false;
    if (activeChip === '● Tersedia Hari Ini' && !p.availableToday) return false;
    if (activeChip === 'Bisa Tatap Muka (Offline)' && !p.type.includes('Tatap Muka')) return false;
    if (activeChip === 'Konseling Online' && !p.type.includes('Daring') && !p.type.includes('Video Call') && !p.type.includes('Online')) return false;

    // Map toggle filter
    if (onlyAvailableToday && !p.availableToday) return false;

    return true;
  });

  const activePinPsikolog = PSYCHOLOGISTS.find((p) => p.id === activePinId) || PSYCHOLOGISTS[0];

  const handleOpenBooking = (psikolog) => {
    setSelectedPsikologModal(psikolog);
    setSelectedSlot(psikolog.slots[0] || '');
    setBookingSuccess(false);
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setSelectedPsikologModal(null);
      setBookingSuccess(false);
    }, 2200);
  };

  return (
    <div className="db-main-content">
      <DashboardHeader />

        <div className="psikolog-page-container">
          <div className="psikolog-content-wrapper">
            
            {/* Top Badge & Hero Header */}
            <div className="psikolog-hero-section">
              <div className="psikolog-hero-left">
                <div className="psikolog-safe-badge">
                  <ShieldCheck size={14} className="text-sky-600" />
                  <span>TEMUKAN PENDAMPING TERDEKAT • TERVERIFIKASI HIMPSI</span>
                </div>
                <h1 className="psikolog-hero-title">Cari Psikolog &amp; Konselor</h1>
                <p className="psikolog-hero-sub">
                  Langkah pertama menuju pemulihan dimulai dari ruang yang aman dan tepat. Pilih
                  profesional berlisensi di dekat lokasi Anda, baik tatap muka maupun daring.
                </p>
              </div>

              {/* Stat / Verification Card on Top Right */}
              <div className="psikolog-hero-stat-card">
                <div className="stat-card-icon-box">
                  <MapPin size={22} className="text-sky-600 fill-sky-100" />
                </div>
                <div className="stat-card-info">
                  <span className="stat-card-title">100% Berlisensi Resmi</span>
                  <span className="stat-card-sub">SIPP &amp; Keanggotaan HIMPSI Aktif</span>
                </div>
              </div>
            </div>

            {/* Search & Filter Control Bar */}
            <div className="psikolog-search-card">
              <div className="search-inputs-row">
                {/* Search Text Input */}
                <div className="search-text-input-wrapper">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    className="search-text-input"
                    placeholder="Cari nama psikolog, klinik, atau topik (spt: Kecemasan, Burnout)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setSearchQuery('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Radius Select */}
                <div className="radius-select-wrapper">
                  <SlidersHorizontal size={16} className="text-sky-600" />
                  <div className="radius-select-inner">
                    <span className="radius-label">AREA &amp; RADIUS JANGKAU</span>
                    <select
                      className="radius-select"
                      value={selectedRadius}
                      onChange={(e) => setSelectedRadius(e.target.value)}
                    >
                      <option value="Jakarta Selatan (Radius 5 km)">Jakarta Selatan (Radius 5 km)</option>
                      <option value="Jakarta Pusat (Radius 5 km)">Jakarta Pusat (Radius 5 km)</option>
                      <option value="Bandung Kota (Radius 10 km)">Bandung Kota (Radius 10 km)</option>
                      <option value="Surabaya Pusat (Radius 10 km)">Surabaya Pusat (Radius 10 km)</option>
                    </select>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>

                {/* Submit Filter Button */}
                <button type="button" className="apply-filter-btn">
                  <Filter size={16} />
                  <span>Terapkan Filter</span>
                </button>
              </div>

              {/* Category Filter Chips */}
              <div className="category-chips-row">
                {[
                  `Semua (${PSYCHOLOGISTS.length})`,
                  'Psikolog Klinik Dewasa',
                  'Psikolog Anak & Remaja',
                  '● Tersedia Hari Ini',
                  'Bisa Tatap Muka (Offline)',
                  'Konseling Online'
                ].map((chip) => {
                  const labelOnly = chip.startsWith('Semua') ? 'Semua' : chip;
                  const isActive = activeChip === labelOnly || activeChip === chip;

                  return (
                    <button
                      key={chip}
                      type="button"
                      className={`filter-chip-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveChip(labelOnly)}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Main Content Area: Left Cards List + Right Map View */}
            <div className="psikolog-split-grid">
              
              {/* Left Side: Psychologists Cards List */}
              <div className="psikolog-list-column">
                <div className="list-header-row">
                  <div className="list-title-group">
                    <h2 className="list-title">Psikolog di Sekitar Anda</h2>
                    <span className="count-badge">{filteredPsychologists.length} Praktik</span>
                  </div>

                  <div className="sort-dropdown-group">
                    <span className="sort-label">Urutkan:</span>
                    <select className="sort-select">
                      <option value="jarak">Jarak Terdekat</option>
                      <option value="rating">Rating Tertinggi</option>
                      <option value="harga">Harga Terendah</option>
                    </select>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="cards-stack">
                  {filteredPsychologists.map((p) => {
                    const isSelectedOnMap = activePinId === p.id;

                    return (
                      <article
                        key={p.id}
                        className={`psikolog-card ${isSelectedOnMap ? 'highlighted-card' : ''}`}
                        onClick={() => setActivePinId(p.id)}
                      >
                        <div className="card-inner-top">
                          {/* Left Avatar Column */}
                          <div className="avatar-column">
                            <div className="avatar-wrapper">
                              <img src={p.avatar} alt={p.name} className="psychologist-photo" />
                              <span className="online-status-dot" title="Aktif Sesi" />
                            </div>
                            <span className="distance-badge">
                              <MapPin size={12} className="text-rose-500" />
                              {p.distance}
                            </span>
                          </div>

                          {/* Right Meta Column */}
                          <div className="meta-column">
                            <div className="meta-top-bar">
                              {p.isHimpsiVerified && (
                                <span className="himpsi-badge">
                                  <ShieldCheck size={13} />
                                  HIMPSI Terverifikasi
                                </span>
                              )}

                              <div className="rating-pill">
                                <Star size={14} className="fill-amber-400 text-amber-400" />
                                <span className="rating-score">{p.rating}</span>
                                <span className="reviews-count">({p.reviewsCount})</span>
                              </div>
                            </div>

                            <h3 className="psychologist-name">{p.name}</h3>
                            <p className="psychologist-clinic">
                              {p.clinic} • <span className="text-slate-500">{p.type}</span>
                            </p>

                            {/* Tags */}
                            <div className="specialization-tags-group">
                              {p.tags.map((tag) => (
                                <span key={tag} className="spec-tag">
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {/* Price & Availability Box */}
                            <div className="price-slot-box">
                              <div className="price-group">
                                <span className="price-label">Biaya Konsultasi</span>
                                <div className="price-value-row">
                                  <span className="price-amount">{p.fee}</span>
                                  <span className="price-duration">{p.duration}</span>
                                </div>
                              </div>

                              <div className="slot-badge">
                                <Calendar size={13} className="text-sky-600" />
                                <span>
                                  {p.availableToday
                                    ? `Slot hari ini: ${p.slots.join(' & ')}`
                                    : p.availableNext}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="card-actions-row">
                              <button
                                type="button"
                                className="tanya-info-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInfoModalPsikolog(p);
                                }}
                              >
                                <MessageSquare size={15} />
                                <span>Tanya Info</span>
                              </button>

                              <button
                                type="button"
                                className="buat-janji-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenBooking(p);
                                }}
                              >
                                <Calendar size={15} />
                                <span>Buat Janji</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="pagination-row">
                  <span className="pagination-info">
                    Menampilkan 1-{filteredPsychologists.length} dari 14 praktisi terdekat
                  </span>
                  <div className="pagination-buttons">
                    <button type="button" className="page-nav-btn" disabled>&lt;</button>
                    <button type="button" className="page-num-btn active">1</button>
                    <button type="button" className="page-num-btn">2</button>
                    <button type="button" className="page-num-btn">3</button>
                    <button type="button" className="page-nav-btn">&gt;</button>
                  </div>
                </div>
              </div>

              {/* Right Side: Interactive Leaflet Map Container */}
              <PsikologLeafletMap
                psychologists={filteredPsychologists}
                activePinId={activePinId}
                setActivePinId={setActivePinId}
                onOpenBooking={handleOpenBooking}
                onlyAvailableToday={onlyAvailableToday}
                setOnlyAvailableToday={setOnlyAvailableToday}
              />
            </div>

            {/* Bottom Medical Ethics & Privacy Banner */}
            <div className="psikolog-ethics-banner">
              <div className="banner-content-left">
                <div className="banner-badge">
                  <Lock size={13} />
                  <span>Standar Privasi &amp; Etik Bina Jiwa</span>
                </div>
                <h2 className="banner-title">
                  Konseling Anda Dilindungi Kode Etik Kerahasiaan Medis
                </h2>
                <p className="banner-sub">
                  Setiap sesi offline di klinik maupun konsultasi online video call dienkripsi secara
                  menyeluruh (end-to-end). Tidak ada rekaman yang disimpan demi menjaga ruang aman Anda
                  tetap murni dan terlindungi.
                </p>
              </div>

              <div className="banner-actions-right">
                <button type="button" className="privacy-protocol-btn">
                  Pelajari Protokol Privasi
                </button>
                <button type="button" className="cs-help-btn">
                  Ajukan Bantuan CS
                </button>
              </div>
            </div>

          </div>
        </div>

      {/* Booking Modal */}
      {selectedPsikologModal && (
        <div className="modal-backdrop" onClick={() => setSelectedPsikologModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <h3 className="modal-title">Buat Janji Konsultasi</h3>
                <span className="modal-sub">{selectedPsikologModal.name}</span>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setSelectedPsikologModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="booking-success-state">
                <div className="success-icon-circle">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <h4 className="success-title">Janji Konsultasi Berhasil Dibuat!</h4>
                <p className="success-sub">
                  Konfirmasi sesi dan rincian lokasi/link video call telah dikirimkan ke email dan pesan akun Anda.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="booking-form">
                <div className="form-group">
                  <label className="form-label">Mode Sesi Konsultasi</label>
                  <div className="mode-toggle-group">
                    <button
                      type="button"
                      className={`mode-btn ${selectedMode === 'offline' ? 'active' : ''}`}
                      onClick={() => setSelectedMode('offline')}
                    >
                      <MapPin size={15} /> Tatap Muka (Klinik)
                    </button>
                    <button
                      type="button"
                      className={`mode-btn ${selectedMode === 'online' ? 'active' : ''}`}
                      onClick={() => setSelectedMode('online')}
                    >
                      <Video size={15} /> Online Video Call HD
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Pilih Tanggal Sesi</label>
                  <input
                    type="date"
                    className="form-input-date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pilih Jam Pertemuan Available</label>
                  <div className="slot-chips-group">
                    {selectedPsikologModal.slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-chip-btn ${selectedSlot === slot ? 'active' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <Clock size={13} /> {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-summary-box">
                  <div className="summary-row">
                    <span>Biaya Sesi (60 Menit)</span>
                    <span className="font-bold text-slate-800">{selectedPsikologModal.fee}</span>
                  </div>
                  <div className="summary-row">
                    <span>Beban Garansi Privasi</span>
                    <span className="text-emerald-600 font-semibold">Gratis (Terlindungi)</span>
                  </div>
                </div>

                <button type="submit" className="confirm-booking-submit-btn">
                  Konfirmasi &amp; Lanjutkan Pembayaran
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Info / Tanya Modal */}
      {infoModalPsikolog && (
        <div className="modal-backdrop" onClick={() => setInfoModalPsikolog(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <h3 className="modal-title">Profil &amp; Informasi Praktik</h3>
                <span className="modal-sub">{infoModalPsikolog.name}</span>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setInfoModalPsikolog(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="info-modal-body">
              <div className="info-avatar-row">
                <img src={infoModalPsikolog.avatar} alt={infoModalPsikolog.name} className="info-avatar" />
                <div className="info-main-meta">
                  <span className="info-title-badge">{infoModalPsikolog.title}</span>
                  <h4 className="info-name">{infoModalPsikolog.name}</h4>
                  <span className="info-clinic"><MapPin size={13} className="text-rose-500" /> {infoModalPsikolog.clinic}</span>
                </div>
              </div>

              <div className="info-bio-box">
                <h5 className="info-section-label">Latar Belakang &amp; Keahlian</h5>
                <p className="info-bio-text">{infoModalPsikolog.bio}</p>
              </div>

              <div className="info-tags-box">
                <h5 className="info-section-label">Fokus Penanganan</h5>
                <div className="specialization-tags-group">
                  {infoModalPsikolog.tags.map((t) => (
                    <span key={t} className="spec-tag">{t}</span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                className="confirm-booking-submit-btn"
                onClick={() => {
                  const target = infoModalPsikolog;
                  setInfoModalPsikolog(null);
                  handleOpenBooking(target);
                }}
              >
                Buat Janji Konsultasi Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
