// Khai báo hằng số và utility dùng riêng cho module auth.
const AUTH_TOKEN_KEY = 'ntums_auth_token';

// Lớp lưu token phía client (localStorage).
export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },
};
