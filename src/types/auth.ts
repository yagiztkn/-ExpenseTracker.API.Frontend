// ──────────────────────────────────────────────────────────────────────────
// Auth DTOs — mirror the ASP.NET Core API contract exactly (Swagger v1.0)
// ──────────────────────────────────────────────────────────────────────────

/** POST /api/Auth/register */
export interface UserRegisterDto {
  /** 3–50 characters */
  username: string;
  /** Valid email format, required */
  email: string;
  /** 6–100 characters, required */
  password: string;
}

/** POST /api/Auth/login */
export interface UserLoginDto {
  /** Required, email format */
  Email: string;
  /** Required */
  Password: string;
}

/** POST /api/Auth/refresh-token | /api/Auth/revoke-token */
export interface RefreshTokenDto {
  refreshToken: string | null;
}

/** POST /api/Auth/set-budget */
export interface SetBudgetDto {
  budget: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Response shapes (inferred — Swagger returns 200 OK with no explicit body)
// Assumes standard JWT auth envelope from ASP.NET Core Identity patterns
// ──────────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  /** ASP.NET Core commonly returns 'token' */
  token?: string;
  /** Alternative casing some backends use */
  accessToken?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  access_token?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

/** Generic API error envelope */
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
