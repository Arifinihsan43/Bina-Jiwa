import React, { useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from '../components/dashboard';
import EventCard from '../components/events/EventCard';
import EventDetailModal from '../components/events/EventDetailModal';
import '../styles/psikolog.css';
import '../styles/events.css';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Search,
  Sparkles,
  X,
  UserCheck,
  AlertCircle,
  CalendarX,
  Mail,
} from 'lucide-react';
import {
  PROPOSAL_EMAIL,
  formatDuration,
  formatEventDay,
  formatEventTime,
  formatPrice,
  initialsOf,
  isFree,
  listMyRegistrations,
  listUpcomingEvents,
  proposalMailto,
} from '../service/eventService';

const CHIPS = ['Semua', 'Gratis', 'Berbayar', 'Online', 'Tatap Muka'];

const matchesChip = (evt, chip) => {
  if (chip === 'Gratis') return isFree(evt);
  if (chip === 'Berbayar') return !isFree(evt);
  if (chip === 'Online') return evt.type === 'ONLINE';
  if (chip === 'Tatap Muka') return evt.type === 'OFFLINE';
  return true;
};

const sorters = {
  terdekat: (a, b) => new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai),
  populer: (a, b) => b.jumlah_peserta - a.jumlah_peserta,
  gratis: (a, b) => Number(a.harga) - Number(b.harga) || new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai),
};

