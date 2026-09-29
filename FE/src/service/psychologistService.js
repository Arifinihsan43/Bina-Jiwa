/**
 * Psychologist Service
 * Profil praktik psikolog (milik sendiri), jadwal praktik,
 * dan daftar psikolog terpublikasi untuk halaman Cari Psikolog.
 */

import { apiRequest, ApiError } from './apiClient';

export const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
export const DAY_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

// Backend: 1 = Senin ... 7 = Minggu. JS Date#getDay(): 0 = Minggu.
export const todayHari = () => ((new Date().getDay() + 6) % 7) + 1;

// '09:00:00' -> '09.00'
export const formatTime = (value) => (value ? value.slice(0, 5).replace(':', '.') : '');

// Decimal dari backend dikirim sebagai string.
const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const splitSpecializations = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// --- Profil praktik milik sendiri -------------------------------------------

/** null bila psikolog belum pernah mengisi profil praktik. */
export const getMyPsychologistProfile = async () => {
  try {
    return await apiRequest('/psychologists/me');
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
};

// Ubah string kosong jadi null supaya field bisa dikosongkan.
const cleanPayload = (data) =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' && value.trim() === '' ? null : typeof value === 'string' ? value.trim() : value,
    ])
  );

export const saveMyPsychologistProfile = async (data, { isNew }) =>
  apiRequest('/psychologists/me', {
    method: isNew ? 'POST' : 'PATCH',
    body: cleanPayload(data),
  });

// --- Jadwal praktik ---------------------------------------------------------

export const getSchedules = async (psychologistId) =>
  apiRequest(`/psychologists/${psychologistId}/schedules?active_only=false`);

export const addSchedule = async ({ hari, jam_mulai, jam_selesai }) =>
  apiRequest('/psychologists/me/schedules', {
    method: 'POST',
    body: { hari: Number(hari), jam_mulai, jam_selesai },
  });

export const updateSchedule = async (scheduleId, patch) =>
  apiRequest(`/psychologists/me/schedules/${scheduleId}`, { method: 'PATCH', body: patch });

export const deleteSchedule = async (scheduleId) =>
  apiRequest(`/psychologists/me/schedules/${scheduleId}`, { method: 'DELETE' });

// Hanya izinkan link http(s) agar link dokumen tidak bisa berisi javascript:.
export const safeExternalUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
};

// --- Cari Psikolog (publik) -------------------------------------------------

function toListItem(p) {
  const jadwal = p.jadwal || [];
  const today = todayHari();
  const todaySlots = jadwal
    .filter((s) => s.hari === today)
    .map((s) => `${formatTime(s.jam_mulai)}–${formatTime(s.jam_selesai)}`);
  const nextSchedule = jadwal.find((s) => s.hari > today) || jadwal[0];

  return {
    id: p.id_psychologist,
    name: p.nama_profesional,
    tags: splitSpecializations(p.spesialisasi),
    bio: p.bio || '',
    city: p.kota || '',
    address: p.alamat_praktik || '',
    lat: toNumber(p.latitude),
    lng: toNumber(p.longitude),
    nomorHimpsi: p.nomor_himpsi,
    nomorSipp: p.nomor_sipp,
    isVerified: p.verification_status === 'VERIFIED',
    jadwal,
    availableToday: todaySlots.length > 0,
    slots: todaySlots,
    availableNext: nextSchedule
      ? `${DAY_NAMES[nextSchedule.hari - 1]}: ${formatTime(nextSchedule.jam_mulai)}–${formatTime(nextSchedule.jam_selesai)}`
      : 'Jadwal belum tersedia',
  };
}

export const listPublishedPsychologists = async ({ kota, spesialisasi } = {}) => {
  const params = new URLSearchParams({ limit: '100' });
  if (kota) params.set('kota', kota);
  if (spesialisasi) params.set('spesialisasi', spesialisasi);
  const rows = await apiRequest(`/psychologists?${params}`);
  return rows.map(toListItem);
};
