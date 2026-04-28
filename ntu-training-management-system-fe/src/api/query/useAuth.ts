import { useCallback, useState } from 'react';
import { authMutations } from '../features/auth';
import type {
  AuthUser,
  ChangePasswordRequest,
  CurrentUserResponse,
  LoginRequest,
  MessageResponse,
} from '../features/auth';
import { authStorage } from '../features/auth';
import type { ApiError } from '../core/apiError';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: ApiError | null;
}

// Chuẩn hóa dữ liệu /auth/me về cùng format AuthUser của frontend.
const mapCurrentUser = (input: CurrentUserResponse): AuthUser | null => {
  if (input.id === null || input.username === null) {
    return null;
  }

  return {
    id: input.id,
    username: input.username,
    display_name: input.display_name ?? null,
    role: input.role,
  };
};

// Hook auth quản lý toàn bộ state đăng nhập cho UI.
export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: false,
    error: null,
  });

  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  const setError = (error: ApiError | null) => {
    setState((prev) => ({ ...prev, error }));
  };

  const login = useCallback(async (payload: LoginRequest): Promise<AuthUser | null> => {
    // Bật loading và xóa lỗi trước khi gửi request.
    setLoading(true);
    setError(null);

    try {
      const response = await authMutations.login(payload);
      setState({
        user: response.user,
        loading: false,
        error: null,
      });
      return response.user;
    } catch (error) {
      const apiError = error as ApiError;
      setState((prev) => ({ ...prev, loading: false, error: apiError }));
      return null;
    }
  }, []);

  const me = useCallback(async (): Promise<AuthUser | null> => {
    const token = authStorage.getToken();

    // Không gọi /auth/me nếu chưa có token để tránh 401 không cần thiết.
    if (!token) {
      setState((prev) => ({ ...prev, user: null, loading: false, error: null }));
      return null;
    }

    // Dùng để phục hồi thông tin user từ token hiện tại.
    setLoading(true);
    setError(null);

    try {
      const response = await authMutations.me();
      const user = mapCurrentUser(response);
      setState({ user, loading: false, error: null });
      return user;
    } catch (error) {
      const apiError = error as ApiError;
      setState((prev) => ({ ...prev, loading: false, error: apiError }));
      return null;
    }
  }, []);

  const changePassword = useCallback(
    async (payload: ChangePasswordRequest): Promise<MessageResponse | null> => {
      // Đổi mật khẩu yêu cầu token hợp lệ (auth:sanctum).
      setLoading(true);
      setError(null);

      try {
        const response = await authMutations.changePassword(payload);
        setLoading(false);
        return response;
      } catch (error) {
        const apiError = error as ApiError;
        setState((prev) => ({ ...prev, loading: false, error: apiError }));
        return null;
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<MessageResponse | null> => {
    // Nếu logout lỗi vẫn xóa local session để tránh treo trạng thái.
    setLoading(true);
    setError(null);

    try {
      const response = await authMutations.logout();
      setState({ user: null, loading: false, error: null });
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      authMutations.clearSession();
      setState({ user: null, loading: false, error: apiError });
      return null;
    }
  }, []);

  return {
    ...state,
    login,
    me,
    changePassword,
    logout,
  };
};
