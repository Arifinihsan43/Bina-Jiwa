import React, { useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import AudioPlayerCard from '../components/chat/AudioPlayerCard';
import '../components/chat/ChatMessages.css';
import {
  ShieldCheck,
  Bell,
  RotateCw,
  Plus,
  MoreVertical,
  Search,
  SlidersHorizontal,
  Check,
  CheckCheck,
  Pin,
  Phone,
  Video,
  Lock,
  Smile,
  Paperclip,
  Mic,
  Send,
  Users,
  AlertCircle,
  User
} from 'lucide-react';

export default function MessagesPage({ user, onLogout, activeMenu = 'pesan', setActiveMenu }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [selectedChatId, setSelectedChatId] = useState('nadia');
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Pre-populated conversations data matching the user's exact specification image
  const [chatsData, setChatsData] = useState({
    nadia: {
      id: 'nadia',
      name: 'Nadia Pratiwi, M.Psi.',
      fullName: 'Nadia Pratiwi, M.Psi., Psikolog',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      verified: true,
      online: true,
      statusText: 'Online • Sesi Aktif Berakhir dlm 35 Menit',
      category: 'Psikolog Klinis',
      tags: [
        { label: 'Psikolog Klinis', type: 'blue' },
        { label: 'Sesi Aktif', type: 'green' }
      ],
      messages: [
        {
          id: 1,
          sender: 'them',
          type: 'text',
          text: 'Selamat pagi Rani. Bagaimana perasaan dan kualitas tidurmu semalam? Apakah kamu sempat mencoba audio grounding 5-4-3-2-1 yang kita bahas kemarin?',
          time: '09:14'
        },
        {
          id: 2,
          sender: 'me',
          type: 'text',
          text: 'Selamat pagi Bu Nadia. Semalam sudah lebih tenang setelah mencoba jeda napas 5 menit, tapi saat bangun rasa cemas di dada masih agak terasa.',
          time: '09:18',
          status: 'read'
        },
        {
          id: 3,
          sender: 'them',
          type: 'audio',
          audioTitle: 'Audio Relaksasi Grounding 5 Menit',
          audioSubtitle: 'Panduan Klinis Pengendalian Kecemasan',
          time: '09:20'
        },
        {
          id: 4,
          sender: 'me',
          type: 'text',
          text: 'Baik Bu, saya putar audio ini sekarang sambil bersiap.',
          time: '09:22',
          status: 'read'
        }
      ]
    },

    dimas: {
      id: 'dimas',
      name: 'dr. Dimas Wicaksono, Sp.KJ',
      fullName: 'dr. Dimas Wicaksono, Sp.KJ',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      verified: true,
      online: true,
      statusText: 'Online • Praktek Klinis',
      category: 'Psikolog Klinis',
      unreadCount: 1,
      tags: [
        { label: 'Psikiater • Konsultasi Medis', type: 'purple' }
      ],
      messages: [
        {
          id: 1,
          sender: 'them',
          type: 'text',
          text: 'Halo Rani, Jadwal evaluasi resep minggu depan sudah saya jadwalkan untuk hari Selasa pukul 10:00 WIB.',
          time: '08:15'
        }
      ]
    },

    ruang_teduh: {
      id: 'ruang_teduh',
      name: 'Ruang Teduh: Saling Dukung',
      fullName: 'Ruang Teduh: Saling Dukung (Grup Anonim)',
      isGroup: true,
      avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80',
      online: true,
      statusText: '24 Anggota Aktif • Pendukung Anonim',
      category: 'Favorit',
      tags: [
        { label: 'Grup Pendukung Anonim', type: 'lavender' }
      ],
      messages: [
        {
          id: 1,
          sender: 'them',
          type: 'text',
          senderName: 'Bintang Malam',
          text: 'Terima kasih sarannya teman-teman, sangat membantu menenangkan pikiran malam ini.',
          time: 'Kemarin'
        }
      ]
    },

    hotline: {
      id: 'hotline',
      name: 'Konselor Siaga 24/7 (Bina Jiwa)',
      fullName: 'Konselor Siaga 24/7 (Tim Tanggap Bina Jiwa)',
      isHotline: true,
      avatar: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=150&auto=format&fit=crop&q=80',
      online: true,
      statusText: 'Siaga 24 Jam • Bebas Pulsa',
      category: 'Belum dibaca',
      tags: [
        { label: 'Siaga Darurat & Krisis', type: 'red' }
      ],
      messages: [
        {
          id: 1,
          sender: 'them',
          type: 'text',
          text: 'Panggilan darurat & panduan grounding siap diakses kapan saja jika Anda membutuhkan bantuan cepat.',
          time: 'Selasa'
        }
      ]
    },

    pakoy: {
      id: 'pakoy',
      name: 'Pakoy ID / Teman Sebaya',
      fullName: 'Pakoy ID / Teman Sebaya (Peer Companion)',
      isPinned: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      online: false,
      statusText: 'Terakhir dilihat tadi malam',
      category: 'Favorit',
      tags: [
        { label: 'Teman Sebaya • Peer', type: 'gray' }
      ],
      messages: [
        {
          id: 1,
          sender: 'them',
          type: 'text',
          text: 'Semoga istirahatmu cukup malam ini ya, jangan dipikirkan terus.',
          time: '00:11'
        }
      ]
    },

    bambang: {
      id: 'bambang',
      name: 'Bambang W., M.Psi.',
      fullName: 'Bambang W., M.Psi.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      online: false,
      statusText: 'Sesi Selesai',
      category: 'Semua',
      tags: [
        { label: 'Selesai • Arsip Sesi', type: 'gray' }
      ],
      messages: [
        {
          id: 1,
          sender: 'them',
          type: 'text',
          text: 'Catatan ringkasan evaluasi sesi regulasi stres siap diunduh di portal dokumen.',
          time: '21 Okt'
        }
      ]
    }
  });

  const activeChat = chatsData[selectedChatId] || chatsData.nadia;

  // Handle send message
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      type: 'text',
      text: inputMessage.trim(),
      time: timeStr,
      status: 'read'
    };

    setChatsData((prev) => ({
      ...prev,
      [selectedChatId]: {
        ...prev[selectedChatId],
        messages: [...prev[selectedChatId].messages, newMsg]
      }
    }));

    setInputMessage('');
  };

  // Contacts list rendering filter
  const conversationList = Object.values(chatsData).filter((chat) => {
    // Filter query search
    if (searchQuery && !chat.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Filter category tabs
    if (activeFilter === 'Belum dibaca') return chat.unreadCount > 0 || chat.category === 'Belum dibaca';
    if (activeFilter === 'Psikolog Klinis') return chat.tags.some(t => t.label.includes('Psikolog'));
    if (activeFilter === 'Favorit') return chat.category === 'Favorit' || chat.isPinned;
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
        activeMenu={activeMenu || 'pesan'}
        setActiveMenu={setActiveMenu}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Chat Workspace */}
      <div className="db-main-content p-0 overflow-hidden">
        <div className="chat-portal-wrapper">
          {/* Top Portal Banner / Header Bar */}
          <header className="portal-top-bar">
            <div className="portal-title-area">
              <div className="portal-brand-icon">
                <ShieldCheck size={18} />
              </div>
              <h1 className="portal-heading">Portal Konsultasi Klinis &amp; Pesan Pulih</h1>
              <div className="portal-security-badge">
                <ShieldCheck size={14} />
                <span>HIMPSI Terenkripsi</span>
              </div>
            </div>

            <div className="portal-actions-area">
              <button type="button" className="portal-icon-btn" title="Notifikasi">
                <Bell size={18} />
                <span className="notification-dot" />
              </button>
            </div>
          </header>

          {/* 2-Column Split Workspace */}
          <div className="chat-main-container">
            {/* LEFT COLUMN: Chats Sidebar List */}
            <aside className="chat-sidebar-panel">
              <div className="chat-sidebar-header">
                <div className="chat-sidebar-title-row">
                  <h2 className="chat-sidebar-title">Chats</h2>
                  <div className="chat-sidebar-tools">
                    <button type="button" className="tool-icon-btn" title="Muat Ulang">
                      <RotateCw size={17} />
                    </button>
                    <button type="button" className="tool-icon-btn" title="Chat Baru">
                      <Plus size={18} />
                    </button>
                    <button type="button" className="tool-icon-btn" title="Menu Opsi">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>

                {/* Search Box */}
                <div className="chat-search-box">
                  <Search size={16} className="search-input-icon" />
                  <input
                    type="text"
                    className="chat-search-input"
                    placeholder="Cari atau mulai chat baru"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <SlidersHorizontal size={15} className="search-filter-icon" title="Filter Chat" />
                </div>

                {/* Filter Chips / Tabs */}
                <div className="chat-filter-chips">
                  <button
                    type="button"
                    className={`filter-chip ${activeFilter === 'Semua' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Semua')}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${activeFilter === 'Belum dibaca' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Belum dibaca')}
                  >
                    Belum dibaca
                    <span className="chip-badge">3</span>
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${activeFilter === 'Psikolog Klinis' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Psikolog Klinis')}
                  >
                    Psikolog Klinis
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${activeFilter === 'Favorit' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('Favorit')}
                  >
                    Favorit
                  </button>
                </div>
              </div>

              {/* Chat Item List */}
              <div className="chat-list-scroll">
                {conversationList.map((chat) => {
                  const isSelected = selectedChatId === chat.id;
                  const lastMsg = chat.messages[chat.messages.length - 1];

                  return (
                    <div
                      key={chat.id}
                      className={`chat-item-card ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedChatId(chat.id)}
                    >
                      {/* Avatar */}
                      <div className="chat-avatar-wrapper">
                        {chat.isGroup ? (
                          <div className="chat-avatar-img group-avatar">
                            <Users size={22} />
                          </div>
                        ) : chat.isHotline ? (
                          <div className="chat-avatar-img hotline-avatar">
                            <AlertCircle size={22} />
                          </div>
                        ) : (
                          <img
                            src={chat.avatar}
                            alt={chat.name}
                            className="chat-avatar-img"
                          />
                        )}
                        {chat.online && <span className="status-dot-online" />}
                      </div>

                      {/* Content */}
                      <div className="chat-item-info">
                        <div className="chat-item-top">
                          <div className="chat-item-name-row">
                            <span className="chat-item-name">{chat.name}</span>
                            {chat.verified && <Check size={14} className="verified-icon" />}
                            {chat.isPinned && <Pin size={12} className="pin-icon" />}
                          </div>
                          <span className={`chat-item-time ${isSelected ? 'highlight' : ''}`}>
                            {lastMsg?.time || '09:22'}
                          </span>
                        </div>

                        <div className="chat-item-preview-row">
                          <p className="chat-item-preview">
                            {isSelected && <Check size={13} className="inline mr-1 text-sky-500" />}
                            {lastMsg?.text || 'Audio Relaksasi Grounding...'}
                          </p>
                          {chat.unreadCount > 0 && (
                            <span className="unread-badge">{chat.unreadCount}</span>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="chat-item-tags">
                          {chat.tags.map((tag, idx) => (
                            <span key={idx} className={`tag-pill tag-${tag.type}`}>
                              {tag.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* RIGHT COLUMN: Active Chat Window */}
            <main className="chat-window-panel">
              {/* Header Bar */}
              <div className="chat-window-header">
                <div className="chat-header-user-info">
                  <div className="header-avatar-box">
                    {activeChat.isGroup ? (
                      <div className="header-avatar-img group-avatar">
                        <Users size={20} />
                      </div>
                    ) : (
                      <img
                        src={activeChat.avatar}
                        alt={activeChat.name}
                        className="header-avatar-img"
                      />
                    )}
                    {activeChat.online && <span className="status-dot-online" />}
                  </div>

                  <div className="header-user-details">
                    <div className="header-user-name-row">
                      <h3 className="header-user-name">{activeChat.fullName || activeChat.name}</h3>
                      {activeChat.verified && <Check size={15} className="verified-icon" />}
                    </div>
                    <div className="header-user-status">
                      <span className="status-green-dot" />
                      <span>{activeChat.statusText}</span>
                    </div>
                  </div>
                </div>

                <div className="chat-header-actions">
                  <button type="button" className="header-action-btn" title="Panggilan Suara">
                    <Phone size={18} />
                  </button>
                  <button type="button" className="header-action-btn" title="Panggilan Video">
                    <Video size={18} />
                  </button>
                  <button type="button" className="header-action-btn" title="Cari di Pesan">
                    <Search size={18} />
                  </button>
                  <button type="button" className="header-action-btn" title="Opsi">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="chat-messages-body">
                {/* Encrypted Notice Banner */}
                <div className="encrypted-banner">
                  <Lock size={14} />
                  <span>
                    Pesan dan panggilan terenkripsi secara end-to-end. Hanya Anda dan konselor yang
                    dapat membaca atau mendengarkannya.
                  </span>
                </div>

                {/* Date Divider */}
                <div className="date-divider">HARI INI</div>

                {/* Messages Stream */}
                {activeChat.messages.map((msg) => {
                  const isMe = msg.sender === 'me';

                  if (msg.type === 'audio') {
                    return (
                      <div key={msg.id} className="message-row incoming">
                        <div className="audio-message-wrapper">
                          <AudioPlayerCard
                            title={msg.audioTitle}
                            subtitle={msg.audioSubtitle}
                            initialTime={45}
                            duration={300}
                          />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`message-row ${isMe ? 'outgoing' : 'incoming'}`}
                    >
                      <div className="message-bubble">
                        {msg.senderName && (
                          <div className="text-xs font-bold text-indigo-600 mb-1">
                            {msg.senderName}
                          </div>
                        )}
                        <span>{msg.text}</span>
                        <div className="message-meta">
                          <span className="message-time">{msg.time}</span>
                          {isMe && <CheckCheck size={14} className="read-status-icon" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <form className="chat-input-bar" onSubmit={handleSendMessage}>
                <button type="button" className="chat-input-action-btn" title="Emoji">
                  <Smile size={20} />
                </button>
                <button type="button" className="chat-input-action-btn" title="Lampiran">
                  <Paperclip size={20} />
                </button>

                <input
                  type="text"
                  className="chat-text-input-field"
                  placeholder={`Ketik pesan untuk ${activeChat.name.split(' ')[0]}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                />

                <button type="button" className="chat-input-action-btn" title="Pesan Suara">
                  <Mic size={20} />
                </button>

                <button type="submit" className="chat-send-btn" title="Kirim Pesan">
                  <Send size={18} />
                </button>
              </form>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
