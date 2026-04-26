import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'

import AuthPage from './app/pages/auth/AuthPage'
import AdminLayout from './app/layout/admin/AdminLayout.tsx'
import AdminDashboardPage from './app/pages/admin/dashboard/AdminDashboardPage.tsx'
import AdminConfigurationPage from './app/pages/admin/configuration/AdminConfigurationPage.tsx'
import LecturerDashboardPage from './app/pages/lecturer/dashboard/LecturerDashboardPage.tsx'
import ManagerDashboardPage from './app/pages/manager/dashboard/ManagerDashboardPage.tsx'
import DashboardStudentPage from './app/pages/student/dashboard/StudentDashboardPage'
import ForgotPasswordPage from './app/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './app/pages/auth/ResetPasswordPage'
import AlertTestPage from './app/pages/test/AlertTestPage'
import ComponentTestPage from './app/pages/test/ComponentTestPage'
import SubnavTestPage from './app/pages/test/SubnavTestPage'
import TrainingOfficerDashboardPage from './app/pages/training-officer/dashboard/TrainingOfficerDashboardPage.tsx'
import { AlertProvider } from './components/alert'
import { useAuthSession } from './hooks'

function AppShell() {
  const location = useLocation()
  const { user, isAuthenticated, isCheckingAuth, redirectForAuthenticatedUser } = useAuthSession(
    location.pathname,
  )

  const isAuthRoute = location.pathname.startsWith('/login')
  const isTestRoute = location.pathname.startsWith('/component-test')

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
          element={<Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to={redirectForAuthenticatedUser} replace /> : <AuthPage />}
        />
        <Route
          path="/login/forgot-password"
          element={isAuthenticated ? <Navigate to={redirectForAuthenticatedUser} replace /> : <ForgotPasswordPage />}
        />
        <Route
          path="/login/reset-password"
          element={isAuthenticated ? <Navigate to={redirectForAuthenticatedUser} replace /> : <ResetPasswordPage />}
        />
        <Route
          path="/sinhvien"
          element={
            isAuthenticated && user?.role === 'student' ? (
              <DashboardStudentPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/canbo"
          element={
            isAuthenticated && user?.role === 'lecturer' ? (
              <LecturerDashboardPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/quanly"
          element={
            isAuthenticated && user?.role === 'manager' ? (
              <ManagerDashboardPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien"
          element={
            isAuthenticated && user?.role === 'training_officer' ? (
              <TrainingOfficerDashboardPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/quantri"
          element={
            isAuthenticated && user?.role === 'admin' ? (
              <AdminLayout />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="cauhinh" element={<AdminConfigurationPage />} />
        </Route>
        <Route
          path="/component-test"
          element={isAuthenticated ? <ComponentTestPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/component-test/alert"
          element={isAuthenticated ? <AlertTestPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/component-test/subnav"
          element={isAuthenticated ? <SubnavTestPage /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
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