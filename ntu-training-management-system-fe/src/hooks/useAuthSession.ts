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
    educationSystem: input.education_system ?? null,
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [token, setToken] = useState(() => authStorage.getToken());
  const hasToken = Boolean(token);
  const effectiveUser = userToken === token ? user : null;

  useEffect(() => {
    const handleSessionChanged = () => {
      const nextToken = authStorage.getToken();
      setToken(nextToken);

      if (!nextToken) {
        setUser(null);
        setUserToken(null);
      }
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);

    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);
    };
  }, []);

  useEffect(() => {
    if (!token || effectiveUser !== null) {
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
          return;
        }

        setUser(mappedUser);
        authStorage.setUser(mappedUser);
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
