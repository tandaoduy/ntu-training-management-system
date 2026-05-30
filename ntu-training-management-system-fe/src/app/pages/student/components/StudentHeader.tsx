import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/api/query'
import { Modal } from '@/components/modal'
import { SCHOOL_NAME, SYSTEM_NAME } from '@/app/branding'
import logoImage from '../../../../assets/Logo_NTU.png'
import './StudentHeader.css'

interface StudentHeaderProps {
  displayName: string
  academicYear: string
  semester: string
  overlay?: boolean
  onHomeClick: () => void
  onLogoutClick?: () => void
}

export function StudentHeader({
  displayName,
  academicYear,
  semester,
  overlay = false,
  onHomeClick,
  onLogoutClick,
}: StudentHeaderProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogoutClick = () => {
    if (onLogoutClick) {
      onLogoutClick()
    } else {
      setShowLogoutConfirm(true)
    }
  }

  const confirmLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await logout()
      setShowLogoutConfirm(false)
      navigate('/login', { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      <header className={`student-shared-header${overlay ? ' student-shared-header-overlay' : ''}`}>
        <div className="student-shared-topbar">
          <button type="button" className="student-shared-brand-group" onClick={onHomeClick} title="Về dashboard sinh viên" aria-label="Về dashboard sinh viên">
            <img src={logoImage} alt="NTU" className="student-shared-brand-logo" />
            <div className="student-shared-brand-text">
              <h1>{SCHOOL_NAME}</h1>
              <span>{SYSTEM_NAME}</span>
            </div>
          </button>
          <span className="student-shared-role-badge">SINH VIÊN</span>
        </div>

        <div className="student-shared-academic-bar">
          <div className="student-shared-academic-left">
            <div className="student-shared-academic-badge">
              <span>Hệ đào tạo:</span>
              <strong>Đại học Chính quy</strong>
            </div>
            <div className="student-shared-academic-badge">
              <span>Năm học:</span>
              <strong>{academicYear}</strong>
            </div>
            <div className="student-shared-academic-badge">
              <span>Học kỳ:</span>
              <strong>{semester}</strong>
            </div>
          </div>
          <div className="student-shared-academic-right">
            <span className="student-shared-greeting">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Xin chào, {displayName}
            </span>
            <div className="student-shared-academic-divider"></div>
            <button type="button" className="student-shared-home-button" onClick={onHomeClick} title="Trang chủ" aria-label="Trang chủ">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 9-8 9 8" /><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" /></svg>
            </button>
            <button type="button" className="student-shared-logout-button" onClick={handleLogoutClick} title="Đăng xuất" aria-label="Đăng xuất">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </button>
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <Modal
          modal={{
            id: 'student-header-logout-confirm',
            title: 'Xác nhận đăng xuất',
            dismissible: !isLoggingOut,
            closeOnOverlayClick: !isLoggingOut,
            content: (
              <div className="flex flex-col items-center text-center py-2 px-1">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-8 w-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">Bạn muốn đăng xuất khỏi hệ thống?</h3>
                <p className="mb-6 max-w-sm text-sm leading-relaxed text-gray-500">
                  Phiên làm việc hiện tại sẽ được đóng lại an toàn để bảo vệ thông tin cá nhân và dữ liệu học tập của bạn.
                </p>
                <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={() => setShowLogoutConfirm(false)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-150 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto min-w-[120px] cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={() => void confirmLogout()}
                    className="w-full rounded-lg bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-600/10 transition-all duration-150 hover:from-rose-700 hover:to-red-700 hover:shadow-lg hover:shadow-rose-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto min-w-[120px] cursor-pointer"
                  >
                    {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                  </button>
                </div>
              </div>
            ),
          }}
          onClose={() => {
            if (!isLoggingOut) setShowLogoutConfirm(false)
          }}
        />
      )}
    </>
  )
}
