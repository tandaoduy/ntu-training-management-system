import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'

import AuthPage from './app/pages/auth/AuthPage'
import DashboardStudentPage from './app/pages/student/dashboard/StudentDashboardPage'
import ForgotPasswordPage from './app/pages/auth/ForgotPasswordPage'
import AlertTestPage from './app/pages/test/AlertTestPage'
import ComponentTestPage from './app/pages/test/ComponentTestPage'
import SubnavTestPage from './app/pages/test/SubnavTestPage'
import { AlertProvider } from './components/alert'
import { authMutations, authStorage, type AuthUser, type CurrentUserResponse } from './api'

const mapCurrentUser = (input: CurrentUserResponse): AuthUser | null => {
  if (input.id === null || input.username === null) {
    return null
  }

  return {
    id: input.id,
    username: input.username,
    role: input.role,
  }
}

const resolveDashboardPath = (role: string | null | undefined): string => {
  if (role === 'student') {
    return '/dashboard-student'
  }

  return '/component-test'
}

function AppShell() {
  const location = useLocation()
  const [user, setUser] = useState<AuthUser | null>(null)
  const hasToken = Boolean(authStorage.getToken())

  useEffect(() => {
    if (!hasToken || user !== null) {
      return
    }

    let isMounted = true

    const bootstrapSession = async () => {
      try {
        const response = await authMutations.me()

        if (!isMounted) {
          return
        }

        const mappedUser = mapCurrentUser(response)

        if (!mappedUser) {
          authMutations.clearSession()
          setUser(null)
          return
        }

        setUser(mappedUser)
      } catch {
        if (!isMounted) {
          return
        }

        authMutations.clearSession()
        setUser(null)
      }
    }

    void bootstrapSession()

    return () => {
      isMounted = false
    }
  }, [hasToken, location.pathname, user])

  const isAuthRoute = location.pathname.startsWith('/auth')
  const isTestRoute = location.pathname.startsWith('/component-test')
  const isAuthenticated = hasToken && user !== null
  const isCheckingAuth = hasToken && user === null
  const redirectForAuthenticatedUser = useMemo(() => resolveDashboardPath(user?.role), [user?.role])

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm font-medium text-slate-600">Dang kiem tra phien dang nhap...</p>
      </main>
    )
  }

  return (
    <>
      {!isAuthRoute && isTestRoute && (
        <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex w-full max-w-4xl gap-2 px-4 py-3">
            <NavLink
              to="/component-test"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`
              }
            >
              Component Test
            </NavLink>
          </nav>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/auth'} replace />}
        />
        <Route
          path="/auth"
          element={isAuthenticated ? <Navigate to={redirectForAuthenticatedUser} replace /> : <AuthPage />}
        />
        <Route
          path="/auth/forgot-password"
          element={isAuthenticated ? <Navigate to={redirectForAuthenticatedUser} replace /> : <ForgotPasswordPage />}
        />
        <Route
          path="/dashboard-student"
          element={
            isAuthenticated && user.role === 'student' ? (
              <DashboardStudentPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/auth'} replace />
            )
          }
        />
        <Route
          path="/component-test"
          element={isAuthenticated ? <ComponentTestPage /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/component-test/alert"
          element={isAuthenticated ? <AlertTestPage /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/component-test/subnav"
          element={isAuthenticated ? <SubnavTestPage /> : <Navigate to="/auth" replace />}
        />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AlertProvider>
        <AppShell />
      </AlertProvider>
    </BrowserRouter>
  )
}

export default App