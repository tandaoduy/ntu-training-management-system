import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiGet } from '../../../../api/core/request'
import { useAuth } from '../../../../api/query'
import { Modal } from '@/components/modal'
import logoImage from '../../../../assets/Logo_NTU.png'
import './StudentDashboardPage.css'

// ── Placeholder data (thay bằng API thật sau) ────────────────────────
const stats = [
  { icon: '📚', label: 'Tín chỉ tích lũy', value: '78', colorClass: 'blue' },
  { icon: '✅', label: 'Môn đã qua', value: '24', colorClass: 'green' },
  { icon: '⏳', label: 'Môn đang học', value: '5', colorClass: 'amber' },
  { icon: '🎯', label: 'GPA tích lũy', value: '3.2', colorClass: 'purple' },
]

const quickAccessLinks = [
  { label: 'Thời khóa biểu', icon: '📅', colorClass: 'blue', link: '/student/schedule' },
  { label: 'Đánh giá rèn luyện', icon: '📋', colorClass: 'teal', link: '/student/conduct' },
  { label: 'Thông tin sinh viên', icon: '👤', colorClass: 'indigo', link: '/student/profile' },
  { label: 'Kế hoạch học tập', icon: '🗺️', colorClass: 'amber', link: '/student/study-plan' },
  { label: 'Đăng ký học phần', icon: '✍️', colorClass: 'purple', link: '/student/registration' },
  { label: 'Xem lịch thi', icon: '⏰', colorClass: 'rose', link: '/student/exam-schedule' },
  { label: 'Nhận xét học phần', icon: '📝', colorClass: 'cyan', link: '/student/feedback' },
  { label: 'Kết quả học tập', icon: '📊', colorClass: 'emerald', link: '/student/grades' },
  { label: 'Ký túc xá', icon: '🏢', colorClass: 'orange', link: '/student/dormitory' },
  { label: 'Học phí', icon: '💵', colorClass: 'green', link: '/student/tuition' },
  { label: 'Xét tốt nghiệp', icon: '🎓', colorClass: 'blue', link: '/student/graduation' },
  { label: 'Đề tài luận văn', icon: '📚', colorClass: 'violet', link: '/student/thesis' },
  { label: 'Tiến độ học tập', icon: '📈', colorClass: 'pink', link: '/student/progress' },
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

interface StudentDashboardResponse {
  student?: {
    ten_sinh_vien?: string | null
    he_dao_tao?: string | null
  } | null
}

interface CurrentAcademicTermResponse {
  data?: {
    id?: number
    nam_hoc_id?: number
    nam_hoc?: string | null
    hoc_ky?: string | null
  } | null
  is_configured?: boolean
}

interface LegacyStudentDashboardResponse extends StudentDashboardResponse {
  hoc_ky_hien_hanh?: {
    id?: number
    nam_hoc_id?: number
    nam_hoc?: string | null
    hoc_ky?: string | null
  } | null
}

export default function StudentDashboardPage() {
  const navigate = useNavigate()
  const { user, logout, me } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [sysAcademicYear, setSysAcademicYear] = useState('Đang tải')
  const [sysSemester, setSysSemester] = useState('Đang tải')
  const [studentName, setStudentName] = useState<string | null>(null)
  const [educationSystem, setEducationSystem] = useState<string | null>(null)

  // Lấy thông tin user khi vào trang
  useEffect(() => {
    if (!user) {
      void me()
    }
  }, [me, user])

  useEffect(() => {
    let isMounted = true

    const fetchStudentDashboard = async () => {
      const [dashboardResult, currentTermResult] = await Promise.allSettled([
        apiGet<LegacyStudentDashboardResponse>('/student/dashboard'),
        apiGet<CurrentAcademicTermResponse>('/academic-catalog/current-term'),
      ])

      if (!isMounted) {
        return
      }

      if (dashboardResult.status === 'fulfilled') {
        const name = dashboardResult.value.student?.ten_sinh_vien?.trim() || null
        const heDaoTao = dashboardResult.value.student?.he_dao_tao?.trim() || null

        setStudentName(name)
        setEducationSystem(heDaoTao)
      } else {
        setStudentName(null)
        setEducationSystem(null)
      }

      const currentTerm = currentTermResult.status === 'fulfilled'
        ? currentTermResult.value.data
        : dashboardResult.status === 'fulfilled'
          ? dashboardResult.value.hoc_ky_hien_hanh
          : null
      const namHoc = currentTerm?.nam_hoc?.trim() || null
      const hocKy = currentTerm?.hoc_ky?.trim() || null

      setSysAcademicYear(namHoc ?? 'Chưa cấu hình')
      setSysSemester(hocKy ?? 'Chưa cấu hình')
    }

    void fetchStudentDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const displayName = studentName || user?.name?.trim() || 'Sinh viên'

  return (
    <div className="sd-root">
      {/* ── HEADER HIỆN ĐẠI ── */}
      <header className="sd-header-modern">
        {/* Main Topbar */}
        <div className="sd-topbar-main">
          <div className="sd-brand-group">
            <img src={logoImage} alt="NTU" className="sd-brand-logo" />
            <div className="sd-brand-text">
              <h1 className="sd-brand-title">TRƯỜNG ĐẠI HỌC NHA TRANG</h1>
              <span className="sd-brand-subtitle">Hệ thống Tích hợp Thông tin</span>
            </div>
          </div>

          <div className="sd-user-group">
            <div className="sd-user-info">
              <span className="sd-user-role">SINH VIÊN</span>
            </div>
          </div>
        </div>

        {/* Academic Info Bar */}
        <div className="sd-academic-bar">
          <div className="sd-academic-left">
            <div className="sd-academic-badge">
              <span className="sd-academic-label">Hệ đào tạo:</span>
              <span className="sd-academic-value">{educationSystem || user?.educationSystem || 'Đại học và Cao đẳng chính quy'}</span>
            </div>
            <div className="sd-academic-dot"></div>
            <div className="sd-academic-badge">
              <span className="sd-academic-label">Năm học:</span>
              <span className="sd-academic-value">{sysAcademicYear}</span>
            </div>
            <div className="sd-academic-dot"></div>
            <div className="sd-academic-badge">
              <span className="sd-academic-label">Học kỳ:</span>
              <span className="sd-academic-value">{sysSemester}</span>
            </div>
          </div>
          <div className="sd-academic-right">
            <span className="sd-academic-greeting" style={{ fontWeight: 600, color: '#2b6cb0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Xin chào, {displayName}
            </span>
            <div className="sd-academic-divider"></div>
            <button type="button" className="sd-btn-logout-small" onClick={() => setShowLogoutConfirm(true)} title="Đăng xuất">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </header>

      {/* MODAL XÁC NHẬN ĐĂNG XUẤT */}
      {showLogoutConfirm && (
        <Modal
          modal={{
            id: 'student-logout-confirm',
            title: 'Xác nhận đăng xuất',
            content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
            dismissible: true,
            closeOnOverlayClick: true,
            actions: [
              {
                label: 'Hủy',
                variant: 'secondary',
                autoClose: false,
                onClick: () => setShowLogoutConfirm(false),
              },
              {
                label: 'Đăng xuất',
                variant: 'danger',
                autoClose: false,
                onClick: () => void handleLogout(),
              },
            ],
          }}
          onClose={() => setShowLogoutConfirm(false)}
        />
      )}

      {/* ── MAIN ── */}
      <main className="sd-main">
        {/* Greeting */}
        <div className="sd-greeting">
          <h1>Xin chào, {displayName} 👋</h1>
        </div>

        {/* Quick Access */}
        <div className="sd-quick-access-section">
          <h2 className="sd-section-title">Chức năng chính</h2>
          <div className="sd-qa-grid">
            {quickAccessLinks.map((item) => (
              <Link to={item.link} key={item.label} className="sd-qa-card">
                <div className={`sd-qa-icon ${item.colorClass}`}>
                  {item.icon}
                </div>
                <span className="sd-qa-label">{item.label}</span>
              </Link>
            ))}
          </div>
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
