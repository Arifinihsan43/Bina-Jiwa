import React, { useEffect, useRef, useState } from 'react';
import { DashboardHeader } from '../components/dashboard';
import PostCard, { PersonaAvatar } from '../components/komunitas/PostCard';
import ReportModal from '../components/komunitas/ReportModal';
import '../styles/komunitas.css';
import { Heart, RefreshCw, Send, ChevronDown, Check, Dices, AlertCircle, PenLine, Users } from 'lucide-react';
import {
  PAGE_SIZE,
  categoryTone,
  createPersona,
  createPost,
  deletePost,
  getForumStats,
  getMyPersona,
  listCategories,
  listPosts,
  randomPersonaName,
  renamePersona,
} from '../service/forumService';

const ALL = 'ALL';

function PersonaSetupCard({ onCreated }) {
  const [name, setName] = useState(() => randomPersonaName());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError('Nama persona minimal 3 karakter.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      onCreated(await createPersona(name));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form className="create-post-card persona-setup-card" onSubmit={handleSubmit}>
      <div className="persona-setup-head">
        <PersonaAvatar name={name} className="author-avatar-icon" />
        <div>
          <h2 className="persona-setup-title">Pilih nama anonimmu</h2>
          <p className="author-subtext">
            Nama ini yang dilihat anggota lain. Identitas aslimu tidak pernah ditampilkan.
          </p>
        </div>
      </div>
      <div className="persona-setup-row">
        <input
          className="add-comment-input"
          value={name}
          maxLength={50}
          onChange={(e) => setName(e.target.value)}
          aria-label="Nama persona"
        />
        <button type="button" className="randomize-persona-btn" onClick={() => setName(randomPersonaName())}>
          <Dices size={14} />
          <span>Acak</span>
        </button>
        <button type="submit" className="submit-post-btn" disabled={saving}>
          <span>{saving ? 'Menyimpan…' : 'Mulai Berbagi'}</span>
        </button>
      </div>
      {error && <p className="komunitas-inline-error"><AlertCircle size={13} /> {error}</p>}
    </form>
  );
}

