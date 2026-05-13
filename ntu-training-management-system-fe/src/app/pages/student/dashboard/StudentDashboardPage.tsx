import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiGet } from '../../../../api/core/request'
import { authStorage } from '../../../../api/features/auth'
import { useAuth } from '../../../../api/query'
import { Modal } from '@/components/modal'
import { StudentHeader } from '../components/StudentHeader'
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
  { label: 'Kế hoạch học tập', icon: '🗺️', colorClass: 'amber', link: '/sinhvien/studyplan' },
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

interface CurrentAcademicTermResponse {
  data?: {
    id?: number
    nam_hoc_id?: number
    nam_hoc?: string | null
    hoc_ky?: string | null
  } | null
  is_configured?: boolean
}

const CURRENT_TERM_CACHE_KEY = 'student-current-academic-term'
const FALLBACK_CURRENT_TERM = {
  year: '2024-2025',
  semester: '1',
}

function readCachedCurrentTerm() {
  try {
    const cached = window.localStorage.getItem(CURRENT_TERM_CACHE_KEY)
    if (!cached) {
      return FALLBACK_CURRENT_TERM
    }

    const parsed = JSON.parse(cached) as { year?: string, semester?: string }
    return {
      year: parsed.year?.trim() || FALLBACK_CURRENT_TERM.year,
      semester: parsed.semester?.trim() || FALLBACK_CURRENT_TERM.semester,
    }
  } catch {
    return FALLBACK_CURRENT_TERM
  }
}

function cacheCurrentTerm(year?: string | null, semester?: string | null) {
  const normalizedYear = year?.trim()
  const normalizedSemester = semester?.trim()

  if (!normalizedYear || !normalizedSemester) {
    return
  }

  window.localStorage.setItem(CURRENT_TERM_CACHE_KEY, JSON.stringify({
    year: normalizedYear,
    semester: normalizedSemester,
  }))
}

export default function StudentDashboardPage() {
  const navigate = useNavigate()
  const { user, logout, me } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [sysAcademicYear, setSysAcademicYear] = useState(() => readCachedCurrentTerm().year)
  const [sysSemester, setSysSemester] = useState(() => readCachedCurrentTerm().semester)

  // Lấy thông tin user khi vào trang
  useEffect(() => {
    if (!user) {
      void me()
    }
  }, [me, user])

  useEffect(() => {
    let isMounted = true

    const fetchStudentDashboard = async () => {
      const [currentTermResult] = await Promise.allSettled([
        apiGet<CurrentAcademicTermResponse>('/academic-catalog/current-term'),
      ])

      if (!isMounted) {
        return
      }

      const currentTerm = currentTermResult.status === 'fulfilled'
        ? currentTermResult.value.data
        : null
      const namHoc = currentTerm?.nam_hoc?.trim() || null
      const hocKy = currentTerm?.hoc_ky?.trim() || null

      setSysAcademicYear(namHoc ?? FALLBACK_CURRENT_TERM.year)
      setSysSemester(hocKy ?? FALLBACK_CURRENT_TERM.semester)
      cacheCurrentTerm(namHoc, hocKy)
    }

    void fetchStudentDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    void logout()
    navigate('/login', { replace: true })
  }

  const cachedUserName = authStorage.getUser()?.name?.trim() || null
  const displayName = user?.name?.trim() || cachedUserName || ''

  return (
    <div className="sd-root">
      <StudentHeader
        displayName={displayName}
        academicYear={sysAcademicYear}
        semester={sysSemester}
        onHomeClick={() => navigate('/sinhvien')}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />

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
