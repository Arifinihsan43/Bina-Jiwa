/**
 * Admin Service
 * Panel admin tanpa akun: setiap request membawa kode akses admin
 * (header X-Admin-Key) yang dicocokkan dengan ADMIN_ACCESS_KEY di backend.
 * Kode disimpan di sessionStorage — hilang saat tab ditutup.
 */

import { apiRequest } from './apiClient';

const ADMIN_KEY_STORAGE = 'binajiwa_admin_key';

export const adminKeyStore = {
  get() {
    try {
      return sessionStorage.getItem(ADMIN_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  },
  set(key) {
    try {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
    } catch {
      // abaikan
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    } catch {
      // abaikan
    }
  },
};

const adminRequest = (path, options = {}, key = adminKeyStore.get()) =>
  apiRequest(path, { ...options, auth: false, headers: { 'X-Admin-Key': key } });

/** Validasi kode akses; lempar ApiError 401 bila salah. */
export const checkAdminKey = async (key) => adminRequest('/admin/check', {}, key);

export const adminListPsychologists = async () => adminRequest('/admin/psychologists?limit=200');

/** status: 'VERIFIED' | 'REJECTED'. catatan wajib diisi saat REJECTED. */
export const verifyPsychologist = async (psychologistId, status, catatan) =>
  adminRequest(`/admin/psychologists/${psychologistId}/verify`, {
    method: 'PATCH',
    body: { verification_status: status, catatan: catatan?.trim() || null },
  });

// --- Kategori komunitas -------------------------------------------------------

export const adminListCategories = async () => adminRequest('/admin/categories');

export const adminCreateCategory = async ({ nama, deskripsi }) =>
  adminRequest('/admin/categories', {
    method: 'POST',
    body: { nama_kategori: nama.trim(), deskripsi: deskripsi?.trim() || null },
  });

export const adminSeedCategories = async () => adminRequest('/admin/categories/defaults', { method: 'POST' });

export const adminUpdateCategory = async (categoryId, patch) =>
  adminRequest(`/admin/categories/${categoryId}`, { method: 'PATCH', body: patch });

// --- Laporan komunitas ------------------------------------------------------

export const adminListReports = async () => adminRequest('/admin/reports?limit=200');

/** status: 'RESOLVED' | 'REJECTED'. hide: sembunyikan konten yang dilaporkan. */
export const adminModerateReport = async (reportId, status, hide) =>
  adminRequest(`/admin/reports/${reportId}`, {
    method: 'PATCH',
    body: { status, sembunyikan_konten: Boolean(hide) },
  });
