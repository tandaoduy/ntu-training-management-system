import axios from 'axios';
import { API_TIMEOUT_MS, API_URL } from './env';
import { authStorage } from '../features/auth/auth.schemas';

/**
 * Mở rộng AxiosRequestConfig để hỗ trợ cờ skipAuth.
 * - skipAuth=true: bỏ qua bước tự gắn Authorization header.
 * - Dùng cho các API public như login/test endpoint.
 */
declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean;
    authToken?: string;
  }
}

/**
 * Axios instance dùng chung cho toàn bộ ứng dụng.
 * Cấu hình chính:
 * - baseURL: trỏ về BE API (ví dụ http://localhost:8000/api)
 * - timeout: lấy từ env để dễ điều chỉnh theo môi trường
 * - headers mặc định: JSON request/response
 */
export const httpClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor:
 * - Nếu skipAuth=true thì không gắn token.
 * - Nếu có token trong localStorage thì tự thêm Bearer token.
 */
httpClient.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config;
  }

  if (config.headers.Authorization) {
    const explicitToken = String(config.headers.Authorization).replace(/^Bearer\s+/i, '');
    config.authToken = explicitToken || undefined;

    return config;
  }

  const token = authStorage.getToken();

  if (!token) {
    return Promise.reject(new axios.CanceledError('Missing auth token'));
  }

  config.headers.Authorization = `Bearer ${token}`;
  config.authToken = token;

  return config;
});

/**
 * Response interceptor:
 * - Nếu gặp 401 (Unauthenticated) thì xóa token local.
 * - Trả lỗi gốc về cho lớp xử lý lỗi chung ở core/request.
 */
httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const url = error.config?.url ?? '';
      const requestToken = error.config?.authToken;
      const currentToken = authStorage.getToken();

      if (
        (status === 401 || (status === 403 && url.startsWith('/student/'))) &&
        (!requestToken || requestToken === currentToken)
      ) {
        authStorage.clearToken();
      }
    }

    return Promise.reject(error);
  },
);
