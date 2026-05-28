import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'

import AuthPage from './app/pages/auth/AuthPage'
import AdminLayout from './app/layout/admin/AdminLayout.tsx'
import RoleLayout from './app/layout/RoleLayout.tsx'
import AdminAccountPage from './app/pages/admin/account/AdminAccountPage.tsx'
import AdminClassPage from './app/pages/admin/classes/AdminClassPage.tsx'
import AdminDashboardPage from './app/pages/admin/dashboard/AdminDashboardPage.tsx'
import AdminCurriculumPage from './app/pages/admin/curriculum/AdminCurriculumPage.tsx'
import AdminConfigurationPage from './app/pages/admin/configuration/AdminConfigurationPage.tsx'
import AdminStudyPlanPage from './app/pages/admin/study-plan/AdminStudyPlanPage.tsx'
import AdminCourseRegistrationPage from './app/pages/admin/course-registration/AdminCourseRegistrationPage.tsx'
import AdminStudentInfoPage from './app/pages/admin/student-info/AdminStudentInfoPage.tsx'
import AdminRoomManagementPage from './app/pages/admin/rooms/AdminRoomManagementPage.tsx'
import AdminGradeInputPeriodPage from './app/pages/admin/grade-entry/AdminGradeInputPeriodPage.tsx'
import AdminPermissionPage from './app/pages/admin/permissions/AdminPermissionPage.tsx'
import AdminBackupPage from './app/pages/admin/backup/AdminBackupPage.tsx'
import LecturerDashboardPage from './app/pages/lecturer/dashboard/LecturerDashboardPage.tsx'
import LecturerStudyPlanPage from './app/pages/lecturer/study-plan/LecturerStudyPlanPage.tsx'
import LecturerGradeEntryPage from './app/pages/lecturer/grade-entry/LecturerGradeEntryPage.tsx'
import LecturerGradeEntryDetailPage from './app/pages/lecturer/grade-entry/LecturerGradeEntryDetailPage.tsx'
import LecturerTimetablePage from './app/pages/lecturer/timetable/LecturerTimetablePage.tsx'
import ManagerDashboardPage from './app/pages/manager/dashboard/ManagerDashboardPage.tsx'
import ManagerCurriculumPage from './app/pages/manager/curriculum/ManagerCurriculumPage.tsx'
import GradeViewPage from './app/pages/grades/GradeViewPage.tsx'
import DashboardStudentPage from './app/pages/student/dashboard/StudentDashboardPage'
import StudentProfilePage from './app/pages/student/profile/StudentProfilePage.tsx'
import StudentStudyPlanPage from './app/pages/student/study-plan/StudentStudyPlanPage.tsx'
import StudentCourseRegistrationPage from './app/pages/student/course-registration/StudentCourseRegistrationPage.tsx'
import StudentTimetablePage from './app/pages/student/timetable/StudentTimetablePage.tsx'
import StudentAcademicResultsPage from './app/pages/student/academic-results/StudentAcademicResultsPage.tsx'
import ForgotPasswordPage from './app/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './app/pages/auth/ResetPasswordPage'
import ComponentPreviewPage from './app/pages/test/ComponentPreviewPage'
import ComponentTestPage from './app/pages/test/ComponentTestPage'
import TrainingOfficerDashboardPage from './app/pages/training-officer/dashboard/TrainingOfficerDashboardPage.tsx'
import TrainingOfficerCurriculumPage from './app/pages/training-officer/curriculum/TrainingOfficerCurriculumPage.tsx'
import TrainingOfficerStudyPlanStatisticsPage from './app/pages/training-officer/study-plan-statistics/TrainingOfficerStudyPlanStatisticsPage.tsx'
import TrainingOfficerStudyPlanCourseRegistrationsPage from './app/pages/training-officer/study-plan-statistics/TrainingOfficerStudyPlanCourseRegistrationsPage.tsx'
import TrainingOfficerTimetablePage from './app/pages/training-officer/timetable/TrainingOfficerTimetablePage.tsx'
import TrainingOfficerCourseRegistrationPage from './app/pages/training-officer/course-registration/TrainingOfficerCourseRegistrationPage.tsx'
import TrainingOfficerCourseRegistrationDetailPage from './app/pages/training-officer/course-registration/TrainingOfficerCourseRegistrationDetailPage.tsx'
import { AlertProvider } from '@/components/alert'
import { ModalProvider } from '@/components/modal'
import { useAuthSession } from './hooks'
import { AuthSessionManager } from './app/auth/AuthSessionManager'

