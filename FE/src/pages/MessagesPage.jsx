import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../styles/chat.css';
import {
  ShieldCheck,
  RotateCw,
  Search,
  Check,
  CheckCheck,
  Lock,
  Send,
  AlertCircle,
  CalendarCheck,
  MessageSquare,
  Link2,
} from 'lucide-react';
import {
  counterpartOf,
  dayKey,
  formatDayLabel,
  formatListTime,
  formatTime,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage,
  splitLinks,
} from '../service/chatService';
import { formatAppointmentRange, listMyAppointments } from '../service/appointmentService';

const LIST_POLL_MS = 15000;
const MESSAGE_POLL_MS = 5000;

// Template cepat untuk psikolog (mis. mengirim tautan sesi online).
const PSYCHOLOGIST_TEMPLATES = [
  { label: 'Tautan sesi', icon: Link2, text: 'Berikut tautan sesi online kita: ' },
  { label: 'Pengingat', icon: CalendarCheck, text: 'Mohon bergabung 5–10 menit sebelum sesi dimulai, di tempat yang tenang dan nyaman ya.' },
];

const initialsOf = (name = '') =>
  name
    .split(',')[0]
    .split(/\s+/)
    .filter((w) => w && !w.endsWith('.'))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

function MessageText({ text }) {
  return splitLinks(text).map((part, i) =>
    part.isLink ? (
      <a key={i} href={part.text} target="_blank" rel="noopener noreferrer" className="message-link">
        {part.text}
      </a>
    ) : (
      <React.Fragment key={i}>{part.text}</React.Fragment>
    )
  );
}

