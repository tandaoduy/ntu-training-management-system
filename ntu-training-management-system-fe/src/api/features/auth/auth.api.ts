import { apiGet, apiPost } from '../../core/request';
import type {
  ChangePasswordRequest,
  CurrentUserResponse,
  LoginRequest,
  LoginResponse,
  MessageResponse,
} from './auth.types';

const AUTH_BASE_PATH = '/auth';

// Nhóm hàm gọi API auth trực tiếp tới backend.
export const authApi = {
  login(payload: LoginRequest): Promise<LoginResponse> {
    return apiPost<LoginResponse, LoginRequest>(`${AUTH_BASE_PATH}/login`, payload, { skipAuth: true });
  },

  me(): Promise<CurrentUserResponse> {
    return apiGet<CurrentUserResponse>(`${AUTH_BASE_PATH}/me`);
  },

  changePassword(payload: ChangePasswordRequest): Promise<MessageResponse> {
    return apiPost<MessageResponse, ChangePasswordRequest>(`${AUTH_BASE_PATH}/change-password`, payload);
  },

  logout(): Promise<MessageResponse> {
    return apiPost<MessageResponse>(`${AUTH_BASE_PATH}/logout`);
  },
};
