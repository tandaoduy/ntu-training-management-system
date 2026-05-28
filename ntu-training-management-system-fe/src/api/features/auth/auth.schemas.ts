// Khai báo hằng số và utility dùng riêng cho module auth.
import type { AuthUser } from './auth.types';

const AUTH_TOKEN_KEY = 'ntums_auth_token';
const AUTH_USER_KEY = 'ntums_auth_user';
const AUTH_SESSION_RENEWED_AT_KEY = 'ntums_auth_session_renewed_at';
const AUTH_LAST_ACTIVITY_AT_KEY = 'ntums_auth_last_activity_at';
export const AUTH_SESSION_CHANGED_EVENT = 'ntums-auth-session-changed';

function notifySessionChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
  }
}

// Lớp lưu token phía client (localStorage).
export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    this.markSessionRenewed();
    this.markActivity();
    notifySessionChanged();
  },

  clearToken(): void {
    const hadSession = Boolean(localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_USER_KEY));

    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_SESSION_RENEWED_AT_KEY);
    localStorage.removeItem(AUTH_LAST_ACTIVITY_AT_KEY);

    if (hadSession) {
      notifySessionChanged();
    }
  },

  getUser(): AuthUser | null {
    try {
      const value = localStorage.getItem(AUTH_USER_KEY);
      return value ? JSON.parse(value) as AuthUser : null;
    } catch {
      return null;
    }
  },

  setUser(user: AuthUser): void {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    notifySessionChanged();
  },

  getSessionRenewedAt(): number | null {
    const value = Number(localStorage.getItem(AUTH_SESSION_RENEWED_AT_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  },

  markSessionRenewed(): void {
    localStorage.setItem(AUTH_SESSION_RENEWED_AT_KEY, String(Date.now()));
  },

  getLastActivityAt(): number | null {
    const value = Number(localStorage.getItem(AUTH_LAST_ACTIVITY_AT_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  },

  markActivity(): void {
    localStorage.setItem(AUTH_LAST_ACTIVITY_AT_KEY, String(Date.now()));
  },
};
