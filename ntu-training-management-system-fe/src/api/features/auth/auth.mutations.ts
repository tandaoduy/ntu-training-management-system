import { authApi } from './auth.api';
import { authStorage } from './auth.schemas';
import type {
  AuthUser,
  ChangePasswordRequest,
  CurrentUserResponse,
  LoginRequest,
  LoginResponse,
  MessageResponse,
} from './auth.types';

// Lớp nghiệp vụ auth: gọi API + quản lý vòng đời token.
type RawAuthUser = Omit<AuthUser, 'advisor'> & {
  education_system?: string | null;
  don_vi_id?: number | null;
  ten_don_vi?: string | null;
  advisor?: (NonNullable<AuthUser['advisor']> & { has_advisor?: boolean }) | null;
};

const normalizeAuthUser = (user: RawAuthUser): AuthUser => ({
  ...user,
  educationSystem: user.educationSystem ?? user.education_system ?? null,
  donViId: user.donViId ?? user.don_vi_id ?? null,
  tenDonVi: user.tenDonVi ?? user.ten_don_vi ?? null,
  advisor: user.advisor
    ? {
        hasAdvisor: user.advisor.hasAdvisor ?? user.advisor.has_advisor ?? false,
        code: user.advisor.code ?? null,
        name: user.advisor.name ?? null,
        phone: user.advisor.phone ?? null,
        email: user.advisor.email ?? null,
        message: user.advisor.message ?? null,
      }
    : null,
});

export const authMutations = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await authApi.login(payload);
    const user = normalizeAuthUser(response.user);
    authStorage.setToken(response.access_token);
    authStorage.setUser(user);
    return { ...response, user };
  },

  me(): Promise<CurrentUserResponse> {
    return authApi.me();
  },

  changePassword(payload: ChangePasswordRequest): Promise<MessageResponse> {
    return authApi.changePassword(payload);
  },

  async extendSession(): Promise<MessageResponse> {
    const response = await authApi.extendSession();
    authStorage.setToken(response.access_token);
    return { message: response.message };
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
