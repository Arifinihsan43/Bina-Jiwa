/**
 * Authentication Service
 * Handles user login, registration, logout, and session restore
 * against the BinaJiwa backend (/auth/*).
 */

import { apiRequest, sessionStore, ApiError } from './apiClient';

// Role di UI ('user' | 'doctor') <-> role di backend ('USER' | 'PSYCHOLOGIST' | 'ADMIN')
const ROLE_TO_API = { user: 'USER', doctor: 'PSYCHOLOGIST' };
const ROLE_FROM_API = { USER: 'user', PSYCHOLOGIST: 'doctor', ADMIN: 'admin' };

// Pesan error Supabase Auth -> Bahasa Indonesia
const AUTH_ERROR_MESSAGES = {
  'Invalid login credentials': 'Email atau kata sandi salah.',
  'Email not confirmed': 'Email belum dikonfirmasi. Silakan cek kotak masuk email Anda.',
  'User already registered': 'Email sudah terdaftar. Silakan masuk.',
};

function translateError(err) {
  if (err instanceof ApiError && AUTH_ERROR_MESSAGES[err.message]) {
    return new ApiError(AUTH_ERROR_MESSAGES[err.message], err.status);
  }
  if (err instanceof ApiError && err.status === 429) {
    return new ApiError('Terlalu banyak percobaan. Silakan tunggu beberapa saat.', 429);
  }
  return err;
}

function toUser(profile, email) {
  return {
    id: profile.id_user,
    email,
    name: profile.nama_lengkap,
    username: profile.username,
    role: ROLE_FROM_API[profile.role] || 'user',
    avatar: profile.foto_profil || undefined,
    city: profile.kota || undefined,
  };
}

// Username wajib unik di backend: ambil dari email + akhiran acak.
function generateUsername(email) {
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 40) || 'user';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}_${suffix}`;
}

async function fetchProfile(accessToken) {
  return apiRequest('/auth/me', { token: accessToken });
}

export const loginService = async ({ email, password, role, rememberMe = true }) => {
  if (!email || !password) {
    throw new Error('Email dan kata sandi wajib diisi.');
  }

  try {
    const session = await apiRequest('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email: email.trim(), password },
    });
    const profile = await fetchProfile(session.access_token);
    const user = toUser(profile, session.user.email);

    // Cegah akun pengguna umum masuk lewat tab psikolog, dan sebaliknya.
    if (profile.role !== 'ADMIN' && role && ROLE_TO_API[role] !== profile.role) {
      throw new Error(
        profile.role === 'PSYCHOLOGIST'
          ? 'Akun ini terdaftar sebagai Psikolog. Pilih tab "Psikolog / Konselor" untuk masuk.'
          : 'Akun ini terdaftar sebagai Pengguna Umum. Pilih tab "Pengguna Umum" untuk masuk.'
      );
    }

    sessionStore.set(
      { access_token: session.access_token, refresh_token: session.refresh_token, user },
      rememberMe
    );
    return user;
  } catch (err) {
    throw translateError(err);
  }
};

/**
 * Hasil: user (langsung masuk), atau { needsEmailConfirmation: true, email }
 * bila Supabase mewajibkan konfirmasi email terlebih dahulu.
 */
export const registerService = async ({ name, email, password, role }) => {
  if (!name || !email || !password) {
    throw new Error('Lengkapi seluruh bidang pendaftaran yang diperlukan.');
  }

  try {
    const session = await apiRequest('/auth/register', {
      method: 'POST',
      auth: false,
      body: {
        email: email.trim(),
        password,
        nama_lengkap: name.trim(),
        username: generateUsername(email.trim()),
        role: ROLE_TO_API[role] || 'USER',
      },
    });

    if (session.needs_email_confirmation || !session.access_token) {
      return { needsEmailConfirmation: true, email: session.user.email };
    }

    const profile = await fetchProfile(session.access_token);
    const user = toUser(profile, session.user.email);
    sessionStore.set(
      { access_token: session.access_token, refresh_token: session.refresh_token, user },
      true
    );
    return user;
  } catch (err) {
    throw translateError(err);
  }
};

export const logoutService = async () => {
  const session = sessionStore.get();
  sessionStore.clear();
  if (!session?.access_token) return true;
  try {
    await apiRequest('/auth/logout', { method: 'POST', token: session.access_token });
  } catch {
    // Token mungkin sudah kedaluwarsa — sesi lokal tetap dihapus.
  }
  return true;
};

// User yang tersimpan dari sesi sebelumnya (tanpa request ke server).
export const getCachedUser = () => sessionStore.get()?.user || null;

// Validasi sesi tersimpan ke backend dan ambil profil terbaru. null bila tidak ada/invalid.
export const restoreSession = async () => {
  const session = sessionStore.get();
  if (!session?.access_token) return null;
  try {
    const profile = await apiRequest('/auth/me');
    const user = toUser(profile, session.user?.email);
    sessionStore.update({ user });
    return user;
  } catch (err) {
    // Hanya hapus sesi bila memang ditolak server, bukan karena backend sedang mati.
    if (err instanceof ApiError && err.status === 401) {
      sessionStore.clear();
      return null;
    }
    return session.user || null;
  }
};

/**
  * Memperbarui informasi profil pengguna (nama, foto profil, dll)
  * di backend dan memperbarui sesi lokal sessionStore.
  */
export const updateProfileService = async (updateData) => {
  const session = sessionStore.get();
  const currentUser = getCachedUser() || {};

  // Persiapkan user object lokal
  const updatedUserLocally = {
    ...currentUser,
    ...(updateData.name !== undefined && { name: updateData.name }),
    ...(updateData.avatar !== undefined && { avatar: updateData.avatar || undefined }),
    ...(updateData.city !== undefined && { city: updateData.city }),
  };

  if (!session?.access_token) {
    sessionStore.update({ user: updatedUserLocally });
    return updatedUserLocally;
  }

  try {
    const payload = {};
    if (updateData.name !== undefined) payload.nama_lengkap = updateData.name;
    if (updateData.avatar !== undefined) payload.foto_profil = updateData.avatar || null;
    if (updateData.city !== undefined) payload.kota = updateData.city;

    const profile = await apiRequest('/profiles/me', {
      method: 'PATCH',
      token: session.access_token,
      body: payload,
    });

    const updatedUser = toUser(profile, session.user?.email || currentUser.email);
    if (updateData.avatar !== undefined) {
      updatedUser.avatar = updateData.avatar || undefined;
    }
    sessionStore.update({ user: updatedUser });
    return updatedUser;
  } catch (err) {
    console.warn('Backend updateProfile skipped or offline, updating locally:', err);
    sessionStore.update({ user: updatedUserLocally });
    return updatedUserLocally;
  }
};

