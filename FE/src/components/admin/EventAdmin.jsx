import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, AlertCircle, CalendarX, Mail, FileEdit, Send, CheckCircle2, Ban } from 'lucide-react';
import EventCard from '../events/EventCard';
import EventFormModal from './EventFormModal';
import ManageEventModal from './ManageEventModal';
import { adminListEvents } from '../../service/adminService';
import { PROPOSAL_EMAIL } from '../../service/eventService';
import '../../styles/events.css';

const TABS = [
  { id: 'DRAFT', label: 'Draf', icon: FileEdit },
  { id: 'PUBLISHED', label: 'Dipublikasikan', icon: Send },
  { id: 'COMPLETED', label: 'Selesai', icon: CheckCircle2 },
  { id: 'CANCELLED', label: 'Dibatalkan', icon: Ban },
];

/** Admin: buat event dari proposal email, publikasikan, dan kelola peserta. */
export default function EventAdmin({ onError }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('PUBLISHED');
  const [manageEvent, setManageEvent] = useState(null);
  const [formEvent, setFormEvent] = useState(undefined); // undefined = tertutup, null = buat baru
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    adminListEvents()
      .then((rows) => {
        if (cancelled) return;
        setEvents(rows);
        setNow(Date.now());
      })
      .catch((err) => !cancelled && !onError(err) && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [onError]);

  const counts = useMemo(() => {
    const c = { DRAFT: 0, PUBLISHED: 0, COMPLETED: 0, CANCELLED: 0 };
    events.forEach((e) => { c[e.status] += 1; });
    return c;
  }, [events]);

  const visible = events.filter((e) => e.status === tab);

  const applyUpdate = (updated) => {
    setEvents((prev) =>
      prev.some((e) => e.id_event === updated.id_event)
        ? prev.map((e) => (e.id_event === updated.id_event ? updated : e))
        : [updated, ...prev]
    );
    setManageEvent((m) => (m?.id_event === updated.id_event ? updated : m));
  };

  return (
    <div className="av-section">
      <div className="pp-banner pp-banner-info">
        <Mail size={20} />
        <div>
          <strong>Proposal event masuk lewat email {PROPOSAL_EMAIL}</strong>
          <span>
            Setelah proposal disetujui, buat event di sini. Simpan sebagai draf untuk dicek dulu, atau langsung
            publikasikan agar tampil di halaman Events &amp; Workshop.
          </span>
        </div>
      </div>

      <div className="av-toolbar">
        <div className="av-tabs" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`av-tab ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon size={15} />
              <span>{label}</span>
              <span className="av-tab-count">{counts[id]}</span>
            </button>
          ))}
        </div>
        <button type="button" className="pp-btn-secondary" onClick={() => setFormEvent(null)}>
          <CalendarPlus size={16} /> Buat Event
        </button>
      </div>

      {error && (
        <div className="auth-error-alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="psikolog-empty-state">Memuat event…</div>
      ) : visible.length === 0 ? (
        <div className="psikolog-empty-state">
          <CalendarX size={28} />
          <strong>Belum ada event di sini</strong>
        </div>
      ) : (
        <div className="events-cards-grid">
          {visible.map((evt) => (
            <EventCard key={evt.id_event} event={evt} adminMode onOpen={setManageEvent} />
          ))}
        </div>
      )}

      {manageEvent && (
        <ManageEventModal
          event={manageEvent}
          now={now}
          onError={onError}
          onClose={() => setManageEvent(null)}
          onChange={applyUpdate}
          onEdit={() => {
            setFormEvent(manageEvent);
            setManageEvent(null);
          }}
        />
      )}

      {formEvent !== undefined && (
        <EventFormModal
          event={formEvent}
          onError={onError}
          onClose={() => setFormEvent(undefined)}
          onSaved={(saved) => {
            applyUpdate(saved);
            setTab(saved.status);
            setFormEvent(undefined);
          }}
        />
      )}
    </div>
  );
}
