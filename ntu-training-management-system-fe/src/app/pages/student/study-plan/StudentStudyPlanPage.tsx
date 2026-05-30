import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiGet, apiPost } from '../../../../api/core/request'
import { authStorage } from '../../../../api/features/auth'
import { useAuth } from '../../../../api/query'
import { MINISTRY_NAME, printBrandHtml, printBrandStyles, printFaviconLink } from '@/app/branding'
import { useAlert } from '@/components/alert'
import { Modal } from '@/components/modal'
import { PAGE_SIZE_OPTIONS, getPageSizeLabel, getPageSizeNumber } from '@/components/pagination'
import { Select } from '@/components/select'
import { formatDisplayDateTime } from '@/utils/dateFormat'
import { dchpHrefForCourseCode } from '../../../data/dchpFiles'
import { StudentHeader } from '../components/StudentHeader'
import './StudentStudyPlanPage.css'

type ViewerMode = 'curriculum' | 'studyplan'

interface CurriculumVersion {
  id: number
  version_no: number
  trang_thai: string
  ghi_chu?: string | null
  chuong_trinh_dao_tao?: {
    ma_ctdt?: string
    ten_ctdt?: string
    tong_tin_chi_yeu_cau?: number
    nganh_dao_tao?: {
      ma_nganh?: string
      ten_nganh?: string
      he_dao_tao?: string | null
      thoi_gian_dao_tao?: number | string | null
    }
  } | null
}

interface CurriculumProgram {
  id: number
  ma_ctdt: string
  ten_ctdt: string
  tong_tin_chi_yeu_cau?: number | null
  nganh_dao_tao?: {
    ma_nganh?: string
    ten_nganh?: string
    he_dao_tao?: string | null
    thoi_gian_dao_tao?: number | string | null
  } | null
  versions?: CurriculumVersion[]
}

interface CurriculumCourse {
  id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi: number
  vai_tro: 'bat_buoc' | 'tu_chon'
  hoc_ky_goi_y?: number | null
  nam_hoc_mo?: string | null
  hoc_ky_mo?: string | null
  nam_hoc_dat?: string | null
  hoc_ky_dat?: string | null
  diem_dat?: string | number | null
  de_cuong_hoc_phan_url?: string | null
  tai_lieu_tham_khao_url?: string | null
  ap_dung_cho: 'all' | 'major' | 'specialization'
  don_vi?: {
    ma_don_vi?: string | null
    ten_don_vi?: string | null
  }
  chuyen_nganh?: {
    ma_chuyen_nganh?: string
    ten_chuyen_nganh?: string
  } | null
}

interface CurriculumGroup {
  id: number
  ma_nhom: string
  ten_nhom: string
  min_tin_chi: number
  min_so_mon: number
  bat_buoc_toan_bo: boolean
  tong_tin_chi: number
  items: CurriculumCourse[]
}

interface CurriculumDetail extends CurriculumVersion {
  groups: CurriculumGroup[]
}

interface ApiListResponse<T> {
  data: T
}

interface CatalogYear {
  id: number
  nam_hoc: string
}

interface CatalogSemester {
  id: number
  nam_hoc_id: number
  hoc_ky: string
}

interface StudentGradeRow {
  ma_hoc_phan?: string | null
  nam_hoc?: string | null
  hoc_ky?: string | null
  average_score?: string | number | null
  result?: string | null
  grade_mode?: 'numeric' | 'pass_fail' | string | null
}

interface StudentGradesResponse {
  data: StudentGradeRow[]
}

interface StudentCurriculumResponse {
  data?: {
    curriculum?: CurriculumDetail | null
    current_term?: {
      nam_hoc?: string | null
      hoc_ky?: string | null
    } | null
  } | null
}

interface CurrentAcademicTermResponse {
  data?: {
    nam_hoc?: string | null
    hoc_ky?: string | null
  } | null
}

interface ProgramDetailResponse {
  data?: {
    program?: CurriculumProgram
    curriculum?: CurriculumDetail | null
  } | null
}

interface StudyPlanRegistrationResponse {
  data?: {
    max_credits: number
    can_register: boolean
    registration_period?: {
      id: number
      starts_at?: string | null
      ends_at?: string | null
      target_term?: {
        nam_hoc?: string | null
        hoc_ky?: string | null
      } | null
    } | null
    plan?: {
      id: number
      hoc_ky_id?: number
      tong_tin_chi: number
      status: string
      submitted_at?: string | null
      course_ids: number[]
      course_terms?: Array<{
        course_id: number
        hoc_ky_id?: number | null
        term?: {
          nam_hoc?: string | null
          hoc_ky?: string | null
        } | null
      }>
      term?: {
        nam_hoc?: string | null
        hoc_ky?: string | null
      } | null
    } | null
  }
}

interface SubmitStudyPlanResponse {
  data?: {
    submitted_at?: string | null
    course_ids: number[]
    hoc_ky_id?: number
    course_terms?: Array<{
      course_id: number
      hoc_ky_id?: number | null
      term?: {
        nam_hoc?: string | null
        hoc_ky?: string | null
      } | null
    }>
    term?: {
      nam_hoc?: string | null
      hoc_ky?: string | null
    } | null
  }
}

interface CurriculumPlanPageProps {
  mode: ViewerMode
  roleLabel: string
  backLink: string
  title: string
  description: string
  staffEndpointPrefix?: string
}

const CURRENT_TERM_CACHE_KEY = 'student-current-academic-term'
const FALLBACK_CURRENT_TERM = {
  year: '2024-2025',
  semester: '1',
}

function studentStudyPlanPageCacheKey(username?: string | null) {
  return username ? `student-study-plan-page:${username}` : null
}

function readStudentStudyPlanPageCache(username?: string | null) {
  const key = studentStudyPlanPageCacheKey(username)
  if (!key) {
    return null
  }

  try {
    const cached = window.localStorage.getItem(key)
    return cached
      ? JSON.parse(cached) as {
        curriculum?: CurriculumDetail | null
        catalogYears?: CatalogYear[]
        catalogSemesters?: CatalogSemester[]
        currentTerm?: { nam_hoc?: string | null, hoc_ky?: string | null } | null
      }
      : null
  } catch {
    return null
  }
}

function writeStudentStudyPlanPageCache(username: string | undefined | null, payload: {
  curriculum?: CurriculumDetail | null
  catalogYears?: CatalogYear[]
  catalogSemesters?: CatalogSemester[]
  currentTerm?: { nam_hoc?: string | null, hoc_ky?: string | null } | null
}) {
  const key = studentStudyPlanPageCacheKey(username)
  if (!key) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify({
    ...payload,
    cachedAt: Date.now(),
  }))
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

function studentStudyPlanRegistrationCacheKey(username?: string | null) {
  return username ? `student-study-plan-registration:${username}` : null
}

function readStudentStudyPlanRegistrationCache(username?: string | null) {
  const key = studentStudyPlanRegistrationCacheKey(username)
  if (!key) {
    return null
  }

  try {
    const cached = window.localStorage.getItem(key)
    if (!cached) {
      return null
    }

    const parsed = JSON.parse(cached) as {
      canRegister?: boolean
      maxCredits?: number
      targetTerm?: { year?: string, semester?: string } | null
      windowText?: string | null
      startsAt?: string | null
      endsAt?: string | null
    }
    const startsAt = parsed.startsAt ? new Date(parsed.startsAt).getTime() : null
    const endsAt = parsed.endsAt ? new Date(parsed.endsAt).getTime() : null
    const now = Date.now()
    const isInsideWindow = startsAt !== null && endsAt !== null && startsAt <= now && now <= endsAt

    return {
      canRegister: Boolean(parsed.canRegister && isInsideWindow),
      maxCredits: typeof parsed.maxCredits === 'number' ? parsed.maxCredits : 45,
      targetTerm: parsed.targetTerm?.year && parsed.targetTerm?.semester
        ? { year: parsed.targetTerm.year, semester: parsed.targetTerm.semester }
        : null,
      windowText: parsed.windowText ?? null,
    }
  } catch {
    return null
  }
}

function writeStudentStudyPlanRegistrationCache(username: string | undefined | null, payload: {
  canRegister: boolean
  maxCredits: number
  targetTerm?: { year: string, semester: string } | null
  windowText?: string | null
  startsAt?: string | null
  endsAt?: string | null
}) {
  const key = studentStudyPlanRegistrationCacheKey(username)
  if (!key) {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(payload))
}

const defaultProps: CurriculumPlanPageProps = {
  mode: 'studyplan',
  roleLabel: 'Sinh viên',
  backLink: '/sinhvien',
  title: 'Kế hoạch học tập của tôi',
  description: 'Danh sách học phần theo ngành và phiên bản chương trình đào tạo sinh viên đang theo học.',
}

function programLabel(program: CurriculumProgram) {
  const major = program.nganh_dao_tao?.ten_nganh || 'Chưa rõ ngành'
  const version = program.versions?.[0]
  const cohort = version?.ghi_chu?.match(/K\d+/i)?.[0]?.toUpperCase()
    ?? (version?.version_no === 1 ? 'K65' : null)
  return `${program.ma_ctdt} - ${major}${cohort ? ` (${cohort})` : ''}`
}

function parentGroupName(name: string) {
  return name
    .replace(/\s*-\s*học phần\s+(bắt buộc|tự chọn)\s*$/i, '')
    .trim()
}

function parentGroupCode(code: string) {
  if (code.startsWith('GDTC_THECHAT')) {
    return 'GDTC_TCQPAN'
  }

  return code.replace(/_(BB|TC)$/i, '')
}

function sectionNumber(code: string) {
  if (code.startsWith('GDTC_XHNVNT')) return 'I.1'
  if (code.startsWith('GDTC_TOANTINTN_CNMT')) return 'I.2'
  if (code.startsWith('GDTC_NGOAINGU')) return 'I.3'
  if (code.startsWith('GDTC_TCQPAN') || code.startsWith('GDTC_THECHAT')) return 'I.4'
  if (code.startsWith('GDCN_COSONGANH')) return 'II.1'
  if (code.startsWith('GDCN_TOTNGHIEP')) return 'II.3'
  if (code.startsWith('GDCN_')) return 'II.2'
  return ''
}

