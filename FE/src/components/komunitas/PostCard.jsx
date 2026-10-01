import React, { useEffect, useState } from 'react';
import { Moon, Cloud, Sun, Leaf, Sparkles, Flower2, Flame, MessageCircle, Send, ShieldCheck, Stethoscope, CornerDownRight, AlertCircle } from 'lucide-react';
import ContentMenu from './ContentMenu';
import {
  createAnswer,
  createComment,
  deleteAnswer,
  deleteComment,
  listAnswers,
  listComments,
  relativeTime,
  toggleAnswerHug,
  togglePostHug,
} from '../../service/forumService';

const AVATAR_ICONS = [Moon, Cloud, Sun, Leaf, Sparkles, Flower2];

/** Ikon avatar stabil berdasarkan nama persona. */
export function PersonaAvatar({ name = '', className = 'post-avatar-box', size = 20 }) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const Icon = AVATAR_ICONS[hash % AVATAR_ICONS.length];
  return (
    <div className={className} aria-hidden="true">
      <Icon size={size} />
    </div>
  );
}

function PsychologistBadge() {
  return (
    <span className="psikolog-mini-tag" title="Ditulis oleh psikolog terverifikasi">
      <Stethoscope size={11} /> Psikolog
    </span>
  );
}

// Judul otomatis (potongan awal cerita) tidak perlu ditampilkan dua kali.
const showTitle = (post) => {
  const title = post.judul.replace(/…$/, '');
  return !post.isi.startsWith(title);
};

