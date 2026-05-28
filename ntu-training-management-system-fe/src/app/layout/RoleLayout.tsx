import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/modal'
import { useAuth } from '../../api/query'
import { SCHOOL_NAME, SYSTEM_NAME } from '../branding'
import logoImage from '../../assets/Logo_NTU.png'
import './RoleLayout.css'

interface RoleLayoutProps {
  brandTitle?: string
  brandSubtitle?: string
  roleLabel: string
  roleColor: 'blue' | 'teal' | 'orange' | 'purple' | 'red'
  homeRoute: string
  roleTitle?: string
  headerOverlay?: boolean
  children: React.ReactNode
}

export default function RoleLayout({
  brandTitle = SCHOOL_NAME,
  brandSubtitle,
  roleLabel,
  roleColor,
  homeRoute,
  roleTitle = '',
  headerOverlay = false,
  children,
}: RoleLayoutProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const displayName = user?.name?.trim() || user?.username || roleTitle

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
    <div className={`rl-root${headerOverlay ? ' rl-root-dashboard' : ''}`}>
      <header className="rl-header">
        <div className="rl-topbar">
          <button type="button" className="rl-brand" onClick={() => navigate(homeRoute)} title="Về dashboard" aria-label="Về dashboard">
            <img src={logoImage} alt="NTU Logo" className="rl-brand-logo" />
            <div className="rl-brand-text">
              <h2 className="rl-brand-title">{brandTitle}</h2>
              <span className="rl-brand-subtitle">{brandSubtitle || SYSTEM_NAME}</span>
            </div>
          </button>

          <span className={`rl-role-chip ${roleColor}`}>{roleLabel}</span>
        </div>

        <div className="rl-system-bar">
          <span className="rl-greeting-text">
            Xin chào, {displayName}
          </span>

          <button
            type="button"
            className="rl-home-btn"
            onClick={() => navigate(homeRoute)}
            title="Trang chủ"
            aria-label="Trang chủ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>

          <button
            type="button"
            className="rl-logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
            title="Đăng xuất"
            aria-label="Đăng xuất"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="rl-content">
        {children}
      </div>

      {showLogoutConfirm && (
        <Modal
          modal={{
            id: 'role-logout-confirm',
            title: 'Xác nhận đăng xuất',
            content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
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
            if (!isLoggingOut) setShowLogoutConfirm(false)
          }}
        />
      )}
    </div>
  )
}
