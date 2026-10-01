/**
 * Forum / Komunitas Service
 * Persona anonim, kategori, cerita (posts), balasan (answers), komentar balasan,
 * pelukan (hugs), dan laporan konten. Backend tidak pernah mengirim identitas asli penulis.
 */

import { apiRequest, ApiError } from './apiClient';

// --- Persona anonim ---------------------------------------------------------

const PERSONA_WORDS = [
  'Daun Teduh', 'Tunas Harapan', 'Awan Putih', 'Pelangi Senja', 'Embun Pagi',
  'Surya Hangat', 'Bintang Malam', 'Cahaya Damai', 'Ombak Tenang', 'Angin Sepoi',
  'Bulan Sabit', 'Kabut Lembut', 'Hujan Rintik', 'Pohon Rindang', 'Senja Jingga',
];

export const randomPersonaName = () => {
  const word = PERSONA_WORDS[Math.floor(Math.random() * PERSONA_WORDS.length)];
  const num = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `${word} #${num}`;
};

/** Persona milik user, atau null bila belum dibuat. */
export const getMyPersona = async () => {
  try {
    return await apiRequest('/profiles/me/persona');
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
};

export const createPersona = async (nama) =>
  apiRequest('/profiles/me/persona', { method: 'POST', body: { nama_persona: nama.trim() } });

export const renamePersona = async (nama) =>
  apiRequest('/profiles/me/persona', { method: 'PATCH', body: { nama_persona: nama.trim() } });

// --- Kategori & statistik ---------------------------------------------------

export const listCategories = async () => apiRequest('/forum/categories');
export const getForumStats = async () => apiRequest('/forum/stats');

// Warna tag kategori mengikuti urutan kategori (stabil selama urutan tidak berubah).
const TAG_TONES = ['sky', 'peach', 'purple'];
export const categoryTone = (categories, id) => {
  const idx = categories.findIndex((c) => c.id_category === id);
  return TAG_TONES[(idx < 0 ? 0 : idx) % TAG_TONES.length];
};

// --- Cerita -----------------------------------------------------------------

export const PAGE_SIZE = 10;

export const listPosts = async ({ categoryId, sort = 'terbaru', offset = 0 } = {}) => {
  const params = new URLSearchParams({ sort, limit: String(PAGE_SIZE), offset: String(offset) });
  if (categoryId) params.set('category_id', categoryId);
  return apiRequest(`/forum/posts?${params}`);
};

export const createPost = async ({ categoryId, judul, isi }) =>
  apiRequest('/forum/posts', {
    method: 'POST',
    body: { id_category: categoryId || null, judul: judul?.trim() || null, isi: isi.trim() },
  });

export const deletePost = async (postId) =>
  apiRequest(`/forum/posts/${postId}`, { method: 'PATCH', body: { status: 'DELETED' } });

export const togglePostHug = async (postId) => apiRequest(`/forum/posts/${postId}/hug`, { method: 'POST' });

// --- Balasan & komentar -----------------------------------------------------

export const listAnswers = async (postId) => apiRequest(`/forum/posts/${postId}/answers?limit=100`);

export const createAnswer = async (postId, isi) =>
  apiRequest(`/forum/posts/${postId}/answers`, { method: 'POST', body: { isi: isi.trim() } });

export const deleteAnswer = async (answerId) =>
  apiRequest(`/forum/answers/${answerId}`, { method: 'PATCH', body: { status: 'DELETED' } });

export const toggleAnswerHug = async (answerId) =>
  apiRequest(`/forum/answers/${answerId}/hug`, { method: 'POST' });

export const listComments = async (answerId) => apiRequest(`/forum/answers/${answerId}/comments?limit=100`);

export const createComment = async (answerId, isi) =>
  apiRequest(`/forum/answers/${answerId}/comments`, { method: 'POST', body: { isi: isi.trim() } });

export const deleteComment = async (commentId) =>
  apiRequest(`/forum/comments/${commentId}`, { method: 'PATCH', body: { status: 'DELETED' } });

// --- Laporan ----------------------------------------------------------------

export const REPORT_REASONS = [
  'Ujaran kebencian / merendahkan',
  'Perundungan / pelecehan',
  'Konten menyakiti diri',
  'Spam / promosi',
  'Membuka identitas orang lain',
  'Lainnya',
];

/** targetType: 'POST' | 'ANSWER' | 'ANSWER_COMMENT' */
export const reportContent = async (targetType, targetId, reason, description) =>
  apiRequest('/reports', {
    method: 'POST',
    body: { target_type: targetType, target_id: targetId, reason, description: description?.trim() || null },
  });

// --- Waktu relatif ------------------------------------------------------------

const dateFmt = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' });

/** "Baru saja", "5 menit lalu", "3 jam lalu", "2 hari lalu", lalu tanggal. `now` = timestamp ms. */
export const relativeTime = (iso, now) => {
  const diff = Math.max(0, now - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} hari lalu`;
  return dateFmt.format(new Date(iso));
};
