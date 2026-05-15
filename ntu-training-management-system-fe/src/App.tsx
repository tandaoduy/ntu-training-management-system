import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'

import AuthPage from './app/pages/auth/AuthPage'
import AdminLayout from './app/layout/admin/AdminLayout.tsx'
import AdminAccountPage from './app/pages/admin/account/AdminAccountPage.tsx'
import AdminClassPage from './app/pages/admin/classes/AdminClassPage.tsx'
import AdminDashboardPage from './app/pages/admin/dashboard/AdminDashboardPage.tsx'
import AdminCurriculumPage from './app/pages/admin/curriculum/AdminCurriculumPage.tsx'
import AdminConfigurationPage from './app/pages/admin/configuration/AdminConfigurationPage.tsx'
import AdminStudyPlanPage from './app/pages/admin/study-plan/AdminStudyPlanPage.tsx'
import LecturerDashboardPage from './app/pages/lecturer/dashboard/LecturerDashboardPage.tsx'
import LecturerStudyPlanPage from './app/pages/lecturer/study-plan/LecturerStudyPlanPage.tsx'
import ManagerDashboardPage from './app/pages/manager/dashboard/ManagerDashboardPage.tsx'
import ManagerCurriculumPage from './app/pages/manager/curriculum/ManagerCurriculumPage.tsx'
import DashboardStudentPage from './app/pages/student/dashboard/StudentDashboardPage'
import StudentStudyPlanPage from './app/pages/student/study-plan/StudentStudyPlanPage.tsx'
import ForgotPasswordPage from './app/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './app/pages/auth/ResetPasswordPage'
import ComponentPreviewPage from './app/pages/test/ComponentPreviewPage'
import ComponentTestPage from './app/pages/test/ComponentTestPage'
import TrainingOfficerDashboardPage from './app/pages/training-officer/dashboard/TrainingOfficerDashboardPage.tsx'
import TrainingOfficerCurriculumPage from './app/pages/training-officer/curriculum/TrainingOfficerCurriculumPage.tsx'
import TrainingOfficerStudyPlanStatisticsPage from './app/pages/training-officer/study-plan-statistics/TrainingOfficerStudyPlanStatisticsPage.tsx'
import TrainingOfficerStudyPlanCourseRegistrationsPage from './app/pages/training-officer/study-plan-statistics/TrainingOfficerStudyPlanCourseRegistrationsPage.tsx'
import { AlertProvider } from '@/components/alert'
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
          path="/sinhvien/studyplan"
          element={
            isAuthenticated && user?.role === 'student' ? (
              <StudentStudyPlanPage />
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
          path="/canbo/studyplan"
          element={
            isAuthenticated && user?.role === 'lecturer' ? (
              <LecturerStudyPlanPage />
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
          path="/quanly/curriculum"
          element={
            isAuthenticated && user?.role === 'manager' ? (
              <ManagerCurriculumPage />
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
          path="/chuyenvien/curriculum"
          element={
            isAuthenticated && user?.role === 'training_officer' ? (
              <TrainingOfficerCurriculumPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/study-plan-statistics"
          element={
            isAuthenticated && user?.role === 'training_officer' ? (
              <TrainingOfficerStudyPlanStatisticsPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/study-plan-statistics/:courseId"
          element={
            isAuthenticated && user?.role === 'training_officer' ? (
              <TrainingOfficerStudyPlanCourseRegistrationsPage />
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
          <Route path="taikhoan" element={<AdminAccountPage />} />
          <Route path="lophoc" element={<AdminClassPage />} />
          <Route path="cauhinh" element={<AdminConfigurationPage />} />
          <Route path="curriculum" element={<AdminCurriculumPage />} />
          <Route path="studyplan" element={<AdminStudyPlanPage />} />
          <Route path="taikhoan" element={<AdminAccountPage />} />
          <Route path="lop" element={<AdminClassPage />} />
        </Route>
        <Route
          path="/component-test"
          element={isAuthenticated ? <ComponentTestPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/component-test/:componentId"
          element={isAuthenticated ? <ComponentPreviewPage /> : <Navigate to="/login" replace />}
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
