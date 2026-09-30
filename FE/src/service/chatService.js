/**
 * Chat Service
 * Pesan antara pengguna dan psikolog (/chat). Percakapan dibuat otomatis
 * oleh backend saat psikolog mengonfirmasi janji temu — FE tidak membuatnya.
 */

import { apiRequest } from './apiClient';

export const listConversations = async () => apiRequest('/chat/conversations?limit=100');

/** Pesan terbaru dulu dari backend; dikembalikan urut lama -> baru. */
export const listMessages = async (conversationId) => {
  const rows = await apiRequest(`/chat/conversations/${conversationId}/messages?limit=100`);
  return rows.reverse();
};

export const sendMessage = async (conversationId, isi) =>
  apiRequest(`/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: { message_type: 'TEXT', isi },
  });

export const markConversationRead = async (conversationId) =>
  apiRequest(`/chat/conversations/${conversationId}/messages/read`, { method: 'PATCH' });

/** Lawan bicara dari sudut pandang user yang sedang login. */
export const counterpartOf = (conversation, userId) => {
  const iAmPsychologist = conversation.psikolog?.id_user === userId;
  return iAmPsychologist
    ? { name: conversation.klien?.nama_lengkap || 'Klien', role: 'Klien', iAmPsychologist }
    : { name: conversation.psikolog?.nama_profesional || 'Psikolog', role: 'Psikolog', iAmPsychologist };
};

// --- Format waktu (WIB) -----------------------------------------------------

const fmt = (options) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ...options });
const timeFmt = fmt({ hour: '2-digit', minute: '2-digit' });
const dayKeyFmt = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' });
const dayLabelFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDateFmt = fmt({ day: 'numeric', month: 'short' });

export const formatTime = (iso) => timeFmt.format(new Date(iso));
export const dayKey = (iso) => dayKeyFmt.format(new Date(iso));
export const formatDayLabel = (iso) => dayLabelFmt.format(new Date(iso));

/** Jam bila hari ini, selain itu tanggal singkat. `todayKey` = dayKey(waktu sekarang). */
export const formatListTime = (iso, todayKey) =>
  dayKey(iso) === todayKey ? formatTime(iso) : shortDateFmt.format(new Date(iso));

// Pecah teks menjadi bagian biasa & tautan http(s) supaya bisa dirender sebagai <a>.
// Tanda baca di akhir (koma, titik, kurung tutup) tidak ikut menjadi bagian tautan.
const URL_PATTERN = /(https?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)\]])/gi;
export const splitLinks = (text) =>
  text.split(URL_PATTERN).map((part, i) => ({ text: part, isLink: i % 2 === 1 }));
