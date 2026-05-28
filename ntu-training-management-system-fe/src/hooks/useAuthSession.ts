import { useEffect, useMemo, useState } from 'react';
import {
  AUTH_SESSION_CHANGED_EVENT,
  authMutations,
  authStorage,
  type AuthUser,
  type CurrentUserResponse,
} from '../api/features/auth';

interface UseAuthSessionResult {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  redirectForAuthenticatedUser: string;
}

const mapCurrentUser = (input: CurrentUserResponse): AuthUser | null => {
  if (input.id === null || input.username === null) {
    return null;
  }

  return {
    id: input.id,
    username: input.username,
    name: input.name ?? null,
    role: input.role,
    permissions: input.permissions ?? [],
    educationSystem: input.education_system ?? null,
    donViId: input.don_vi_id ?? null,
    tenDonVi: input.ten_don_vi ?? null,
    advisor: input.advisor
      ? {
          hasAdvisor: input.advisor.has_advisor ?? false,
          code: input.advisor.code ?? null,
          name: input.advisor.name ?? null,
          phone: input.advisor.phone ?? null,
          email: input.advisor.email ?? null,
          message: input.advisor.message ?? null,
        }
      : null,
  };
};

const resolveDashboardPath = (role: string | null | undefined): string => {
  switch (role) {
    case 'student':
      return '/sinhvien';
    case 'lecturer':
      return '/canbo';
    case 'manager':
      return '/quanly';
    case 'training_officer':
      return '/chuyenvien';
    case 'admin':
      return '/quantri';
    default:
      return '/component-test';
  }
};

let bootstrapRequest: {
  token: string;
  promise: Promise<CurrentUserResponse>;
} | null = null;

const getCurrentUserForToken = (token: string): Promise<CurrentUserResponse> => {
  if (bootstrapRequest?.token === token) {
    return bootstrapRequest.promise;
  }

  const promise = authMutations.me().finally(() => {
    if (bootstrapRequest?.token === token) {
      bootstrapRequest = null;
    }
  });

  bootstrapRequest = { token, promise };

  return promise;
};

export const useAuthSession = (routeKey: string): UseAuthSessionResult => {
  const [token, setToken] = useState(() => authStorage.getToken());
  const [user, setUser] = useState<AuthUser | null>(() => (
    authStorage.getToken() ? authStorage.getUser() : null
  ));
  const [userToken, setUserToken] = useState<string | null>(() => (
    authStorage.getUser() && authStorage.getToken() ? authStorage.getToken() : null
  ));
  const [validatedToken, setValidatedToken] = useState<string | null>(null);
  const hasToken = Boolean(token);
  const effectiveUser = userToken === token ? user : null;

  useEffect(() => {
    const handleSessionChanged = () => {
      const nextToken = authStorage.getToken();
      setToken(nextToken);

      if (!nextToken) {
        setUser(null);
        setUserToken(null);
        setValidatedToken(null);
        return;
      }

      const cachedUser = authStorage.getUser();
      setUser(cachedUser);
      setUserToken(cachedUser ? nextToken : null);
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);
    };
  }, []);

  useEffect(() => {
    if (!token || validatedToken === token) {
      return;
    }

    let isMounted = true;
    const requestToken = token;

    const bootstrapSession = async () => {
      try {
        const response = await getCurrentUserForToken(requestToken);

        if (!isMounted || authStorage.getToken() !== requestToken) {
          return;
        }

        const mappedUser = mapCurrentUser(response);

        if (!mappedUser) {
          authMutations.clearSession();
          setUser(null);
          setUserToken(null);
          setValidatedToken(null);
          return;
        }

        setUser(mappedUser);
        authStorage.setUser(mappedUser);
        setUserToken(requestToken);
        setValidatedToken(requestToken);
      } catch {
        if (!isMounted) {
          return;
        }

        authMutations.clearSession();
        setUser(null);
        setUserToken(null);
        setValidatedToken(null);
      }
    };

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [routeKey, token, validatedToken]);

  const isAuthenticated = hasToken && effectiveUser !== null;
  const isCheckingAuth = false;
  const redirectForAuthenticatedUser = useMemo(
    () => resolveDashboardPath(effectiveUser?.role),
    [effectiveUser?.role],
  );

  return {
    user: effectiveUser,
    isAuthenticated,
    isCheckingAuth,
    redirectForAuthenticatedUser,
  };
};
