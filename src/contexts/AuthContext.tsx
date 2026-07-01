import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { authService } from '@/services/authService';
import type { AuthResponse } from '@/types/auth';

// ── Constants ─────────────────────────────────────────────────────────────
export const BUDGET_KEY = 'monthly_budget';

// ── Helpers: decode JWT payload without a library ─────────────────────────
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export interface UserInfo {
  username?: string;
  email?: string;
  id?: string;
}

function getUserInfoFromToken(): UserInfo | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload) return null;

  // ASP.NET Core / Identity standard claim names
  return {
    username:
      (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string) ??
      (payload['unique_name'] as string) ??
      (payload['sub'] as string) ??
      undefined,
    email:
      (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] as string) ??
      (payload['email'] as string) ??
      undefined,
    id:
      (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string) ??
      (payload['nameid'] as string) ??
      undefined,
  };
}

// ── Shape ────────────────────────────────────────────────────────────────
interface AuthContextValue {
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
  // ⚠️  NOTE: userInfo is decoded from the JWT on mount. If your backend issues
  // a new JWT after a profile update, call login() with the new token response.
  // If it does NOT reissue a token, call updateUserInfo() to manually patch
  // the in-memory context so the UI reflects the change without a page refresh.
  /** Patch specific fields of userInfo in-memory (no token re-decode). */
  updateUserInfo: (patch: Partial<UserInfo>) => void;
  /** Monthly budget in TRY — null means not set */
  monthlyBudget: number | null;
  /** Persist budget to localStorage and update context */
  setMonthlyBudget: (amount: number | null) => void;
  /** Call after a successful login response to persist tokens and update state */
  login: (response: AuthResponse) => void;
  /** Call on logout — clears tokens and resets state */
  logout: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    authService.isAuthenticated,
  );

  const [userInfo, setUserInfo] = useState<UserInfo | null>(
    getUserInfoFromToken,
  );

  const [monthlyBudget, setMonthlyBudgetState] = useState<number | null>(() => {
    const stored = localStorage.getItem(BUDGET_KEY);
    return stored ? Number(stored) : null;
  });

  const setMonthlyBudget = useCallback((amount: number | null) => {
    if (amount === null) {
      localStorage.removeItem(BUDGET_KEY);
    } else {
      localStorage.setItem(BUDGET_KEY, String(amount));
    }
    setMonthlyBudgetState(amount);
  }, []);

  const login = useCallback((response: AuthResponse) => {
    const accessToken =
      response.token ??
      response.accessToken ??
      response.access_token ??
      '';

    const refreshToken = response.refreshToken ?? '';

    if (!accessToken) {
      console.error('[AuthContext] Login response contained no recognisable token field:', response);
    }

    authService.saveTokens(accessToken, refreshToken);
    setIsAuthenticated(true);
    setUserInfo(getUserInfoFromToken());
  }, []);

  const updateUserInfo = useCallback((patch: Partial<UserInfo>) => {
    setUserInfo((prev) => (prev ? { ...prev, ...patch } : patch as UserInfo));
  }, []);

  const logout = useCallback(() => {
    authService.clearTokens();
    setIsAuthenticated(false);
    setUserInfo(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userInfo, updateUserInfo, monthlyBudget, setMonthlyBudget, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be called inside <AuthProvider>');
  }
  return ctx;
}
