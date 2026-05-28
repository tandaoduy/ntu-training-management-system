import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import RoleLayout from '../../../layout/RoleLayout'
import { apiGet } from '@/api/core/request'
import { useAuth } from '../../../../api/query'
import './TrainingOfficerDashboardPage.css'

type ModuleTone = 'orange' | 'blue' | 'purple' | 'teal'
type AcademicYear = { id: number; nam_hoc: string }
type AcademicTerm = { id: number; nam_hoc_id: number; hoc_ky: string }
type CatalogResponse<T> = { data: T[] }
type CurrentTermResponse = {
  data: {
    nam_hoc_id?: number | null
    hoc_ky?: string | null
  } | null
}

type TrainingOfficerModule = {
  title: string
  href: string
  permission: string
  tone: ModuleTone
  icon: ReactNode
}

/* ──────────────────────────────────────────────────────────────────── */
/* Icons                                                               */
/* ──────────────────────────────────────────────────────────────────── */

const CurriculumIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19a1 1 0 0 1 1 1v14.5" />
    <path d="M4 5.5V19a2 2 0 0 0 2 2h13" />
    <path d="M8 7h8M8 11h8M8 15h5" />
  </svg>
)

const StatisticsIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <rect x="7" y="12" width="3" height="6" rx="1" />
    <rect x="12" y="8" width="3" height="10" rx="1" />
    <rect x="17" y="5" width="3" height="13" rx="1" />
  </svg>
)

const TimetableIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18" />
    <path d="M8 3v4M16 3v4" />
    <path d="M8 14h2M8 17h2M14 14h2M14 17h2" />
  </svg>
)

const RegistrationIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H15l5 5v11a2 2 0 0 1-2 2H6.5A1.5 1.5 0 0 1 5 19.5z" />
    <path d="M14 3v5h5" />
    <path d="m9 14 2 2 4-4" />
  </svg>
)

const StudentInfoIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
    <circle cx="12" cy="8" r="4" />
    <path d="M3 4h4M17 4h4M3 20h4M17 20h4" />
  </svg>
)

const GradeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16v16H4z" />
    <path d="M8 9h8M8 13h4M15 13l1.5 1.5L19 12" />
  </svg>
)

const RoomIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const ClassIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const modules: TrainingOfficerModule[] = [
  { title: 'Quản lí điểm', href: '/chuyenvien/diem', permission: 'training_officer.grades.view', tone: 'orange', icon: GradeIcon },
  { title: 'Chương trình đào tạo', href: '/chuyenvien/curriculum', permission: 'training_officer.curriculum.view', tone: 'orange', icon: CurriculumIcon },
  { title: 'Thống kê kế hoạch học tập', href: '/chuyenvien/study-plan-statistics', permission: 'training_officer.study-plan-statistics.view', tone: 'blue', icon: StatisticsIcon },
  { title: 'Xếp thời khóa biểu', href: '/chuyenvien/timetable', permission: 'training_officer.timetable.manage', tone: 'purple', icon: TimetableIcon },
  { title: 'Đăng ký học phần', href: '/chuyenvien/registrations', permission: 'training_officer.course-registration.manage', tone: 'teal', icon: RegistrationIcon },
  { title: 'Thông tin sinh viên', href: '/chuyenvien/thongtinsinhvien', permission: 'training_officer.student-info.manage', tone: 'blue', icon: StudentInfoIcon },
  { title: 'Quản lí phòng học', href: '/chuyenvien/phonghoc', permission: 'admin.room.manage', tone: 'purple', icon: RoomIcon },
  { title: 'Quản lí lớp học', href: '/chuyenvien/lophoc', permission: 'admin.class.manage', tone: 'teal', icon: ClassIcon },
]

/* ──────────────────────────────────────────────────────────────────── */

