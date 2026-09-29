/**
 * API Client
 * Wrapper fetch untuk memanggil backend BinaJiwa (FastAPI).
 * Menyimpan sesi (access & refresh token), menyisipkan header Authorization,
 * dan memperbarui token otomatis saat access token kedaluwarsa.
 */

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const SESSION_KEY = 'binajiwa_session';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Sesi disimpan di localStorage ("Ingat saya") atau sessionStorage (hilang saat tab ditutup).
export const sessionStore = {
  get() {
    try {
      const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(session, remember = true) {
    try {
      this.clear();
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(SESSION_KEY, JSON.stringify({ ...session, remember }));
    } catch {
      // Storage tidak tersedia (mis. mode privat) — sesi hanya bertahan di memori.
    }
  },

  update(patch) {
    const current = this.get();
    if (current) this.set({ ...current, ...patch }, current.remember);
  },

  clear() {
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // abaikan
    }
  },
};

// FastAPI mengembalikan `detail` berupa string, atau array error validasi (422).
function extractErrorMessage(data, status) {
  const detail = data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d) => d.msg).join(', ');
  }
  return `Permintaan gagal (${status}).`;
}

async function rawRequest(path, { method = 'GET', body, token, headers: extraHeaders } = {}) {
  const headers = { Accept: 'application/json', ...extraHeaders };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.', 0);
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(extractErrorMessage(data, response.status), response.status);
  }
  return data;
}

let refreshPromise = null;

// Satu refresh untuk banyak request paralel yang sama-sama kena 401.
function refreshAccessToken(refreshToken) {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/auth/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    })
      .then((session) => {
        sessionStore.update({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        return session.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Panggil endpoint backend.
 * @param {string} path - contoh: '/auth/me'
 * @param {object} options - { method, body, auth (default true), token (override), headers }
 */
export async function apiRequest(path, { method = 'GET', body, auth = true, token, headers } = {}) {
  const session = auth ? sessionStore.get() : null;
  const accessToken = token || session?.access_token;

  try {
    return await rawRequest(path, { method, body, headers, token: auth ? accessToken : undefined });
  } catch (err) {
    const canRefresh = auth && !token && err.status === 401 && session?.refresh_token;
    if (!canRefresh) throw err;

    let newToken;
    try {
      newToken = await refreshAccessToken(session.refresh_token);
    } catch {
      sessionStore.clear();
      throw new ApiError('Sesi Anda telah berakhir. Silakan masuk kembali.', 401);
    }
    return rawRequest(path, { method, body, headers, token: newToken });
  }
}
