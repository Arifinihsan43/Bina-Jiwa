/**
 * Mood & Refleksi Service
 * Check-in mood harian (/wellness/moods) dan refleksi (/wellness/journals).
 * "Hari" selalu mengacu ke WIB, sama seperti backend.
 */

import { apiRequest, ApiError } from './apiClient';

// --- Pilihan mood -----------------------------------------------------------
// `legend` mengelompokkan mood ke 5 kategori legenda kalender.
// `valence` dipakai menghitung indeks suasana hati (-1 sangat negatif … 1 sangat positif).
export const MOODS = [
  { id: 'Sangat Baik', legend: 'Bahagia', color: '#fef3c7', emoji: '🌟', valence: 1 },
  { id: 'Tenang', legend: 'Tenang', color: '#e0f2fe', emoji: '🪻', valence: 0.6 },
  { id: 'Biasa', legend: 'Biasa', color: '#f1f5f9', emoji: '☁️', valence: 0 },
  { id: 'Lelah', legend: 'Cemas', color: '#ffe4e6', emoji: '🔋', valence: -0.4 },
  { id: 'Cemas', legend: 'Cemas', color: '#ffe4e6', emoji: '🌊', valence: -0.7 },
  { id: 'Sedih', legend: 'Sedih', color: '#f3e8ff', emoji: '🌧️', valence: -1 },
];
const MOOD_BY_ID = Object.fromEntries(MOODS.map((m) => [m.id, m]));
export const moodMeta = (mood) => MOOD_BY_ID[mood] || MOOD_BY_ID.Biasa;

export const FACTORS = ['Pekerjaan', 'Keluarga • Rumah', 'Hubungan Sosial', 'Kualitas Tidur', 'Kebugaran Fisik'];

export const intensityLabel = (lvl) =>
  ({
    1: 'Tingkat 1 (Sangat Samar)',
    2: 'Tingkat 2 (Samar)',
    3: 'Tingkat 3 (Sedang)',
    4: 'Tingkat 4 (Kuat)',
    5: 'Tingkat 5 (Sangat Kuat)',
  })[lvl] || 'Tingkat 3 (Sedang)';

/**
 * Indeks suasana hati 0–100 (50 = netral). Mood positif makin tinggi saat
 * intensitasnya kuat; mood negatif makin rendah saat intensitasnya kuat.
 */
export const moodScore = (mood, intensitas) =>
  Math.round(50 + 50 * moodMeta(mood).valence * (0.4 + 0.6 * (intensitas / 5)));

// --- Tanggal WIB ------------------------------------------------------------
const WIB_MS = 7 * 3600 * 1000;

/** 'YYYY-MM-DD' menurut WIB untuk sebuah Date/ISO string/timestamp. */
export const wibDateKey = (value = Date.now()) =>
  new Date(new Date(value).getTime() + WIB_MS).toISOString().slice(0, 10);

export const addDaysKey = (dateKey, days) => {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const timeFmt = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
export const formatWibTime = (iso) => `${timeFmt.format(new Date(iso))} WIB`;

// --- Faktor & catatan disimpan di kolom `catatan` ----------------------------
// Format: "Faktor: Pekerjaan, Kualitas Tidur\n<catatan bebas>"
const FACTOR_PREFIX = 'Faktor: ';

const encodeCatatan = (factors, note) => {
  const lines = [];
  if (factors.length) lines.push(FACTOR_PREFIX + factors.join(', '));
  if (note?.trim()) lines.push(note.trim());
  return lines.length ? lines.join('\n') : null;
};

const decodeCatatan = (catatan) => {
  if (!catatan) return { factors: [], note: '' };
  const [first, ...rest] = catatan.split('\n');
  if (first.startsWith(FACTOR_PREFIX)) {
    return {
      factors: first.slice(FACTOR_PREFIX.length).split(',').map((f) => f.trim()).filter(Boolean),
      note: rest.join('\n').trim(),
    };
  }
  return { factors: [], note: catatan.trim() };
};

/** Bentuk yang dipakai komponen UI. */
const toLog = (entry) => {
  const meta = moodMeta(entry.mood);
  const { factors, note } = decodeCatatan(entry.catatan);
  return {
    id: entry.id_mood_entry,
    dateKey: wibDateKey(entry.created_at),
    mood: entry.mood,
    type: meta.legend,
    color: meta.color,
    icon: meta.emoji,
    intensity: entry.intensitas,
    score: moodScore(entry.mood, entry.intensitas),
    factors,
    note,
    timestamp: entry.created_at,
  };
};

// --- API --------------------------------------------------------------------

/** Log mood per tanggal WIB dalam rentang [dari, sampai]: { 'YYYY-MM-DD': log } */
export const getMoodLogs = async (dari, sampai) => {
  const rows = await apiRequest(`/wellness/moods?limit=100&dari=${dari}&sampai=${sampai}`);
  const logs = {};
  // Terbaru dulu dari backend; simpan satu entri per hari (yang pertama tercatat).
  rows.forEach((row) => {
    const log = toLog(row);
    logs[log.dateKey] = log;
  });
  return logs;
};

export const getTodayMood = async () => {
  const today = wibDateKey();
  const logs = await getMoodLogs(today, today);
  return logs[today] || null;
};

export const saveTodayMood = async ({ mood, intensity, factors = [], note = '' }) => {
  try {
    const entry = await apiRequest('/wellness/moods', {
      method: 'POST',
      body: { mood, intensitas: intensity, catatan: encodeCatatan(factors, note) },
    });
    return toLog(entry);
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      throw new ApiError('Kamu sudah mencatat mood hari ini. Setiap hari hanya dapat diisi 1 kali.', 409);
    }
    throw err;
  }
};

