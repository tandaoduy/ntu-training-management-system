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
  { label: 'Cấu hình hệ thống', icon: '⚙️', colorClass: 'gray', link: '/quantri/cauhinh' },
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
  return (
    <div className="ad-root">

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
