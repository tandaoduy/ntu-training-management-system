import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../../../api/query'
import logoImage from '../../../../assets/Logo_NTU.png'
import './AdminDashboardPage.css'

// ── Placeholder data (thay bằng API thật sau) ────────────────────────
const stats = [
  { icon: '👥', label: 'Người dùng hoạt động', value: '2,486', colorClass: 'blue' },
  { icon: '⚠️', label: 'Sự cố hệ thống', value: '1', colorClass: 'red' },
  { icon: '⏳', label: 'Yêu cầu chờ duyệt', value: '11', colorClass: 'amber' },
  { icon: '🟢', label: 'Uptime hệ thống', value: '99.9%', colorClass: 'green' },
]

const quickAccessLinks = [
  { label: 'Quản lý người dùng', icon: '👤', colorClass: 'blue', link: '/admin/users' },
  { label: 'Phân quyền hệ thống', icon: '🔑', colorClass: 'purple', link: '/admin/roles' },
  { label: 'Quản lý phòng ban', icon: '🏢', colorClass: 'cyan', link: '/admin/departments' },
  { label: 'Cấu hình hệ thống', icon: '⚙️', colorClass: 'gray', link: '/admin/settings' },
  { label: 'Nhật ký truy cập', icon: '📋', colorClass: 'indigo', link: '/admin/logs' },
  { label: 'Sao lưu dữ liệu', icon: '💾', colorClass: 'teal', link: '/admin/backups' },
  { label: 'Quản lý thông báo', icon: '📢', colorClass: 'amber', link: '/admin/notifications' },
  { label: 'Báo cáo thống kê', icon: '📊', colorClass: 'green', link: '/admin/reports' },
]

const pendingRequests = [
  { id: 'REQ-001', user: 'Nguyen Van A', type: 'Cấp quyền Giảng viên', status: 'pending' },
  { id: 'REQ-002', user: 'Tran Thi B', type: 'Reset mật khẩu', status: 'pending' },
  { id: 'REQ-003', user: 'Le Van C', type: 'Mở khóa tài khoản', status: 'pending' },
  { id: 'REQ-004', user: 'Pham Thi D', type: 'Cập nhật email', status: 'pending' },
]

const recentLogs = [
  { action: 'Cập nhật phân quyền', user: 'admin_root', time: '10 phút trước' },
  { action: 'Đăng nhập hệ thống (IP lạ)', user: 'gv_tuan', time: '1 giờ trước' },
  { action: 'Sao lưu DB thành công', user: 'System', time: '2 giờ trước' },
  { action: 'Xóa tài khoản sinh viên', user: 'admin_staff', time: 'Hôm qua' },
]

const systemStatus = [
  { component: 'Web Server', status: 'Hoạt động tốt', state: 'success' },
  { component: 'Database Server', status: 'Hoạt động tốt', state: 'success' },
  { component: 'Storage', status: 'Cảnh báo: 85% đầy', state: 'warning' },
  { component: 'Email Service', status: 'Hoạt động tốt', state: 'success' },
]

const stateLabel: Record<string, string> = {
  success: 'Bình thường',
  warning: 'Cảnh báo',
  error: 'Lỗi',
  info: 'Thông tin',
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user, logout, me } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Lấy thông tin user khi vào trang
  useEffect(() => {
    if (!user) {
      void me()
    }
  }, [me, user])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const displayName = user?.username ?? 'Quản trị viên'

  return (
    <div className="ad-root">
      {/* ── HEADER HIỆN ĐẠI ── */}
      <header className="ad-header-modern">
        {/* Main Topbar */}
        <div className="ad-topbar-main">
          <div className="ad-brand-group">
            <img src={logoImage} alt="NTU" className="ad-brand-logo" />
            <div className="ad-brand-text">
              <h1 className="ad-brand-title">TRƯỜNG ĐẠI HỌC NHA TRANG</h1>
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
        <div className="ad-system-bar" style={{ justifyContent: 'flex-end', gap: '16px' }}>
          <span style={{ fontWeight: 600, color: '#2d3748', fontSize: '0.95rem' }}>
            Xin chào, Quản trị viên
          </span>
          <button type="button" className="ad-btn-logout-small" onClick={() => setShowLogoutConfirm(true)} title="Đăng xuất">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      {/* MODAL XÁC NHẬN ĐĂNG XUẤT */}
      {showLogoutConfirm && (
        <div className="ad-modal-overlay">
          <div className="ad-modal-content">
            <h3 className="ad-modal-title">Xác nhận đăng xuất</h3>
            <p className="ad-modal-desc">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị?</p>
            <div className="ad-modal-actions">
              <button className="ad-modal-btn ad-modal-btn-cancel" onClick={() => setShowLogoutConfirm(false)}>Hủy</button>
              <button className="ad-modal-btn ad-modal-btn-confirm" onClick={handleLogout}>Đăng xuất</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="ad-main">
        {/* Quick Access */}
        <div className="ad-quick-access-section">
          <h2 className="ad-section-title">Quản lý nhanh</h2>
          <div className="ad-qa-grid">
            {quickAccessLinks.map((item) => (
              <Link to={item.link} key={item.label} className="ad-qa-card">
                <div className={`ad-qa-icon ${item.colorClass}`}>
                  {item.icon}
                </div>
                <span className="ad-qa-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="ad-stats">
          {stats.map((s) => (
            <div key={s.label} className="ad-stat-card">
              <div className={`ad-stat-icon ${s.colorClass}`}>{s.icon}</div>
              <div className="ad-stat-value">{s.value}</div>
              <div className="ad-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grid 2 cột */}
        <div className="ad-grid">
          {/* Yêu cầu chờ duyệt */}
          <div className="ad-panel">
            <div className="ad-panel-header">
              <span className="ad-panel-title">⏳ Yêu cầu chờ duyệt</span>
              <a href="#" className="ad-panel-link">Xem tất cả</a>
            </div>
            <div className="ad-panel-body">
              <div className="ad-list">
                {pendingRequests.map((r) => (
                  <div key={r.id} className="ad-list-item">
                    <div className="ad-list-content">
                      <span className="ad-list-title">{r.user}</span>
                      <span className="ad-list-desc">{r.type}</span>
                    </div>
                    <span className="ad-badge warning">Chờ duyệt</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Nhật ký hệ thống */}
          <div className="ad-panel">
            <div className="ad-panel-header">
              <span className="ad-panel-title">📋 Nhật ký hoạt động (Gần đây)</span>
            </div>
            <div className="ad-panel-body">
              <div className="ad-timeline">
                {recentLogs.map((log, idx) => (
                  <div key={idx} className="ad-timeline-item">
                    <div className="ad-timeline-icon">📝</div>
                    <div className="ad-timeline-content">
                      <div className="ad-timeline-title">{log.action}</div>
                      <div className="ad-timeline-time">{log.user} • {log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tình trạng hệ thống */}
          <div className="ad-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="ad-panel-header">
              <span className="ad-panel-title">⚙️ Tình trạng hệ thống</span>
            </div>
            <div className="ad-panel-body">
              <div className="ad-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
                {systemStatus.map((s, idx) => (
                  <div key={idx} className="ad-list-item">
                    <div className="ad-list-content">
                      <span className="ad-list-title">{s.component}</span>
                      <span className="ad-list-desc">{s.status}</span>
                    </div>
                    <span className={`ad-badge ${s.state}`}>{stateLabel[s.state]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
