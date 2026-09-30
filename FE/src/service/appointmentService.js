/**
 * Appointment Service
 * Janji temu antara pengguna dan psikolog (/appointments).
 * Jadwal praktik psikolog diasumsikan dalam WIB (UTC+7).
 */

import { apiRequest, ApiError } from './apiClient';

export const SESSION_MINUTES = 60;
const WIB_OFFSET = '+07:00';

// Tanggal hari ini menurut WIB, format YYYY-MM-DD.
export const todayWib = () =>
  new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

// 'YYYY-MM-DD' -> hari backend (1 = Senin ... 7 = Minggu)
export const hariOf = (dateStr) => {
  const jsDay = new Date(`${dateStr}T00:00:00Z`).getUTCDay(); // 0 = Minggu
  return ((jsDay + 6) % 7) + 1;
};

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fromMinutes = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

export const wibIso = (dateStr, hhmm) => `${dateStr}T${hhmm}:00${WIB_OFFSET}`;

/**
 * Slot per jam dari jadwal praktik pada tanggal tsb, tanpa slot yang sudah
 * lewat atau bentrok dengan jam terisi. Hasil: [{ start: 'HH:MM', end: 'HH:MM' }]
 */
export function buildSlots(jadwal, dateStr, busy = []) {
  const hari = hariOf(dateStr);
  const now = Date.now();
  const busyRanges = busy.map((b) => [new Date(b.tanggal_mulai).getTime(), new Date(b.tanggal_selesai).getTime()]);
  const slots = [];

  jadwal
    .filter((s) => s.hari === hari)
    .forEach((s) => {
      const open = toMinutes(s.jam_mulai.slice(0, 5));
      const close = toMinutes(s.jam_selesai.slice(0, 5));
      for (let m = open; m + SESSION_MINUTES <= close; m += SESSION_MINUTES) {
        const start = fromMinutes(m);
        const end = fromMinutes(m + SESSION_MINUTES);
        const startMs = new Date(wibIso(dateStr, start)).getTime();
        const endMs = new Date(wibIso(dateStr, end)).getTime();
        if (startMs <= now) continue;
        if (busyRanges.some(([bs, be]) => startMs < be && endMs > bs)) continue;
        slots.push({ start, end });
      }
    });

  return slots.sort((a, b) => a.start.localeCompare(b.start));
}

export const getBusySlots = async (psychologistId, dateStr) =>
  apiRequest(`/psychologists/${psychologistId}/busy?tanggal=${dateStr}`);

export const createAppointment = async ({ psychologistId, date, slot, type, catatan }) => {
  try {
    return await apiRequest('/appointments', {
      method: 'POST',
      body: {
        id_psychologist: psychologistId,
        tanggal_mulai: wibIso(date, slot.start),
        tanggal_selesai: wibIso(date, slot.end),
        type,
        catatan: catatan?.trim() || null,
      },
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      throw new ApiError('Jam ini baru saja dipesan orang lain. Silakan pilih jam lain.', 409);
    }
    throw err;
  }
};

export const listMyAppointments = async () => apiRequest('/appointments?limit=100');

export const updateAppointment = async (appointmentId, patch) =>
  apiRequest(`/appointments/${appointmentId}`, { method: 'PATCH', body: patch });

// --- Format tampilan (selalu WIB) ------------------------------------------

const wibFormatter = (options) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ...options });
const dateFmt = wibFormatter({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = wibFormatter({ hour: '2-digit', minute: '2-digit' });

export const formatAppointmentRange = (startIso, endIso) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${dateFmt.format(start)}, ${timeFmt.format(start)}–${timeFmt.format(end)} WIB`;
};