const routePermissions: Record<string, string> = {
  '/sinhvien': 'student.dashboard.view',
  '/student/profile': 'student.profile.view',
  '/sinhvien/studyplan': 'student.study-plan.view',
  '/sinhvien/thoikhoabieu': 'student.timetable.view',
  '/sinhvien/dangkyhocphan/dangky': 'student.course-registration.view',
  '/sinhvien/diem': 'student.grades.view',
  '/sinhvien/ketquahoctap': 'student.grades.view',
  '/canbo': 'lecturer.dashboard.view',
  '/canbo/studyplan': 'lecturer.curriculum.view',
  '/canbo/nhapdiem': 'lecturer.grade-entry.manage',
  '/canbo/nhapdiem/nhapdiemnhomhocphan': 'lecturer.grade-entry.manage',
  '/canbo/thoikhoabieu': 'lecturer.timetable.view',
  '/quanly': 'manager.dashboard.view',
  '/quanly/curriculum': 'manager.curriculum.view',
  '/quanly/thongtinsinhvien': 'manager.student-info.view',
  '/quanly/diem': 'manager.grades.view',
  '/quanly/diem/insinhvien': 'manager.grades.view',
  '/quanly/diem/inlophocphan': 'manager.grades.view',
  '/quanly/diem/phodiem': 'manager.grades.view',
  '/chuyenvien': 'training_officer.dashboard.view',
  '/chuyenvien/curriculum': 'training_officer.curriculum.view',
  '/chuyenvien/study-plan-statistics': 'training_officer.study-plan-statistics.view',
  '/chuyenvien/timetable': 'training_officer.timetable.manage',
  '/chuyenvien/registrations': 'training_officer.course-registration.manage',
  '/chuyenvien/diem': 'training_officer.grades.view',
  '/chuyenvien/diem/insinhvien': 'training_officer.grades.view',
  '/chuyenvien/diem/inlophocphan': 'training_officer.grades.view',
  '/chuyenvien/diem/phodiem': 'training_officer.grades.view',
  '/chuyenvien/diem/chinhsuadiem': 'training_officer.grades.edit',
  '/chuyenvien/thongtinsinhvien': 'training_officer.student-info.manage',
  '/chuyenvien/phonghoc': 'admin.room.manage',
  '/chuyenvien/lophoc': 'admin.class.manage',
}

