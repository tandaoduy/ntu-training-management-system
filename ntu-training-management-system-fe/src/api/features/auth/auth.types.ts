export interface AuthUser {
  id: number;
  username: string;
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
