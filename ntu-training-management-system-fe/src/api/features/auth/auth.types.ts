export interface AuthUser {
  id: number;
  username: string;
  display_name?: string | null;
  role: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'Bearer' | string;
  user: AuthUser;
}

export interface CurrentUserResponse {
  id: number | null;
  username: string | null;
  display_name?: string | null;
  role: string | null;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface MessageResponse {
  message: string;
}

export interface ForgotPasswordRequest {
  identifier: string;
  captcha_id: string;
  captcha_code: string;
}

export interface CheckEmailRequest {
  email: string;
}

export interface CheckEmailResponse {
  message: string;
  exists: boolean;
  username?: string;
}

export interface ForgotPasswordResponse {
  message: string;
  email: string;
  reset_token?: string | null;
  reset_url?: string | null;
}

export interface ForgotPasswordCaptchaResponse {
  challenge_id: string;
  captcha_image: string;
  expires_in_seconds: number;
  captcha_code?: string | null;
}

export interface ResetTokenVerifyRequest {
  token: string;
  email: string;
}

export interface ResetTokenVerifyResponse {
  message: string;
  user_id: number;
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordResponse {
  message: string;
}