function sectionTitle(code: string, fallback: string) {
  if (code.startsWith('GDTC_XHNVNT')) return 'Xã hội, Nhân văn và Nghệ thuật'
  if (code.startsWith('GDTC_TOANTINTN_CNMT')) return 'Toán, Tin học, Tự nhiên, CN&MT'
  if (code.startsWith('GDTC_NGOAINGU')) return 'Ngoại ngữ'
  if (code.startsWith('GDTC_TCQPAN') || code.startsWith('GDTC_THECHAT')) return 'Thể chất và Quốc phòng - An ninh'
  if (code.startsWith('GDCN_COSONGANH')) return 'Cơ sở ngành'
  if (code === 'GDCN_TOTNGHIEP_CHUNG') return 'Tốt nghiệp'
  if (code.startsWith('GDCN_NGANH')) return 'Ngành'
  return fallback
}

function isSpecializationGroup(code: string) {
  return /_(CNPM|HTTT|TTMMT)$/.test(code)
}

function subsectionCredits(items: CurriculumCourse[], fallback: number) {
  return items.length > 0 ? items.reduce((sum, item) => sum + item.so_tin_chi, 0) : fallback
}

function termSortValue(year?: string | null, semester?: string | null) {
  const startYear = Number(year?.slice(0, 4)) || 0
  const semesterOrder = semester === '1' ? 1 : semester === '2' ? 2 : semester === 'Hè' ? 3 : 9
  return startYear * 10 + semesterOrder
}

