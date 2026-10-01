/**
 * Events & Workshop Service
 * Daftar event & pendaftaran peserta. Event dibuat dan dikelola admin (lihat adminService).
 * Waktu ditampilkan dan diinput dalam WIB.
 */

import { apiRequest, ApiError } from './apiClient';

export const listUpcomingEvents = async () => apiRequest('/events?upcoming_only=true&limit=100');
export const listMyRegistrations = async () => apiRequest('/events/me/registrations');

export const registerEvent = async (eventId) => {
  try {
    return await apiRequest(`/events/${eventId}/register`, { method: 'POST' });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409 && /exclusion|penuh/i.test(err.message)) {
      throw new ApiError('Maaf, kursi untuk event ini baru saja penuh.', 409);
    }
    throw err;
  }
};

export const cancelRegistration = async (eventId) =>
  apiRequest(`/events/${eventId}/registration`, { method: 'PATCH', body: { status: 'CANCELLED' } });

// --- Proposal kolaborasi -------------------------------------------------------
// Event diajukan lewat email; admin Bina Jiwa yang membuat & mempublikasikannya.

export const PROPOSAL_EMAIL = import.meta.env.VITE_PROPOSAL_EMAIL || 'kolaborasi@binajiwa.id';

const PROPOSAL_TEMPLATE = `Halo Tim Bina Jiwa,

Kami ingin mengajukan proposal event/workshop dengan rincian berikut:

Nama penyelenggara (individu/komunitas/lembaga):
Profil singkat & kredensial (mis. psikolog berlisensi, komunitas, dsb.):
Judul event:
Deskripsi & tujuan:
Sasaran peserta:
Format (online / tatap muka + lokasi):
Usulan tanggal & jam (WIB):
Kuota peserta:
Biaya (gratis / nominal):
Narahubung (nama, email, no. WhatsApp):

Terima kasih.`;

export const proposalMailto = () =>
  `mailto:${PROPOSAL_EMAIL}?subject=${encodeURIComponent('Proposal Event Bina Jiwa')}&body=${encodeURIComponent(PROPOSAL_TEMPLATE)}`;

// --- Format -----------------------------------------------------------------

const fmt = (options) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ...options });
const dayFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortDayFmt = fmt({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const timeFmt = fmt({ hour: '2-digit', minute: '2-digit' });
const dateKeyFmt = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' });

const sameDay = (a, b) => dateKeyFmt.format(a) === dateKeyFmt.format(b);

/** "Sabtu, 2 November 2026" */
export const formatEventDay = (iso) => dayFmt.format(new Date(iso));

/** "09.00–12.00 WIB" (atau rentang tanggal bila beda hari) */
export const formatEventTime = (startIso, endIso) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (sameDay(start, end)) return `${timeFmt.format(start)}–${timeFmt.format(end)} WIB`;
  return `${timeFmt.format(start)} WIB s.d. ${shortDayFmt.format(end)} ${timeFmt.format(end)} WIB`;
};

/** "Min, 24 Nov 2026 • 14.00 WIB" */
export const formatEventShort = (iso) => `${shortDayFmt.format(new Date(iso))} • ${timeFmt.format(new Date(iso))} WIB`;

export const formatDuration = (startIso, endIso) => {
  const minutes = Math.round((new Date(endIso) - new Date(startIso)) / 60000);
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} jam ${m} menit` : `${h} jam`;
};

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
export const formatPrice = (harga) => (Number(harga) > 0 ? rupiah.format(Number(harga)) : 'Gratis');
export const isFree = (event) => !(Number(event.harga) > 0);

/** Inisial nama untuk avatar penyelenggara (mengabaikan gelar seperti "M.Psi."). */
export const initialsOf = (name = '') =>
  name
    .split(',')[0]
    .split(/\s+/)
    .filter((w) => w && !w.endsWith('.'))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'BJ';

// --- Input datetime-local (WIB) <-> ISO --------------------------------------

/** '2026-11-02T09:00' (dianggap WIB) -> '2026-11-02T09:00:00+07:00' */
export const wibInputToIso = (value) => (value ? `${value}:00+07:00` : null);

/** ISO -> '2026-11-02T09:00' dalam WIB, untuk mengisi <input type="datetime-local"> */
export const isoToWibInput = (iso) => {
  if (!iso) return '';
  return new Date(new Date(iso).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 16);
};
