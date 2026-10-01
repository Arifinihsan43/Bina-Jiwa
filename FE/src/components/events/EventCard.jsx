import React from 'react';
import { Calendar, Video, MapPin, CalendarDays } from 'lucide-react';
import { formatEventShort, formatPrice, initialsOf } from '../../service/eventService';

const STATUS_LABEL = { DRAFT: 'Draf', CANCELLED: 'Dibatalkan', COMPLETED: 'Selesai' };

/** Gambar event, atau latar bergradasi bila tidak ada gambar. */
export function EventCover({ event, className = 'event-image-box' }) {
  return (
    <div className={className}>
      {event.gambar_url ? (
        <img src={event.gambar_url} alt="" className="event-card-img" loading="lazy" />
      ) : (
        <div className={`event-cover-placeholder ${event.type === 'ONLINE' ? 'online' : 'offline'}`}>
          <CalendarDays size={40} />
        </div>
      )}
      <span className="event-type-badge">
        {event.type === 'ONLINE' ? <><Video size={12} /> Online</> : <><MapPin size={12} /> Tatap Muka</>}
      </span>
      {STATUS_LABEL[event.status] && <span className={`event-cat-badge status-${event.status.toLowerCase()}`}>{STATUS_LABEL[event.status]}</span>}
    </div>
  );
}

function actionLabel(event, adminMode) {
  if (adminMode) return { label: 'Kelola', variant: 'outline' };
  if (event.status_pendaftaran_saya === 'ATTENDED') return { label: 'Hadir ✓', variant: 'registered' };
  if (event.status_pendaftaran_saya === 'REGISTERED') return { label: 'Terdaftar ✓', variant: 'registered' };
  if (event.status === 'CANCELLED') return { label: 'Dibatalkan', variant: 'outline' };
  if (event.sisa_kursi === 0) return { label: 'Penuh', variant: 'outline' };
  if (!event.pendaftaran_dibuka) return { label: 'Ditutup', variant: 'outline' };
  return { label: Number(event.harga) > 0 ? 'Daftar Sesi' : 'Daftar Gratis', variant: Number(event.harga) > 0 ? 'outline' : 'primary' };
}

/** adminMode: tombol "Kelola" (Panel Admin) alih-alih tombol pendaftaran. */
export default function EventCard({ event, onOpen, adminMode = false }) {
  const { label, variant } = actionLabel(event, adminMode);
  const almostFull = event.sisa_kursi !== null && event.kapasitas && event.sisa_kursi <= Math.max(3, event.kapasitas * 0.1);
  const organizer = event.penyelenggara;

  return (
    <article className="event-card">
      <EventCover event={event} />

      <div className="event-card-body">
        <div className="event-date-row">
          <Calendar size={13} className="text-sky-600" />
          <span>{formatEventShort(event.tanggal_mulai)}</span>
        </div>

        <h3 className="event-card-title">{event.judul}</h3>
        {event.deskripsi && <p className="event-card-desc">{event.deskripsi}</p>}

        {organizer && (
          <div className="event-speaker-row">
            <div className="speaker-thumb-img speaker-initials">{initialsOf(organizer.nama)}</div>
            <div className="speaker-thumb-meta">
              <span className="speaker-thumb-name">{organizer.nama}</span>
              <span className="speaker-thumb-title">{organizer.keterangan || 'Penyelenggara'}</span>
            </div>
          </div>
        )}

        <div className="event-card-footer">
          <div className="price-seats-group">
            <span className="card-price-text">{formatPrice(event.harga)}</span>
            <span className={`seats-left-tag ${almostFull ? 'almost-full' : ''}`}>
              {event.sisa_kursi === null
                ? `${event.jumlah_peserta} peserta`
                : event.sisa_kursi === 0
                  ? 'Kursi penuh'
                  : `Sisa ${event.sisa_kursi} kursi`}
            </span>
          </div>

          <button
            type="button"
            className={`event-action-btn ${variant === 'registered' ? 'registered' : `btn-${variant}`}`}
            onClick={() => onOpen(event)}
          >
            {label}
          </button>
        </div>
      </div>
    </article>
  );
}