function CommentsSection({ answer, now, persona, onReport, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listComments(answer.id_answer)
      .then((rows) => {
        if (!cancelled) setComments(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [answer.id_answer]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const created = await createComment(answer.id_answer, input);
      setComments((prev) => [...prev, created]);
      onCountChange(1);
      setInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (comment) => {
    try {
      await deleteComment(comment.id_comment);
      setComments((prev) => prev.filter((c) => c.id_comment !== comment.id_comment));
      onCountChange(-1);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="answer-comments">
      {loading && <p className="no-comments-text">Memuat tanggapan…</p>}
      {comments.map((c) => (
        <div key={c.id_comment} className="answer-comment-item">
          <CornerDownRight size={13} className="answer-comment-arrow" />
          <div className="comment-item-content">
            <div className="comment-item-header">
              <span className="comment-author">{c.persona?.nama_persona || 'Anonim'}</span>
              {c.oleh_psikolog && <PsychologistBadge />}
              {c.milik_saya && <span className="mine-mini-tag">Kamu</span>}
              <span className="comment-time">• {relativeTime(c.created_at, now)}</span>
              <ContentMenu
                size={14}
                isMine={c.milik_saya}
                onDelete={() => handleDelete(c)}
                onReport={() => onReport({ type: 'ANSWER_COMMENT', id: c.id_comment })}
              />
            </div>
            <p className="comment-text">{c.isi}</p>
          </div>
        </div>
      ))}
      {error && <p className="komunitas-inline-error"><AlertCircle size={13} /> {error}</p>}
      {persona && (
        <div className="add-comment-bar compact">
          <input
            type="text"
            className="add-comment-input"
            placeholder={`Tanggapi sebagai ${persona.nama_persona}...`}
            value={input}
            maxLength={1000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button type="button" className="submit-comment-btn" onClick={handleSend} disabled={!input.trim() || sending}>
            <Send size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function AnswerItem({ answer, now, persona, onReport, onDeleted, onChange }) {
  const [showComments, setShowComments] = useState(false);
  const [error, setError] = useState('');

  const handleHug = async () => {
    try {
      const res = await toggleAnswerHug(answer.id_answer);
      onChange({ ...answer, sudah_dipeluk: res.dipeluk, jumlah_peluk: res.jumlah_peluk });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAnswer(answer.id_answer);
      onDeleted(answer);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={`comment-item ${answer.oleh_psikolog ? 'by-psychologist' : ''}`}>
      <PersonaAvatar name={answer.persona?.nama_persona} className="comment-item-avatar" size={14} />
      <div className="comment-item-content">
        <div className="comment-item-header">
          <span className="comment-author">{answer.persona?.nama_persona || 'Anonim'}</span>
          {answer.oleh_psikolog && <PsychologistBadge />}
          {answer.milik_saya && <span className="mine-mini-tag">Kamu</span>}
          <span className="comment-time">• {relativeTime(answer.created_at, now)}</span>
          <ContentMenu
            size={15}
            isMine={answer.milik_saya}
            onDelete={handleDelete}
            onReport={() => onReport({ type: 'ANSWER', id: answer.id_answer })}
          />
        </div>
        <p className="comment-text">{answer.isi}</p>
        <div className="answer-actions">
          <button
            type="button"
            className={`answer-action-btn ${answer.sudah_dipeluk ? 'hugged' : ''}`}
            onClick={handleHug}
            aria-pressed={answer.sudah_dipeluk}
          >
            <Flame size={13} className={answer.sudah_dipeluk ? 'fill-orange-500 text-orange-500' : ''} />
            Peluk {answer.jumlah_peluk > 0 ? answer.jumlah_peluk : ''}
          </button>
          <button type="button" className="answer-action-btn" onClick={() => setShowComments((v) => !v)}>
            <MessageCircle size={13} />
            {answer.jumlah_komentar > 0 ? `${answer.jumlah_komentar} Tanggapan` : 'Tanggapi'}
          </button>
        </div>
        {error && <p className="komunitas-inline-error"><AlertCircle size={13} /> {error}</p>}
        {showComments && (
          <CommentsSection
            answer={answer}
            now={now}
            persona={persona}
            onReport={onReport}
            onCountChange={(delta) => onChange({ ...answer, jumlah_komentar: answer.jumlah_komentar + delta })}
          />
        )}
      </div>
    </div>
  );
}

function AnswersSection({ post, now, persona, onReport, onCountChange }) {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listAnswers(post.id_post)
      .then((rows) => {
        if (!cancelled) setAnswers(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [post.id_post]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const created = await createAnswer(post.id_post, input);
      setAnswers((prev) => [...prev, created]);
      onCountChange(1);
      setInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="comments-expand-section">
      <div className="comments-divider" />
      <div className="comments-list">
        {loading ? (
          <p className="no-comments-text">Memuat balasan…</p>
        ) : answers.length === 0 ? (
          <p className="no-comments-text">Belum ada balasan empati. Jadilah yang pertama memberikan kata penguatan.</p>
        ) : (
          answers.map((a) => (
            <AnswerItem
              key={a.id_answer}
              answer={a}
              now={now}
              persona={persona}
              onReport={onReport}
              onChange={(updated) => setAnswers((prev) => prev.map((x) => (x.id_answer === updated.id_answer ? updated : x)))}
              onDeleted={(deleted) => {
                setAnswers((prev) => prev.filter((x) => x.id_answer !== deleted.id_answer));
                onCountChange(-1);
              }}
            />
          ))
        )}
      </div>

      {error && <p className="komunitas-inline-error"><AlertCircle size={13} /> {error}</p>}

      {persona ? (
        <div className="add-comment-bar">
          <input
            type="text"
            className="add-comment-input"
            placeholder={`Balas sebagai ${persona.nama_persona}...`}
            value={input}
            maxLength={3000}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button type="button" className="submit-comment-btn" onClick={handleSend} disabled={!input.trim() || sending}>
            <Send size={14} />
            <span>{sending ? 'Mengirim…' : 'Kirim'}</span>
          </button>
        </div>
      ) : (
        <p className="no-comments-text">Buat persona anonim di atas untuk ikut membalas.</p>
      )}
    </div>
  );
}

export default function PostCard({ post, now, persona, categoryTone, onChange, onDelete, onReport }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const handleHug = async () => {
    try {
      const res = await togglePostHug(post.id_post);
      onChange({ ...post, sudah_dipeluk: res.dipeluk, jumlah_peluk: res.jumlah_peluk });
    } catch (err) {
      setError(err.message);
    }
  };

  const top = post.balasan_teratas;

  return (
    <article className="post-card">
      <div className="post-card-header">
        <div className="post-author-group">
          <PersonaAvatar name={post.persona?.nama_persona} />
          <div className="post-author-meta">
            <div className="post-author-top">
              <h3 className="post-author-name">{post.persona?.nama_persona || 'Anonim'}</h3>
              {post.milik_saya && <span className="mine-mini-tag">Tulisanmu</span>}
              <span className="post-time">• {relativeTime(post.created_at, now)}</span>
            </div>
            {post.kategori && (
              <span className={`category-tag-pill tag-${categoryTone}`}>{post.kategori.nama_kategori}</span>
            )}
          </div>
        </div>

        <ContentMenu
          isMine={post.milik_saya}
          onDelete={() => onDelete(post)}
          onReport={() => onReport({ type: 'POST', id: post.id_post })}
        />
      </div>

      {showTitle(post) && <h3 className="post-title">{post.judul}</h3>}
      <p className="post-body-text">{post.isi}</p>

      <div className="post-actions-row">
        <div className="left-action-buttons">
          <button
            type="button"
            className={`hug-btn ${post.sudah_dipeluk ? 'hugged' : ''}`}
            onClick={handleHug}
            aria-pressed={post.sudah_dipeluk}
          >
            <Flame size={16} className={post.sudah_dipeluk ? 'fill-orange-500 text-orange-500' : ''} />
            <span>Peluk Hangat {post.jumlah_peluk}</span>
          </button>

          <button
            type="button"
            className={`comment-btn ${open ? 'active' : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <MessageCircle size={16} />
            <span>{post.jumlah_balasan} Balasan Empati</span>
          </button>
        </div>
      </div>

      {error && <p className="komunitas-inline-error"><AlertCircle size={13} /> {error}</p>}

      {!open && top && (
        <div className="pinned-reply-box">
          <div className="pinned-reply-header">
            <div className="reply-author-info">
              <Leaf size={15} />
              <span className="font-bold">{top.persona?.nama_persona || 'Anonim'}</span>
              <span className="reply-time-text">• {relativeTime(top.created_at, now)}</span>
            </div>
            <div className="reply-badge">
              {top.oleh_psikolog ? <Stethoscope size={13} /> : <ShieldCheck size={13} />}
              <span>{top.oleh_psikolog ? 'Dijawab Psikolog' : `Paling Didukung • ${top.jumlah_peluk} peluk`}</span>
            </div>
          </div>
          <p className="pinned-reply-text">“{top.isi}”</p>
        </div>
      )}

      {open && (
        <AnswersSection
          post={post}
          now={now}
          persona={persona}
          onReport={onReport}
          onCountChange={(delta) => onChange({ ...post, jumlah_balasan: post.jumlah_balasan + delta })}
        />
      )}
    </article>
  );
}
