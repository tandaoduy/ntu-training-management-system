import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AcademicCapIcon, CalendarDaysIcon, ChartBarSquareIcon, IdentificationIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { apiGet } from '../../../../api/core/request'
import { authStorage } from '../../../../api/features/auth'
import { useAuth } from '../../../../api/query'
import { StudentHeader } from '../components/StudentHeader'
import './StudentDashboardPage.css'

const quickAccessLinks = [
  { label: 'Thời khóa biểu', icon: CalendarDaysIcon, colorClass: 'blue', link: '/sinhvien/thoikhoabieu', permission: 'student.timetable.view' },
  { label: 'Thông tin sinh viên', icon: IdentificationIcon, colorClass: 'indigo', link: '/student/profile', permission: 'student.profile.view' },
  { label: 'Kế hoạch học tập', icon: AcademicCapIcon, colorClass: 'amber', link: '/sinhvien/studyplan', permission: 'student.study-plan.view' },
  { label: 'Đăng ký học phần', icon: PencilSquareIcon, colorClass: 'purple', link: '/sinhvien/dangkyhocphan/dangky', permission: 'student.course-registration.view' },
  { label: 'Kết quả học tập', icon: ChartBarSquareIcon, colorClass: 'emerald', link: '/sinhvien/ketquahoctap', permission: 'student.grades.view' },
]

interface CurrentAcademicTermResponse {
  data?: {
    id?: number
    nam_hoc_id?: number
    nam_hoc?: string | null
    hoc_ky?: string | null
  } | null
  is_configured?: boolean
}

type TimetableRow = {
  id: number
  ma_hoc_phan: string
  nhom_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi: number
  lop_hoc_phan: string
  thu: number
  tiet_bat_dau: number
  tiet_ket_thuc: number
  tuan_bat_dau: number
  tuan_ket_thuc: number
  ten_giang_vien: string
  ten_phong: string
  ngay_bat_dau_hoc?: string | null
}

type CourseRegistrationResponse = {
  data: {
    registration_period: { term?: { nam_hoc?: string | null; hoc_ky?: string | null } | null } | null
    student_academic_info?: { ma_lop?: string | null; ten_nganh_hoc?: string | null } | null
    student_timetable: TimetableRow[]
  }
}

const CURRENT_TERM_CACHE_KEY = 'student-current-academic-term'
const STUDENT_TIMETABLE_CACHE_PREFIX = 'student-timetable-page'
const FALLBACK_CURRENT_TERM = {
  year: '2024-2025',
  semester: '1',
}

function studentTimetableCacheKey(username?: string | null) {
  return `${STUDENT_TIMETABLE_CACHE_PREFIX}:${username?.trim() || 'current'}`
}

function cacheStudentTimetable(username: string | undefined | null, response: CourseRegistrationResponse, term?: CurrentAcademicTermResponse['data']) {
  const registrationTerm = response.data.registration_period?.term
  const year = registrationTerm?.nam_hoc?.trim() || term?.nam_hoc?.trim() || FALLBACK_CURRENT_TERM.year
  const semester = registrationTerm?.hoc_ky?.trim() || term?.hoc_ky?.trim() || FALLBACK_CURRENT_TERM.semester

  try {
    window.localStorage.setItem(studentTimetableCacheKey(username), JSON.stringify({
      periodYear: year,
      periodSemester: semester,
      sysAcademicYear: term?.nam_hoc?.trim() || year,
      sysSemester: term?.hoc_ky?.trim() || semester,
      rows: response.data.student_timetable ?? [],
      academicInfo: response.data.student_academic_info ?? null,
      cachedAt: Date.now(),
    }))
  } catch {
    // Prefetch cache is optional.
  }
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
  const { user, me } = useAuth()
  const [sysAcademicYear, setSysAcademicYear] = useState(() => readCachedCurrentTerm().year)
  const [sysSemester, setSysSemester] = useState(() => readCachedCurrentTerm().semester)

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

      if (user?.permissions?.includes('student.course-registration.view')) {
        apiGet<CourseRegistrationResponse>('/student/course-registration')
          .then((response) => cacheStudentTimetable(user?.username || authStorage.getUser()?.username, response, currentTerm))
          .catch(() => undefined)
      }
    }

    void fetchStudentDashboard()

    return () => {
      isMounted = false
    }
  }, [user?.permissions, user?.username])



  const cachedUserName = authStorage.getUser()?.name?.trim() || null
  const displayName = user?.name?.trim() || cachedUserName || ''
  const enabledLinks = quickAccessLinks.filter((item) => user?.permissions?.includes(item.permission))

  return (
    <div className="sd-root">
      <StudentHeader
        displayName={displayName}
        academicYear={sysAcademicYear}
        semester={sysSemester}
        onHomeClick={() => navigate('/sinhvien')}
      />

      <main className="sd-main">
        <div className="sd-content-container">
          <div className="sd-quick-access-section-new">
            <div className="sd-qa-grid-new">
              {enabledLinks.map((item) => {
                const Icon = item.icon

                return (
                  <Link to={item.link} key={item.label} className="sd-qa-card-new">
                    <div className="sd-qa-card-inner">
                      <div className={`sd-qa-icon-box ${item.colorClass}`}>
                        <Icon aria-hidden="true" />
                      </div>
                      <span className="sd-qa-label-new">{item.label}</span>
                      <span className="sd-qa-arrow" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" x2="19" y1="12" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