function gradeNumber(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function displayAchievedScore(grade?: StudentGradeRow) {
  if (!grade) {
    return ''
  }

  const score = gradeNumber(grade.average_score)

  if (score === null) {
    return ''
  }

  if (grade.grade_mode === 'pass_fail') {
    return score >= 10 ? 'Đạt' : 'Chưa đạt'
  }

  return score.toFixed(1)
}

function admissionYearFromCurriculum(curriculum?: CurriculumDetail | null) {
  const note = curriculum?.ghi_chu ?? ''
  const cohort = note.match(/K(\d+)/i)?.[1]

  if (cohort) {
    return 1958 + Number(cohort)
  }

  return curriculum?.version_no === 1 ? 2023 : null
}

function plannedTermFromRecommendedSemester(recommendedSemester?: number | null, admissionYear?: number | null) {
  if (!recommendedSemester || !admissionYear) {
    return { year: null, semester: null }
  }

  const startYear = admissionYear + Math.floor((recommendedSemester - 1) / 2)

  return {
    year: `${startYear}-${startYear + 1}`,
    semester: recommendedSemester % 2 === 1 ? '1' : '2',
  }
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default function StudentStudyPlanPage() {
  const config = defaultProps
  const navigate = useNavigate()
  const { user, me } = useAuth()
  const { showAlert, clearAlerts } = useAlert()
  const isStudentShell = config.mode === 'studyplan'
  const isStudentMode = isStudentShell && user?.role === 'student'
  const cachedRegistrationOnBoot = isStudentShell
    ? readStudentStudyPlanRegistrationCache(authStorage.getUser()?.username)
    : null
  const endpointPrefix = config.staffEndpointPrefix ?? '/curriculum-programs'
  const [programs, setPrograms] = useState<CurriculumProgram[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)
  const [curriculum, setCurriculum] = useState<CurriculumDetail | null>(null)
  const [currentTermText, setCurrentTermText] = useState<string | null>(null)
  const [, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [catalogYears, setCatalogYears] = useState<CatalogYear[]>([])
  const [catalogSemesters, setCatalogSemesters] = useState<CatalogSemester[]>([])
  const [studentFilters, setStudentFilters] = useState({
    year: '',
    semester: '',
    searchField: 'code',
    searchValue: '',
    sortBy: 'term',
    sortDirection: 'asc',
  })

  const [sysAcademicYear, setSysAcademicYear] = useState(() => readCachedCurrentTerm().year)
  const [sysSemester, setSysSemester] = useState(() => readCachedCurrentTerm().semester)
  const [studentActiveView, setStudentActiveView] = useState<'curriculum' | 'studyplan'>('curriculum')
  const [plannedCourseIds, setPlannedCourseIds] = useState<number[]>([])
  const [plannedCourseTerms, setPlannedCourseTerms] = useState<Record<number, { year: string, semester: string }>>({})
  const [selectedStudyPlanCourseIds, setSelectedStudyPlanCourseIds] = useState<number[]>([])
  const [plannedConfirmedAt, setPlannedConfirmedAt] = useState<string | null>(null)
  const [studyPlanCanRegister, setStudyPlanCanRegister] = useState(cachedRegistrationOnBoot?.canRegister ?? false)
  const [studyPlanWindowText, setStudyPlanWindowText] = useState<string | null>(cachedRegistrationOnBoot?.windowText ?? null)
  const [studyPlanTargetTerm, setStudyPlanTargetTerm] = useState<{ year: string, semester: string } | null>(cachedRegistrationOnBoot?.targetTerm ?? null)
  const [studyPlanMaxCredits, setStudyPlanMaxCredits] = useState(cachedRegistrationOnBoot?.maxCredits ?? 45)
  const [isSubmittingStudyPlan, setIsSubmittingStudyPlan] = useState(false)
  const [studyPlanPageSize, setStudyPlanPageSize] = useState('20')
  const [studyPlanDialog, setStudyPlanDialog] = useState<'curriculum' | 'quick' | null>(null)
  const [curriculumDialogCourseIds, setCurriculumDialogCourseIds] = useState<number[]>([])
  const [quickCourseCode, setQuickCourseCode] = useState('')
  const [studentGrades, setStudentGrades] = useState<StudentGradeRow[]>([])

  useEffect(() => {
    if (!user || (user.role === 'student' && user.advisor === undefined)) {
      void me()
    }
  }, [me, user])

  useEffect(() => {
    let active = true

    if (isStudentMode) {
      const cached = readStudentStudyPlanPageCache(user?.username)
      if (cached) {
        setCurriculum(cached.curriculum ?? null)
        setCatalogYears(cached.catalogYears ?? [])
        setCatalogSemesters(cached.catalogSemesters ?? [])
        const term = cached.currentTerm
        setCurrentTermText(term?.nam_hoc && term?.hoc_ky ? `${term.nam_hoc} - HK ${term.hoc_ky}` : null)
      }
    }

    const loadInitialData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (!user?.role) {
          return
        }

        if (isStudentMode) {
          const [yearsResult, semestersResult, curriculumResult, gradesResult] = await Promise.allSettled([
            apiGet<ApiListResponse<CatalogYear[]>>('/academic-catalog/nam-hocs'),
            apiGet<ApiListResponse<CatalogSemester[]>>('/academic-catalog/hoc-kys'),
            apiGet<StudentCurriculumResponse>('/student/curriculum'),
            apiGet<StudentGradesResponse>('/student/grades'),
          ] as const)

          if (!active) return

          if (yearsResult.status === 'fulfilled') {
            setCatalogYears(yearsResult.value.data)
          }

          if (semestersResult.status === 'fulfilled') {
            setCatalogSemesters(semestersResult.value.data)
          }

          if (gradesResult.status === 'fulfilled') {
            setStudentGrades(gradesResult.value.data)
          }

          if (curriculumResult.status === 'rejected') {
            throw curriculumResult.reason
          }

          const response = curriculumResult.value
          const studentCurriculum = response.data?.curriculum ?? null
          let nextCurriculum = studentCurriculum
          const years = yearsResult.status === 'fulfilled' ? yearsResult.value.data : []
          const semesters = semestersResult.status === 'fulfilled' ? semestersResult.value.data : []

          if (studentCurriculum) {
            setCurriculum(studentCurriculum)
          } else {
            const fallbackPrograms = await apiGet<ApiListResponse<CurriculumProgram[]>>('/curriculum-programs')
            const fallbackProgramId = fallbackPrograms.data[0]?.id

            if (fallbackProgramId) {
              const fallbackDetail = await apiGet<ProgramDetailResponse>(`/curriculum-programs/${fallbackProgramId}`)
              nextCurriculum = fallbackDetail.data?.curriculum ?? null
              setCurriculum(nextCurriculum)
            } else {
              setCurriculum(null)
            }
          }

          const term = response.data?.current_term
          writeStudentStudyPlanPageCache(user?.username, {
            curriculum: nextCurriculum,
            catalogYears: years,
            catalogSemesters: semesters,
            currentTerm: term ?? null,
          })
          setCurrentTermText(term?.nam_hoc && term?.hoc_ky ? `${term.nam_hoc} - HK ${term.hoc_ky}` : null)
          setStudentFilters((current) => ({
            ...current,
            year: term?.nam_hoc?.trim() || current.year,
            semester: term?.hoc_ky?.trim() || current.semester,
          }))
          return
        }

        const response = await apiGet<ApiListResponse<CurriculumProgram[]>>(endpointPrefix)
        if (!active) return
        setPrograms(response.data)
        setSelectedProgramId(response.data[0]?.id ?? null)
      } catch {
        if (active) {
          if (isStudentMode) {
            try {
              const fallbackPrograms = await apiGet<ApiListResponse<CurriculumProgram[]>>('/curriculum-programs')
              const fallbackProgramId = fallbackPrograms.data[0]?.id

              if (fallbackProgramId) {
                const fallbackDetail = await apiGet<ProgramDetailResponse>(`/curriculum-programs/${fallbackProgramId}`)
                if (!active) return
                setCurriculum(fallbackDetail.data?.curriculum ?? null)
                setError(null)
                return
              }
            } catch {
              // Fall through to the student-facing message below.
            }
          }

          setError(isStudentMode ? 'Sinh viên chưa có chương trình đào tạo để hiển thị.' : 'Không tải được danh sách CTĐT.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialData()

    return () => {
      active = false
    }
  }, [endpointPrefix, isStudentMode, user?.role, user?.username])

  useEffect(() => {
    if (!isStudentMode || !user?.username) {
      return
    }

    let active = true

    const loadStudentHeader = async () => {
      const [currentTermResult] = await Promise.allSettled([
        apiGet<CurrentAcademicTermResponse>('/academic-catalog/current-term'),
      ])

      if (!active) {
        return
      }

      if (currentTermResult.status === 'fulfilled') {
        const term = currentTermResult.value.data
        const year = term?.nam_hoc?.trim() || null
        const semester = term?.hoc_ky?.trim() || null
        setSysAcademicYear(year || FALLBACK_CURRENT_TERM.year)
        setSysSemester(semester || FALLBACK_CURRENT_TERM.semester)
        cacheCurrentTerm(year, semester)
        setStudentFilters((current) => ({
          ...current,
          year: year || current.year,
          semester: semester || current.semester,
        }))
      } else {
        const cached = readCachedCurrentTerm()
        setSysAcademicYear(cached.year)
        setSysSemester(cached.semester)
      }
    }

    void loadStudentHeader()

    return () => {
      active = false
    }
  }, [isStudentMode, user?.username])

  useEffect(() => {
    if (!isStudentMode || !user?.username) {
      return
    }

    const cachedRegistration = readStudentStudyPlanRegistrationCache(user.username)
    if (cachedRegistration) {
      setStudyPlanCanRegister(cachedRegistration.canRegister)
      setStudyPlanMaxCredits(cachedRegistration.maxCredits)
      setStudyPlanTargetTerm(cachedRegistration.targetTerm)
      setStudyPlanWindowText(cachedRegistration.windowText)
      if (cachedRegistration.targetTerm) {
        setStudentFilters((current) => ({
          ...current,
          year: cachedRegistration.targetTerm?.year || current.year,
          semester: cachedRegistration.targetTerm?.semester || current.semester,
        }))
      }
    }

    const savedPlan = window.localStorage.getItem(`student-study-plan:${user.username}`)

    if (!savedPlan) {
      return
    }

    try {
      const parsed = JSON.parse(savedPlan) as {
        courseIds?: number[],
        confirmedAt?: string | null,
        courseTerms?: Record<string, { year?: string, semester?: string }>
      }

      setPlannedCourseIds(Array.isArray(parsed.courseIds) ? parsed.courseIds : [])
      setPlannedCourseTerms(Object.fromEntries(
        Object.entries(parsed.courseTerms ?? {}).map(([courseId, term]) => [
          Number(courseId),
          { year: term.year ?? '', semester: term.semester ?? '' },
        ]),
      ))
      setPlannedConfirmedAt(parsed.confirmedAt ?? null)
    } catch {
      setPlannedCourseIds([])
      setPlannedCourseTerms({})
      setPlannedConfirmedAt(null)
    }
  }, [isStudentMode, user?.username])

  useEffect(() => {
    setSelectedStudyPlanCourseIds((current) => current.filter((id) => plannedCourseIds.includes(id)))
    setPlannedCourseTerms((current) => Object.fromEntries(
      Object.entries(current).filter(([courseId]) => plannedCourseIds.includes(Number(courseId))),
    ))
  }, [plannedCourseIds])

  useEffect(() => {
    setSelectedStudyPlanCourseIds([])
  }, [studentFilters.year, studentFilters.semester])

  useEffect(() => {
    if (!isStudentMode) {
      return
    }

    let active = true

    const loadStudyPlanRegistration = async () => {
      try {
        const response = await apiGet<StudyPlanRegistrationResponse>('/student/study-plan-registration')
        if (!active) return

        const data = response.data
        const period = data?.registration_period
        const targetYear = period?.target_term?.nam_hoc?.trim() ?? ''
        const targetSemester = period?.target_term?.hoc_ky?.trim() ?? ''
        const windowText = period
          ? `${period.target_term?.nam_hoc ?? ''} - HK ${period.target_term?.hoc_ky ?? ''} (${period.starts_at ?? ''} đến ${period.ends_at ?? ''})`
          : null

        setStudyPlanMaxCredits(data?.max_credits ?? 45)
        setStudyPlanCanRegister(Boolean(data?.can_register))
        setStudyPlanTargetTerm(targetYear && targetSemester ? { year: targetYear, semester: targetSemester } : null)
        setStudyPlanWindowText(windowText)
        writeStudentStudyPlanRegistrationCache(user?.username, {
          canRegister: Boolean(data?.can_register),
          maxCredits: data?.max_credits ?? 45,
          targetTerm: targetYear && targetSemester ? { year: targetYear, semester: targetSemester } : null,
          windowText,
          startsAt: period?.starts_at ?? null,
          endsAt: period?.ends_at ?? null,
        })
        /*
          ? `${period.target_term?.nam_hoc ?? ''} - HK ${period.target_term?.hoc_ky ?? ''} (${period.starts_at ?? ''} đến ${period.ends_at ?? ''})`
          : null)
        */
        if (targetYear && targetSemester) {
          setStudentFilters((current) => ({
            ...current,
            year: targetYear,
            semester: targetSemester,
          }))
        }

        if (data?.plan) {
          const planYear = data.plan.term?.nam_hoc?.trim() ?? ''
          const planSemester = data.plan.term?.hoc_ky?.trim() ?? ''

          if (planYear && planSemester) {
            if (!period) {
              setStudyPlanTargetTerm({ year: planYear, semester: planSemester })
            }
            setStudentFilters((current) => ({
              ...current,
              year: planYear,
              semester: planSemester,
            }))
          }

          setPlannedCourseIds(Array.isArray(data.plan.course_ids) ? data.plan.course_ids : [])
          if (data.plan.term?.nam_hoc && data.plan.term?.hoc_ky && Array.isArray(data.plan.course_ids)) {
            setPlannedCourseTerms(Object.fromEntries(
              (data.plan.course_terms && data.plan.course_terms.length > 0
                ? data.plan.course_terms
                : data.plan.course_ids.map((courseId) => ({
                  course_id: courseId,
                  term: data.plan?.term,
                }))
              ).map((item) => [
                item.course_id,
                {
                  year: item.term?.nam_hoc ?? data.plan?.term?.nam_hoc ?? '',
                  semester: item.term?.hoc_ky ?? data.plan?.term?.hoc_ky ?? '',
                },
              ]),
            ))
          }
          setPlannedConfirmedAt(data.plan.submitted_at ?? null)
        } else {
          setPlannedCourseIds([])
          setPlannedCourseTerms({})
          setSelectedStudyPlanCourseIds([])
          setPlannedConfirmedAt(null)
          if (user?.username) {
            window.localStorage.removeItem(`student-study-plan:${user.username}`)
          }
        }
      } catch {
        if (!active) return
        setStudyPlanCanRegister(false)
        setStudyPlanTargetTerm(null)
        setSelectedStudyPlanCourseIds([])
      }
    }

    void loadStudyPlanRegistration()

    return () => {
      active = false
    }
  }, [isStudentMode, user?.username])

  useEffect(() => {
    if (isStudentMode || !selectedProgramId) {
      return
    }

    let active = true

    const loadDetail = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await apiGet<ProgramDetailResponse>(`${endpointPrefix}/${selectedProgramId}`)
        if (active) {
          setCurriculum(response.data?.curriculum ?? null)
        }
      } catch {
        if (active) {
          setError('Không tải được chi tiết chương trình đào tạo.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadDetail()

    return () => {
      active = false
    }
  }, [endpointPrefix, isStudentMode, selectedProgramId])

  const totals = useMemo(() => {
    const groups = curriculum?.groups ?? []
    const requiredCredits = curriculum?.chuong_trinh_dao_tao?.tong_tin_chi_yeu_cau
    const credits = requiredCredits ?? groups.reduce((sum, group) => sum + group.min_tin_chi, 0)
    const courses = groups.reduce((sum, group) => sum + group.items.length, 0)
    return { credits, courses, groups: groups.length }
  }, [curriculum])

  const generalInfo = useMemo(() => {
    const program = curriculum?.chuong_trinh_dao_tao
    const major = program?.nganh_dao_tao
    const duration = major?.thoi_gian_dao_tao ? `${major.thoi_gian_dao_tao} năm` : '4 năm'

    return [
      ['Ngành đào tạo', major?.ten_nganh || 'Chưa cập nhật'],
      ['Mã số ngành đào tạo', major?.ma_nganh || 'Chưa cập nhật'],
      ['Trình độ đào tạo', 'Đại học'],
      ['Hình thức đào tạo', major?.he_dao_tao?.includes('Chính quy') ? 'Chính quy' : major?.he_dao_tao || 'Chính quy'],
      ['Thời gian đào tạo', duration],
      ['Tên văn bằng tốt nghiệp', `Cử nhân ${major?.ten_nganh || program?.ten_ctdt || ''}`.trim()],
      ['Tổng số tín chỉ', `${totals.credits}`],
    ]
  }, [curriculum, totals.credits])

  const curriculumRows = useMemo(() => {
    let index = 0
    const groups = new Map<string, {
      id: string
      ma_nhom: string
      ten_nhom: string
      min_tin_chi: number
      optional_min_tin_chi: number
      requiredItems: CurriculumCourse[]
      optionalItems: CurriculumCourse[]
    }>()

      ; (curriculum?.groups ?? []).forEach((group) => {
        const tenNhom = parentGroupName(group.ten_nhom)
        const maNhom = parentGroupCode(group.ma_nhom)
        const tenHienThi = sectionTitle(maNhom, tenNhom)
        const key = `${maNhom}-${tenHienThi}`.toLowerCase()
        const requiredItems = group.items.filter((item) => item.vai_tro === 'bat_buoc')
        const optionalItems = group.items.filter((item) => item.vai_tro === 'tu_chon')
        const existing = groups.get(key)
        const entry = existing ?? {
          id: key,
          ma_nhom: maNhom,
          ten_nhom: tenHienThi,
          min_tin_chi: 0,
          optional_min_tin_chi: 0,
          requiredItems: [],
          optionalItems: [],
        }

        entry.min_tin_chi += group.min_tin_chi
        if (optionalItems.length > 0) {
          entry.optional_min_tin_chi += group.min_tin_chi
        }

        entry.requiredItems.push(...requiredItems)
        entry.optionalItems.push(...optionalItems)
        groups.set(key, entry)
      })

    return Array.from(groups.values()).map((group) => ({
      group,
      requiredItems: group.requiredItems.map((item) => ({ ...item, rowNo: ++index })),
      optionalItems: group.optionalItems.map((item) => ({ ...item, rowNo: ++index })),
    }))
  }, [curriculum])

  const generalEducationRows = curriculumRows.filter(({ group }) => group.ma_nhom.startsWith('GDTC_'))
  const professionalRows = curriculumRows.filter(({ group }) => group.ma_nhom.startsWith('GDCN_'))
  const foundationRows = professionalRows.filter(({ group }) => group.ma_nhom.startsWith('GDCN_COSONGANH'))
  const industryRows = professionalRows.filter(({ group }) => (
    group.ma_nhom.startsWith('GDCN_NGANH')
    || group.ma_nhom.startsWith('GDCN_CNPM')
    || group.ma_nhom.startsWith('GDCN_HTTT')
    || group.ma_nhom.startsWith('GDCN_TTMMT')
  ))
  const graduationRows = professionalRows.filter(({ group }) => group.ma_nhom.startsWith('GDCN_TOTNGHIEP'))
  const sumCredits = (rows: typeof curriculumRows) => rows.reduce((sum, row) => sum + row.group.min_tin_chi, 0)
  const studentAdmissionYear = admissionYearFromCurriculum(curriculum)
  const achievedGradeByCourseCode = useMemo(() => {
    const map = new Map<string, StudentGradeRow>()

    studentGrades.forEach((grade) => {
      const code = grade.ma_hoc_phan?.trim().toUpperCase()
      const score = gradeNumber(grade.average_score)

      if (!code || score === null || grade.result === 'failed') {
        return
      }

      const current = map.get(code)
      if (!current || termSortValue(grade.nam_hoc, grade.hoc_ky) >= termSortValue(current.nam_hoc, current.hoc_ky)) {
        map.set(code, grade)
      }
    })

    return map
  }, [studentGrades])
  const studentPlanRows = curriculumRows
    .flatMap(({ requiredItems, optionalItems }) => [
      ...requiredItems.map((course) => ({ ...course, groupName: 'Kiến thức chung' })),
      ...optionalItems.map((course) => ({ ...course, groupName: 'Kiến thức chung' })),
    ])
    .filter((course) => !course.ma_hoc_phan.toUpperCase().startsWith('QPAD'))
    .map((course) => {
      const plannedTerm = plannedTermFromRecommendedSemester(course.hoc_ky_goi_y, studentAdmissionYear)
      const achievedGrade = achievedGradeByCourseCode.get(course.ma_hoc_phan.trim().toUpperCase())

      return {
        ...course,
        nam_hoc_mo_hien_thi: course.nam_hoc_mo ?? plannedTerm.year,
        hoc_ky_mo_hien_thi: course.hoc_ky_mo ?? plannedTerm.semester,
        nam_hoc_dat: achievedGrade?.nam_hoc ?? course.nam_hoc_dat,
        hoc_ky_dat: achievedGrade?.hoc_ky ?? course.hoc_ky_dat,
        diem_dat: displayAchievedScore(achievedGrade) || course.diem_dat,
      }
    })
    .filter((course, index, courses) => (
      courses.findIndex((candidate) => candidate.ma_hoc_phan === course.ma_hoc_phan) === index
    ))
    .sort((left, right) => (
      termSortValue(left.nam_hoc_mo_hien_thi, left.hoc_ky_mo_hien_thi)
      - termSortValue(right.nam_hoc_mo_hien_thi, right.hoc_ky_mo_hien_thi)
    ) || left.ma_hoc_phan.localeCompare(right.ma_hoc_phan))
    .map((course, index) => ({ ...course, studentRowNo: index + 1 }))
  const computedStudentYears = Array.from(new Set(studentPlanRows.map((course) => course.nam_hoc_mo_hien_thi).filter(Boolean) as string[]))
    .sort()
  const computedStudentSemesters = Array.from(new Set(studentPlanRows.map((course) => course.hoc_ky_mo_hien_thi).filter(Boolean) as string[]))
    .sort((left, right) => termSortValue('2000-2001', left) - termSortValue('2000-2001', right))
  const studentYears = catalogYears.length > 0
    ? catalogYears.map((year) => year.nam_hoc).sort()
    : computedStudentYears
  const studentSemesters = catalogSemesters.length > 0
    ? Array.from(new Set(catalogSemesters.map((semester) => semester.hoc_ky)))
      .sort((left, right) => termSortValue('2000-2001', left) - termSortValue('2000-2001', right))
    : computedStudentSemesters
  const studentCourseCodes = Array.from(new Set(studentPlanRows.map((course) => course.ma_hoc_phan)))
    .sort((left, right) => left.localeCompare(right))
  const studentCourseNames = Array.from(new Set(studentPlanRows.map((course) => course.ten_hoc_phan)))
    .sort((left, right) => left.localeCompare(right))
  const studentSearchOptions = studentFilters.searchField === 'name' ? studentCourseNames : studentCourseCodes
  const studyPlanYearOptions = studentYears
  const studyPlanSemesterOptions = studentSemesters
  const getSemesterOptionsForYear = (year?: string | null) => {
    if (!year) {
      return studyPlanSemesterOptions
    }

    const selectedYear = catalogYears.find((item) => item.nam_hoc === year)
    if (!selectedYear) {
      return studyPlanSemesterOptions
    }

    const semesters = catalogSemesters
      .filter((semester) => semester.nam_hoc_id === selectedYear.id)
      .map((semester) => semester.hoc_ky)

    return semesters.length > 0 ? Array.from(new Set(semesters)) : studyPlanSemesterOptions
  }
  const quickMatchedCourse = quickCourseCode.trim()
    ? studentPlanRows.find((course) => course.ma_hoc_phan.toLowerCase() === quickCourseCode.trim().toLowerCase()) ?? null
    : null
  const filteredStudentRows = studentPlanRows
    .filter((course) => (
      (!studentFilters.year || course.nam_hoc_mo_hien_thi === studentFilters.year)
      && (!studentFilters.semester || course.hoc_ky_mo_hien_thi === studentFilters.semester)
      && (!studentFilters.searchValue || (
        studentFilters.searchField === 'name'
          ? course.ten_hoc_phan.toLowerCase().includes(studentFilters.searchValue.toLowerCase())
          : course.ma_hoc_phan.toLowerCase().includes(studentFilters.searchValue.toLowerCase())
      ))
    ))
    .sort((left, right) => {
      const direction = studentFilters.sortDirection === 'desc' ? -1 : 1
      let result = 0

      if (studentFilters.sortBy === 'course') {
        result = left.ma_hoc_phan.localeCompare(right.ma_hoc_phan)
      } else if (studentFilters.sortBy === 'name') {
        result = left.ten_hoc_phan.localeCompare(right.ten_hoc_phan)
      } else if (studentFilters.sortBy === 'group') {
        result = left.groupName.localeCompare(right.groupName)
      } else if (studentFilters.sortBy === 'required') {
        result = Number(left.vai_tro === 'bat_buoc') - Number(right.vai_tro === 'bat_buoc')
      } else {
        result = termSortValue(left.nam_hoc_mo_hien_thi, left.hoc_ky_mo_hien_thi) - termSortValue(right.nam_hoc_mo_hien_thi, right.hoc_ky_mo_hien_thi)
      }

      return result * direction || left.ma_hoc_phan.localeCompare(right.ma_hoc_phan)
    })
    .map((course, index) => ({ ...course, studentRowNo: index + 1 }))
  const studentProgram = curriculum?.chuong_trinh_dao_tao
  const studentMajor = studentProgram?.nganh_dao_tao
  const cachedUserName = authStorage.getUser()?.name?.trim() || null
  const displayName = user?.name?.trim() || cachedUserName || ''
  const advisor = user?.advisor
  const advisorLine = advisor?.hasAdvisor
    ? [
        advisor.code ? `Mã cố vấn: ${advisor.code}` : null,
        advisor.name ? `Họ tên: ${advisor.name}` : null,
        advisor.phone ? `Điện thoại: ${advisor.phone}` : null,
        advisor.email ? `Email: ${advisor.email}` : null,
      ].filter(Boolean).join('. ')
    : 'Không có cố vấn học tập'
  const filteredStudentTotalCredits = filteredStudentRows.reduce((sum, course) => sum + course.so_tin_chi, 0)
  const plannedStudentRows = studentPlanRows
    .filter((course) => plannedCourseIds.includes(course.id))
    .map((course, index) => ({
      ...course,
      nam_hoc_mo_hien_thi: plannedCourseTerms[course.id]?.year || studyPlanTargetTerm?.year || course.nam_hoc_mo_hien_thi,
      hoc_ky_mo_hien_thi: plannedCourseTerms[course.id]?.semester || studyPlanTargetTerm?.semester || course.hoc_ky_mo_hien_thi,
      studentRowNo: index + 1,
    }))
  const studyPlanCourseCodes = Array.from(new Set(plannedStudentRows.map((course) => course.ma_hoc_phan)))
    .sort((left, right) => left.localeCompare(right))
  const studyPlanCourseNames = Array.from(new Set(plannedStudentRows.map((course) => course.ten_hoc_phan)))
    .sort((left, right) => left.localeCompare(right))
  const studyPlanSearchOptions = studentFilters.searchField === 'name' ? studyPlanCourseNames : studyPlanCourseCodes
  const studyPlanFilteredRows = plannedStudentRows
    .filter((course) => (
      (!studentFilters.year || course.nam_hoc_mo_hien_thi === studentFilters.year)
      && (!studentFilters.semester || course.hoc_ky_mo_hien_thi === studentFilters.semester)
      && (!studentFilters.searchValue || (
        studentFilters.searchField === 'name'
          ? course.ten_hoc_phan.toLowerCase().includes(studentFilters.searchValue.toLowerCase())
          : course.ma_hoc_phan.toLowerCase().includes(studentFilters.searchValue.toLowerCase())
      ))
    ))
    .map((course, index) => ({ ...course, studentRowNo: index + 1 }))
  const studyPlanVisibleRows = studyPlanFilteredRows.slice(0, getPageSizeNumber(studyPlanPageSize, studyPlanFilteredRows.length))
  const studyPlanFilteredTotalCredits = studyPlanFilteredRows.reduce((sum, course) => sum + course.so_tin_chi, 0)
  const studentExportTitle = 'Danh Sách Học Phần Thuộc Chương Trình Đào Tạo Thực Hiện'
  const studentExportInfo = `Hệ: ${user?.educationSystem || 'Đại học và Cao đẳng chính quy'}. Ngành: ${studentMajor?.ten_nganh || 'Chưa cập nhật'} (${studentMajor?.ma_nganh || '---'}). Khóa học: ${studentAdmissionYear ?? 2023} (65). Mô hình đào tạo Tín chỉ.`

  const courseSyllabusHref = (course: CurriculumCourse) => (
    dchpHrefForCourseCode(course.ma_hoc_phan)
      || [course.tai_lieu_tham_khao_url, course.de_cuong_hoc_phan_url]
        .map((url) => url?.trim())
        .find((url) => url && !url.startsWith('/dchp/'))
      || null
  )

  const buildStudentExportHtml = (forPrint = false) => {
    const isStudyPlanExport = isStudentMode && studentActiveView === 'studyplan'
    const exportRows = isStudyPlanExport ? studyPlanFilteredRows : filteredStudentRows
    const exportTitle = isStudyPlanExport ? 'Kế Hoạch Học Tập Sinh Viên' : studentExportTitle
    const exportTotalCredits = exportRows.reduce((sum, course) => sum + course.so_tin_chi, 0)
    const rows = exportRows.map((course) => isStudyPlanExport ? `
      <tr>
        <td class="center bold">${course.studentRowNo}</td>
        <td>${escapeHtml(course.ma_hoc_phan)}</td>
        <td>${escapeHtml(course.ten_hoc_phan)}</td>
        <td class="right">${course.so_tin_chi}</td>
        <td class="center">Đã duyệt</td>
        <td class="center">${escapeHtml(course.nam_hoc_mo_hien_thi ?? '')}</td>
        <td class="center">${escapeHtml(course.hoc_ky_mo_hien_thi ?? '')}</td>
      </tr>
    ` : `
      <tr>
        <td class="center bold">${course.studentRowNo}</td>
        <td>${escapeHtml(course.ma_hoc_phan)}</td>
        <td class="course">${escapeHtml(course.ten_hoc_phan)}</td>
        <td class="right">${course.so_tin_chi}</td>
        <td></td>
        <td>${escapeHtml(course.groupName)}</td>
        <td class="center">${escapeHtml(course.nam_hoc_mo_hien_thi ?? '')}</td>
        <td class="center">${escapeHtml(course.hoc_ky_mo_hien_thi ?? '')}</td>
        <td class="center">x</td>
        <td class="center">${course.vai_tro === 'bat_buoc' ? 'x' : ''}</td>
        <td class="center">x</td>
        <td class="center">x</td>
        <td></td>
        <td></td>
      </tr>
    `).join('')
    const tableHead = isStudyPlanExport ? `
        <tr>
          <th>Stt</th>
          <th>Mã học phần</th>
          <th>Tên học phần</th>
          <th>ĐVHT/TC</th>
          <th>Duyệt</th>
          <th>Năm học</th>
          <th>Học kỳ</th>
        </tr>
    ` : `
        <tr>
          <th>Stt</th>
          <th>Mã học phần</th>
          <th>Tên học phần</th>
          <th>ĐVHT/TC</th>
          <th>Tài liệu tham khảo</th>
          <th>Nhóm kiến thức</th>
          <th>Năm học</th>
          <th>Học kỳ</th>
          <th>HP cứng</th>
          <th>HP bắt buộc</th>
          <th>Học phần xét luận văn</th>
          <th>Học phần xét học bổng</th>
          <th>HP thi tốt nghiệp</th>
          <th>Học phần tiên quyết</th>
        </tr>
    `

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  ${printFaviconLink}
  <title>${escapeHtml(exportTitle)}</title>
  <style>
    ${printBrandStyles}
    body { font-family: "Times New Roman", Arial, sans-serif; font-size: 12pt; color: #000; }
    .sheet { padding: ${forPrint ? '16px' : '0'}; }
    .top { width: 100%; border-collapse: collapse; margin-bottom: 26px; }
    .top td { border: 0; text-align: center; font-weight: 700; line-height: 1.35; }
    .title { text-align: center; font-weight: 700; margin-bottom: 8px; }
    .info { font-weight: 700; margin-bottom: 4px; }
    table.data { border-collapse: collapse; width: 100%; }
    .data th, .data td { border: 1px solid #000; padding: 4px; vertical-align: middle; }
    .data th { text-align: center; font-weight: 700; }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 700; }
    .course { color: #0563c1; text-decoration: underline; }
    .total { font-weight: 700; margin-top: 4px; }
    @page { size: A4 landscape; margin: 10mm; }
  </style>
</head>
<body>
  <div class="sheet">
    <table class="top">
      <tr>
        <td style="width: 45%;">${printBrandHtml(MINISTRY_NAME)}</td>
        <td style="width: 55%;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />Độc lập - Tự do - Hạnh phúc</td>
      </tr>
    </table>
    <div class="title">${escapeHtml(exportTitle)}</div>
    <div class="info">${escapeHtml(studentExportInfo)}</div>
    <table class="data">
      <thead>${tableHead}</thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total">- Tổng ĐVHT/TC: ${exportTotalCredits}</div>
  </div>
</body>
</html>`
  }

  const handlePrintStudentPlan = () => {
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      return
    }

    printWindow.document.open()
    printWindow.document.write(buildStudentExportHtml(true))
    printWindow.document.close()
    printWindow.focus()
    window.setTimeout(() => printWindow.print(), 300)
  }

  const handleExportStudentExcel = () => {
    const blob = new Blob([`\uFEFF${buildStudentExportHtml()}`], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const year = studentFilters.year || 'tat-ca'
    const semester = studentFilters.semester || 'tat-ca'

    link.href = url
    link.download = `${studentActiveView === 'studyplan' ? 'ke-hoach-hoc-tap' : 'chuong-trinh-dao-tao'}-${year}-hk-${semester}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const persistStudentStudyPlan = (
    courseIds: number[],
    confirmedAt = plannedConfirmedAt,
    courseTerms = plannedCourseTerms,
  ) => {
    if (!user?.username) {
      return
    }

    window.localStorage.setItem(`student-study-plan:${user.username}`, JSON.stringify({
      courseIds,
      courseTerms,
      confirmedAt,
    }))
  }

  const notifyStudyPlan = (variant: 'success' | 'error' | 'info', title: string, message: string) => {
    setError(variant === 'error' ? message : null)
    clearAlerts()
    showAlert({ title, message, variant })
  }

  const updatePlannedCourseTerm = (courseId: number, field: 'year' | 'semester', value: string) => {
    if (!studyPlanCanRegister) {
      notifyStudyPlan('error', 'Không thể đổi học kỳ', 'Hiện không trong thời gian đăng ký kế hoạch học tập.')
      return
    }

    setPlannedCourseTerms((current) => {
      const currentTerm = current[courseId] ?? {
        year: studyPlanTargetTerm?.year || studentFilters.year,
        semester: studyPlanTargetTerm?.semester || studentFilters.semester,
      }
      const nextTerm = { ...currentTerm, [field]: value }
      if (field === 'year') {
        const validSemesters = getSemesterOptionsForYear(value)
        if (!validSemesters.includes(nextTerm.semester)) {
          nextTerm.semester = validSemesters[0] ?? ''
        }
      }
      const next = {
        ...current,
        [courseId]: nextTerm,
      }

      setPlannedConfirmedAt(null)

      return next
    })
  }

  const addCoursesToStudyPlan = (courseIds: number[]) => {
    if (!studyPlanCanRegister) {
      notifyStudyPlan('error', 'Không thể thêm học phần', 'Hiện không trong thời gian đăng ký kế hoạch học tập.')
      return
    }

    if (courseIds.length === 0) {
      notifyStudyPlan('error', 'Chưa chọn học phần', 'Vui lòng chọn học phần cần thêm vào kế hoạch học tập.')
      return
    }

    setPlannedCourseIds((current) => {
      const next = Array.from(new Set([...current, ...courseIds]))
      const nextCredits = studentPlanRows
        .filter((course) => next.includes(course.id))
        .reduce((sum, course) => sum + course.so_tin_chi, 0)

      if (nextCredits > studyPlanMaxCredits) {
        notifyStudyPlan('error', 'Vượt giới hạn tín chỉ', `Tổng số tín chỉ đăng ký KHHT không được vượt quá ${studyPlanMaxCredits} tín chỉ trong một học kỳ.`)
        return current
      }

      const nextTerms = next.reduce<Record<number, { year: string, semester: string }>>((terms, courseId) => {
        terms[courseId] = plannedCourseTerms[courseId] ?? {
          year: studyPlanTargetTerm?.year || studentFilters.year || studentYears[0] || '',
          semester: studyPlanTargetTerm?.semester || studentFilters.semester || studentSemesters[0] || '',
        }
        return terms
      }, {})

      setPlannedCourseTerms(nextTerms)
      setPlannedConfirmedAt(null)
      setError(null)
      setStudyPlanDialog(null)
      setCurriculumDialogCourseIds([])
      setQuickCourseCode('')
      return next
    })
  }

  const togglePlannedCourse = (courseId: number) => {
    if (!studyPlanCanRegister) {
      notifyStudyPlan('error', 'Không thể chọn học phần', 'Hiện không trong thời gian đăng ký kế hoạch học tập.')
      return
    }

    setSelectedStudyPlanCourseIds((current) => (
      current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId]
    ))
  }

  const handleAddCurriculumCourses = () => {
    addCoursesToStudyPlan(curriculumDialogCourseIds)
  }

  const handleAddQuickCourse = () => {
    if (!quickMatchedCourse) {
      notifyStudyPlan('error', 'Không có môn phù hợp', 'Mã học phần bạn nhập không tồn tại trong chương trình đào tạo.')
      return
    }

    addCoursesToStudyPlan([quickMatchedCourse.id])
  }

  const findTermId = (year?: string | null, semester?: string | null) => (
    year && semester
      ? catalogSemesters.find((item) => (
        item.hoc_ky === semester
        && catalogYears.find((catalogYear) => catalogYear.id === item.nam_hoc_id)?.nam_hoc === year
      ))?.id
      : undefined
  )
  const selectedStudyPlanTermId = findTermId(studyPlanTargetTerm?.year, studyPlanTargetTerm?.semester)
  const selectedCourseTerms = plannedStudentRows.map((course) => ({
    course_id: course.id,
    hoc_ky_id: findTermId(course.nam_hoc_mo_hien_thi, course.hoc_ky_mo_hien_thi),
    year: course.nam_hoc_mo_hien_thi,
    semester: course.hoc_ky_mo_hien_thi,
  }))

  const confirmStudentStudyPlan = async () => {
    if (!studyPlanCanRegister) {
      notifyStudyPlan('error', 'Không thể lưu KHHT', 'Hiện không trong thời gian đăng ký kế hoạch học tập.')
      return
    }

    if (!selectedStudyPlanTermId) {
      notifyStudyPlan('error', 'Chưa xác định học kỳ đăng ký', 'Vui lòng chọn năm học và học kỳ hợp lệ trước khi bấm Thực hiện.')
      return
    }

    if (selectedCourseTerms.some((item) => !item.hoc_ky_id)) {
      notifyStudyPlan('error', 'Có học phần chưa có học kỳ hợp lệ', 'Vui lòng kiểm tra lại năm học và học kỳ của từng học phần trước khi bấm Thực hiện.')
      return
    }

    setIsSubmittingStudyPlan(true)

    try {
      const response = await apiPost<SubmitStudyPlanResponse, {
        course_ids: number[],
        hoc_ky_id: number,
        course_terms: Array<{ course_id: number, hoc_ky_id: number }>
      }>(
        '/student/study-plan-registration',
        {
          course_ids: plannedCourseIds,
          hoc_ky_id: selectedStudyPlanTermId,
          course_terms: selectedCourseTerms.map((item) => ({
            course_id: item.course_id,
            hoc_ky_id: item.hoc_ky_id as number,
          })),
        },
      )
      const confirmedAt = response.data?.submitted_at ?? new Date().toISOString()

      setPlannedConfirmedAt(confirmedAt)
      persistStudentStudyPlan(plannedCourseIds, confirmedAt, plannedCourseTerms)
      setSelectedStudyPlanCourseIds([])
      setError(null)
      notifyStudyPlan('success', 'Đã lưu thành công', `Đã lưu ${plannedCourseIds.length} học phần vào kế hoạch học tập.`)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Không thể xác nhận kế hoạch học tập.'
      notifyStudyPlan('error', 'Không thể lưu KHHT', message)
    } finally {
      setIsSubmittingStudyPlan(false)
    }
  }

  const clearStudentStudyPlan = () => {
    if (!studyPlanCanRegister) {
      notifyStudyPlan('error', 'Không thể xóa học phần', 'Hiện không trong thời gian đăng ký kế hoạch học tập.')
      return
    }

    const next = selectedStudyPlanCourseIds.length > 0
      ? plannedCourseIds.filter((id) => !selectedStudyPlanCourseIds.includes(id))
      : []

    setPlannedCourseIds(next)
    const nextTerms = Object.fromEntries(
      Object.entries(plannedCourseTerms).filter(([courseId]) => next.includes(Number(courseId))),
    )
    setPlannedCourseTerms(nextTerms)
    setSelectedStudyPlanCourseIds([])
    setPlannedConfirmedAt(null)
    setError(null)
  }

  const toggleAllVisiblePlannedCourses = () => {
    if (!studyPlanCanRegister) {
      notifyStudyPlan('error', 'Không thể chọn tất cả', 'Hiện không trong thời gian đăng ký kế hoạch học tập.')
      return
    }

    const visibleIds = studyPlanVisibleRows.map((course) => course.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedStudyPlanCourseIds.includes(id))
    setSelectedStudyPlanCourseIds((current) => (
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    ))
    setError(null)
  }

  const renderStudyPlanActions = () => (
    <div className="cp-khht-actions">
      {studyPlanCanRegister && (
        <>
          <button type="button" onClick={() => setStudyPlanDialog('curriculum')}>
            <span>+</span> Thêm HP trong khung CTĐT
          </button>
          <button type="button" onClick={() => setStudyPlanDialog('quick')}>
            <span>+</span> Thêm nhanh HP vào KHHT
          </button>
          <button type="button" onClick={confirmStudentStudyPlan} disabled={plannedCourseIds.length === 0 || isSubmittingStudyPlan}>
            <span>P</span> {isSubmittingStudyPlan ? 'Đang thực hiện' : 'Thực hiện'}
          </button>
          <button type="button" onClick={clearStudentStudyPlan} disabled={plannedCourseIds.length === 0}>
            <span>X</span> Xóa
          </button>
        </>
      )}
      <button type="button" onClick={handlePrintStudentPlan}>
        <span>P</span> In
      </button>
      <button type="button" onClick={handleExportStudentExcel}>
        <span>X</span> Xuất Excel
      </button>
    </div>
  )



  const renderCourse = (groupId: string, course: CurriculumCourse & { rowNo: number }) => (
    <tr key={`${groupId}-${course.id}-${course.rowNo}`} className="cp-course-row">
      <td>{course.rowNo}</td>
      <td>{course.ma_hoc_phan}</td>
      <td className="cp-course-name">{course.ten_hoc_phan}</td>
      <td>{course.so_tin_chi}</td>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
        <td key={semester}>{course.hoc_ky_goi_y === semester ? course.so_tin_chi : ''}</td>
      ))}
    </tr>
  )

  const renderSimpleSection = (rows: typeof curriculumRows) => rows.map(({ group, requiredItems, optionalItems }) => (
    <Fragment key={group.id}>
      <tr className="cp-subsection-title-row">
        <td>{sectionNumber(group.ma_nhom)}</td>
        <td colSpan={2}>{sectionTitle(group.ma_nhom, group.ten_nhom)}</td>
        <td>{group.min_tin_chi}</td>
        <td colSpan={8}></td>
      </tr>
      {requiredItems.length > 0 && (
        <tr className="cp-subsection-row">
          <td colSpan={3}>Học phần bắt buộc</td>
          <td>{subsectionCredits(requiredItems, group.min_tin_chi)}</td>
          <td colSpan={8}></td>
        </tr>
      )}
      {requiredItems.map((course) => renderCourse(group.id, course))}
      {optionalItems.length > 0 && (
        <tr className="cp-subsection-row">
          <td colSpan={3}>Học phần tự chọn</td>
          <td>{group.optional_min_tin_chi}</td>
          <td colSpan={8}></td>
        </tr>
      )}
      {optionalItems.map((course) => renderCourse(group.id, course))}
    </Fragment>
  ))

  const renderComplexSection = (
    number: string,
    title: string,
    rows: typeof curriculumRows,
    credits?: { total?: number, required?: number, optional?: number, optionalLabel?: string },
  ) => {
    const requiredRows = rows.filter(({ requiredItems }) => requiredItems.length > 0)
    const optionalRows = rows.filter(({ optionalItems }) => optionalItems.length > 0)
    const requiredCredits = credits?.required ?? requiredRows.reduce((sum, row) => sum + subsectionCredits(row.requiredItems, 0), 0)
    const optionalCredits = credits?.optional ?? optionalRows.reduce((sum, row) => sum + row.group.optional_min_tin_chi, 0)
    const totalCredits = credits?.total ?? (requiredCredits + optionalCredits)

    return (
      <Fragment key={number}>
        <tr className="cp-subsection-title-row">
          <td>{number}</td>
          <td colSpan={2}>{title}</td>
          <td>{totalCredits}</td>
          <td colSpan={8}></td>
        </tr>
        {requiredRows.length > 0 && (
          <tr className="cp-subsection-row">
            <td colSpan={3}>Học phần bắt buộc</td>
            <td>{requiredCredits}</td>
            <td colSpan={8}></td>
          </tr>
        )}
        {requiredRows.map(({ group, requiredItems }) => (
          <Fragment key={`${group.id}-required`}>
            {isSpecializationGroup(group.ma_nhom) && (
              <tr className="cp-specialization-row">
                <td colSpan={3}>{group.ten_nhom}</td>
                <td></td>
                <td colSpan={8}></td>
              </tr>
            )}
            {requiredItems.map((course) => renderCourse(`${group.id}-required`, course))}
          </Fragment>
        ))}
        {optionalRows.length > 0 && (
          <tr className="cp-subsection-row">
            <td colSpan={3}>{credits?.optionalLabel ?? 'Học phần tự chọn'}</td>
            <td>{optionalCredits}</td>
            <td colSpan={8}></td>
          </tr>
        )}
        {optionalRows.map(({ group, optionalItems }) => (
          <Fragment key={`${group.id}-optional`}>
            {isSpecializationGroup(group.ma_nhom) && (
              <tr className="cp-specialization-row">
                <td colSpan={3}>{group.ten_nhom}</td>
                <td></td>
                <td colSpan={8}></td>
              </tr>
            )}
            {optionalItems.map((course) => renderCourse(`${group.id}-optional`, course))}
          </Fragment>
        ))}
      </Fragment>
    )
  }

  return (
    <main className={`cp-page ${config.mode}`}>
      {isStudentShell && (
        <StudentHeader
          displayName={displayName}
          academicYear={sysAcademicYear}
          semester={sysSemester}
          onHomeClick={() => navigate('/sinhvien')}
        />
      )}

      {studyPlanDialog === 'curriculum' && (
        <Modal
          modal={{
            id: 'khht-add-from-curriculum',
            title: 'Thêm học phần trong khung CTĐT',
            size: 'xl',
            dismissible: true,
            closeOnOverlayClick: true,
            content: (
              <div className="cp-khht-modal">
                <div className="cp-khht-modal-table-wrap">
                  <table className="cp-khht-modal-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Chọn</th>
                        <th>Mã học phần</th>
                        <th>Tên học phần</th>
                        <th>ĐVHT/TC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentPlanRows.map((course, index) => {
                        const isAlreadyAdded = plannedCourseIds.includes(course.id)

                        return (
                          <tr key={`add-curriculum-${course.id}`}>
                            <td>{index + 1}</td>
                            <td>
                              <input
                                type="checkbox"
                                checked={isAlreadyAdded || curriculumDialogCourseIds.includes(course.id)}
                                disabled={isAlreadyAdded}
                                onChange={() => setCurriculumDialogCourseIds((current) => (
                                  current.includes(course.id)
                                    ? current.filter((id) => id !== course.id)
                                    : [...current, course.id]
                                ))}
                              />
                            </td>
                            <td>{course.ma_hoc_phan}</td>
                            <td>{course.ten_hoc_phan}</td>
                            <td>{course.so_tin_chi}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ),
            actions: [
              {
                label: 'Hủy',
                variant: 'secondary',
                autoClose: false,
                onClick: () => {
                  setStudyPlanDialog(null)
                  setCurriculumDialogCourseIds([])
                },
              },
              {
                label: 'Thực hiện',
                variant: 'primary',
                autoClose: false,
                onClick: handleAddCurriculumCourses,
              },
            ],
          }}
          onClose={() => {
            setStudyPlanDialog(null)
            setCurriculumDialogCourseIds([])
          }}
        />
      )}

      {studyPlanDialog === 'quick' && (
        <Modal
          modal={{
            id: 'khht-add-quick',
            title: 'Thêm nhanh học phần vào KHHT',
            size: 'md',
            dismissible: true,
            closeOnOverlayClick: true,
            content: (
              <div className="cp-khht-quick-form">
                <label>
                  <span>Mã học phần</span>
                  <input
                    value={quickCourseCode}
                    list="khht-course-code-options"
                    onChange={(e) => setQuickCourseCode(e.target.value)}
                    placeholder="Nhập hoặc chọn mã học phần"
                  />
                  <datalist id="khht-course-code-options">
                    {studentCourseCodes.map((code) => (
                      <option key={code} value={code} />
                    ))}
                  </datalist>
                </label>
                <label>
                  <span>Tên học phần</span>
                  <input
                    value={quickCourseCode.trim() ? quickMatchedCourse?.ten_hoc_phan ?? 'Không có môn phù hợp' : ''}
                    readOnly
                  />
                </label>
              </div>
            ),
            actions: [
              {
                label: 'Hủy',
                variant: 'secondary',
                autoClose: false,
                onClick: () => {
                  setStudyPlanDialog(null)
                  setQuickCourseCode('')
                },
              },
              {
                label: 'Thực hiện',
                variant: 'primary',
                autoClose: false,
                onClick: handleAddQuickCourse,
              },
            ],
          }}
          onClose={() => {
            setStudyPlanDialog(null)
            setQuickCourseCode('')
          }}
        />
      )}

      <div className="cp-content">
        {!isStudentShell && (
          <div className="cp-toolbar">
            <span className="cp-role">{config.roleLabel}</span>
          </div>
        )}

        {isStudentShell ? (
          <div className="cp-student-view-tabs" role="tablist" aria-label="Chế độ xem chương trình đào tạo">
            <button
              type="button"
              className={studentActiveView === 'curriculum' ? 'active' : ''}
              onClick={() => setStudentActiveView('curriculum')}
            >
              Xem chương trình đào tạo
            </button>
            <button
              type="button"
              className={studentActiveView === 'studyplan' ? 'active' : ''}
              onClick={() => setStudentActiveView('studyplan')}
            >
              Kế hoạch học tập sinh viên
            </button>
          </div>
        ) : (
          <section className="cp-header">
            <div>
              <p className="cp-eyebrow">Kế hoạch học tập</p>
              <h1>{config.title}</h1>
              <p>{config.description}</p>
            </div>
            <label className="cp-version-select">
              <span>Chương trình đào tạo</span>
              <select
                value={selectedProgramId ?? ''}
                onChange={(event) => setSelectedProgramId(Number(event.target.value) || null)}
              >
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {programLabel(program)}
                  </option>
                ))}
              </select>
            </label>
          </section>
        )}

        {error && <div className="cp-alert">{error}</div>}

        {curriculum && (
          <>
            {!isStudentShell && (
              <section className="cp-general">
                <h2>Thông tin chung</h2>
                {currentTermText && <p className="cp-term-note">Học kỳ cấu hình: {currentTermText}</p>}
                <table>
                  <tbody>
                    {generalInfo.map(([label, value]) => (
                      <tr key={label}>
                        <td>{label}</td>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {isStudentMode && studentActiveView === 'curriculum' ? (
              <>
                {/* ── Filter panel ── */}
                <section className="cp-student-search">
                  <p>
                    <strong>Hệ:</strong> Đại học và Cao đẳng chính quy.{' '}
                    <strong>Ngành:</strong> {studentMajor?.ten_nganh || 'Chưa cập nhật'} ({studentMajor?.ma_nganh || '---'}).{' '}
                    <strong>Khóa học:</strong> {studentAdmissionYear ?? 2023} (65).{' '}
                    <strong>Mô hình đào tạo:</strong> Tín chỉ.
                  </p>

                  <div className="cp-filter-stack">
                    <div className="cp-filter-row">
                      <span className="cp-filter-label-box">Năm học mở</span>
                      <Select
                        selectSize="sm"
                        value={studentFilters.year}
                        onChange={(e) => setStudentFilters((c) => ({ ...c, year: e.target.value }))}
                        options={[
                          { label: '---- Tất cả ----', value: '' },
                          ...studentYears.map((y) => ({ label: y, value: y })),
                        ]}
                      />
                    </div>
                    <div className="cp-filter-row">
                      <span className="cp-filter-label-box">Học kỳ mở</span>
                      <Select
                        selectSize="sm"
                        value={studentFilters.semester}
                        onChange={(e) => setStudentFilters((c) => ({ ...c, semester: e.target.value }))}
                        options={[
                          { label: '---- Tất cả ----', value: '' },
                          ...studentSemesters.map((s) => ({ label: `Học kỳ ${s}`, value: s })),
                        ]}
                      />
                    </div>
                    <div className="cp-filter-row">
                      <Select
                        selectSize="sm"
                        value={studentFilters.searchField}
                        onChange={(e) => setStudentFilters((c) => ({ ...c, searchField: e.target.value, searchValue: '' }))}
                        options={[
                          { label: 'Mã học phần', value: 'code' },
                          { label: 'Tên học phần', value: 'name' },
                        ]}
                      />
                      <Select
                        selectSize="sm"
                        value={studentFilters.searchValue}
                        onChange={(e) => setStudentFilters((c) => ({ ...c, searchValue: e.target.value }))}
                        options={[
                          { label: '---- Tất cả ----', value: '' },
                          ...studentSearchOptions.map((o) => ({ label: o, value: o })),
                        ]}
                      />
                    </div>
                    <div className="cp-filter-row cp-filter-sort-row">
                      <strong>Sắp xếp</strong>
                      <Select
                        selectSize="sm"
                        value={studentFilters.sortBy}
                        onChange={(e) => setStudentFilters((c) => ({ ...c, sortBy: e.target.value }))}
                        options={[
                          { label: 'Năm học - học kỳ mở', value: 'term' },
                          { label: 'Mã học phần', value: 'course' },
                          { label: 'Tên học phần', value: 'name' },
                          { label: 'Nhóm kiến thức', value: 'group' },
                          { label: 'Học phần bắt buộc', value: 'required' },
                        ]}
                      />
                      <Select
                        selectSize="sm"
                        value={studentFilters.sortDirection}
                        onChange={(e) => setStudentFilters((c) => ({ ...c, sortDirection: e.target.value }))}
                        options={[
                          { label: 'Tăng dần', value: 'asc' },
                          { label: 'Giảm dần', value: 'desc' },
                        ]}
                      />
                    </div>
                  </div>
                </section>

                {/* ── Table ── */}
                <section className="cp-student-plan-frame">
                  <div className="cp-table-wrap">
                    <table className="cp-student-plan-table">
                      <thead>
                        <tr>
                          <th>Stt</th>
                          <th>Mã học phần</th>
                          <th>Tên học phần</th>
                          <th>ĐVHT/TC</th>
                          <th>Tài liệu tham khảo</th>
                          <th>Nhóm kiến thức</th>
                          <th>Năm học mở</th>
                          <th>Học kỳ mở</th>
                          <th>Học phần bắt buộc</th>
                          <th>Học phần xét luận văn</th>
                          <th>Học phần xét học bổng</th>
                          <th>Năm học đạt</th>
                          <th>Học kỳ đạt</th>
                          <th>Điểm đạt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudentRows.length > 0 ? (
                          filteredStudentRows.map((course) => {
                            const syllabusHref = courseSyllabusHref(course)

                            return (
                            <tr key={`${course.id}-${course.studentRowNo}`}>
                              <td>{course.studentRowNo}</td>
                              <td>{course.ma_hoc_phan}</td>
                              <td className="cp-course-name">{course.ten_hoc_phan}</td>
                              <td>{course.so_tin_chi}</td>
                              <td>
                                <a
                                  className={`cp-reference-link${syllabusHref ? '' : ' cp-reference-link--disabled'}`}
                                  href={syllabusHref ?? undefined}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(event) => {
                                    if (!syllabusHref) event.preventDefault()
                                  }}
                                  title={`Xem đề cương học phần ${course.ma_hoc_phan}`}
                                  aria-label={`Xem đề cương học phần ${course.ma_hoc_phan}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <path d="M14 2v6h6" />
                                    <path d="M8 13h8" />
                                    <path d="M8 17h5" />
                                  </svg>
                                </a>
                              </td>
                              <td>{course.groupName}</td>
                              <td>{course.nam_hoc_mo_hien_thi ?? ''}</td>
                              <td>{course.hoc_ky_mo_hien_thi ?? ''}</td>
                              <td>{course.vai_tro === 'bat_buoc' ? 'X' : ''}</td>
                              <td>X</td>
                              <td>X</td>
                              <td>{course.nam_hoc_dat ?? ''}</td>
                              <td>{course.hoc_ky_dat ?? ''}</td>
                              <td>{course.diem_dat ?? ''}</td>
                            </tr>
                            )
                          })
                        ) : (
                          <tr>
                            <td colSpan={14}>Không có học phần nào phù hợp với bộ lọc.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="cp-student-plan-footer">
                    <strong className="text-sm text-gray-700">
                      Tổng ĐVHT/TC: <span className="font-bold text-blue-700">{filteredStudentTotalCredits}</span>
                    </strong>
                    <div className="cp-student-export-actions">
                      <button
                        type="button"
                        onClick={handlePrintStudentPlan}
                      >
                        <span>P</span>
                        In
                      </button>
                      <button
                        type="button"
                        onClick={handleExportStudentExcel}
                      >
                        <span>X</span>
                        Excel
                      </button>
                    </div>
                  </div>
                </section>
              </>
            ) : isStudentMode ? (
              <section className="cp-khht-panel">
                <div className="cp-khht-student-line">
                  {advisor?.hasAdvisor ? (
                    <>
                      {advisor.code && <><strong>Mã cố vấn:</strong> {advisor.code}. </>}
                      {advisor.name && <><strong>Họ tên:</strong> {advisor.name}. </>}
                      {advisor.phone && <><strong>Điện thoại:</strong> {advisor.phone}. </>}
                      {advisor.email && <><strong>Email:</strong> {advisor.email}</>}
                    </>
                  ) : (
                    <strong>{advisorLine}</strong>
                  )}
                </div>

                <div className="cp-khht-filter-area">
                  <div className="cp-khht-filter-grid">
                    <label>Năm học</label>
                      <Select
                        selectSize="sm"
                        value={studentFilters.year}
                        onChange={(e) => {
                        const nextYear = e.target.value
                        const validSemesters = getSemesterOptionsForYear(nextYear)
                        setStudentFilters((c) => ({
                          ...c,
                          year: nextYear,
                          semester: c.semester && validSemesters.includes(c.semester) ? c.semester : '',
                        }))
                      }}
                      options={[
                        { label: '---- Tất cả ----', value: '' },
                        ...studyPlanYearOptions.map((y) => ({ label: y, value: y })),
                      ]}
                    />
                    <label>Học kỳ</label>
                      <Select
                        selectSize="sm"
                        value={studentFilters.semester}
                        onChange={(e) => setStudentFilters((c) => ({ ...c, semester: e.target.value }))}
                      options={[
                        { label: '---- Tất cả ----', value: '' },
                        ...getSemesterOptionsForYear(studentFilters.year).map((s) => ({ label: s, value: s })),
                      ]}
                    />
                    <label>Mã học phần</label>
                    <div className="cp-khht-search-line">
                      <Select
                        selectSize="sm"
                        value={studentFilters.searchField}
                        onChange={(e) => setStudentFilters((c) => ({ ...c, searchField: e.target.value, searchValue: '' }))}
                        options={[
                          { label: 'Mã học phần', value: 'code' },
                          { label: 'Tên học phần', value: 'name' },
                        ]}
                      />
                      <Select
                        selectSize="sm"
                        value={studentFilters.searchValue}
                        onChange={(e) => setStudentFilters((c) => ({ ...c, searchValue: e.target.value }))}
                        aria-label="Tìm học phần"
                        options={[
                          { label: '---- Tất cả ----', value: '' },
                          ...studyPlanSearchOptions.map((option) => ({ label: option, value: option })),
                        ]}
                      />
                    </div>
                    <label>Số dòng mỗi trang</label>
                    <Select
                      selectSize="sm"
                      value={studyPlanPageSize}
                      onChange={(e) => setStudyPlanPageSize(e.target.value)}
                      options={PAGE_SIZE_OPTIONS.map((value) => ({ label: getPageSizeLabel(value), value }))}
                    />
                  </div>
                </div>

                <div className="cp-khht-action-row">{renderStudyPlanActions()}</div>

                <div className="cp-table-wrap">
                  <table className="cp-khht-table">
                    <thead>
                      <tr>
                        <th>Stt</th>
                        <th>Mã học phần</th>
                        <th>Tên học phần</th>
                        <th>ĐVHT/TC</th>
                        <th>Duyệt</th>
                        <th>Năm học</th>
                        <th>Học kỳ</th>
                        <th>Chọn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studyPlanVisibleRows.length > 0 ? studyPlanVisibleRows.map((course) => (
                        <tr key={`plan-${course.id}`}>
                          <td>{course.studentRowNo}</td>
                          <td>{course.ma_hoc_phan}</td>
                          <td>{course.ten_hoc_phan}</td>
                          <td>{course.so_tin_chi}</td>
                          <td>Đã duyệt</td>
                          <td>
                            <select
                              value={course.nam_hoc_mo_hien_thi ?? studentFilters.year}
                              onChange={(e) => updatePlannedCourseTerm(course.id, 'year', e.target.value)}
                              disabled={!studyPlanCanRegister}
                              aria-label={`Năm học đăng ký ${course.ma_hoc_phan}`}
                            >
                              {studyPlanYearOptions.map((year) => (
                                <option key={year} value={year}>{year}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              value={course.hoc_ky_mo_hien_thi ?? studentFilters.semester}
                              onChange={(e) => updatePlannedCourseTerm(course.id, 'semester', e.target.value)}
                              disabled={!studyPlanCanRegister}
                              aria-label={`Học kỳ đăng ký ${course.ma_hoc_phan}`}
                            >
                              {getSemesterOptionsForYear(course.nam_hoc_mo_hien_thi).map((semester) => (
                                <option key={semester} value={semester}>{semester}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedStudyPlanCourseIds.includes(course.id)}
                              onChange={() => togglePlannedCourse(course.id)}
                              disabled={!studyPlanCanRegister}
                              aria-label={`Chọn học phần ${course.ma_hoc_phan}`}
                            />
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={8}>Không có học phần nào trong bảng năm học/học kỳ đang chọn.</td>
                        </tr>
                      )}
                      <tr className="cp-khht-select-all-row">
                        <td colSpan={7}>Chọn tất cả</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={studyPlanVisibleRows.length > 0 && studyPlanVisibleRows.every((course) => selectedStudyPlanCourseIds.includes(course.id))}
                            onChange={toggleAllVisiblePlannedCourses}
                            disabled={!studyPlanCanRegister || studyPlanVisibleRows.length === 0}
                            aria-label="Chọn tất cả học phần đang hiển thị"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="cp-khht-note">
                  <span>
                    <strong>Tổng số tín chỉ:</strong> {studyPlanFilteredTotalCredits}
                  </span>
                  {studyPlanCanRegister && (
                    <span>
                      <strong>Đã chọn:</strong> {studyPlanFilteredTotalCredits}/{studyPlanMaxCredits}
                    </span>
                  )}
                  <span>
                    <strong>Số học phần:</strong> {studyPlanFilteredRows.length}
                  </span>
                  <br />
                  <strong>Ghi chú:</strong> <strong>CTĐT:</strong> Chương trình đào tạo - <strong>HP:</strong> Học phần - <strong>KHHT:</strong> Kế hoạch học tập
                  {plannedConfirmedAt && (
                    <>
                      <br />
                      <strong>Đã xác nhận:</strong> {formatDisplayDateTime(plannedConfirmedAt)}
                    </>
                  )}
                  {!studyPlanCanRegister && (
                    <>
                      <br />
                      <strong>Trạng thái:</strong> Ngoài thời gian đăng ký KHHT
                    </>
                  )}
                  {studyPlanWindowText && (
                    <>
                      <br />
                      <strong>Đợt đăng ký:</strong> {studyPlanWindowText}
                    </>
                  )}
                </div>

                <div className="cp-khht-action-row cp-khht-action-row-bottom">{renderStudyPlanActions()}</div>
              </section>
            ) : (
              <section className="cp-curriculum-frame">
                <div className="cp-table-wrap">
                  <table className="cp-plan-table">
                    <thead>
                      <tr>
                        <th rowSpan={2}>TT</th>
                        <th rowSpan={2}>Mã HP</th>
                        <th rowSpan={2}>Tên học phần</th>
                        <th rowSpan={2}>Số tín chỉ</th>
                        <th colSpan={8}>Phân bổ từng học kỳ</th>
                      </tr>
                      <tr>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                          <th key={semester}>{semester}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="cp-total-row">
                        <td colSpan={3}>Tổng số tín chỉ</td>
                        <td>{totals.credits}</td>
                        <td colSpan={8}></td>
                      </tr>
                      <tr className="cp-section-row">
                        <td>I</td>
                        <td colSpan={2}>Giáo dục tổng quát</td>
                        <td>{sumCredits(generalEducationRows)}</td>
                        <td colSpan={8}></td>
                      </tr>
                      {renderSimpleSection(generalEducationRows)}
                      <tr className="cp-section-row">
                        <td>II</td>
                        <td colSpan={2}>Giáo dục chuyên nghiệp</td>
                        <td>{totals.credits - sumCredits(generalEducationRows)}</td>
                        <td colSpan={8}></td>
                      </tr>
                      {renderSimpleSection(foundationRows)}
                      {renderComplexSection('II.2', 'Ngành', industryRows, { total: 43, required: 34, optional: 9 })}
                      {renderComplexSection('II.3', 'Tốt nghiệp', graduationRows, {
                        total: 10,
                        optional: 10,
                        optionalLabel: 'Đồ án/Khóa luận tốt nghiệp hoặc Học phần thay thế',
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

      </div>
    </main>
  )
}
