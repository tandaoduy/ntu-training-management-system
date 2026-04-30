import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../api/query'
import { Modal } from '@/components/modal'
import logoImage from '../../../assets/Logo_NTU.png'
import './AdminLayout.css'

export default function AdminLayout() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const goHome = () => {
    navigate('/quantri')
  }

  const confirmLogout = async () => {
    if (isLoggingOut) {
      return
    }

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
    <div className="ad-root">
      {/* ── HEADER ── */}
      <header className="ad-header-modern">
        <div className="ad-topbar-main">
          <div className="ad-brand-group">
            <img src={logoImage} alt="NTU Logo" className="ad-brand-logo" />
            <div className="ad-brand-text">
              <h2 className="ad-brand-title">TRƯỜNG ĐẠI HỌC NHA TRANG</h2>
              <span className="ad-brand-subtitle">Hệ thống Quản trị</span>
            </div>
          </div>

          <div className="ad-user-group">
            <div className="ad-user-info">
              <span className="ad-user-role">ADMINISTRATOR</span>
            </div>
          </div>
        </div>

        {/* Greeting Bar */}
        <div className="ad-system-bar">
          <span className="ad-greeting-text">
            Xin chào, Quản trị viên
          </span>
          <button type="button" className="ad-home-icon" onClick={goHome} title="Trang chủ" aria-label="Trang chủ">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </button>
          <button type="button" className="ad-btn-logout-small" onClick={() => setShowLogoutConfirm(true)} title="Đăng xuất" aria-label="Đăng xuất">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="ad-main-content">
        <Outlet />
      </div>

      {/* ── LOGOUT MODAL ── */}
      {showLogoutConfirm && (
        <Modal
          modal={{
            id: 'admin-logout-confirm',
            title: 'Xác nhận đăng xuất',
            content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị?',
            dismissible: !isLoggingOut,
            closeOnOverlayClick: !isLoggingOut,
            actions: [
              {
                label: 'Hủy',
                variant: 'secondary',
                autoClose: false,
                onClick: () => setShowLogoutConfirm(false),
              },
              {
                label: isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất',
                variant: 'danger',
                autoClose: false,
                onClick: () => void confirmLogout(),
              },
            ],
          }}
          onClose={() => {
            if (!isLoggingOut) {
              setShowLogoutConfirm(false)
            }
          }}
        />
      )}
    </div>
  )
}
