import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../api/query'
import logoImage from '../../../../assets/Logo_NTU.png'
import './StudentDashboardPage.css'

// ── Placeholder data (thay bằng API thật sau) ────────────────────────
const stats = [
  { icon: '📚', label: 'Tín chỉ tích lũy', value: '78', colorClass: 'blue' },
  { icon: '✅', label: 'Môn đã qua', value: '24', colorClass: 'green' },
  { icon: '⏳', label: 'Môn đang học', value: '5', colorClass: 'amber' },
  { icon: '🎯', label: 'GPA tích lũy', value: '3.2', colorClass: 'purple' },
]

const currentCourses = [
  { name: 'Lập trình hướng đối tượng', credits: '3 TC', status: 'active' },
  { name: 'Cơ sở dữ liệu', credits: '3 TC', status: 'active' },
  { name: 'Mạng máy tính', credits: '3 TC', status: 'active' },
  { name: 'Kiến trúc máy tính', credits: '2 TC', status: 'active' },
  { name: 'Toán rời rạc', credits: '3 TC', status: 'active' },
]

const recentGrades = [
  { name: 'Lập trình Web', credits: '3 TC', status: 'pass', score: '8.5' },
  { name: 'Giải tích 2', credits: '3 TC', status: 'pass', score: '7.0' },
  { name: 'Vật lý đại cương', credits: '2 TC', status: 'fail', score: '4.0' },
  { name: 'Tiếng Anh 2', credits: '3 TC', status: 'pass', score: '9.0' },
]

const schedule = [
  { day: 'T2', subject: 'Lập trình hướng đối tượng', time: '07:30 – 09:30 • P.B201' },
  { day: 'T3', subject: 'Cơ sở dữ liệu', time: '09:45 – 11:45 • P.A302' },
  { day: 'T4', subject: 'Mạng máy tính', time: '13:00 – 15:00 • P.C104' },
  { day: 'T5', subject: 'Kiến trúc máy tính', time: '07:30 – 09:30 • P.B305' },
  { day: 'T6', subject: 'Toán rời rạc', time: '09:45 – 11:45 • P.A201' },
]

const progressItems = [
  { label: 'Tín chỉ tích lũy / Yêu cầu (130 TC)', pct: Math.round((78 / 130) * 100) },
  { label: 'Tiến độ học kỳ hiện tại', pct: 65 },
  { label: 'Hoàn thành chương trình đào tạo', pct: Math.round((78 / 130) * 100) },
]

const statusLabel: Record<string, string> = {
  pass: 'Đạt',
  fail: 'Không đạt',
  active: 'Đang học',
}

export default function StudentDashboardPage() {
  const navigate = useNavigate()
  const { user, logout, me } = useAuth()

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

  const displayName = user?.username ?? 'Sinh viên'
  const avatarLetter = displayName.charAt(0).toUpperCase()

  return (
    <div className="sd-root">
      {/* ── TOPBAR ── */}
      <header className="sd-topbar">
        <div className="sd-topbar-brand">
          <img src={logoImage} alt="NTU" className="sd-topbar-logo" />
          <span className="sd-topbar-title">NTU – Quản lý đào tạo</span>
        </div>

        <div className="sd-topbar-spacer" />

        <div className="sd-topbar-user">
          <div className="sd-topbar-avatar">{avatarLetter}</div>
          <span className="sd-topbar-username">{displayName}</span>
          <button type="button" className="sd-logout-btn" onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="sd-main">
        {/* Greeting */}
        <div className="sd-greeting">
          <h1>Xin chào, {displayName} 👋</h1>
          <p>Chào mừng bạn đến với hệ thống quản lý đào tạo Trường Đại học Nha Trang.</p>
        </div>

        {/* Stat cards */}
        <div className="sd-stats">
          {stats.map((s) => (
            <div key={s.label} className="sd-stat-card">
              <div className={`sd-stat-icon ${s.colorClass}`}>{s.icon}</div>
              <div className="sd-stat-value">{s.value}</div>
              <div className="sd-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grid 2 cột */}
        <div className="sd-grid">
          {/* Môn đang học */}
          <div className="sd-panel">
            <div className="sd-panel-header">
              <span className="sd-panel-title">📖 Môn học kỳ này</span>
              <a href="#" className="sd-panel-link">Xem tất cả</a>
            </div>
            <div className="sd-panel-body">
              <div className="sd-course-list">
                {currentCourses.map((c) => (
                  <div key={c.name} className="sd-course-item">
                    <span className="sd-course-name">{c.name}</span>
                    <span className="sd-course-credit">{c.credits}</span>
                    <span className={`sd-badge ${c.status}`}>{statusLabel[c.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lịch học */}
          <div className="sd-panel">
            <div className="sd-panel-header">
              <span className="sd-panel-title">🗓️ Lịch học tuần này</span>
            </div>
            <div className="sd-panel-body">
              <div className="sd-schedule-list">
                {schedule.map((s) => (
                  <div key={s.day + s.subject} className="sd-schedule-item">
                    <span className="sd-schedule-day">{s.day}</span>
                    <div className="sd-schedule-info">
                      <div className="sd-schedule-subject">{s.subject}</div>
                      <div className="sd-schedule-time">{s.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kết quả gần đây */}
          <div className="sd-panel">
            <div className="sd-panel-header">
              <span className="sd-panel-title">📊 Kết quả học tập gần đây</span>
              <a href="#" className="sd-panel-link">Xem bảng điểm</a>
            </div>
            <div className="sd-panel-body">
              <div className="sd-course-list">
                {recentGrades.map((c) => (
                  <div key={c.name} className="sd-course-item">
                    <span className="sd-course-name">{c.name}</span>
                    <span className="sd-course-credit">{c.score}</span>
                    <span className={`sd-badge ${c.status}`}>{statusLabel[c.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tiến độ tốt nghiệp */}
          <div className="sd-panel">
            <div className="sd-panel-header">
              <span className="sd-panel-title">🎓 Tiến độ tốt nghiệp</span>
            </div>
            <div className="sd-panel-body">
              <div className="sd-progress-wrap">
                {progressItems.map((p) => (
                  <div key={p.label} className="sd-progress-item">
                    <div className="sd-progress-row">
                      <span className="sd-progress-label">{p.label}</span>
                      <span className="sd-progress-pct">{p.pct}%</span>
                    </div>
                    <div className="sd-progress-track">
                      <div className="sd-progress-bar" style={{ width: `${p.pct}%` }} />
                    </div>
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