/** Jendela satu percakapan. Di-mount ulang (key) setiap kali percakapan berganti. */
function ChatWindow({ conversation, userId, nextSession, onSeen, onSent }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  const conversationId = conversation.id_conversation;
  const active = counterpartOf(conversation, userId);

  const scrollToBottom = () =>
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    });

  useEffect(() => {
    let cancelled = false;
    let lastCount = -1;

    const load = (initial) =>
      listMessages(conversationId)
        .then((rows) => {
          if (cancelled) return;
          setMessages(rows);
          if (initial || rows.some((m) => !m.is_read && m.id_sender !== userId)) {
            markConversationRead(conversationId).catch(() => {});
            onSeen(conversationId);
          }
          if (rows.length !== lastCount) {
            lastCount = rows.length;
            scrollToBottom();
          }
        })
        .catch((err) => {
          if (!cancelled && initial) setError(err.message);
        })
        .finally(() => {
          if (!cancelled && initial) setLoading(false);
        });

    load(true);
    const timer = setInterval(() => load(false), MESSAGE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [conversationId, userId, onSeen]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      const sent = await sendMessage(conversationId, text);
      setMessages((prev) => [...prev, sent]);
      onSent(conversationId, sent);
      setInput('');
      scrollToBottom();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (text) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
    inputRef.current?.focus();
  };

  return (
    <>
      <div className="chat-window-header">
        <div className="chat-header-user-info">
          <div className="header-avatar-box">
            <div className="header-avatar-img initial-avatar">{initialsOf(active.name)}</div>
          </div>
          <div className="header-user-details">
            <div className="header-user-name-row">
              <h3 className="header-user-name">{active.name}</h3>
              {active.role === 'Psikolog' && <Check size={15} className="verified-icon" />}
            </div>
            <div className="header-user-status">
              <CalendarCheck size={13} />
              <span>
                {nextSession
                  ? `Sesi berikutnya: ${formatAppointmentRange(nextSession.tanggal_mulai, nextSession.tanggal_selesai)} • ${nextSession.type === 'ONLINE' ? 'Online' : 'Tatap muka'}`
                  : active.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-messages-body" ref={bodyRef}>
        <div className="encrypted-banner">
          <Lock size={14} />
          <span>
            Percakapan ini hanya dapat dibaca oleh Anda dan {active.role.toLowerCase()} Anda.
            Jangan bagikan kata sandi atau data sensitif di luar kebutuhan konsultasi.
          </span>
        </div>

        {loading && <div className="date-divider">Memuat pesan…</div>}

        {!loading && messages.length === 0 && (
          <div className="date-divider">
            {active.iAmPsychologist
              ? 'Belum ada pesan. Kirim tautan sesi atau informasi persiapan untuk klien Anda.'
              : 'Belum ada pesan. Psikolog Anda akan mengirim informasi sesi di sini.'}
          </div>
        )}

        {messages.map((m, i) => {
          const isMe = m.id_sender === userId;
          const showDay = i === 0 || dayKey(messages[i - 1].created_at) !== dayKey(m.created_at);
          return (
            <React.Fragment key={m.id_message}>
              {showDay && <div className="date-divider">{formatDayLabel(m.created_at)}</div>}
              <div className={`message-row ${isMe ? 'outgoing' : 'incoming'}`}>
                <div className="message-bubble">
                  <span className="message-text">
                    {m.isi && <MessageText text={m.isi} />}
                    {m.attachment_url && /^https?:\/\//i.test(m.attachment_url) && (
                      <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" className="message-link">
                        {m.attachment_url}
                      </a>
                    )}
                  </span>
                  <div className="message-meta">
                    <span className="message-time">{formatTime(m.created_at)}</span>
                    {isMe && (m.is_read
                      ? <CheckCheck size={14} className="read-status-icon" />
                      : <Check size={14} className="read-status-icon unread" />)}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {conversation.status === 'ACTIVE' ? (
        <>
          {active.iAmPsychologist && (
            <div className="chat-template-row">
              {PSYCHOLOGIST_TEMPLATES.map(({ label, icon: Icon, text }) => (
                <button key={label} type="button" className="chat-template-chip" onClick={() => applyTemplate(text)}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          )}
          {error && (
            <div className="chat-send-error">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <form className="chat-input-bar" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              className="chat-text-input-field"
              placeholder={`Ketik pesan untuk ${active.name.split(/[\s,]/)[0]}...`}
              value={input}
              maxLength={4000}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="chat-send-btn" title="Kirim Pesan" disabled={!input.trim() || sending}>
              <Send size={18} />
            </button>
          </form>
        </>
      ) : (
        <div className="chat-closed-note">Percakapan ini sudah ditutup.</div>
      )}
    </>
  );
}

export default function MessagesPage({ user }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [listReload, setListReload] = useState(0);
  const [nowTs, setNowTs] = useState(() => Date.now());

  const selectedId = searchParams.get('c');
  const userId = user?.id;
  const isDoctor = user?.role === 'doctor';

  // --- Daftar percakapan (polling) ---
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      listConversations()
        .then((rows) => {
          if (cancelled) return;
          setConversations(rows);
          setListError('');
          setNowTs(Date.now());
        })
        .catch((err) => {
          if (!cancelled) setListError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoadingList(false);
        });
    load();
    const timer = setInterval(load, LIST_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [listReload]);

  // Janji temu, untuk menampilkan sesi berikutnya di header percakapan.
  useEffect(() => {
    let cancelled = false;
    listMyAppointments()
      .then((rows) => {
        if (!cancelled) setAppointments(rows);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Pilih percakapan dari ?psikolog=&klien= (tombol "Kirim Pesan" di Janji Temu),
  // atau percakapan teratas di layar lebar.
  useEffect(() => {
    if (selectedId || conversations.length === 0) return;
    const psikolog = searchParams.get('psikolog');
    const klien = searchParams.get('klien');
    const match = psikolog && klien
      ? conversations.find((c) => c.id_psychologist === psikolog && c.id_user === klien)
      : null;
    const target = match || (window.innerWidth > 768 ? conversations[0] : null);
    if (target) setSearchParams({ c: target.id_conversation }, { replace: true });
  }, [conversations, selectedId, searchParams, setSearchParams]);

  const handleSeen = useMemo(
    () => (conversationId) =>
      setConversations((prev) =>
        prev.map((c) => (c.id_conversation === conversationId ? { ...c, jumlah_belum_dibaca: 0 } : c))
      ),
    []
  );

  const handleSent = (conversationId, message) =>
    setConversations((prev) =>
      prev.map((c) => (c.id_conversation === conversationId ? { ...c, pesan_terakhir: message } : c))
    );

  const activeConversation = conversations.find((c) => c.id_conversation === selectedId) || null;

  const nextSession = activeConversation
    ? appointments
        .filter(
          (a) =>
            a.id_user === activeConversation.id_user &&
            a.id_psychologist === activeConversation.id_psychologist &&
            a.status === 'CONFIRMED' &&
            new Date(a.tanggal_selesai).getTime() > nowTs
        )
        .sort((a, b) => new Date(a.tanggal_mulai) - new Date(b.tanggal_mulai))[0] || null
    : null;

  const q = search.trim().toLowerCase();
  const visibleConversations = conversations.filter((c) => {
    if (onlyUnread && !c.jumlah_belum_dibaca) return false;
    if (q && !counterpartOf(c, userId).name.toLowerCase().includes(q)) return false;
    return true;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.jumlah_belum_dibaca || 0), 0);
  const todayKey = dayKey(new Date(nowTs).toISOString());

  return (
    <div className="db-main-content p-0 overflow-hidden">
      <div className="chat-portal-wrapper">
        <header className="portal-top-bar">
          <div className="portal-title-area">
            <div className="portal-brand-icon">
              <ShieldCheck size={18} />
            </div>
            <h1 className="portal-heading">Pesan Konsultasi</h1>
            <div className="portal-security-badge">
              <Lock size={14} />
              <span>Hanya Anda &amp; {isDoctor ? 'klien' : 'psikolog'} Anda</span>
            </div>
          </div>
        </header>

        <div className="chat-main-container">
          {/* Daftar percakapan */}
          <aside className="chat-sidebar-panel">
            <div className="chat-sidebar-header">
              <div className="chat-sidebar-title-row">
                <h2 className="chat-sidebar-title">Chats</h2>
                <div className="chat-sidebar-tools">
                  <button
                    type="button"
                    className="tool-icon-btn"
                    title="Muat Ulang"
                    onClick={() => setListReload((n) => n + 1)}
                  >
                    <RotateCw size={17} />
                  </button>
                </div>
              </div>

              <div className="chat-search-box">
                <Search size={16} className="search-input-icon" />
                <input
                  type="text"
                  className="chat-search-input"
                  placeholder={isDoctor ? 'Cari nama klien' : 'Cari nama psikolog'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="chat-filter-chips">
                <button
                  type="button"
                  className={`filter-chip ${!onlyUnread ? 'active' : ''}`}
                  onClick={() => setOnlyUnread(false)}
                >
                  Semua
                </button>
                <button
                  type="button"
                  className={`filter-chip ${onlyUnread ? 'active' : ''}`}
                  onClick={() => setOnlyUnread(true)}
                >
                  Belum dibaca
                  {totalUnread > 0 && <span className="chip-badge">{totalUnread}</span>}
                </button>
              </div>
            </div>

            <div className="chat-list-scroll">
              {loadingList && <p className="chat-list-note">Memuat percakapan…</p>}
              {!loadingList && listError && (
                <p className="chat-list-note error">
                  <AlertCircle size={14} /> {listError}
                </p>
              )}
              {!loadingList && !listError && conversations.length === 0 && (
                <div className="chat-list-empty">
                  <MessageSquare size={28} />
                  <strong>Belum ada percakapan</strong>
                  <span>
                    {isDoctor
                      ? 'Percakapan dengan klien terbuka otomatis setelah Anda mengonfirmasi janji temu.'
                      : 'Percakapan dengan psikolog terbuka otomatis setelah janji temu Anda dikonfirmasi.'}
                  </span>
                  <button
                    type="button"
                    className="chat-empty-btn"
                    onClick={() => navigate(isDoctor ? '/janji-temu' : '/psikolog')}
                  >
                    {isDoctor ? 'Lihat Janji Temu' : 'Cari Psikolog'}
                  </button>
                </div>
              )}

              {visibleConversations.map((c) => {
                const other = counterpartOf(c, userId);
                const last = c.pesan_terakhir;
                const isSelected = c.id_conversation === selectedId;
                return (
                  <div
                    key={c.id_conversation}
                    className={`chat-item-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSearchParams({ c: c.id_conversation })}
                  >
                    <div className="chat-avatar-wrapper">
                      <div className="chat-avatar-img initial-avatar">{initialsOf(other.name)}</div>
                    </div>
                    <div className="chat-item-info">
                      <div className="chat-item-top">
                        <div className="chat-item-name-row">
                          <span className="chat-item-name">{other.name}</span>
                          {other.role === 'Psikolog' && <Check size={14} className="verified-icon" />}
                        </div>
                        <span className={`chat-item-time ${isSelected ? 'highlight' : ''}`}>
                          {last ? formatListTime(last.created_at, todayKey) : ''}
                        </span>
                      </div>
                      <div className="chat-item-preview-row">
                        <p className="chat-item-preview">
                          {last
                            ? `${last.id_sender === userId ? 'Anda: ' : ''}${last.isi || 'Lampiran'}`
                            : 'Belum ada pesan — mulai percakapan'}
                        </p>
                        {c.jumlah_belum_dibaca > 0 && !isSelected && (
                          <span className="unread-badge">{c.jumlah_belum_dibaca}</span>
                        )}
                      </div>
                      <div className="chat-item-tags">
                        <span className={`tag-pill ${other.role === 'Psikolog' ? 'tag-blue' : 'tag-green'}`}>
                          {other.role}
                        </span>
                        {c.status !== 'ACTIVE' && <span className="tag-pill tag-gray">Ditutup</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Jendela percakapan */}
          <main className="chat-window-panel">
            {activeConversation ? (
              <ChatWindow
                key={activeConversation.id_conversation}
                conversation={activeConversation}
                userId={userId}
                nextSession={nextSession}
                onSeen={handleSeen}
                onSent={handleSent}
              />
            ) : (
              <div className="chat-window-empty">
                <MessageSquare size={36} />
                <strong>Pilih percakapan</strong>
                <span>Pesan hanya tersedia antara pengguna dan psikolog setelah janji temu dikonfirmasi.</span>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
