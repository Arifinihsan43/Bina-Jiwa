/**
 * Payment Service
 * Pembayaran SIMULASI untuk sesi psikolog & event berbayar (/payments).
 * Tidak ada payment gateway: tombol "Simulasikan Pembayaran Berhasil" menggantikan
 * notifikasi dari gateway. Biaya dihitung backend; angka di sini hanya untuk info.
 */

import { apiRequest } from './apiClient';

// Sama dengan default backend (KOMISI_PERSEN_PSIKOLOG & BIAYA_LAYANAN di .env).
export const KOMISI_PERSEN_PSIKOLOG = 15;
export const BIAYA_LAYANAN = 2500;

export const PAYMENT_METHODS = [
  { id: 'QRIS', label: 'QRIS', group: 'QRIS', hint: 'Scan dengan aplikasi bank / e-wallet apa pun' },
  { id: 'VA_BCA', label: 'BCA Virtual Account', group: 'Virtual Account', bank: 'BCA' },
  { id: 'VA_BNI', label: 'BNI Virtual Account', group: 'Virtual Account', bank: 'BNI' },
  { id: 'VA_MANDIRI', label: 'Mandiri Virtual Account', group: 'Virtual Account', bank: 'Mandiri' },
  { id: 'GOPAY', label: 'GoPay', group: 'E-Wallet', app: 'Gojek' },
  { id: 'OVO', label: 'OVO', group: 'E-Wallet', app: 'OVO' },
  { id: 'DANA', label: 'DANA', group: 'E-Wallet', app: 'DANA' },
];

export const methodOf = (id) => PAYMENT_METHODS.find((m) => m.id === id);

export const PAYMENT_STATUS = {
  PENDING: { cls: 'pending', label: 'Menunggu pembayaran' },
  PAID: { cls: 'paid', label: 'Lunas' },
  EXPIRED: { cls: 'expired', label: 'Kedaluwarsa' },
  CANCELLED: { cls: 'cancelled', label: 'Dibatalkan' },
  REFUNDED: { cls: 'refunded', label: 'Dana dikembalikan' },
};

/** Langkah pembayaran (simulasi) yang ditampilkan di halaman instruksi. */
export const paymentSteps = (method, kode, total) => {
  const m = methodOf(method);
  if (!m) return [];
  if (m.group === 'QRIS') {
    return [
      'Buka aplikasi m-banking atau e-wallet yang mendukung QRIS.',
      'Pilih menu Scan / Bayar, lalu arahkan kamera ke kode QR di atas.',
      `Pastikan nominal ${formatRupiah(total)} dan merchant "Bina Jiwa", lalu konfirmasi.`,
    ];
  }
  if (m.group === 'Virtual Account') {
    return [
      `Buka aplikasi / ATM ${m.bank}, pilih Transfer > Virtual Account.`,
      `Masukkan nomor Virtual Account ${kode}.`,
      `Periksa nama "Bina Jiwa" dan nominal ${formatRupiah(total)}, lalu konfirmasi dengan PIN.`,
    ];
  }
  return [
    `Buka aplikasi ${m.app} di ponselmu.`,
    `Buka notifikasi tagihan atau masukkan kode pembayaran ${kode}.`,
    `Konfirmasi pembayaran ${formatRupiah(total)} dengan PIN ${m.label}.`,
  ];
};

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
export const formatRupiah = (value) => rupiah.format(Number(value) || 0);

/** Tarif yang diterima psikolog setelah komisi (perkiraan untuk form profil). */
export const netForPsychologist = (tarif) =>
  Math.max(0, Number(tarif) - Math.round((Number(tarif) * KOMISI_PERSEN_PSIKOLOG) / 100));

// target: { jenis: 'APPOINTMENT', id_appointment } | { jenis: 'EVENT', id_event }

export const getQuote = async (target) => apiRequest('/payments/quote', { method: 'POST', body: target });

export const createPayment = async (target, metode) =>
  apiRequest('/payments', { method: 'POST', body: { ...target, metode } });

export const listPayments = async ({ id_appointment, id_event } = {}) => {
  const params = new URLSearchParams({ limit: '100' });
  if (id_appointment) params.set('id_appointment', id_appointment);
  if (id_event) params.set('id_event', id_event);
  return apiRequest(`/payments?${params}`);
};

export const getPayment = async (paymentId) => apiRequest(`/payments/${paymentId}`);

export const simulatePaid = async (paymentId) =>
  apiRequest(`/payments/${paymentId}/simulate-paid`, { method: 'POST' });

export const cancelPayment = async (paymentId) =>
  apiRequest(`/payments/${paymentId}/cancel`, { method: 'POST' });

/** Tagihan PENDING yang masih berlaku untuk target ini (untuk melanjutkan pembayaran). */
export const findActivePayment = async (target) => {
  const rows = await listPayments(target);
  const now = Date.now();
  return rows.find((p) => p.status === 'PENDING' && new Date(p.expired_at).getTime() > now) || null;
};
