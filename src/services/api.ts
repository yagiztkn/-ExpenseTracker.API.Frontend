import axios from 'axios';

// ── Constants ────────────────────────────────────────────────────────────
const BASE_URL = 'https://localhost:7132';
export const TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// ── Axios Instance ────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT Bearer token ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle global 401 Unauthorized ────────────────
// Skip redirect for auth/profile endpoints to let the caller handle the error.
const SKIP_REDIRECT_URLS = ['/api/auth/update-profile', '/api/auth/login', '/api/auth/register'];

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? '';
      const isSkipped = SKIP_REDIRECT_URLS.some((u) => requestUrl.includes(u));
      const alreadyOnLogin = window.location.pathname === '/login';

      if (!isSkipped && !alreadyOnLogin) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
