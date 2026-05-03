import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiGet } from '../../../../api/core/request'
import { useAuth } from '../../../../api/query'
import { Modal } from '@/components/modal'
import { Select } from '@/components/select'
import logoImage from '../../../../assets/Logo_NTU.png'
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
  diem_dat?: number | null
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

interface StudentCurriculumResponse {
  data?: {
    curriculum?: CurriculumDetail | null
    current_term?: {
      nam_hoc?: string | null
      hoc_ky?: string | null
    } | null
  } | null
}

interface StudentDashboardResponse {
  student?: {
    ten_sinh_vien?: string | null
    he_dao_tao?: string | null
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

interface CurriculumPlanPageProps {
  mode: ViewerMode
  roleLabel: string
  backLink: string
  title: string
  description: string
  staffEndpointPrefix?: string
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
  const { user, me, logout } = useAuth()
  const isStudentMode = config.mode === 'studyplan' && user?.role === 'student'
  const endpointPrefix = config.staffEndpointPrefix ?? '/curriculum-programs'
  const [programs, setPrograms] = useState<CurriculumProgram[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)
  const [curriculum, setCurriculum] = useState<CurriculumDetail | null>(null)
  const [currentTermText, setCurrentTermText] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [studentName, setStudentName] = useState<string | null>(null)
  const [educationSystem, setEducationSystem] = useState<string | null>(null)
  const [sysAcademicYear, setSysAcademicYear] = useState('Đang tải')
  const [sysSemester, setSysSemester] = useState('Đang tải')
  const [studentActiveView, setStudentActiveView] = useState<'curriculum' | 'studyplan'>('curriculum')
  const [plannedCourseIds, setPlannedCourseIds] = useState<number[]>([])
  const [plannedConfirmedAt, setPlannedConfirmedAt] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      void me()
    }
  }, [me, user])

  useEffect(() => {
    let active = true

    const loadInitialData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (!user?.role) {
          return
        }

        if (isStudentMode) {
          const yearsResponse = await apiGet<ApiListResponse<CatalogYear[]>>('/academic-catalog/nam-hocs')
          const semestersResponse = await Promise.all(
            yearsResponse.data.map((year) => apiGet<ApiListResponse<CatalogSemester[]>>(`/academic-catalog/hoc-kys?nam_hoc_id=${year.id}`)),
          )
          if (!active) return
          setCatalogYears(yearsResponse.data)
          setCatalogSemesters(semestersResponse.flatMap((response) => response.data))

          const response = await apiGet<StudentCurriculumResponse>('/student/curriculum')
          if (!active) return
          const studentCurriculum = response.data?.curriculum ?? null

          if (studentCurriculum) {
            setCurriculum(studentCurriculum)
          } else {
            const fallbackPrograms = await apiGet<ApiListResponse<CurriculumProgram[]>>('/curriculum-programs')
            const fallbackProgramId = fallbackPrograms.data[0]?.id

            if (fallbackProgramId) {
              const fallbackDetail = await apiGet<ProgramDetailResponse>(`/curriculum-programs/${fallbackProgramId}`)
              setCurriculum(fallbackDetail.data?.curriculum ?? null)
            } else {
              setCurriculum(null)
            }
          }

          const term = response.data?.current_term
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
  }, [endpointPrefix, isStudentMode, user?.role])

  useEffect(() => {
    if (!isStudentMode) {
      return
    }

    let active = true

    const loadStudentHeader = async () => {
      const [dashboardResult, currentTermResult] = await Promise.allSettled([
        apiGet<StudentDashboardResponse>('/student/dashboard'),
        apiGet<CurrentAcademicTermResponse>('/academic-catalog/current-term'),
      ])

      if (!active) {
        return
      }

      if (dashboardResult.status === 'fulfilled') {
        setStudentName(dashboardResult.value.student?.ten_sinh_vien?.trim() || null)
        setEducationSystem(dashboardResult.value.student?.he_dao_tao?.trim() || null)
      }

      if (currentTermResult.status === 'fulfilled') {
        const term = currentTermResult.value.data
        setSysAcademicYear(term?.nam_hoc?.trim() || 'Chưa cấu hình')
        setSysSemester(term?.hoc_ky?.trim() || 'Chưa cấu hình')
        setStudentFilters((current) => ({
          ...current,
          year: term?.nam_hoc?.trim() || current.year,
          semester: term?.hoc_ky?.trim() || current.semester,
        }))
      } else {
        setSysAcademicYear('Chưa cấu hình')
        setSysSemester('Chưa cấu hình')
      }
    }

    void loadStudentHeader()

    return () => {
      active = false
    }
  }, [isStudentMode])

  useEffect(() => {
    if (!isStudentMode || !user?.username) {
      return
    }

    const savedPlan = window.localStorage.getItem(`student-study-plan:${user.username}`)

    if (!savedPlan) {
      return
    }

    try {
      const parsed = JSON.parse(savedPlan) as { courseIds?: number[], confirmedAt?: string | null }

      setPlannedCourseIds(Array.isArray(parsed.courseIds) ? parsed.courseIds : [])
      setPlannedConfirmedAt(parsed.confirmedAt ?? null)
    } catch {
      setPlannedCourseIds([])
      setPlannedConfirmedAt(null)
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
  const studentPlanRows = curriculumRows
    .flatMap(({ requiredItems, optionalItems }) => [
      ...requiredItems.map((course) => ({ ...course, groupName: 'Kiến thức chung' })),
      ...optionalItems.map((course) => ({ ...course, groupName: 'Kiến thức chung' })),
    ])
    .filter((course) => !course.ma_hoc_phan.toUpperCase().startsWith('QPAD'))
    .map((course) => {
      const plannedTerm = plannedTermFromRecommendedSemester(course.hoc_ky_goi_y, studentAdmissionYear)

      return {
        ...course,
        nam_hoc_mo_hien_thi: course.nam_hoc_mo ?? plannedTerm.year,
        hoc_ky_mo_hien_thi: course.hoc_ky_mo ?? plannedTerm.semester,
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
  const filteredStudentRows = studentPlanRows
    .filter((course) => (
      (!studentFilters.year || course.nam_hoc_mo_hien_thi === studentFilters.year)
      && (!studentFilters.semester || course.hoc_ky_mo_hien_thi === studentFilters.semester)
      && (!studentFilters.searchValue || (
        studentFilters.searchField === 'name'
          ? course.ten_hoc_phan === studentFilters.searchValue
          : course.ma_hoc_phan === studentFilters.searchValue
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
  const displayName = studentName || user?.name?.trim() || 'Sinh viên'
  const filteredStudentTotalCredits = filteredStudentRows.reduce((sum, course) => sum + course.so_tin_chi, 0)
  const plannedStudentRows = filteredStudentRows.filter((course) => plannedCourseIds.includes(course.id))
  const plannedStudentTotalCredits = plannedStudentRows.reduce((sum, course) => sum + course.so_tin_chi, 0)
  const studentExportTitle = 'Danh Sách Học Phần Thuộc Chương Trình Đào Tạo Thực Hiện'
  const studentExportInfo = `Hệ: ${educationSystem || user?.educationSystem || 'Đại học và Cao đẳng chính quy'}. Ngành: ${studentMajor?.ten_nganh || 'Chưa cập nhật'} (${studentMajor?.ma_nganh || '---'}). Khóa học: ${studentAdmissionYear ?? 2023} (65). Mô hình đào tạo Tín chỉ.`

  const buildStudentExportHtml = (forPrint = false) => {
    const rows = filteredStudentRows.map((course) => `
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

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(studentExportTitle)}</title>
  <style>
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
        <td style="width: 45%;">BỘ GIÁO DỤC VÀ ĐÀO TẠO<br />TRƯỜNG ĐẠI HỌC NHA TRANG</td>
        <td style="width: 55%;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />Độc lập - Tự do - Hạnh phúc</td>
      </tr>
    </table>
    <div class="title">${escapeHtml(studentExportTitle)}</div>
    <div class="info">${escapeHtml(studentExportInfo)}</div>
    <table class="data">
      <thead>
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
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total">- Tổng ĐVHT/TC: ${filteredStudentTotalCredits}</div>
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
    link.download = `chuong-trinh-dao-tao-${year}-hk-${semester}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const persistStudentStudyPlan = (courseIds: number[], confirmedAt = plannedConfirmedAt) => {
    if (!user?.username) {
      return
    }

    window.localStorage.setItem(`student-study-plan:${user.username}`, JSON.stringify({
      courseIds,
      confirmedAt,
    }))
  }

  const togglePlannedCourse = (courseId: number) => {
    setPlannedCourseIds((current) => {
      const next = current.includes(courseId)
        ? current.filter((id) => id !== courseId)
        : [...current, courseId]

      setPlannedConfirmedAt(null)
      persistStudentStudyPlan(next, null)

      return next
    })
  }

  const confirmStudentStudyPlan = () => {
    const confirmedAt = new Date().toISOString()

    setPlannedConfirmedAt(confirmedAt)
    persistStudentStudyPlan(plannedCourseIds, confirmedAt)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

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

  if (!user?.role) {
    return <main className="cp-page"><div className="cp-loading">Đang tải phiên đăng nhập...</div></main>
  }

  return (
    <main className={`cp-page ${config.mode}`}>
      {isStudentMode && (
        <header className="cp-student-header">
          <div className="cp-student-topbar">
            <div className="cp-student-brand-group">
              <img src={logoImage} alt="NTU" className="cp-student-brand-logo" />
              <div className="cp-student-brand-text">
                <h1>TRƯỜNG ĐẠI HỌC NHA TRANG</h1>
                <span>Hệ thống Tích hợp Thông tin</span>
              </div>
            </div>
            <span className="cp-student-role-badge">SINH VIÊN</span>
          </div>

          <div className="cp-student-academic-bar">
            <div className="cp-student-academic-left">
              <div className="cp-student-academic-badge">
                <span>Hệ đào tạo:</span>
                <strong>{educationSystem || user?.educationSystem || 'Đại học và Cao đẳng chính quy'}</strong>
              </div>
              <div className="cp-student-academic-dot"></div>
              <div className="cp-student-academic-badge">
                <span>Năm học:</span>
                <strong>{sysAcademicYear}</strong>
              </div>
              <div className="cp-student-academic-dot"></div>
              <div className="cp-student-academic-badge">
                <span>Học kỳ:</span>
                <strong>{sysSemester}</strong>
              </div>
            </div>
            <div className="cp-student-academic-right">
              <span className="cp-student-greeting">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                Xin chào, {displayName}
              </span>
              <div className="cp-student-academic-divider"></div>
              <button type="button" className="cp-student-home-button" onClick={() => navigate('/sinhvien')} title="Trang chủ" aria-label="Trang chủ">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 9-8 9 8" /><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" /></svg>
              </button>
              <button type="button" className="cp-student-logout-button" onClick={() => setShowLogoutConfirm(true)} title="Đăng xuất" aria-label="Đăng xuất">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              </button>
            </div>
          </div>
        </header>
      )}

      {showLogoutConfirm && (
        <Modal
          modal={{
            id: 'curriculum-logout-confirm',
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

      <div className="cp-content">
        {!isStudentMode && (
          <div className="cp-toolbar">
            <span className="cp-role">{config.roleLabel}</span>
          </div>
        )}

        {isStudentMode ? (
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
            {!isStudentMode && (
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

                  <div className="cp-filter-grid">
                    <Select
                      label="Năm học mở"
                      selectSize="sm"
                      value={studentFilters.year}
                      onChange={(e) => setStudentFilters((c) => ({ ...c, year: e.target.value }))}
                      options={[
                        { label: '---- Tất cả ----', value: '' },
                        ...studentYears.map((y) => ({ label: y, value: y })),
                      ]}
                    />
                    <Select
                      label="Học kỳ mở"
                      selectSize="sm"
                      value={studentFilters.semester}
                      onChange={(e) => setStudentFilters((c) => ({ ...c, semester: e.target.value }))}
                      options={[
                        { label: '---- Tất cả ----', value: '' },
                        ...studentSemesters.map((s) => ({ label: `Học kỳ ${s}`, value: s })),
                      ]}
                    />
                    <Select
                      label="Tìm theo"
                      selectSize="sm"
                      value={studentFilters.searchField}
                      onChange={(e) => setStudentFilters((c) => ({ ...c, searchField: e.target.value, searchValue: '' }))}
                      options={[
                        { label: 'Mã học phần', value: 'code' },
                        { label: 'Tên học phần', value: 'name' },
                      ]}
                    />
                    <Select
                      label={studentFilters.searchField === 'name' ? 'Tên học phần' : 'Mã học phần'}
                      selectSize="sm"
                      value={studentFilters.searchValue}
                      onChange={(e) => setStudentFilters((c) => ({ ...c, searchValue: e.target.value }))}
                      options={[
                        { label: '---- Tất cả ----', value: '' },
                        ...studentSearchOptions.map((o) => ({ label: o, value: o })),
                      ]}
                    />
                    <Select
                      label="Sắp xếp theo"
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
                      label="Thứ tự"
                      selectSize="sm"
                      value={studentFilters.sortDirection}
                      onChange={(e) => setStudentFilters((c) => ({ ...c, sortDirection: e.target.value }))}
                      options={[
                        { label: 'Tăng dần', value: 'asc' },
                        { label: 'Giảm dần', value: 'desc' },
                      ]}
                    />
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
                          filteredStudentRows.map((course) => (
                            <tr key={`${course.id}-${course.studentRowNo}`}>
                              <td>{course.studentRowNo}</td>
                              <td>{course.ma_hoc_phan}</td>
                              <td className="cp-course-name">{course.ten_hoc_phan}</td>
                              <td>{course.so_tin_chi}</td>
                              <td>
                                {(course.de_cuong_hoc_phan_url || course.tai_lieu_tham_khao_url) ? (
                                  <a
                                    className="cp-reference-link"
                                    href={course.de_cuong_hoc_phan_url || course.tai_lieu_tham_khao_url || undefined}
                                    target="_blank"
                                    rel="noreferrer"
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
                                ) : null}
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
                          ))
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
              <section className="cp-study-plan-confirm">
                <div className="cp-study-plan-head">
                  <div>
                    <h2>Kế hoạch học tập sinh viên</h2>
                    <p>Chọn các học phần dự định đăng ký cho kỳ tới rồi xác nhận kế hoạch.</p>
                  </div>
                  <div className="cp-study-plan-summary">
                    <span>Tổng tín chỉ đã chọn</span>
                    <strong>{plannedStudentTotalCredits}</strong>
                  </div>
                </div>

                <div className="cp-study-plan-meta">
                  <span>Năm học: <strong>{studentFilters.year || sysAcademicYear}</strong></span>
                  <span>Học kỳ: <strong>{studentFilters.semester || sysSemester}</strong></span>
                  {plannedConfirmedAt && (
                    <span>Đã xác nhận: <strong>{new Date(plannedConfirmedAt).toLocaleString('vi-VN')}</strong></span>
                  )}
                </div>

                <div className="cp-table-wrap">
                  <table className="cp-study-plan-table">
                    <thead>
                      <tr>
                        <th>Chọn</th>
                        <th>Stt</th>
                        <th>Mã học phần</th>
                        <th>Tên học phần</th>
                        <th>ĐVHT/TC</th>
                        <th>Năm học mở</th>
                        <th>Học kỳ mở</th>
                        <th>Bắt buộc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentRows.map((course) => (
                        <tr key={`plan-${course.id}`}>
                          <td>
                            <input
                              type="checkbox"
                              checked={plannedCourseIds.includes(course.id)}
                              onChange={() => togglePlannedCourse(course.id)}
                              aria-label={`Chọn học phần ${course.ma_hoc_phan}`}
                            />
                          </td>
                          <td>{course.studentRowNo}</td>
                          <td>{course.ma_hoc_phan}</td>
                          <td className="cp-course-name">{course.ten_hoc_phan}</td>
                          <td>{course.so_tin_chi}</td>
                          <td>{course.nam_hoc_mo_hien_thi ?? ''}</td>
                          <td>{course.hoc_ky_mo_hien_thi ?? ''}</td>
                          <td>{course.vai_tro === 'bat_buoc' ? 'X' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="cp-study-plan-actions">
                  <div>
                    <strong>{plannedStudentRows.length}</strong> học phần được chọn
                    <span> / {plannedStudentTotalCredits} tín chỉ</span>
                  </div>
                  <button type="button" onClick={confirmStudentStudyPlan} disabled={plannedCourseIds.length === 0}>
                    Xác nhận kế hoạch học tập
                  </button>
                </div>
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

        {isLoading && <div className="cp-loading">Đang tải kế hoạch học tập...</div>}
      </div>
    </main>
  )
}
