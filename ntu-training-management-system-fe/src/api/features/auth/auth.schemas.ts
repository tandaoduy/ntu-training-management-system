// Khai báo hằng số và utility dùng riêng cho module auth.
import type { AuthUser } from './auth.types';

const AUTH_TOKEN_KEY = 'ntums_auth_token';
const AUTH_USER_KEY = 'ntums_auth_user';
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
    notifySessionChanged();
  },

  clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    notifySessionChanged();
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
};
