import { useCallback, useEffect, useRef, useState } from 'react';
import { authMutations, authStorage, AUTH_SESSION_CHANGED_EVENT } from '@/api/features/auth';
import { useModal } from '@/components/modal';

const SESSION_DURATION_MS = 15 * 60 * 1000;
const PROMPT_BEFORE_EXPIRY_MS = 60 * 1000;
const ACTIVE_ACTIVITY_WINDOW_MS = 60 * 1000;
const ACTIVITY_THROTTLE_MS = 5 * 1000;

const activityEvents = [
  'click',
  'keydown',
  'mousemove',
  'scroll',
  'touchstart',
] as const;

interface AuthSessionManagerProps {
  isAuthenticated: boolean;
}

export const AuthSessionManager = ({ isAuthenticated }: AuthSessionManagerProps) => {
  const modal = useModal();
  const [sessionPulse, setSessionPulse] = useState(0);
  const lastStoredActivityRef = useRef(0);
  const isModalOpenRef = useRef(false);
  const isRenewingRef = useRef(false);

  const logout = useCallback(async () => {
    isModalOpenRef.current = false;
    modal.close();
    await authMutations.logout();
  }, [modal]);

  const renewSession = useCallback(async () => {
    if (isRenewingRef.current || !authStorage.getToken()) {
      return;
    }

    isRenewingRef.current = true;

    try {
      await authMutations.extendSession();
      isModalOpenRef.current = false;
      modal.close();
      setSessionPulse((value) => value + 1);
    } catch {
      await logout();
    } finally {
      isRenewingRef.current = false;
    }
  }, [logout, modal]);

  const openExpiryModal = useCallback(() => {
    if (isModalOpenRef.current || !authStorage.getToken()) {
      return;
    }

    isModalOpenRef.current = true;

    modal.open({
      title: 'Phiên làm việc sắp hết hạn',
      content: (
        <p>
          Bạn đã không thao tác trong một thời gian. Chọn tiếp tục để gia hạn phiên đăng nhập,
          nếu không hệ thống sẽ đăng xuất khi hết 15 phút.
        </p>
      ),
      closeOnEscape: false,
      closeOnOverlayClick: false,
      dismissible: false,
      actions: [
        {
          label: 'Đăng xuất',
          variant: 'secondary',
          onClick: () => {
            void logout();
          },
        },
        {
          label: 'Tiếp tục phiên',
          variant: 'primary',
          autoClose: false,
          onClick: () => {
            void renewSession();
          },
        },
      ],
    });
  }, [logout, modal, renewSession]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const markActivity = () => {
      const now = Date.now();

      if (now - lastStoredActivityRef.current < ACTIVITY_THROTTLE_MS) {
        return;
      }

      lastStoredActivityRef.current = now;
      authStorage.markActivity();
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    const handleSessionChanged = () => {
      setSessionPulse((value) => value + 1);
    };

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);
    markActivity();

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !authStorage.getToken()) {
      isModalOpenRef.current = false;
      modal.close();
      return;
    }

    const renewedAt = authStorage.getSessionRenewedAt() ?? Date.now();
    const now = Date.now();
    const promptAt = renewedAt + SESSION_DURATION_MS - PROMPT_BEFORE_EXPIRY_MS;
    const expiresAt = renewedAt + SESSION_DURATION_MS;

    const promptTimer = window.setTimeout(() => {
      const lastActivityAt = authStorage.getLastActivityAt() ?? 0;
      const isRecentlyActive = Date.now() - lastActivityAt <= ACTIVE_ACTIVITY_WINDOW_MS;

      if (isRecentlyActive) {
        void renewSession();
        return;
      }

      openExpiryModal();
    }, Math.max(promptAt - now, 0));

    const expiryTimer = window.setTimeout(() => {
      void logout();
    }, Math.max(expiresAt - now, 0));

    return () => {
      window.clearTimeout(promptTimer);
      window.clearTimeout(expiryTimer);
    };
  }, [isAuthenticated, logout, modal, openExpiryModal, renewSession, sessionPulse]);

  return null;
};
