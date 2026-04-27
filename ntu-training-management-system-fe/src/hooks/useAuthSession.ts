import { useEffect, useMemo, useState } from 'react';
import { authMutations, authStorage, type AuthUser, type CurrentUserResponse } from '../api/features/auth';

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
    display_name: input.display_name ?? null,
    role: input.role,
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

export const useAuthSession = (routeKey: string): UseAuthSessionResult => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const token = authStorage.getToken();
  const hasToken = Boolean(token);
  const effectiveUser = userToken === token ? user : null;

  useEffect(() => {
    if (!token || effectiveUser !== null) {
      return;
    }

    let isMounted = true;
    const requestToken = token;

    const bootstrapSession = async () => {
      try {
        const response = await authMutations.me();

        if (!isMounted) {
          return;
        }

        const mappedUser = mapCurrentUser(response);

        if (!mappedUser) {
          authMutations.clearSession();
          setUser(null);
          setUserToken(null);
          return;
        }

        setUser(mappedUser);
        setUserToken(requestToken);
      } catch {
        if (!isMounted) {
          return;
        }

        authMutations.clearSession();
        setUser(null);
        setUserToken(null);
      }
    };

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [effectiveUser, routeKey, token]);

  const isAuthenticated = hasToken && effectiveUser !== null;
  const isCheckingAuth = hasToken && effectiveUser === null;
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