// --- Refleksi (jurnal) ------------------------------------------------------

export const REFLECTION_PROMPTS = [
  'Satu hal kecil apa yang patut kamu syukuri dan hangatkan hatimu hari ini?',
  'Apa satu hal yang membuatmu merasa cukup hari ini?',
  'Momen apa hari ini yang ingin kamu ingat lebih lama?',
  'Apa yang sedang kamu butuhkan dari dirimu sendiri saat ini?',
  'Siapa yang membuat harimu sedikit lebih ringan, dan mengapa?',
  'Emosi apa yang paling sering muncul hari ini? Apa pesannya untukmu?',
  'Langkah kecil apa yang bisa kamu lakukan besok untuk merawat diri?',
];

/** Pertanyaan panduan berganti setiap hari (WIB). */
export const promptOfTheDay = () => {
  const dayNumber = Math.floor(new Date(`${wibDateKey()}T00:00:00Z`).getTime() / 86400000);
  return REFLECTION_PROMPTS[dayNumber % REFLECTION_PROMPTS.length];
};

export const saveReflection = async (question, text) =>
  apiRequest('/wellness/journals', {
    method: 'POST',
    body: { judul: question.slice(0, 150), isi: text.trim() },
  });

export const getReflections = async (dari, sampai) =>
  apiRequest(`/wellness/journals?limit=100&dari=${dari}&sampai=${sampai}`);

// --- Ringkasan untuk Dashboard ------------------------------------------------

const average = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

/**
 * Statistik dari log 14 hari terakhir:
 * - weekly: rata-rata indeks 7 hari terakhir, perubahan vs 7 hari sebelumnya,
 *   mood dominan, dan nilai harian (null bila tidak diisi) untuk sparkline.
 * - streak: jumlah hari berturut-turut terisi (hari ini boleh belum diisi).
 */
export const summarize = (logs, todayKey = wibDateKey()) => {
  const days = Array.from({ length: 7 }, (_, i) => addDaysKey(todayKey, i - 6));
  const prevDays = Array.from({ length: 7 }, (_, i) => addDaysKey(todayKey, i - 13));

  const thisWeek = days.map((d) => logs[d]).filter(Boolean);
  const prevWeek = prevDays.map((d) => logs[d]).filter(Boolean);
  const avg = average(thisWeek.map((l) => l.score));
  const prevAvg = average(prevWeek.map((l) => l.score));

  // Dihitung dari yang terbaru, jadi saat jumlahnya seri, mood terbaru yang menang (sort stabil).
  const counts = {};
  [...thisWeek].reverse().forEach((l) => { counts[l.mood] = (counts[l.mood] || 0) + 1; });
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  let streak = 0;
  let cursor = logs[todayKey] ? todayKey : addDaysKey(todayKey, -1);
  while (logs[cursor]) {
    streak += 1;
    cursor = addDaysKey(cursor, -1);
  }

  return {
    weekly: {
      average: avg === null ? null : Math.round(avg),
      delta: avg !== null && prevAvg !== null ? Math.round(avg - prevAvg) : null,
      dominant,
      filledDays: thisWeek.length,
      series: days.map((d) => ({ dateKey: d, score: logs[d]?.score ?? null, mood: logs[d]?.mood ?? null })),
    },
    streak,
  };
};
