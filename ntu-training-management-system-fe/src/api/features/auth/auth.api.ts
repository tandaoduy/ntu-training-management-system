import { apiGet, apiPost } from '../../core/request';
import type {
  CheckEmailRequest,
  CheckEmailResponse,
  ChangePasswordRequest,
  CurrentUserResponse,
  ForgotPasswordCaptchaResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ResetTokenVerifyRequest,
  ResetTokenVerifyResponse,
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

  logout(token?: string | null): Promise<MessageResponse> {
    return apiPost<MessageResponse>(`${AUTH_BASE_PATH}/logout`, undefined, token ? {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    } : undefined);
  },

  forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    return apiPost<ForgotPasswordResponse, ForgotPasswordRequest>(`${AUTH_BASE_PATH}/forgot-password`, payload, { skipAuth: true });
  },

  checkEmail(payload: CheckEmailRequest): Promise<CheckEmailResponse> {
    return apiPost<CheckEmailResponse, CheckEmailRequest>(`${AUTH_BASE_PATH}/check-email`, payload, { skipAuth: true });
  },

  forgotPasswordCaptcha(): Promise<ForgotPasswordCaptchaResponse> {
    return apiGet<ForgotPasswordCaptchaResponse>(`${AUTH_BASE_PATH}/forgot-password/captcha`, { skipAuth: true });
  },

  verifyResetToken(payload: ResetTokenVerifyRequest): Promise<ResetTokenVerifyResponse> {
    return apiPost<ResetTokenVerifyResponse, ResetTokenVerifyRequest>(`${AUTH_BASE_PATH}/verify-reset-token`, payload, { skipAuth: true });
  },

  resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    return apiPost<ResetPasswordResponse, ResetPasswordRequest>(`${AUTH_BASE_PATH}/reset-password`, payload, { skipAuth: true });
  },
};