function AppShell() {
  const location = useLocation()
  const { user, isAuthenticated, isCheckingAuth, redirectForAuthenticatedUser } = useAuthSession(
    location.pathname,
  )

  const isAuthRoute = location.pathname.startsWith('/login')
  const isTestRoute = location.pathname.startsWith('/component-test')
  const hasPermission = (permission: string) => Boolean(user?.permissions?.includes(permission))
  const canUse = (role: string, path: string) => (
    isAuthenticated
    && user?.role === role
    && hasPermission(routePermissions[path] ?? '')
  )
  const canUsePermission = (role: string, permission: string) => (
    isAuthenticated
    && user?.role === role
    && hasPermission(permission)
  )
  const adminPage = (permission: string, element: ReactNode) => (
    user?.role === 'admin' && hasPermission(permission)
      ? element
      : <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
  )

  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm font-medium text-slate-600">Dang kiem tra phien dang nhap...</p>
      </main>
    )
  }

  return (
    <>
      <AuthSessionManager isAuthenticated={isAuthenticated} />

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
            canUse('student', location.pathname) ? (
              <DashboardStudentPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/student/profile"
          element={
            canUse('student', location.pathname) ? (
              <StudentProfilePage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/sinhvien/studyplan"
          element={
            canUse('student', location.pathname) ? (
              <StudentStudyPlanPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/sinhvien/thoikhoabieu"
          element={
            canUse('student', location.pathname) ? (
              <StudentTimetablePage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/student/registration"
          element={<Navigate to="/sinhvien/dangkyhocphan/dangky" replace />}
        />
        <Route
          path="/sinhvien/dangkyhocphan/dangky"
          element={
            canUse('student', location.pathname) ? (
              <StudentCourseRegistrationPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/sinhvien/diem"
          element={
            canUse('student', location.pathname) ? (
              <GradeViewPage viewerRole="student" />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/sinhvien/ketquahoctap"
          element={
            canUse('student', location.pathname) ? (
              <StudentAcademicResultsPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/canbo"
          element={
            canUse('lecturer', location.pathname) ? (
              <LecturerDashboardPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/canbo/studyplan"
          element={
            canUse('lecturer', location.pathname) ? (
              <LecturerStudyPlanPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/canbo/nhapdiem"
          element={
            canUse('lecturer', location.pathname) ? (
              <LecturerGradeEntryPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/canbo/nhapdiem/nhapdiemnhomhocphan"
          element={
            canUse('lecturer', location.pathname) ? (
              <LecturerGradeEntryDetailPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/canbo/quanlydiem"
          element={<Navigate to="/canbo/nhapdiem" replace />}
        />
        <Route
          path="/canbo/thoikhoabieu"
          element={
            canUse('lecturer', location.pathname) ? (
              <LecturerTimetablePage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/quanly"
          element={
            canUse('manager', location.pathname) ? (
              <ManagerDashboardPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/quanly/curriculum"
          element={
            canUse('manager', location.pathname) ? (
              <ManagerCurriculumPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/quanly/thongtinsinhvien"
          element={
            canUse('manager', location.pathname) ? (
              <RoleLayout brandSubtitle="Há»‡ thá»‘ng ÄÃ o táº¡o" roleLabel="QUáº¢N LÃ" roleColor="teal" homeRoute="/quanly" roleTitle="Quáº£n lÃ½">
                <AdminStudentInfoPage access="manager" />
              </RoleLayout>
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/quanly/diem"
          element={
            canUse('manager', location.pathname) ? (
              <GradeViewPage viewerRole="manager" />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/quanly/diem/insinhvien"
          element={
            canUse('manager', location.pathname) ? (
              <GradeViewPage viewerRole="manager" tool="student" />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/quanly/diem/inlophocphan"
          element={
            canUse('manager', location.pathname) ? (
              <GradeViewPage viewerRole="manager" tool="section" />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/quanly/diem/phodiem"
          element={
            canUse('manager', location.pathname) ? (
              <GradeViewPage viewerRole="manager" tool="analysis" />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien"
          element={
            canUse('training_officer', location.pathname) ? (
              <TrainingOfficerDashboardPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/curriculum"
          element={
            canUse('training_officer', location.pathname) ? (
              <TrainingOfficerCurriculumPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/study-plan-statistics"
          element={
            canUse('training_officer', location.pathname) ? (
              <TrainingOfficerStudyPlanStatisticsPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/study-plan-statistics/:courseId"
          element={
            canUsePermission('training_officer', 'training_officer.study-plan-statistics.view') ? (
              <TrainingOfficerStudyPlanCourseRegistrationsPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/timetable"
          element={
            canUse('training_officer', location.pathname) ? (
              <TrainingOfficerTimetablePage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/phonghoc"
          element={
            canUse('training_officer', location.pathname) ? (
              <RoleLayout brandSubtitle="Hệ thống Đào tạo" roleLabel="CHUYÊN VIÊN" roleColor="orange" homeRoute="/chuyenvien" roleTitle="Chuyên viên đào tạo">
                <AdminRoomManagementPage />
              </RoleLayout>
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/lophoc"
          element={
            canUse('training_officer', location.pathname) ? (
              <RoleLayout brandSubtitle="Hệ thống Đào tạo" roleLabel="CHUYÊN VIÊN" roleColor="orange" homeRoute="/chuyenvien" roleTitle="Chuyên viên đào tạo">
                <AdminClassPage />
              </RoleLayout>
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/registrations"
          element={
            canUse('training_officer', location.pathname) ? (
              <TrainingOfficerCourseRegistrationPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/registrations/:id"
          element={
            canUsePermission('training_officer', 'training_officer.course-registration.manage') ? (
              <TrainingOfficerCourseRegistrationDetailPage />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/diem"
          element={
            canUse('training_officer', location.pathname) ? (
              <GradeViewPage viewerRole="training_officer" />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/diem/insinhvien"
          element={
            canUse('training_officer', location.pathname) ? (
              <GradeViewPage viewerRole="training_officer" tool="student" />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/diem/inlophocphan"
          element={
            canUse('training_officer', location.pathname) ? (
              <GradeViewPage viewerRole="training_officer" tool="section" />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/diem/phodiem"
          element={
            canUse('training_officer', location.pathname) ? (
              <GradeViewPage viewerRole="training_officer" tool="analysis" />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/diem/chinhsuadiem"
          element={
            canUse('training_officer', location.pathname) ? (
              <GradeViewPage viewerRole="training_officer" tool="edit" />
            ) : (
              <Navigate to={isAuthenticated ? redirectForAuthenticatedUser : '/login'} replace />
            )
          }
        />
        <Route
          path="/chuyenvien/thongtinsinhvien"
          element={
            canUse('training_officer', location.pathname) ? (
              <RoleLayout brandSubtitle="Há»‡ thá»‘ng ÄÃ o táº¡o" roleLabel="CHUYÃŠN VIÃŠN" roleColor="orange" homeRoute="/chuyenvien" roleTitle="ChuyÃªn viÃªn Ä‘Ã o táº¡o">
                <AdminStudentInfoPage access="training_officer" />
              </RoleLayout>
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
          <Route index element={adminPage('admin.dashboard.view', <AdminDashboardPage />)} />
          <Route path="roles" element={adminPage('admin.permission.manage', <AdminPermissionPage />)} />
          <Route path="backup" element={adminPage('admin.backup.manage', <AdminBackupPage />)} />
          <Route path="taikhoan" element={adminPage('admin.account.manage', <AdminAccountPage />)} />
          <Route path="lophoc" element={adminPage('admin.class.manage', <AdminClassPage />)} />
          <Route path="cauhinh" element={adminPage('admin.config.manage', <AdminConfigurationPage />)} />
          <Route path="phonghoc" element={adminPage('admin.room.manage', <AdminRoomManagementPage />)} />
          <Route path="curriculum" element={adminPage('admin.curriculum.manage', <AdminCurriculumPage />)} />
          <Route path="studyplan" element={adminPage('admin.study-plan.manage', <AdminStudyPlanPage />)} />
          <Route path="dangkyhocphan" element={adminPage('admin.course-registration.manage', <AdminCourseRegistrationPage />)} />
          <Route path="nhapdiem" element={adminPage('admin.grade-entry.lock.manage', <AdminGradeInputPeriodPage />)} />
          <Route path="thongtinsinhvien" element={adminPage('admin.student-info.manage', <AdminStudentInfoPage />)} />
          <Route path="lop" element={adminPage('admin.class.manage', <AdminClassPage />)} />
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
        <ModalProvider>
          <AppShell />
        </ModalProvider>
      </AlertProvider>
    </BrowserRouter>
  )
}

export default App