function formatToday(): string {
  const today = new Date()
  const weekday = today.toLocaleDateString('vi-VN', { weekday: 'long' })
  const date = today.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${date}`
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 11) return 'Chào buổi sáng'
  if (hour >= 11 && hour < 13) return 'Chào buổi trưa'
  if (hour >= 13 && hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export default function TrainingOfficerDashboardPage() {
  const { user, me } = useAuth()
  const displayName = user?.name?.trim() || user?.username || 'chuyên viên'

  const [now, setNow] = useState<Date>(() => new Date())
  const [trainingSystem, setTrainingSystem] = useState('Đại học và Cao đẳng chính quy')
  const [academicYear, setAcademicYear] = useState('')
  const [semester, setSemester] = useState('')
  const [years, setYears] = useState<AcademicYear[]>([])
  const [terms, setTerms] = useState<AcademicTerm[]>([])

  useEffect(() => {
    void me()
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [me])

  useEffect(() => {
    let isMounted = true

    Promise.all([
      apiGet<CatalogResponse<AcademicYear>>('/academic-catalog/nam-hocs'),
      apiGet<CurrentTermResponse>('/academic-catalog/current-term'),
    ])
      .then(([yearResponse, currentResponse]) => {
        if (!isMounted) return
        setYears(yearResponse.data ?? [])
        setAcademicYear(String(currentResponse.data?.nam_hoc_id ?? yearResponse.data?.[0]?.id ?? ''))
        setSemester(currentResponse.data?.hoc_ky ?? '')
      })
      .catch(() => {
        if (!isMounted) return
        setYears([])
        setAcademicYear('')
        setSemester('')
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!academicYear) return

    let isMounted = true
    apiGet<CatalogResponse<AcademicTerm>>('/academic-catalog/hoc-kys', {
      params: { nam_hoc_id: Number(academicYear) },
    })
      .then((response) => {
        if (!isMounted) return
        setTerms(response.data ?? [])
        setSemester((current) => current || response.data?.[0]?.hoc_ky || '')
      })
      .catch(() => {
        if (!isMounted) return
        setTerms([])
      })

    return () => {
      isMounted = false
    }
  }, [academicYear])

  const greeting = getGreeting(now.getHours())
  const today = formatToday()
  const enabledModules = modules.filter((module) => user?.permissions?.includes(module.permission))

  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="CHUYÊN VIÊN"
      roleColor="orange"
      homeRoute="/chuyenvien"
      roleTitle="Chuyên viên đào tạo"
    >
      <main className="to-main">
        <div className="to-content">
          <section className="to-filter-bar" aria-label="Thông tin học kỳ">
            <label>
              <span>Hệ đào tạo</span>
              <select value={trainingSystem} onChange={(event) => setTrainingSystem(event.target.value)}>
                <option value="Đại học và Cao đẳng chính quy">Đại học và Cao đẳng chính quy</option>
                <option value="Vừa học vừa làm">Vừa học vừa làm</option>
                <option value="Đào tạo từ xa">Đào tạo từ xa</option>
              </select>
            </label>
            <label>
              <span>Năm học</span>
              <select value={academicYear} onChange={(event) => { setAcademicYear(event.target.value); setSemester('') }}>
                <option value="">Chọn năm học</option>
                {years.map((year) => <option key={year.id} value={year.id}>{year.nam_hoc}</option>)}
              </select>
            </label>
            <label>
              <span>Học kỳ</span>
              <select value={semester} onChange={(event) => setSemester(event.target.value)}>
                <option value="">Chọn học kỳ</option>
                {terms.map((term) => <option key={term.id} value={term.hoc_ky}>{term.hoc_ky}</option>)}
              </select>
            </label>
          </section>

          {/* Hero Section with Greeting */}
          <section className="to-hero-section" aria-label="Chào mừng">
            <div className="to-hero-content">
              <h1 className="to-hero-greeting">{greeting}, {displayName}!</h1>
              <p className="to-hero-date">{today}</p>
            </div>
          </section>

          {/* Modules Section */}
          <section className="to-modules-section" aria-label="Nghiệp vụ chính">
            <div className="to-modules-grid">
              {enabledModules.map((module) => (
                <Link
                  to={module.href}
                  key={module.title}
                  className={`to-module-card tone-${module.tone}`}
                >
                  <div className="to-module-icon" aria-hidden="true">
                    {module.icon}
                  </div>
                  <h3 className="to-module-title">{module.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </RoleLayout>
  )
}