export default function EventsPage({ user }) {
  const [tab, setTab] = useState('upcoming'); // upcoming | registered
  const [upcoming, setUpcoming] = useState([]);
  const [registered, setRegistered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState('Semua');
  const [sort, setSort] = useState('terdekat');
  const [now, setNow] = useState(() => Date.now());
  const [detailEvent, setDetailEvent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listUpcomingEvents(), listMyRegistrations()])
      .then(([up, reg]) => {
        if (cancelled) return;
        setUpcoming(up);
        setRegistered(reg);
        setNow(Date.now());
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Event yang sama bisa ada di dua daftar; perbarui keduanya.
  const applyUpdate = (updated) => {
    const replace = (list) => list.map((e) => (e.id_event === updated.id_event ? updated : e));
    setUpcoming(replace);
    setRegistered((prev) =>
      prev.some((e) => e.id_event === updated.id_event) ? replace(prev) : [updated, ...prev]
    );
    setDetailEvent((d) => (d?.id_event === updated.id_event ? updated : d));
  };

  const activeRegistrations = registered.filter((e) => ['REGISTERED', 'ATTENDED'].includes(e.status_pendaftaran_saya));

  const source = tab === 'upcoming' ? upcoming : registered;
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = source.filter((evt) => {
      if (!matchesChip(evt, chip)) return false;
      if (!q) return true;
      return [evt.judul, evt.deskripsi, evt.penyelenggara?.nama, evt.lokasi].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
    return tab === 'upcoming' ? [...rows].sort(sorters[sort]) : rows;
  }, [source, search, chip, sort, tab]);

  // Sorotan: event terdekat yang pendaftarannya masih dibuka.
  const featured = useMemo(
    () => [...upcoming].sort(sorters.terdekat).find((e) => e.pendaftaran_dibuka) || null,
    [upcoming]
  );

  return (
    <div className="db-main-content">
      <DashboardHeader />

      <div className="events-page-container">
        <div className="events-content-wrapper">
          {/* Hero */}
          <div className="events-hero-section">
            <div className="events-hero-left">
              <div className="events-safe-badge">
                <Sparkles size={14} className="text-sky-600" />
                <span>Eksplorasi Pembelajaran &amp; Pemulihan Jiwa</span>
              </div>
              <h1 className="events-hero-title">Events &amp; Workshop Kesehatan Mental</h1>
              <p className="events-hero-sub">
                Ikuti lokakarya interaktif, webinar, dan sesi pendampingan yang dikurasi tim Bina Jiwa
                untuk merawat pikiran dan jiwa dalam ruang yang aman dan terpercaya.
              </p>
            </div>

            <div className="events-hero-sort-group">
              <span className="sort-label">Urutkan:</span>
              <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="terdekat">Jadwal Terdekat</option>
                <option value="populer">Paling Diminati</option>
                <option value="gratis">Sesi Gratis Dulu</option>
              </select>
            </div>
          </div>

          {/* Pencarian & filter */}
          <div className="events-search-bar-card">
            <div className="search-input-box">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                className="search-event-input"
                placeholder="Cari judul, penyelenggara, atau lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="clear-btn" onClick={() => setSearch('')} aria-label="Hapus pencarian">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="topic-chips-row">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`topic-chip-btn ${chip === c ? 'active' : ''}`}
                  onClick={() => setChip(c)}
                  aria-pressed={chip === c}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Kartu sorotan */}
          {featured && tab === 'upcoming' && (
            <div className="featured-masterclass-card">
              <div className="masterclass-left">
                <div className="masterclass-badges-row">
                  <span className="badge-highlight">
                    <Sparkles size={13} /> Sesi Terdekat
                  </span>
                  <span className="badge-certified">{featured.type === 'ONLINE' ? 'Online' : 'Tatap Muka'}</span>
                </div>

                <h2 className="masterclass-title">{featured.judul}</h2>
                {featured.deskripsi && <p className="masterclass-sub">{featured.deskripsi}</p>}

                {featured.penyelenggara && (
                  <div className="speakers-box">
                    <div className="speaker-avatar speaker-initials">{initialsOf(featured.penyelenggara.nama)}</div>
                    <div className="speaker-details">
                      <span className="speaker-name">{featured.penyelenggara.nama}</span>
                      <span className="speaker-title-text">{featured.penyelenggara.keterangan || 'Penyelenggara'}</span>
                    </div>
                  </div>
                )}

                <div className="masterclass-details-grid">
                  <div className="detail-item">
                    <Calendar size={16} className="text-sky-600" />
                    <span>{formatEventDay(featured.tanggal_mulai)}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={16} className="text-sky-600" />
                    <span>
                      {formatEventTime(featured.tanggal_mulai, featured.tanggal_selesai)} ({formatDuration(featured.tanggal_mulai, featured.tanggal_selesai)})
                    </span>
                  </div>
                  <div className="detail-item">
                    {featured.type === 'ONLINE' ? <Video size={16} className="text-sky-600" /> : <MapPin size={16} className="text-sky-600" />}
                    <span>{featured.type === 'ONLINE' ? 'Online (tautan untuk peserta terdaftar)' : featured.lokasi}</span>
                  </div>
                  <div className="detail-item">
                    <Users size={16} className="text-sky-600" />
                    <span>{featured.jumlah_peserta} peserta terdaftar</span>
                  </div>
                </div>
              </div>

              <div className="masterclass-ticket-box">
                <div className="ticket-top-badge-row">
                  <span className="ticket-type">{isFree(featured) ? 'SESI GRATIS' : 'TIKET'}</span>
                </div>
                <div className="ticket-price-row">
                  <span className="current-price">{formatPrice(featured.harga)}</span>
                </div>

                {featured.kapasitas && (
                  <div className="seats-progress-wrapper">
                    <div className="seats-text-row">
                      <span>Ketersediaan Kursi</span>
                      <span className="seats-highlight">Sisa {featured.sisa_kursi} dari {featured.kapasitas} Kursi</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.min(100, (featured.jumlah_peserta / featured.kapasitas) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="ticket-actions-row">
                  <button type="button" className="daftar-sekarang-btn" onClick={() => setDetailEvent(featured)}>
                    {featured.status_pendaftaran_saya === 'REGISTERED' ? 'Lihat Tiket' : 'Daftar Sekarang'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="events-tabs-row">
            <div className="tabs-group" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'upcoming'} className={`tab-btn ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
                <Calendar size={16} />
                <span>Akan Datang</span>
              </button>
              <button type="button" role="tab" aria-selected={tab === 'registered'} className={`tab-btn ${tab === 'registered' ? 'active' : ''}`} onClick={() => setTab('registered')}>
                <UserCheck size={16} />
                <span>Sesi Terdaftar Saya</span>
                <span className="tab-count-badge">{activeRegistrations.length}</span>
              </button>
            </div>
            <span className="events-count-text">Menampilkan {visible.length} event</span>
          </div>

          {error && (
            <div className="auth-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Grid kartu event */}
          {loading ? (
            <div className="events-empty-state">Memuat event…</div>
          ) : visible.length === 0 ? (
            <div className="events-empty-state">
              <CalendarX size={30} />
              <strong>{search || chip !== 'Semua' ? 'Tidak ada event yang cocok dengan filter' : 'Belum ada event'}</strong>
              {!search && chip === 'Semua' && (
                <span>
                  {tab === 'upcoming'
                    ? 'Nantikan event dan workshop berikutnya dari Bina Jiwa.'
                    : 'Kamu belum mendaftar event apa pun.'}
                </span>
              )}
            </div>
          ) : (
            <div className="events-cards-grid">
              {visible.map((evt) => (
                <EventCard key={evt.id_event} event={evt} onOpen={setDetailEvent} />
              ))}
            </div>
          )}

          {/* Banner kolaborasi: proposal lewat email */}
          <div className="events-collab-banner">
            <div className="collab-content-left">
              <span className="collab-sub-tag">KOLABORASI BERSAMA BINA JIWA</span>
              <h2 className="collab-title">Tertarik Menjadi Fasilitator atau Mengadakan Workshop di Komunitasmu?</h2>
              <p className="collab-desc">
                Psikolog, praktisi, komunitas, maupun lembaga dapat mengajukan proposal event ke {PROPOSAL_EMAIL}.
                Tim Bina Jiwa akan meninjau proposalmu, lalu mempublikasikan event yang disetujui di halaman ini.
              </p>
            </div>
            <div className="collab-actions-right">
              <a className="ajukan-kolaborasi-btn" href={proposalMailto()}>
                <Mail size={16} /> Ajukan Proposal Kolaborasi
              </a>
            </div>
          </div>
        </div>
      </div>

      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          user={user}
          now={now}
          onClose={() => setDetailEvent(null)}
          onChange={applyUpdate}
        />
      )}
    </div>
  );
}