function Composer({ persona, categories, onPersonaChange, onPosted }) {
  const [categoryId, setCategoryId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [posting, setPosting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return undefined;
    const close = (e) => dropdownRef.current && !dropdownRef.current.contains(e.target) && setDropdownOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [dropdownOpen]);

  const selectedCategory = categories.find((c) => c.id_category === categoryId);

  const handleRename = async () => {
    setRenaming(true);
    setError('');
    try {
      onPersonaChange(await renamePersona(randomPersonaName()));
    } catch (err) {
      setError(err.message);
    } finally {
      setRenaming(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isi.trim() || posting) return;
    setPosting(true);
    setError('');
    try {
      const created = await createPost({ categoryId, judul, isi });
      onPosted(created);
      setJudul('');
      setIsi('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <form className="create-post-card" onSubmit={handleSubmit}>
      <div className="create-post-header">
        <div className="author-info-group">
          <PersonaAvatar name={persona.nama_persona} className="author-avatar-icon" />
          <div className="author-details">
            <div className="author-name-row">
              <span className="author-name">{persona.nama_persona}</span>
              <button
                type="button"
                className="randomize-persona-btn"
                onClick={handleRename}
                disabled={renaming}
                title="Ganti nama anonim (berlaku untuk semua tulisanmu)"
              >
                <RefreshCw size={12} className={renaming ? 'spin' : ''} />
                <span>Ganti Nama</span>
              </button>
            </div>
            <span className="author-subtext">Identitas aslimu tersembunyi dari anggota lain</span>
          </div>
        </div>

        <div className="category-dropdown-container" ref={dropdownRef}>
          <button
            type="button"
            className="category-select-btn"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            <span>{selectedCategory?.nama_kategori || 'Pilih Topik'}</span>
            <ChevronDown size={14} className={`dropdown-chevron ${dropdownOpen ? 'open' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="category-dropdown-menu" role="listbox">
              {[{ id_category: null, nama_kategori: 'Tanpa topik' }, ...categories].map((cat) => (
                <button
                  key={cat.id_category || 'none'}
                  type="button"
                  role="option"
                  aria-selected={categoryId === cat.id_category}
                  className={`category-dropdown-item ${categoryId === cat.id_category ? 'active' : ''}`}
                  onClick={() => {
                    setCategoryId(cat.id_category);
                    setDropdownOpen(false);
                  }}
                >
                  {cat.nama_kategori}
                  {categoryId === cat.id_category && <Check size={14} className="text-sky-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <input
        className="create-post-title"
        placeholder="Judul (opsional)"
        value={judul}
        maxLength={200}
        onChange={(e) => setJudul(e.target.value)}
      />
      <div className="post-textarea-wrapper">
        <textarea
          className="create-post-textarea"
          placeholder="Bagikan isi hatimu di sini tanpa takut dihakimi... Tuliskan apa yang terasa mengganjal di dadamu hari ini."
          value={isi}
          maxLength={5000}
          onChange={(e) => setIsi(e.target.value)}
        />
      </div>

      {error && <p className="komunitas-inline-error"><AlertCircle size={13} /> {error}</p>}

      <div className="create-post-footer">
        <div className="post-footer-left">
          <span className="moderated-badge">• Dimoderasi tim Bina Jiwa • {isi.length}/5000</span>
        </div>
        <button type="submit" className="submit-post-btn" disabled={!isi.trim() || posting}>
          <Send size={15} />
          <span>{posting ? 'Mengirim…' : 'Kirim Anonim'}</span>
        </button>
      </div>
    </form>
  );
}

export default function KomunitasPage({ onToggleSidebar }) {
  const [persona, setPersona] = useState(null);
  const [personaLoaded, setPersonaLoaded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [topic, setTopic] = useState(ALL);
  const [sort, setSort] = useState('terbaru');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [reportTarget, setReportTarget] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyPersona()
      .then((p) => !cancelled && setPersona(p))
      .catch(() => {})
      .finally(() => !cancelled && setPersonaLoaded(true));
    listCategories()
      .then((rows) => !cancelled && setCategories(rows))
      .catch(() => {});
    getForumStats()
      .then((s) => !cancelled && setStats(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Muat ulang feed saat topik / urutan berubah.
  useEffect(() => {
    let cancelled = false;
    listPosts({ categoryId: topic === ALL ? null : topic, sort })
      .then((rows) => {
        if (cancelled) return;
        setPosts(rows);
        setHasMore(rows.length === PAGE_SIZE);
        setError('');
        setNow(Date.now());
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [topic, sort, reloadKey]);

  const changeFeed = (update) => {
    setLoading(true);
    update();
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const rows = await listPosts({ categoryId: topic === ALL ? null : topic, sort, offset: posts.length });
      setPosts((prev) => [...prev, ...rows.filter((r) => !prev.some((p) => p.id_post === r.id_post))]);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const updatePost = (updated) =>
    setPosts((prev) => prev.map((p) => (p.id_post === updated.id_post ? updated : p)));

  const handleDelete = async (post) => {
    try {
      await deletePost(post.id_post);
      setPosts((prev) => prev.filter((p) => p.id_post !== post.id_post));
      setStats((s) => (s ? { ...s, jumlah_cerita: Math.max(0, s.jumlah_cerita - 1) } : s));
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePosted = (created) => {
    setNow(Date.now());
    if (topic === ALL || topic === created.id_category) setPosts((prev) => [created, ...prev]);
    setStats((s) => (s ? { ...s, jumlah_cerita: s.jumlah_cerita + 1 } : s));
  };

  return (
    <div className="db-main-content">
      <DashboardHeader onToggleSidebar={onToggleSidebar} />

      <div className="komunitas-page-container">
        <div className="komunitas-content-wrapper">
          <div className="komunitas-dashed-divider" />

          {/* 1. Hero */}
          <div className="komunitas-hero-section">
            <div className="komunitas-hero-left">
              <div className="komunitas-safe-badge">
                <span className="safe-dot" />
                <span>Ruang Aman • Identitas Asli Tidak Ditampilkan</span>
              </div>
              <h1 className="komunitas-hero-title">Lingkar Rasa &amp; Ruang Berbagi</h1>
              <p className="komunitas-hero-sub">
                Di sini, suaramu didengar tanpa prasangka. Berbagi beban dengan sesama pejuang jiwa
                dan dapatkan balasan hangat — termasuk dari psikolog terverifikasi.
              </p>
            </div>

            <div className="komunitas-hero-stat-card">
              <div className="stat-card-icon">
                <Heart size={22} className="fill-sky-500 text-sky-500" />
              </div>
              <div className="stat-card-content">
                <span className="stat-card-tag">TUMBUH BERSAMA</span>
                <span className="stat-card-number">
                  {stats ? `${stats.jumlah_anggota.toLocaleString('id-ID')} Jiwa` : '…'}
                </span>
                <span className="stat-card-label">
                  {stats ? `${stats.jumlah_cerita.toLocaleString('id-ID')} cerita dibagikan` : 'Terhubung'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Filter topik */}
          <div className="komunitas-filter-card">
            <div className="topic-filter-row">
              <span className="filter-label">Topik:</span>
              <div className="topic-chips-group">
                {[{ id_category: ALL, nama_kategori: 'Semua Topik' }, ...categories].map((cat) => (
                  <button
                    key={cat.id_category}
                    type="button"
                    className={`topic-chip-btn ${topic === cat.id_category ? 'active' : ''}`}
                    onClick={() => topic !== cat.id_category && changeFeed(() => setTopic(cat.id_category))}
                    aria-pressed={topic === cat.id_category}
                  >
                    {cat.nama_kategori}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Persona / tulis cerita */}
          {!personaLoaded ? null : persona ? (
            <Composer
              persona={persona}
              categories={categories}
              onPersonaChange={setPersona}
              onPosted={handlePosted}
            />
          ) : (
            <PersonaSetupCard
              onCreated={(p) => {
                setPersona(p);
                setStats((s) => (s ? { ...s, jumlah_anggota: s.jumlah_anggota + 1 } : s));
              }}
            />
          )}

          {/* 4. Feed header */}
          <div className="feed-header-row">
            <div className="feed-title-group">
              <h2 className="feed-title">Diskusi Terkini</h2>
              <button
                type="button"
                className="feed-refresh-btn"
                onClick={() => changeFeed(() => setReloadKey((k) => k + 1))}
                title="Muat ulang"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="feed-sort-group">
              <span>Urutkan: </span>
              <button
                type="button"
                className={`sort-link-btn ${sort === 'populer' ? 'active' : ''}`}
                onClick={() => sort !== 'populer' && changeFeed(() => setSort('populer'))}
              >
                Paling Didukung
              </button>
              <span className="sort-dot">•</span>
              <button
                type="button"
                className={`sort-link-btn ${sort === 'terbaru' ? 'active' : ''}`}
                onClick={() => sort !== 'terbaru' && changeFeed(() => setSort('terbaru'))}
              >
                Terbaru
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 5. Feed */}
          <div className="feed-cards-list">
            {loading ? (
              <div className="feed-empty-state">Memuat cerita komunitas…</div>
            ) : posts.length === 0 ? (
              <div className="feed-empty-state">
                {topic === ALL ? <PenLine size={28} /> : <Users size={28} />}
                <strong>{topic === ALL ? 'Belum ada cerita' : 'Belum ada cerita di topik ini'}</strong>
                <span>
                  {sort === 'populer'
                    ? 'Belum ada cerita yang mendapat dukungan dalam 30 hari terakhir.'
                    : 'Jadilah yang pertama berbagi — ceritamu bisa menguatkan orang lain.'}
                </span>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id_post}
                  post={post}
                  now={now}
                  persona={persona}
                  categoryTone={categoryTone(categories, post.id_category)}
                  onChange={updatePost}
                  onDelete={handleDelete}
                  onReport={setReportTarget}
                />
              ))
            )}
          </div>

          {hasMore && !loading && (
            <div className="load-more-wrapper">
              <button type="button" className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                <RefreshCw size={15} />
                <span>{loadingMore ? 'Memuat…' : 'Muat Cerita Komunitas Lainnya'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {reportTarget && <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} />}
    </div>
  );
}
