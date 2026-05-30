import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/modal'
import { useAuth } from '@/api/query'
import { SCHOOL_NAME, SYSTEM_NAME } from '@/app/branding'
import logoImage from '../../assets/Logo_NTU.png'
import { HomeIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import './Header.css'

interface HeaderProps {
  brandTitle?: string
  brandSubtitle?: string
  roleLabel: string
  roleColor?: 'blue' | 'teal' | 'orange' | 'purple' | 'red'
  homeRoute: string
  heDaoTao?: string
  namHoc?: string
  hocKy?: string
  showAcademicInfo?: boolean
}

export default function Header({
  brandTitle = SCHOOL_NAME,
  brandSubtitle = SYSTEM_NAME,
  roleLabel,
  roleColor = 'blue',
  homeRoute,
  heDaoTao = 'Đại học Chính quy',
  namHoc = '2025-2026',
  hocKy = '2',
  showAcademicInfo = false,
}: HeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const displayName = user?.name?.trim() || user?.username || 'Thành viên'

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
    <header className="rl-shared-header">
      <div className="rl-topbar">
        <button
          type="button"
          className="rl-brand"
          onClick={() => navigate(homeRoute)}
          title="Về trang chủ"
          aria-label="Về trang chủ"
        >
          <img src={logoImage} alt="NTU Logo" className="rl-brand-logo" />
          <div className="rl-brand-text">
            <h2 className="rl-brand-title">{brandTitle}</h2>
            <span className="rl-brand-subtitle">{brandSubtitle}</span>
          </div>
        </button>
        <span className={`rl-role-chip ${roleColor}`}>{roleLabel}</span>
      </div>

      <div className="rl-system-bar">
        {showAcademicInfo ? (
          <div className="rl-system-bar-left">
            <div className="rl-info-pill">
              <span className="pill-label">Hệ đào tạo:</span>
              <span className="pill-val active">{heDaoTao}</span>
            </div>
            <div className="rl-info-pill">
              <span className="pill-label">Năm học:</span>
              <span className="pill-val">{namHoc}</span>
            </div>
            <div className="rl-info-pill">
              <span className="pill-label">Học kỳ:</span>
              <span className="pill-val">{hocKy}</span>
            </div>
          </div>
        ) : (
          <div className="rl-system-bar-left-placeholder" />
        )}

        <div className="rl-system-bar-right">
          <div className="rl-greeting-pill">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span>Xin chào, {displayName}</span>
          </div>

          <div className="rl-divider"></div>

          <button
            type="button"
            className="rl-action-circle-btn home"
            onClick={() => navigate(homeRoute)}
            title="Trang chủ"
            aria-label="Trang chủ"
          >
            <HomeIcon />
          </button>

          <button
            type="button"
            className="rl-action-circle-btn logout"
            onClick={() => setShowLogoutConfirm(true)}
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <ArrowRightOnRectangleIcon />
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <Modal
          modal={{
            id: 'role-logout-confirm',
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
                  Phiên làm việc hiện tại sẽ được đóng lại an toàn để bảo vệ thông tin cá nhân và dữ liệu làm việc của bạn.
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
    </header>
  )
}
