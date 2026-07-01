import type {
  UserLoginDto,
  UserRegisterDto,
  RefreshTokenDto,
  SetBudgetDto,
  AuthResponse,
} from '@/types/auth';
import api, { TOKEN_KEY, REFRESH_TOKEN_KEY } from './api';

export const authService = {
  // ── Endpoints ─────────────────────────────────────────────────────────

  /** POST /api/Auth/login */
  login: (data: UserLoginDto) =>
    api.post<AuthResponse>('/api/Auth/login', data),

  /** POST /api/Auth/register */
  register: (data: UserRegisterDto) =>
    api.post<AuthResponse>('/api/Auth/register', data),

  /** POST /api/Auth/refresh-token */
  refreshToken: (data: RefreshTokenDto) =>
    api.post<AuthResponse>('/api/Auth/refresh-token', data),

  /** POST /api/Auth/revoke-token */
  revokeToken: (data: RefreshTokenDto) =>
    api.post<void>('/api/Auth/revoke-token', data),

  /** POST /api/Auth/set-budget */
  setBudget: (data: SetBudgetDto) =>
    api.post<void>('/api/Auth/set-budget', data),

  // ── Token helpers ──────────────────────────────────────────────────────

  saveTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated: (): boolean =>
    Boolean(localStorage.getItem(TOKEN_KEY)),
};
