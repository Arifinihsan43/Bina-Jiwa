/**
 * Storage Service
 * Unggah file ke Supabase Storage lewat backend (/storage/upload/{bucket}).
 * Backend memvalidasi tipe & ukuran file per bucket dan mengembalikan URL publik.
 */

import { apiRequest } from './apiClient';

export const PROFILE_IMAGE_BUCKET = 'profile-images';
export const PROFILE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Mengembalikan URL publik file yang diunggah. */
export const uploadFile = async (bucket, file) => {
  const form = new FormData();
  form.append('file', file);
  const { url } = await apiRequest(`/storage/upload/${bucket}`, { method: 'POST', body: form });
  return url;
};
