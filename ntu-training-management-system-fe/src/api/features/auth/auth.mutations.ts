import { authApi } from './auth.api';
import { authStorage } from './auth.schemas';
import type {
  ChangePasswordRequest,
  CurrentUserResponse,
  LoginRequest,
  LoginResponse,
  MessageResponse,
} from './auth.types';

// Lớp nghiệp vụ auth: gọi API + quản lý vòng đời token.
export const authMutations = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await authApi.login(payload);
    authStorage.setToken(response.access_token);
    authStorage.setUser(response.user);
    return response;
  },

  me(): Promise<CurrentUserResponse> {
    return authApi.me();
  },

  changePassword(payload: ChangePasswordRequest): Promise<MessageResponse> {
    return authApi.changePassword(payload);
  },

  async logout(): Promise<MessageResponse> {
    const token = authStorage.getToken();
    authStorage.clearToken();

    try {
      return await authApi.logout(token);
    } catch {
      return { message: 'Logged out successfully' };
    }
  },

  clearSession(): void {
    authStorage.clearToken();
  },
};
