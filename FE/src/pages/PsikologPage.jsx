import React, { useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from '../components/dashboard';
import PsikologLeafletMap from '../components/psikolog/PsikologLeafletMap';
import BookingModal from '../components/psikolog/BookingModal';
import '../styles/psikolog.css';
import '../styles/profil-psikolog.css';
import {
  Search,
  MapPin,
  Calendar,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  Lock,
  X,
  SlidersHorizontal,
  AlertCircle,
  Users,
} from 'lucide-react';
import { DAY_NAMES, DAY_SHORT, formatTime, listPublishedPsychologists } from '../service/psychologistService';
import { BIAYA_LAYANAN, formatRupiah } from '../service/paymentService';

const ALL_CITIES = 'Semua Kota';
const CHIP_ALL = 'Semua';
const CHIP_TODAY = '● Tersedia Hari Ini';

const initials = (name) =>
  name
    .split(',')[0]
    .split(/\s+/)
    .filter((w) => w && !w.endsWith('.'))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

function PsychologistAvatar({ p, className }) {
  if (p.avatar) return <img src={p.avatar} alt={p.name} className={className} />;
  return (
    <div className={`${className} psychologist-initials`} aria-label={p.name}>
      {initials(p.name)}
    </div>
  );
}

const scheduleDays = (jadwal) =>
  [...new Set(jadwal.map((s) => s.hari))].map((h) => DAY_SHORT[h - 1]).join(', ');

export default function PsikologPage() {
  const [psychologists, setPsychologists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(ALL_CITIES);
  const [activeChip, setActiveChip] = useState(CHIP_ALL);
  const [sortBy, setSortBy] = useState('nama');
  const [onlyAvailableToday, setOnlyAvailableToday] = useState(false);
  const [selectedPsikologModal, setSelectedPsikologModal] = useState(null);
  const [infoModalPsikolog, setInfoModalPsikolog] = useState(null);
  const [activePinId, setActivePinId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listPublishedPsychologists()
      .then((rows) => {
        if (cancelled) return;
        setPsychologists(rows);
        const firstOnMap = rows.find((p) => p.lat !== null && p.lng !== null);
        setActivePinId(firstOnMap ? firstOnMap.id : null);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cities = useMemo(
    () => [...new Set(psychologists.map((p) => p.city).filter(Boolean))].sort(),
    [psychologists]
  );

  // Chip spesialisasi: 4 fokus penanganan yang paling sering muncul.
  const topTags = useMemo(() => {
    const counts = {};
    psychologists.forEach((p) => p.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag]) => tag);
  }, [psychologists]);

  const filteredPsychologists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = psychologists.filter((p) => {
      if (q) {
        const haystack = [p.name, p.address, p.city, ...p.tags].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (selectedCity !== ALL_CITIES && p.city !== selectedCity) return false;
      if (activeChip === CHIP_TODAY && !p.availableToday) return false;
      if (activeChip !== CHIP_ALL && activeChip !== CHIP_TODAY && !p.tags.includes(activeChip)) return false;
      if (onlyAvailableToday && !p.availableToday) return false;
      return true;
    });
    if (sortBy === 'tersedia') {
      return [...rows].sort((a, b) => Number(b.availableToday) - Number(a.availableToday));
    }
    return rows;
  }, [psychologists, searchQuery, selectedCity, activeChip, onlyAvailableToday, sortBy]);

  const mapPsychologists = useMemo(
    () => filteredPsychologists.filter((p) => p.lat !== null && p.lng !== null),
    [filteredPsychologists]
  );

  const handleOpenBooking = (psikolog) => {
    setSelectedPsikologModal(psikolog);
  };

  const chips = [CHIP_ALL, CHIP_TODAY, ...topTags];

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
                  <span className="stat-card-sub">Diverifikasi tim Bina Jiwa</span>
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

                {/* City Select */}
                <div className="radius-select-wrapper">
                  <SlidersHorizontal size={16} className="text-sky-600" />
                  <div className="radius-select-inner">
                    <span className="radius-label">KOTA PRAKTIK</span>
                    <select
                      className="radius-select"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                    >
                      <option value={ALL_CITIES}>{ALL_CITIES}</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <ChevronDown size={14} className="text-slate-400" />
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="category-chips-row">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={`filter-chip-btn ${activeChip === chip ? 'active' : ''}`}
                    onClick={() => setActiveChip(chip)}
                  >
                    {chip === CHIP_ALL ? `${CHIP_ALL} (${psychologists.length})` : chip}
                  </button>
                ))}
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
                    <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="nama">Nama (A–Z)</option>
                      <option value="tersedia">Tersedia Hari Ini</option>
                    </select>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="cards-stack">
                  {loading && <div className="psikolog-empty-state">Memuat daftar psikolog…</div>}

                  {!loading && loadError && (
                    <div className="psikolog-empty-state">
                      <AlertCircle size={28} className="text-rose-500" />
                      <strong>Gagal memuat daftar psikolog</strong>
                      <span>{loadError}</span>
                    </div>
                  )}

                  {!loading && !loadError && filteredPsychologists.length === 0 && (
                    <div className="psikolog-empty-state">
                      <Users size={28} />
                      <strong>
                        {psychologists.length === 0 ? 'Belum ada psikolog yang terdaftar' : 'Tidak ada psikolog yang cocok'}
                      </strong>
                      <span>
                        {psychologists.length === 0
                          ? 'Psikolog akan tampil di sini setelah profilnya diverifikasi.'
                          : 'Coba ubah kata kunci atau filter pencarian Anda.'}
                      </span>
                    </div>
                  )}

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
                              <PsychologistAvatar p={p} className="psychologist-photo" />
                              {p.availableToday && <span className="online-status-dot" title="Praktik hari ini" />}
                            </div>
                            {p.city && (
                              <span className="distance-badge">
                                <MapPin size={12} className="text-rose-500" />
                                {p.city}
                              </span>
                            )}
                          </div>

                          {/* Right Meta Column */}
                          <div className="meta-column">
                            <div className="meta-top-bar">
                              {p.isVerified && (
                                <span className="himpsi-badge">
                                  <ShieldCheck size={13} />
                                  Terverifikasi
                                </span>
                              )}
                            </div>

                            <h3 className="psychologist-name">{p.name}</h3>
                            {(p.address || p.city) && (
                              <p className="psychologist-clinic">
                                {p.address || p.city}
                              </p>
                            )}

                            {/* Tags */}
                            {p.tags.length > 0 && (
                              <div className="specialization-tags-group">
                                {p.tags.map((tag) => (
                                  <span key={tag} className="spec-tag">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Schedule & Availability Box */}
                            <div className="price-slot-box">
                              <div className="price-group">
                                <span className="price-label">Tarif per Sesi</span>
                                <div className="price-value-row">
                                  <span className="price-amount">{p.tarif > 0 ? formatRupiah(p.tarif) : 'Gratis'}</span>
                                  {p.tarif > 0 && <span className="price-duration">/ 60 menit</span>}
                                </div>
                                <span className="price-label">
                                  Praktik: {p.jadwal.length ? scheduleDays(p.jadwal) : '—'}
                                </span>
                              </div>

                              <div className="slot-badge">
                                <Calendar size={13} className="text-sky-600" />
                                <span>
                                  {p.availableToday
                                    ? `Hari ini: ${p.slots.join(' & ')}`
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
                                <span>Lihat Profil</span>
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

                {filteredPsychologists.length > 0 && (
                  <div className="pagination-row">
                    <span className="pagination-info">
                      Menampilkan {filteredPsychologists.length} dari {psychologists.length} praktisi
                    </span>
                  </div>
                )}
              </div>

              {/* Right Side: Interactive Leaflet Map Container */}
              <PsikologLeafletMap
                psychologists={mapPsychologists}
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
        <BookingModal
          psychologist={selectedPsikologModal}
          onClose={() => setSelectedPsikologModal(null)}
        />
      )}

      {/* Info / Profil Modal */}
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
                <PsychologistAvatar p={infoModalPsikolog} className="info-avatar" />
                <div className="info-main-meta">
                  {infoModalPsikolog.isVerified && (
                    <span className="info-title-badge">Psikolog Terverifikasi</span>
                  )}
                  <h4 className="info-name">{infoModalPsikolog.name}</h4>
                  {(infoModalPsikolog.address || infoModalPsikolog.city) && (
                    <span className="info-clinic">
                      <MapPin size={13} className="text-rose-500" />{' '}
                      {[infoModalPsikolog.address, infoModalPsikolog.city].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {infoModalPsikolog.bio && (
                <div className="info-bio-box">
                  <h5 className="info-section-label">Latar Belakang &amp; Keahlian</h5>
                  <p className="info-bio-text">{infoModalPsikolog.bio}</p>
                </div>
              )}

              {infoModalPsikolog.tags.length > 0 && (
                <div className="info-tags-box">
                  <h5 className="info-section-label">Fokus Penanganan</h5>
                  <div className="specialization-tags-group">
                    {infoModalPsikolog.tags.map((t) => (
                      <span key={t} className="spec-tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="info-tags-box">
                <h5 className="info-section-label">Tarif Konsultasi</h5>
                <p className="info-bio-text">
                  {infoModalPsikolog.tarif > 0
                    ? `${formatRupiah(infoModalPsikolog.tarif)} per sesi (60 menit), belum termasuk biaya layanan ${formatRupiah(BIAYA_LAYANAN)}.`
                    : 'Gratis'}
                </p>
              </div>

              {infoModalPsikolog.jadwal.length > 0 && (
                <div className="info-tags-box">
                  <h5 className="info-section-label">Jadwal Praktik</h5>
                  <ul className="pp-schedule-list">
                    {infoModalPsikolog.jadwal.map((s) => (
                      <li key={s.id_schedule} className="pp-schedule-row">
                        <span className="pp-schedule-day">{DAY_NAMES[s.hari - 1]}</span>
                        <span className="pp-schedule-time">
                          {formatTime(s.jam_mulai)} – {formatTime(s.jam_selesai)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(infoModalPsikolog.nomorHimpsi || infoModalPsikolog.nomorSipp) && (
                <div className="info-tags-box">
                  <h5 className="info-section-label">Legalitas</h5>
                  <p className="info-bio-text">
                    {infoModalPsikolog.nomorHimpsi && <>HIMPSI: {infoModalPsikolog.nomorHimpsi}<br /></>}
                    {infoModalPsikolog.nomorSipp && <>SIPP: {infoModalPsikolog.nomorSipp}</>}
                  </p>
                </div>
              )}

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
