// Cấu hình mặc định khi chưa khai báo biến môi trường.
const DEFAULT_API_BASE_URL = 'http://localhost:8000';
const DEFAULT_API_TIMEOUT_MS = 15000;

// Chuẩn hóa URL để tránh lỗi ghép path bị dư dấu '/'.
const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

// Validate và chuẩn hóa base URL lấy từ Vite env.
const normalizeApiBaseUrl = (value: string | undefined): string => {
  const candidate = value?.trim();

  if (!candidate) {
    return DEFAULT_API_BASE_URL;
  }

  try {
    const url = new URL(candidate);
    return stripTrailingSlash(url.toString());
  } catch {
    throw new Error('Invalid VITE_API_BASE_URL. Example: http://localhost:8000');
  }
};

// Parse timeout từ env, yêu cầu là số nguyên dương.
const parseApiTimeoutMs = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_API_TIMEOUT_MS;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Invalid VITE_API_TIMEOUT_MS. Use a positive integer (milliseconds).');
  }

  return parsed;
};

// Biến cấu hình dùng xuyên suốt toàn bộ module API.
export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
export const API_TIMEOUT_MS = parseApiTimeoutMs(import.meta.env.VITE_API_TIMEOUT_MS);
export const APP_URL = import.meta.env.VITE_APP_URL?.trim() || window.location.origin;

export const API_PREFIX = '/api';
export const API_URL = `${API_BASE_URL}${API_PREFIX}`;

// Object env tổng hợp để import một lần cho các lớp khác.
export const env = {
  apiBaseUrl: API_BASE_URL,
  apiTimeoutMs: API_TIMEOUT_MS,
  appUrl: APP_URL,
} as const;
