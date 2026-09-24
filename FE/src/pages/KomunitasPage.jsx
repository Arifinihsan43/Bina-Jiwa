import React, { useState } from 'react';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import '../components/komunitas/Komunitas.css';
import {
  Heart,
  Globe,
  MapPin,
  RefreshCw,
  Smile,
  Send,
  MoreHorizontal,
  Bookmark,
  Share2,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Moon,
  Cloud,
  Sun,
  Leaf,
  Users,
  Flame,
  Check,
  CornerDownRight,
  Info
} from 'lucide-react';

const RANDOM_PERSONAS = [
  'Daun Teduh #42',
  'Tunas Harapan #81',
  'Awan Putih #07',
  'Pelangi Senja #55',
  'Embun Pagi #63',
  'Surya Hangat #64',
  'Bintang Malam #19',
  'Cahaya Damai #88'
];

const CATEGORIES = [
  'Curhat Anonim',
  'Burnout Kerja',
  'Karir & Kecemasan',
  'Kisah Pemulihan',
  'Family & Parenting'
];

export default function KomunitasPage({ user, onLogout, activeMenu = 'komunitas', setActiveMenu }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedScope, setSelectedScope] = useState('seluruh');
  const [selectedTopic, setSelectedTopic] = useState('Semua Topik');
  const [selectedSort, setSelectedSort] = useState('relevan');
  const [selectedCategory, setSelectedCategory] = useState('Curhat Anonim');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [currentPersonaIndex, setCurrentPersonaIndex] = useState(0);
  const [postText, setPostText] = useState('');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [hasLoadedMore, setHasLoadedMore] = useState(false);

  // Initial feed posts matching exact screenshot design & structure
  const [feedPosts, setFeedPosts] = useState([
    {
      id: 1,
      author: 'Bintang Malam #19',
      avatarIcon: Moon,
      scope: 'komunitas',
      location: 'Komunitas Lokal Jakarta',
      time: '42 menit lalu',
      category: 'Karir & Kecemasan',
      categoryTagType: 'peach',
      title: 'Bagaimana cara kalian menghadapi imposter syndrome di kantor baru tanpa merasa sendirian?',
      body: "Sudah masuk minggu ketiga di perusahaan teknologi ini. Setiap rapat rasanya takut sekali kalau pendapatku salah atau ketahuan 'tidak sepintar yang mereka kira'. Jantung sering berdebar sejak malam sebelum hari kerja. Apakah perasaan ini wajar, dan apa afirmasi yang biasa kalian gunakan untuk meredakannya?",
      hugsCount: 45,
      hasHugged: false,
      commentsCount: 23,
      comments: [
        {
          id: 101,
          author: 'Tunas Harapan #81',
          time: '15 menit lalu',
          text: 'Sangat wajar! Ingat mereka merekrutmu karena potensimu, bukan karena kamu harus tahu segalanya di hari pertama. Coba teknik 5-4-3-2-1 grounding kalau dada mulai berdebar.',
          isHelpful: true
        },
        {
          id: 102,
          author: 'Surya Hangat #64',
          time: '28 menit lalu',
          text: 'Saya juga pernah di posisi itu. Yang bantu saya adalah menuliskan pencapaian kecil tiap jam 5 sore. Kamu tidak sendiri, semangat!',
          isHelpful: false
        }
      ],
      pinnedReply: {
        author: 'Tunas Harapan #81',
        time: '15m lalu',
        text: '"Sangat wajar! Ingat mereka merekrutmu karena potensimu, bukan karena kamu harus tahu segalanya di hari pertama. Coba teknik 5-4-3-2-1 grounding kalau dada mulai berdebar."'
      }
    },
    {
      id: 2,
      author: 'Awan Putih #07',
      avatarIcon: Cloud,
      scope: 'seluruh',
      location: 'Seluruh Indonesia',
      time: '3 jam lalu',
      category: 'Kisah Pemulihan',
      categoryTagType: 'sky',
      title: 'Sudah 3 minggu rutin jurnal refleksi di Bina Jiwa, rasanya beban pikiran jauh lebih ringan. Semangat buat teman-teman yang sedang berjuang!',
      body: "Dulu saya skeptis dengan 'menulis perasaan'. Tapi pelan-pelan, setiap subuh saya luangkan waktu 7 menit untuk napas teratur dan menulis 3 hal kecil yang saya syukuri. Buat kalian yang saat ini merasa di titik terendah: badai ini pasti berlalu, jangan ragu meminta bantuan profesional kalau terasa terlalu berat.",
      mediaUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1000&auto=format&fit=crop&q=80',
      mediaCaption: '💡 "Pemulihan bukan perlombaan, tapi proses pulang ke dirimu sendiri."',
      hugsCount: 112,
      hasHugged: false,
      commentsCount: 58,
      comments: [
        {
          id: 201,
          author: 'Cahaya Damai #88',
          time: '1 jam lalu',
          text: 'Terima kasih penguatnya kawan. Subuh ini saya merasa sangat cemas, baca tulisanmu bikin agak lebih tenang.',
          isHelpful: true
        }
      ]
    },
    {
      id: 3,
      author: 'Embun Pagi #63',
      avatarIcon: Sun,
      scope: 'komunitas',
      location: 'Jawa Barat & Bandung',
      time: '5 jam lalu',
      category: 'Curhat Anonim',
      categoryTagType: 'sky',
      title: '',
      body: 'Hanya ingin menitipkan pesan untuk siapapun yang merasa lelah hari ini: bernapaslah pelan. Kamu sudah berusaha sebaik mungkin dengan kekuatan yang kamu miliki sekarang. Cukup untuk hari ini.',
      hugsCount: 89,
      hasHugged: false,
      commentsCount: 17,
      comments: [
        {
          id: 301,
          author: 'Daun Teduh #42',
          time: '2 jam lalu',
          text: 'Pesan ini datang di waktu yang sangat tepat. Terima kasih banyak...',
          isHelpful: false
        }
      ]
    }
  ]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleRandomizePersona = () => {
    setCurrentPersonaIndex((prev) => (prev + 1) % RANDOM_PERSONAS.length);
  };

  const handleToggleHug = (postId) => {
    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            hugsCount: post.hasHugged ? post.hugsCount - 1 : post.hugsCount + 1,
            hasHugged: !post.hasHugged
          };
        }
        return post;
      })
    );
  };

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!postText.trim()) return;

    const categoryTagMap = {
      'Curhat Anonim': 'sky',
      'Burnout Kerja': 'purple',
      'Karir & Kecemasan': 'peach',
      'Kisah Pemulihan': 'sky',
      'Family & Parenting': 'peach'
    };

    const newPost = {
      id: Date.now(),
      author: RANDOM_PERSONAS[currentPersonaIndex],
      avatarIcon: Leaf,
      scope: selectedScope,
      location: selectedScope === 'seluruh' ? 'Seluruh Indonesia' : 'Komunitas Lokal Jabodetabek',
      time: 'Baru saja',
      category: selectedCategory,
      categoryTagType: categoryTagMap[selectedCategory] || 'sky',
      title: postText.length > 70 ? postText.slice(0, 60) + '...' : '',
      body: postText,
      hugsCount: 1,
      hasHugged: true,
      commentsCount: 0,
      comments: []
    };

    setFeedPosts([newPost, ...feedPosts]);
    setPostText('');
  };

  const handleToggleComments = (postId) => {
    setActiveCommentsPostId((prev) => (prev === postId ? null : postId));
  };

  const handleAddComment = (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newComment = {
            id: Date.now(),
            author: RANDOM_PERSONAS[currentPersonaIndex],
            time: 'Baru saja',
            text: text.trim(),
            isHelpful: false
          };
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
            comments: [...(post.comments || []), newComment]
          };
        }
        return post;
      })
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleLoadMore = () => {
    if (hasLoadedMore) return;

    const morePosts = [
      {
        id: 4,
        author: 'Pelangi Senja #55',
        avatarIcon: Sun,
        scope: 'komunitas',
        location: 'Komunitas Lokal Surabaya',
        time: '7 jam lalu',
        category: 'Burnout Kerja',
        categoryTagType: 'purple',
        title: 'Menghadapi burnout di tengah deadline menumpuk: bagaimana cara kalian menetapkan batas (boundary) dengan atasan?',
        body: 'Rasanya energi sudah di titik nol setiap sore. Saya mulai belajar berani mengomunikasikan batas waktu pengerjaan tugas secara sopan tanpa merasa bersalah. Bagaimana pengalaman teman-teman?',
        hugsCount: 62,
        hasHugged: false,
        commentsCount: 18,
        comments: []
      },
      {
        id: 5,
        author: 'Surya Hangat #64',
        avatarIcon: Leaf,
        scope: 'seluruh',
        location: 'Seluruh Indonesia',
        time: '9 jam lalu',
        category: 'Family & Parenting',
        categoryTagType: 'peach',
        title: 'Merawat kesehatan mental sebagai orang tua baru di era media sosial.',
        body: 'Seringkali merasa overwhelmed dengan perbandingan standar parenting di internet. Hari ini belajar menerima bahwa menjadi orang tua tidak harus sempurna, yang penting hadir sepenuhnya.',
        hugsCount: 74,
        hasHugged: false,
        commentsCount: 31,
        comments: []
      }
    ];

    setFeedPosts((prev) => [...prev, ...morePosts]);
    setHasLoadedMore(true);
  };

  // Filter posts based on active scope & topic
  const filteredPosts = feedPosts
    .filter((post) => {
      // Scope filter
      if (selectedScope === 'komunitas' && post.scope !== 'komunitas') return false;
      // Topic filter
      if (selectedTopic === 'Curhat Anonim' && post.category !== 'Curhat Anonim') return false;
      if (selectedTopic === 'Burnout Kerja' && post.category !== 'Burnout Kerja') return false;
      if (selectedTopic === 'Family & Parenting' && post.category !== 'Family & Parenting') return false;
      if (selectedTopic === 'Kecemasan & Stress' && !post.category.includes('Kecemasan')) return false;
      return true;
    })
    .sort((a, b) => {
      if (selectedSort === 'relevan') {
        return b.hugsCount + b.commentsCount - (a.hugsCount + a.commentsCount);
      }
      return b.id - a.id;
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
        activeMenu={activeMenu || 'komunitas'}
        setActiveMenu={setActiveMenu}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="db-main-content">
        <DashboardHeader />

        <div className="komunitas-page-container">
          <div className="komunitas-content-wrapper">
            
            {/* Dashed Accent Line Top Border Container */}
            <div className="komunitas-dashed-divider" />

            {/* 1. Hero Section */}
            <div className="komunitas-hero-section">
              <div className="komunitas-hero-left">
                <div className="komunitas-safe-badge">
                  <span className="safe-dot" />
                  <span>Ruang Aman • Terjaga Anonimitas 100%</span>
                </div>
                <h1 className="komunitas-hero-title">Lingkar Rasa &amp; Ruang Berbagi</h1>
                <p className="komunitas-hero-sub">
                  Di sini, suaramu didengar tanpa prasangka. Berbagi beban dengan sesama pejuang jiwa
                  atau konsultasikan langkah pemulihanmu dengan psikolog berlisensi.
                </p>
              </div>

              {/* Stat card on top right */}
              <div className="komunitas-hero-stat-card">
                <div className="stat-card-icon">
                  <Heart size={22} className="fill-sky-500 text-sky-500" />
                </div>
                <div className="stat-card-content">
                  <span className="stat-card-tag">TUMBUH BERSAMA</span>
                  <span className="stat-card-number">4,812 Jiwa</span>
                  <span className="stat-card-label">Terhubung</span>
                </div>
              </div>
            </div>

            {/* 2. Filter & Scope Selection Bar */}
            <div className="komunitas-filter-card">
              {/* Lingkup Berbagi */}
              <div className="scope-filter-row">
                <span className="filter-label">
                  <Globe size={16} className="text-sky-600" />
                  Lingkup Berbagi:
                </span>
                <div className="scope-pills-group">
                  <button
                    type="button"
                    className={`scope-btn ${selectedScope === 'seluruh' ? 'active' : ''}`}
                    onClick={() => setSelectedScope('seluruh')}
                  >
                    <Globe size={15} />
                    <span>Seluruh Indonesia</span>
                  </button>
                  <button
                    type="button"
                    className={`scope-btn ${selectedScope === 'komunitas' ? 'active' : ''}`}
                    onClick={() => setSelectedScope('komunitas')}
                  >
                    <MapPin size={15} className="text-rose-500" />
                    <span>Komunitas Lokal (Jabodetabek)</span>
                  </button>
                </div>
              </div>

              {/* Topik Chips */}
              <div className="topic-filter-row">
                <span className="filter-label">Topik:</span>
                <div className="topic-chips-group">
                  {[
                    'Semua Topik',
                    'Curhat Anonim',
                    'Burnout Kerja',
                    'Family & Parenting',
                    'Kecemasan & Stress'
                  ].map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      className={`topic-chip-btn ${selectedTopic === topic ? 'active' : ''}`}
                      onClick={() => setSelectedTopic(topic)}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Create Anonymous Post Card */}
            <form className="create-post-card" onSubmit={handleCreatePost}>
              <div className="create-post-header">
                <div className="author-info-group">
                  <div className="author-avatar-icon">
                    <Leaf size={20} />
                  </div>
                  <div className="author-details">
                    <div className="author-name-row">
                      <span className="author-name">{RANDOM_PERSONAS[currentPersonaIndex]}</span>
                      <button
                        type="button"
                        className="randomize-persona-btn"
                        onClick={handleRandomizePersona}
                        title="Acak Identitas Anonim"
                      >
                        <RefreshCw size={12} />
                        <span>Acak Persona</span>
                      </button>
                    </div>
                    <span className="author-subtext">
                      Identitas pribadimu dienkripsi &amp; tersembunyi
                    </span>
                  </div>
                </div>

                {/* Category Dropdown Picker */}
                <div className="category-dropdown-container">
                  <button
                    type="button"
                    className="category-select-btn"
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  >
                    <span>{selectedCategory}</span>
                    <ChevronDown size={14} className={`dropdown-chevron ${isCategoryDropdownOpen ? 'open' : ''}`} />
                  </button>

                  {isCategoryDropdownOpen && (
                    <div className="category-dropdown-menu">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`category-dropdown-item ${selectedCategory === cat ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                        >
                          {cat}
                          {selectedCategory === cat && <Check size={14} className="text-sky-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Textarea Input Container */}
              <div className="post-textarea-wrapper">
                <textarea
                  className="create-post-textarea"
                  placeholder="Bagikan isi hatimu di sini tanpa takut dihakimi... Tuliskan apa yang terasa mengganjal di dadamu hari ini."
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
              </div>

              {/* Post Footer Actions */}
              <div className="create-post-footer">
                <div className="post-footer-left">
                  <button type="button" className="post-tool-btn" title="Tambah Emoji">
                    <Smile size={18} />
                  </button>
                  <button type="button" className="post-tool-btn" title="Kutipan Bahasa">
                    <span className="quote-mark font-serif">”</span>
                  </button>
                  <span className="moderated-badge">• Aman &amp; Dimoderasi AI</span>
                </div>

                <button type="submit" className="submit-post-btn">
                  <Send size={15} />
                  <span>Kirim Anonim</span>
                </button>
              </div>
            </form>

            {/* 4. Feed Header Section */}
            <div className="feed-header-row">
              <div className="feed-title-group">
                <h2 className="feed-title">Diskusi Terkini</h2>
                <span className="live-badge">
                  <span className="live-dot" />
                  <span>Live</span>
                </span>
              </div>

              <div className="feed-sort-group">
                <span>Urutkan: </span>
                <button
                  type="button"
                  className={`sort-link-btn ${selectedSort === 'relevan' ? 'active' : ''}`}
                  onClick={() => setSelectedSort('relevan')}
                >
                  Paling Relevan
                </button>
                <span className="sort-dot">•</span>
                <button
                  type="button"
                  className={`sort-link-btn ${selectedSort === 'terbaru' ? 'active' : ''}`}
                  onClick={() => setSelectedSort('terbaru')}
                >
                  Terbaru
                </button>
              </div>
            </div>

            {/* 5. Feed Items List */}
            <div className="feed-cards-list">
              {filteredPosts.map((post) => {
                const IconComponent = post.avatarIcon || Leaf;
                const isCommentsOpen = activeCommentsPostId === post.id;

                return (
                  <article key={post.id} className="post-card">
                    {/* Post Card Header */}
                    <div className="post-card-header">
                      <div className="post-author-group">
                        <div className="post-avatar-box">
                          <IconComponent size={20} />
                        </div>
                        <div className="post-author-meta">
                          <div className="post-author-top">
                            <h3 className="post-author-name">{post.author}</h3>
                            <span className="location-tag">
                              {post.scope === 'komunitas' ? (
                                <MapPin size={12} className="text-rose-500" />
                              ) : (
                                <Globe size={12} className="text-sky-500" />
                              )}
                              {post.location}
                            </span>
                            <span className="post-time">• {post.time}</span>
                          </div>

                          <span className={`category-tag-pill tag-${post.categoryTagType}`}>
                            {post.category}
                          </span>
                        </div>
                      </div>

                      <button type="button" className="more-options-btn" title="Opsi Diskusi">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>

                    {/* Post Title & Text */}
                    {post.title && <h3 className="post-title">{post.title}</h3>}
                    <p className="post-body-text">{post.body}</p>

                    {/* Media Image Attachment with Overlay Badge if Present */}
                    {post.mediaUrl && (
                      <div className="post-media-container">
                        <img
                          src={post.mediaUrl}
                          alt="Media Refleksi"
                          className="post-media-image"
                        />
                        {post.mediaCaption && (
                          <div className="post-media-overlay">
                            <span>{post.mediaCaption}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="post-actions-row">
                      <div className="left-action-buttons">
                        <button
                          type="button"
                          className={`hug-btn ${post.hasHugged ? 'hugged' : ''}`}
                          onClick={() => handleToggleHug(post.id)}
                        >
                          <Flame
                            size={16}
                            className={post.hasHugged ? 'fill-orange-500 text-orange-500' : ''}
                          />
                          <span>Peluk Hangat #{post.hugsCount}</span>
                        </button>

                        <button
                          type="button"
                          className={`comment-btn ${isCommentsOpen ? 'active' : ''}`}
                          onClick={() => handleToggleComments(post.id)}
                        >
                          <MessageCircle size={16} />
                          <span>{post.commentsCount} Komentar Empati</span>
                        </button>
                      </div>

                      <div className="right-action-icons">
                        <button type="button" className="action-icon-btn" title="Simpan Post">
                          <Bookmark size={18} />
                        </button>
                        <button type="button" className="action-icon-btn" title="Bagikan">
                          <Share2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Pinned Empathetic Reply Box */}
                    {post.pinnedReply && (
                      <div className="pinned-reply-box">
                        <div className="pinned-reply-header">
                          <div className="reply-author-info">
                            <Leaf size={15} />
                            <span className="font-bold">{post.pinnedReply.author}</span>
                            <span className="reply-time-text">• {post.pinnedReply.time}</span>
                          </div>

                          <div className="reply-badge">
                            <ShieldCheck size={13} />
                            <span>Jawaban Membantu</span>
                          </div>
                        </div>

                        <p className="pinned-reply-text">{post.pinnedReply.text}</p>
                      </div>
                    )}

                    {/* Expanded Interactive Comments Section */}
                    {isCommentsOpen && (
                      <div className="comments-expand-section">
                        <div className="comments-divider" />
                        
                        {/* Comments List */}
                        <div className="comments-list">
                          {post.comments && post.comments.length > 0 ? (
                            post.comments.map((comment) => (
                              <div key={comment.id} className="comment-item">
                                <div className="comment-item-avatar">
                                  <Leaf size={14} />
                                </div>
                                <div className="comment-item-content">
                                  <div className="comment-item-header">
                                    <span className="comment-author">{comment.author}</span>
                                    <span className="comment-time">• {comment.time}</span>
                                    {comment.isHelpful && (
                                      <span className="helpful-mini-tag">
                                        <ShieldCheck size={11} /> Jawaban Membantu
                                      </span>
                                    )}
                                  </div>
                                  <p className="comment-text">{comment.text}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="no-comments-text">Belum ada komentar empati. Jadilah yang pertama memberikan kata penguatan.</p>
                          )}
                        </div>

                        {/* Add Comment Input Bar */}
                        <div className="add-comment-bar">
                          <input
                            type="text"
                            className="add-comment-input"
                            placeholder={`Balas sebagai ${RANDOM_PERSONAS[currentPersonaIndex]}...`}
                            value={commentInputs[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                          />
                          <button
                            type="button"
                            className="submit-comment-btn"
                            onClick={() => handleAddComment(post.id)}
                          >
                            <Send size={14} />
                            <span>Kirim</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Bottom Load More Button */}
            {!hasLoadedMore && (
              <div className="load-more-wrapper">
                <button
                  type="button"
                  className="load-more-btn"
                  onClick={handleLoadMore}
                >
                  <RefreshCw size={15} />
                  <span>Muat Cerita Komunitas Lainnya</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

