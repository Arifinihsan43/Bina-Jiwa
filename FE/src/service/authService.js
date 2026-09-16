/**
 * Authentication Service
 * Handles user login, registration, and logout operations.
 * Prepared for seamless integration with real backend REST/GraphQL APIs.
 */

export const loginService = async ({ email, password, role }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!email || !password) {
        reject(new Error('Email dan kata sandi wajib diisi.'));
        return;
      }
      resolve({
        id: 'usr_' + Date.now(),
        email,
        name: email.split('@')[0],
        role: role || 'user',
        token: 'mock-jwt-token-' + Date.now(),
      });
    }, 800);
  });
};

export const registerService = async ({ name, email, phone, password, role }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!name || !email || !password) {
        reject(new Error('Lengkapi seluruh bidang pendaftaran yang diperlukan.'));
        return;
      }
      resolve({
        id: 'usr_' + Date.now(),
        name,
        email,
        phone,
        role: role || 'user',
        token: 'mock-jwt-token-' + Date.now(),
      });
    }, 1000);
  });
};

export const logoutService = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 300);
  });
};
