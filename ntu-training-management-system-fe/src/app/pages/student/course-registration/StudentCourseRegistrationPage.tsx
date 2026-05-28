import { useEffect, useMemo, useState } from 'react'
import { ArrowPathIcon, CheckCircleIcon, PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { apiDelete, apiGet, apiPost, apiPut } from '@/api/core/request'
import { MINISTRY_NAME, printBrandHtml, printBrandStyles, printFaviconLink } from '@/app/branding'
import { authStorage } from '../../../../api/features/auth'
import { useAuth } from '../../../../api/query'
import { useAlert } from '@/components/alert'
import { Modal } from '@/components/modal'
import { StudentHeader } from '../components/StudentHeader'
import '../../training-officer/timetable/TrainingOfficerTimetablePage.css'
import './StudentCourseRegistrationPage.css'

type ClassOption = {
  id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi: number
  lop_hoc_phan: string
  nhom_hoc_phan: string
  ten_giang_vien: string
  si_so_toi_da: number
  so_sv_da_dk: number
  is_default: boolean
  is_full: boolean
  has_conflict: boolean
}

type ClassSummary = Omit<ClassOption, 'is_default' | 'is_full'>

type CourseGroup = {
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi: number
  da_dang_ky: boolean
  options: ClassOption[]
}

type Registration = {
  id: number
  lop_hoc_phan_dang_ky_id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi: number
  lop_hoc_phan: string
  nhom_hoc_phan: string
  ten_giang_vien: string
  status: 'pending' | 'registered'
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

type ClassTimetableDetail = {
  class: ClassSummary
  timetable: TimetableRow[]
}

type ClassTimetableResponse = {
  data: ClassTimetableDetail
}

type ResponsePayload = {
  data: {
    registration_period: { id: number; term?: { nam_hoc?: string; hoc_ky?: string } | null } | null
    registration_open: boolean
    student_academic_info?: {
      ma_lop?: string | null
      ten_nganh_hoc?: string | null
    } | null
    courses: CourseGroup[]
    registrations: Registration[]
    student_timetable: TimetableRow[]
    message?: string | null
  }
}

type CurrentAcademicTermResponse = {
  data?: {
    nam_hoc?: string | null
    hoc_ky?: string | null
  } | null
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

const LESSONS_PER_DAY = 13

const makeLessonPattern = (start: number, end: number) => (
  Array.from({ length: LESSONS_PER_DAY }, (_, index) => {
    const lesson = index + 1
    return lesson >= start && lesson <= end ? String(lesson % 10) : '-'
  }).join('')
)

const makeWeekPattern = (start: number, end: number) => (
  Array.from({ length: 19 }, (_, index) => {
    const week = index + 1
    return week >= start && week <= end ? String(week % 10) : '-'
  }).join('')
)

const mergeWeekPatterns = (patterns: string[]) => (
  Array.from({ length: 19 }, (_, index) => (
    patterns.map((pattern) => pattern[index]).find((char) => char && char !== '-') ?? '-'
  )).join('')
)

const makeLessonPatternForDisplay = (start: number, end: number) => (
  makeLessonPattern(start, end).replace(/-/g, '_')
)

const formatDate = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}-${month}-${year}`
}

const getDateTime = (value?: string | null) => {
  if (!value) return Number.POSITIVE_INFINITY
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? Number.POSITIVE_INFINITY : date.getTime()
}

const formatClassOnly = (value?: string | null) => (value ?? '').split(/\s+-\s+/)[0]

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')

const parsePeriodLabel = (label: string, fallbackYear: string, fallbackSemester: string) => {
  const yearMatch = label.match(/\d{4}-\d{4}/)
  const semesterMatch = label.match(/(?:H\u1ecdc k\u1ef3|Hoc ky|Học kỳ)\s*:?\s*([^;\-\s]+)/i)

  return {
    year: yearMatch?.[0] ?? fallbackYear,
    semester: semesterMatch?.[1] ?? fallbackSemester,
  }
}

const formatVietnamesePrintDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `Khánh Hòa, ngày ${day} tháng ${month} năm ${year}`
}

const compareTextNaturally = (left: string, right: string) => (
  left.localeCompare(right, 'vi', { numeric: true, sensitivity: 'base' })
)

const sortClassOptionsByCourseGroup = (options: ClassOption[]) => (
  options
    .slice()
    .sort((left, right) => (
      compareTextNaturally(left.nhom_hoc_phan || '', right.nhom_hoc_phan || '')
      || compareTextNaturally(left.lop_hoc_phan || '', right.lop_hoc_phan || '')
    ))
)

export default function StudentCourseRegistrationPage() {
  const alert = useAlert()
  const navigate = useNavigate()
  const { user, me, logout } = useAuth()
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [periodLabel, setPeriodLabel] = useState('')
  const [message, setMessage] = useState('')
  const [courses, setCourses] = useState<CourseGroup[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [studentTimetable, setStudentTimetable] = useState<TimetableRow[]>([])
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [busyCourse, setBusyCourse] = useState('')
  const [loadingClassTimetableId, setLoadingClassTimetableId] = useState<number | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [changeCourse, setChangeCourse] = useState<CourseGroup | null>(null)
  const [classTimetableDetail, setClassTimetableDetail] = useState<ClassTimetableDetail | null>(null)
  const [studentAcademicInfo, setStudentAcademicInfo] = useState<{ ma_lop?: string | null; ten_nganh_hoc?: string | null } | null>(null)
  const [sysAcademicYear, setSysAcademicYear] = useState(() => readCachedCurrentTerm().year)
  const [sysSemester, setSysSemester] = useState(() => readCachedCurrentTerm().semester)

  const registeredByCourse = useMemo(() => (
    Object.fromEntries(registrations.map((item) => [item.ma_hoc_phan, item]))
  ), [registrations])

  const sortedChangeGroupOptions = useMemo(
    () => sortClassOptionsByCourseGroup(changeCourse?.options ?? []),
    [changeCourse],
  )

  const displayedClassTimetable = useMemo(() => {
    const grouped = new Map<string, TimetableRow[]>()

    ;(classTimetableDetail?.timetable ?? []).forEach((row) => {
      const key = [
        row.ma_hoc_phan,
        row.nhom_hoc_phan,
        row.ten_hoc_phan,
        row.thu,
        row.tiet_bat_dau,
        row.tiet_ket_thuc,
        row.ten_giang_vien,
        row.ten_phong,
      ].join('|')

      grouped.set(key, [...(grouped.get(key) ?? []), row])
    })

    return Array.from(grouped.values()).map((rows) => {
      const first = rows.slice().sort((left, right) => left.tuan_bat_dau - right.tuan_bat_dau)[0]

      return {
        ...first,
        weekPattern: mergeWeekPatterns(rows.map((row) => makeWeekPattern(row.tuan_bat_dau, row.tuan_ket_thuc))),
      }
    })
  }, [classTimetableDetail])

  const totalCredits = registrations.reduce((sum, item) => sum + (item.so_tin_chi || 0), 0)
  const displayedStudentTimetable = useMemo(() => {
    const grouped = new Map<string, TimetableRow[]>()

    studentTimetable.forEach((row) => {
      const key = [
        row.ma_hoc_phan,
        row.nhom_hoc_phan,
        row.ten_hoc_phan,
        row.so_tin_chi,
        formatClassOnly(row.lop_hoc_phan),
        row.thu,
        row.tiet_bat_dau,
        row.tiet_ket_thuc,
        row.ten_giang_vien,
        row.ten_phong,
      ].join('|')

      grouped.set(key, [...(grouped.get(key) ?? []), row])
    })

    return Array.from(grouped.values()).map((rows) => {
      const sortedRows = rows.slice().sort((left, right) => getDateTime(left.ngay_bat_dau_hoc) - getDateTime(right.ngay_bat_dau_hoc))
      const first = sortedRows[0]

      return {
        ...first,
        lop_hoc_phan: formatClassOnly(first.lop_hoc_phan),
        ngay_bat_dau_hoc: sortedRows.find((row) => row.ngay_bat_dau_hoc)?.ngay_bat_dau_hoc ?? first.ngay_bat_dau_hoc,
        weekPattern: mergeWeekPatterns(sortedRows.map((row) => makeWeekPattern(row.tuan_bat_dau, row.tuan_ket_thuc))),
      }
    })
  }, [studentTimetable])

  const loadData = async () => {
    const response = await apiGet<ResponsePayload>('/student/course-registration')
    const data = response.data
    const isRegistrationOpen = Boolean(data.registration_open)
    setRegistrationOpen(isRegistrationOpen)
    setMessage(isRegistrationOpen ? data.message ?? '' : 'Thời gian đăng ký không hợp lệ\nSinh viên vui lòng xem thông báo của trường hoặc liên hệ với cán bộ quản lý.')
    setCourses(data.courses ?? [])
    setRegistrations(data.registrations ?? [])
    setStudentTimetable(data.student_timetable ?? [])
    setStudentAcademicInfo(data.student_academic_info ?? null)
    setPeriodLabel(data.registration_period?.term ? `N\u0103m h\u1ecdc: ${data.registration_period.term.nam_hoc} ; H\u1ecdc k\u1ef3: ${data.registration_period.term.hoc_ky}` : '')
    setSelectedOptions(Object.fromEntries((data.courses ?? []).map((course) => {
      const registered = data.registrations?.find((item) => item.ma_hoc_phan === course.ma_hoc_phan)
      return [course.ma_hoc_phan, String(registered?.lop_hoc_phan_dang_ky_id ?? '')]
    })))
  }

  useEffect(() => {
    loadData().catch(() => alert.showError('Không tải được dữ liệu', 'Vui lòng kiểm tra backend.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!user) {
      void me()
    }
  }, [me, user])

  useEffect(() => {
    let isMounted = true

    const fetchCurrentTerm = async () => {
      try {
        const response = await apiGet<CurrentAcademicTermResponse>('/academic-catalog/current-term')
        if (!isMounted) {
          return
        }

        const namHoc = response.data?.nam_hoc?.trim() || null
        const hocKy = response.data?.hoc_ky?.trim() || null
        const cached = readCachedCurrentTerm()

        setSysAcademicYear(namHoc ?? cached.year)
        setSysSemester(hocKy ?? cached.semester)
        cacheCurrentTerm(namHoc, hocKy)
      } catch {
        const cached = readCachedCurrentTerm()
        setSysAcademicYear(cached.year)
        setSysSemester(cached.semester)
      }
    }

    void fetchCurrentTerm()

    return () => {
      isMounted = false
    }
  }, [])

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    void logout()
    navigate('/login', { replace: true })
  }

  const handleOpenChangeGroup = (course: CourseGroup) => {
    setChangeCourse(course)
  }

  const handleOpenClassTimetable = async (option: ClassOption) => {
    try {
      setLoadingClassTimetableId(option.id)
      const response = await apiGet<ClassTimetableResponse>(`/student/course-registration/classes/${option.id}/timetable`)
      setClassTimetableDetail(response.data)
    } catch (err) {
      alert.showError('Không tải được thời khóa biểu nhóm', err instanceof Error ? err.message : 'Vui lòng thử lại.')
    } finally {
      setLoadingClassTimetableId(null)
    }
  }

  const handleRegister = async (course: CourseGroup) => {
    const optionId = Number(selectedOptions[course.ma_hoc_phan])
    if (!registrationOpen) {
      alert.showError('Chưa đến thời gian đăng ký', message || 'Vui lòng theo dõi thông báo của trường.')
      return
    }
    if (!optionId) {
      setChangeCourse(course)
      return
    }
    try {
      setBusyCourse(course.ma_hoc_phan)
      await apiPost('/student/course-registration', { lop_hoc_phan_dang_ky_id: optionId })
      alert.showSuccess('Đăng ký thành công', 'Môn học đã được thêm ngay vào thời khóa biểu sinh viên.')
      await loadData()
    } catch (err) {
      alert.showError('Không đăng ký được', err instanceof Error ? err.message : 'Vui lòng thử lại.')
    } finally {
      setBusyCourse('')
    }
  }

  const handleCancel = async (registration: Registration) => {
    if (!registrationOpen) {
      alert.showError('Không thể hủy đăng ký', message || 'Đợt đăng ký học phần chưa mở hoặc đã kết thúc.')
      return
    }
    try {
      setBusyCourse(registration.ma_hoc_phan)
      await apiDelete(`/student/course-registration/${registration.id}`)
      alert.showSuccess('Đã hủy đăng ký', 'Môn học đã được gỡ khỏi thời khóa biểu đăng ký.')
      await loadData()
    } catch (err) {
      alert.showError('Không hủy được', err instanceof Error ? err.message : 'Vui lòng thử lại.')
    } finally {
      setBusyCourse('')
    }
  }

  const handleConfirm = async (registration: Registration) => {
    if (!registrationOpen) return
    try {
      setBusyCourse(registration.ma_hoc_phan)
      await apiPost(`/student/course-registration/${registration.id}/confirm`)
      alert.showSuccess('Đã xác nhận', 'Học phần đã được thêm vào thời khóa biểu sinh viên.')
      await loadData()
    } catch (err) {
      alert.showError('Không xác nhận được', err instanceof Error ? err.message : 'Vui lòng thử lại.')
    } finally {
      setBusyCourse('')
    }
  }

  const handleChooseClass = async (course: CourseGroup, option: ClassOption) => {
    const registration = registeredByCourse[course.ma_hoc_phan]
    if (!registrationOpen || option.is_full || option.has_conflict) return
    try {
      setBusyCourse(course.ma_hoc_phan)
      if (registration) {
        await apiPut(`/student/course-registration/${registration.id}/change-class`, { lop_hoc_phan_dang_ky_id: option.id })
      } else {
        await apiPost('/student/course-registration', { lop_hoc_phan_dang_ky_id: option.id })
      }
      alert.showSuccess('Đã đổi lớp học phần', 'Thời khóa biểu sinh viên đã được cập nhật.')
      setChangeCourse(null)
      await loadData()
    } catch (err) {
      alert.showError('Không đổi lớp được', err instanceof Error ? err.message : 'Vui lòng thử lại.')
    } finally {
      setBusyCourse('')
    }
  }

  const cachedUserName = authStorage.getUser()?.name?.trim() || null
  const displayName = user?.name?.trim() || cachedUserName || ''
  const handlePrintRegistrationResult = () => {
    const printedAt = new Date()
    const term = parsePeriodLabel(periodLabel, sysAcademicYear, sysSemester)
    const studentCode = user?.username || authStorage.getUser()?.username || ''
    const studentClass = studentAcademicInfo?.ma_lop?.trim() || ''
    const studentMajor = studentAcademicInfo?.ten_nganh_hoc?.trim() || ''
    const printableRegistrations = registrations
      .slice()
      .sort((left, right) => compareTextNaturally(left.ma_hoc_phan, right.ma_hoc_phan))
    const registrationRows = printableRegistrations.map((item, index) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${escapeHtml(item.ma_hoc_phan)}</td>
        <td>${escapeHtml(item.ten_hoc_phan)}</td>
        <td class="center">${escapeHtml(item.nhom_hoc_phan)}</td>
        <td class="center">${escapeHtml(item.so_tin_chi)}</td>
      </tr>
    `).join('')
    const timetableRows = displayedStudentTimetable.map((row) => `
      <tr>
        <td>${escapeHtml(row.ma_hoc_phan)}</td>
        <td class="center">${escapeHtml(row.nhom_hoc_phan)}</td>
        <td class="course-name">${escapeHtml(row.ten_hoc_phan)}</td>
        <td class="center">${escapeHtml(row.so_tin_chi)}</td>
        <td>${escapeHtml(formatClassOnly(row.lop_hoc_phan))}</td>
        <td class="center">${escapeHtml(row.thu)}</td>
        <td class="mono center">${escapeHtml(makeLessonPattern(row.tiet_bat_dau, row.tiet_ket_thuc))}</td>
        <td>${escapeHtml(row.ten_giang_vien)}</td>
        <td class="center">${escapeHtml(row.ten_phong)}</td>
        <td class="center">${escapeHtml(formatDate(row.ngay_bat_dau_hoc))}</td>
        <td class="mono center">${escapeHtml(row.weekPattern)}</td>
      </tr>
    `).join('')
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert.showError('Không mở được cửa sổ in', 'Vui lòng cho phép trình duyệt mở popup rồi thử lại.')
      return
    }

    printWindow.document.write(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  ${printFaviconLink}
  <title>Kết quả đăng ký học phần</title>
  <style>
    ${printBrandStyles}
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; font-family: "Times New Roman", Arial, sans-serif; font-size: 13px; }
    .sheet { width: 100%; max-width: 900px; margin: 0 auto; }
    .top { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; text-align: center; font-weight: 700; }
    .top .line { display: inline-block; border-bottom: 1px solid #000; padding-bottom: 2px; }
    h1 { margin: 24px 0 2px; text-align: center; font-size: 18px; line-height: 1.15; }
    .subtitle { text-align: center; font-size: 16px; font-style: italic; font-weight: 700; }
    .page-no { text-align: right; margin: 4px 0 0; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #999; padding: 2px 4px; vertical-align: top; line-height: 1.08; }
    th { text-align: center; font-weight: 700; }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: 700; }
    .mono { font-family: "Courier New", monospace; word-break: break-all; }
    .section-title { text-align: center; font-weight: 700; }
    .info td { border-bottom: 0; }
    .summary td { font-weight: 700; }
    .note { margin-top: 4px; }
    .sign { width: 260px; margin: 0 70px 0 auto; text-align: center; }
    .sign .date { font-style: italic; margin-bottom: 2px; }
    .print-toolbar { position: sticky; top: 0; z-index: 10; display: flex; justify-content: flex-end; gap: 8px; padding: 8px 0; background: #fff; }
    .print-toolbar button { border: 1px solid #999; background: #fff; color: #000; font: 13px Arial, sans-serif; padding: 5px 12px; cursor: pointer; }
    .print-timetable { width: 100%; table-layout: fixed; }
    .print-timetable th,
    .print-timetable td { line-height: 1.14; }
    .print-timetable th { width: auto !important; }
    .print-timetable .course-name { word-break: normal; overflow-wrap: break-word; }
    .print-timetable .mono { word-break: normal; overflow-wrap: anywhere; }
    @media print {
      .sheet { max-width: none; }
      .print-toolbar { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <button type="button" onclick="window.print()">In</button>
    <button type="button" onclick="window.close()">Đóng</button>
  </div>
  <div class="sheet">
    <div class="top">
      <div>
        ${printBrandHtml(MINISTRY_NAME)}
      </div>
      <div>
        <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div class="line">Độc lập - Tự do - Hạnh phúc</div>
      </div>
    </div>
    <h1>KẾT QUẢ ĐĂNG KÝ HỌC PHẦN</h1>
    <div class="subtitle">(HỌC KỲ: ${escapeHtml(term.semester)} - NĂM HỌC: ${escapeHtml(term.year)})</div>
    <div class="page-no">Trang 1/1</div>
    <table class="info">
      <tr><td colspan="5">Tên sinh viên: <span class="bold">${escapeHtml(displayName)}</span> <span class="bold">(${escapeHtml(studentCode)})</span></td></tr>
      <tr><td colspan="5">Lớp: <span class="bold">${escapeHtml(studentClass)}</span> &nbsp;&nbsp;&nbsp;&nbsp; Ngành: <span class="bold">${escapeHtml(studentMajor)}</span></td></tr>
      <tr><td colspan="5" class="section-title">Danh sách các học phần đăng ký</td></tr>
      <tr>
        <th style="width: 52px;">Stt</th>
        <th style="width: 72px;">Mã HP</th>
        <th>Tên HP</th>
        <th style="width: 70px;">Nhóm</th>
        <th style="width: 126px;">Số tín chỉ/ĐVHT</th>
      </tr>
      ${registrationRows || '<tr><td colspan="5" class="center">Chưa có học phần đăng ký.</td></tr>'}
      <tr class="summary"><td colspan="4">Tổng số tín chỉ/ĐVHT đã đăng ký</td><td class="center">${escapeHtml(totalCredits)}</td></tr>
      <tr><td colspan="4">Học phí phải đóng (VNĐ)</td><td class="right">0</td></tr>
      <tr><td colspan="5" class="section-title">Thời khóa biểu - Học kỳ: ${escapeHtml(term.semester)} - Năm học: ${escapeHtml(term.year)}</td></tr>
    </table>
    <table class="print-timetable">
      <colgroup>
        <col style="width: 7%;" />
        <col style="width: 5%;" />
        <col style="width: 22%;" />
        <col style="width: 6%;" />
        <col style="width: 9%;" />
        <col style="width: 4.5%;" />
        <col style="width: 10%;" />
        <col style="width: 13%;" />
        <col style="width: 5.5%;" />
        <col style="width: 8%;" />
        <col style="width: 10%;" />
      </colgroup>
      <tr>
        <th style="width: 58px;">Mã HP</th>
        <th style="width: 42px;">Nhóm</th>
        <th>Tên HP</th>
        <th style="width: 72px;">Số tín chỉ/ĐVHT</th>
        <th style="width: 72px;">Lớp học phần</th>
        <th style="width: 38px;">Thứ</th>
        <th style="width: 86px;">Tiết học</th>
        <th style="width: 102px;">CBGD</th>
        <th style="width: 52px;">Phòng</th>
        <th style="width: 68px;">Ngày BĐ dạy</th>
        <th style="width: 112px;">Tuần học</th>
      </tr>
      ${timetableRows || '<tr><td colspan="11" class="center">Chưa có thời khóa biểu.</td></tr>'}
    </table>
    <div class="note">-Sinh viên đóng học phí tại: <span class="bold">Phòng Tài chính (Đóng Online)</span></div>
    <div class="sign">
      <div class="date">${escapeHtml(formatVietnamesePrintDate(printedAt))}</div>
      <div>Người lập mẫu</div>
    </div>
  </div>
</body>
</html>`)
    printWindow.document.close()
    printWindow.opener = null
  }

  return (
    <div className="student-registration-shell">
      <StudentHeader
        displayName={displayName}
        academicYear={sysAcademicYear}
        semester={sysSemester}
        onHomeClick={() => navigate('/sinhvien')}
        onLogoutClick={() => setShowLogoutConfirm(true)}
      />

      {showLogoutConfirm && (
        <Modal
          modal={{
            id: 'student-course-registration-logout-confirm',
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

      {changeCourse && !classTimetableDetail && (
        <div className="system-old-window-overlay" onClick={() => setChangeCourse(null)}>
          <div className="system-old-window" onClick={(e) => e.stopPropagation()}>
            <div className="system-old-window-header">
              <span>Đổi nhóm học phần</span>
              <button type="button" className="system-old-window-close" onClick={() => setChangeCourse(null)}>[X]</button>
            </div>
            <div className="system-old-window-body">
              <div className="system-old-window-info">
                <strong>Học phần: {changeCourse.ma_hoc_phan} - {changeCourse.ten_hoc_phan}</strong>
              </div>
              <table className="system-old-table">
                <thead>
                  <tr>
                    <th>Stt</th>
                    <th>Nhóm học phần</th>
                    <th>Lớp học phần</th>
                    <th>Sĩ số</th>
                    <th>Đã đăng ký</th>
                    <th>Xem TKB</th>
                    <th>Trung TKB</th>
                    <th>Đổi nhóm</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedChangeGroupOptions.map((option, index) => {
                    const isCurrent = registeredByCourse[changeCourse.ma_hoc_phan]?.lop_hoc_phan_dang_ky_id === option.id
                    const isBusy = busyCourse === changeCourse.ma_hoc_phan

                    return (
                      <tr key={option.id} style={isCurrent ? { backgroundColor: '#eef7ff' } : {}}>
                        <td>{index + 1}</td>
                        <td>{option.nhom_hoc_phan}</td>
                        <td>{option.lop_hoc_phan}</td>
                        <td>{option.si_so_toi_da}</td>
                        <td>{option.so_sv_da_dk}</td>
                        <td>
                          <button
                            type="button"
                            className="student-icon-btn view"
                            disabled={loadingClassTimetableId === option.id}
                            onClick={() => void handleOpenClassTimetable(option)}
                            title="Xem thời khóa biểu"
                            aria-label="Xem thời khóa biểu"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5fb323' }}
                          >
                            <CheckCircleIcon width={20} />
                          </button>
                        </td>
                        <td className={option.has_conflict ? 'student-conflict-mark' : ''}>{option.has_conflict ? 'X' : ''}</td>
                        <td>
                          {isCurrent ? (
                            <span className="student-change-group-current">Đang học</span>
                          ) : option.has_conflict ? (
                            ''
                          ) : option.is_full ? (
                            <span className="student-change-group-full">Hết chỗ</span>
                          ) : (
                            <button
                              type="button"
                              className="student-icon-btn choose"
                              disabled={isBusy}
                              onClick={() => void handleChooseClass(changeCourse, option)}
                              title="Đổi nhóm"
                              aria-label="Đổi nhóm"
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#0ea5e9' }}
                            >
                              <ArrowPathIcon width={20} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {classTimetableDetail && (
        <div className="system-old-window-overlay" onClick={() => setClassTimetableDetail(null)}>
          <div className="system-old-window" onClick={(e) => e.stopPropagation()}>
            <div className="system-old-window-header">
              <span>Thời khóa biểu nhóm</span>
              <button type="button" className="system-old-window-close" onClick={() => setClassTimetableDetail(null)}>[X]</button>
            </div>
            <div className="system-old-window-body">
              <div className="system-old-window-info">
                <strong>Học phần: {classTimetableDetail.class.ma_hoc_phan} - {classTimetableDetail.class.ten_hoc_phan}</strong><br />
                <strong>Nhóm: {classTimetableDetail.class.nhom_hoc_phan}</strong>
              </div>
              <table className="system-old-table">
                <thead>
                  <tr>
                    <th>Thứ</th>
                    <th>Mã học phần</th>
                    <th>Nhóm học phần</th>
                    <th>Tên học phần</th>
                    <th>Tiết học</th>
                    <th>Tên cán bộ</th>
                    <th>Tên phòng</th>
                    <th>Tuần học</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedClassTimetable.map((row) => (
                    <tr key={row.id}>
                      <td><strong>{row.thu}</strong></td>
                      <td>{row.ma_hoc_phan}</td>
                      <td>{row.nhom_hoc_phan}</td>
                      <td className="left-align">{row.ten_hoc_phan}</td>
                      <td className="system-old-table-pattern">{makeLessonPatternForDisplay(row.tiet_bat_dau, row.tiet_ket_thuc)}</td>
                      <td className="left-align">{row.ten_giang_vien}</td>
                      <td>{row.ten_phong}</td>
                      <td className="system-old-table-pattern">{row.weekPattern.replace(/-/g, '_')}</td>
                    </tr>
                  ))}
                  {displayedClassTimetable.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>Chưa có thời khóa biểu cho nhóm này.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <main className="to-timetable-page student-registration-page">
        {message && (
          <div className={registrationOpen ? 'to-timetable-alert' : 'to-timetable-alert error'}>
            {message}
          </div>
        )}

        {registrationOpen && (
          <section className="to-timetable-panel student-registration-panel">
            <div className="student-registration-title">Đăng ký học phần</div>
            <div className="student-registration-meta">{periodLabel || 'Chưa có học kỳ đăng ký'}</div>
            <div className="to-timetable-table-wrap">
              <table className="to-timetable-table student-registration-table">
                <thead>
                  <tr>
                    <th>Stt</th>
                    <th>Mã học phần</th>
                    <th>Tên học phần</th>
                    <th>ĐVHT/TC</th>
                    <th>Lớp học phần</th>
                    <th>Đổi nhóm</th>
                    <th>Đăng ký dự phòng</th>
                    <th>Xóa dự phòng</th>
                    <th>Đăng ký</th>
                    <th>Xóa đăng ký</th>
                    <th>Xác nhận đăng ký</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => {
                    const registration = registeredByCourse[course.ma_hoc_phan]
                    const selected = course.options.find((option) => String(option.id) === selectedOptions[course.ma_hoc_phan])
                    const isBusy = busyCourse === course.ma_hoc_phan
                    const canChooseClassOption = false
                    return (
                      <tr key={course.ma_hoc_phan}>
                        <td><strong>{index + 1}</strong></td>
                        <td>{course.ma_hoc_phan}</td>
                        <td>{course.ten_hoc_phan}</td>
                        <td>{course.so_tin_chi || selected?.so_tin_chi || ''}</td>
                        <td>
                          {registration ? (
                            formatClassOnly(registration.lop_hoc_phan)
                          ) : canChooseClassOption ? (
                            <select
                              className="to-registration-class-select compact"
                              value={selectedOptions[course.ma_hoc_phan] ?? ''}
                              disabled={!registrationOpen}
                              onChange={(event) => setSelectedOptions((current) => ({ ...current, [course.ma_hoc_phan]: event.target.value }))}
                            >
                              {course.options.map((option) => (
                                <option key={option.id} value={option.id} disabled={option.is_full}>
                                  {formatClassOnly(option.lop_hoc_phan)}{option.is_default ? ' (lớp của bạn)' : ''}{option.is_full ? ' - hết chỗ' : ''}
                                </option>
                              ))}
                            </select>
                          ) : ''}
                        </td>
                        <td>
                          {registration?.status === 'registered' && course.options.length > 1 && (
                            <button type="button" className="student-icon-btn swap" title="Đổi nhóm" onClick={() => handleOpenChangeGroup(course)}>
                              <ArrowPathIcon />
                            </button>
                          )}
                        </td>
                        <td />
                        <td />
                        <td>
                          {!registration && (
                            <button type="button" className="student-icon-btn register" title="Đăng ký" disabled={isBusy || !registrationOpen} onClick={() => void handleRegister(course)}>
                              <CheckCircleIcon />
                            </button>
                          )}
                        </td>
                        <td>
                          {registration && (
                            <button type="button" className="student-icon-btn cancel" title="Xóa đăng ký" disabled={isBusy || !registrationOpen} onClick={() => void handleCancel(registration)}>
                              <XMarkIcon />
                            </button>
                          )}
                        </td>
                        <td>
                          {registration?.status === 'registered' && <span className="student-confirmed">Đã xác nhận</span>}
                          {registration?.status === 'pending' && (
                            <button type="button" className="to-timetable-icon-btn" disabled={isBusy || !registrationOpen} onClick={() => void handleConfirm(registration)}>
                              Xác nhận
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {courses.length === 0 && (
                    <tr>
                      <td colSpan={11} className="to-timetable-empty">{message || 'Chưa có học phần mở đăng ký.'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="student-registration-summary">
              Tổng số {courses.length} học phần. Đã đăng ký: {registrations.length} ({totalCredits} tín chỉ)
            </div>
          </section>
        )}

        <section className="student-schedule-panel">
          <div className="student-schedule-titlebar">Thời khóa biểu sinh viên</div>
          <div className="student-schedule-table-wrap">
            <table className="student-schedule-table">
              <thead>
                <tr>
                  <th>Mã học phần</th>
                  <th>Nhóm học phần</th>
                  <th>Tên học phần</th>
                  <th>ĐVHT/TC</th>
                  <th>Lớp học phần</th>
                  <th>Thứ</th>
                  <th>Tiết học</th>
                  <th>Tên cán bộ</th>
                  <th>Tên phòng</th>
                  <th>Ngày bắt đầu học</th>
                  <th>Tuần học</th>
                </tr>
              </thead>
              <tbody>
                {displayedStudentTimetable.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.ma_hoc_phan}</strong></td>
                    <td>{row.nhom_hoc_phan}</td>
                    <td>{row.ten_hoc_phan}</td>
                    <td>{row.so_tin_chi || ''}</td>
                    <td>{row.lop_hoc_phan}</td>
                    <td>{row.thu}</td>
                    <td className="student-schedule-pattern">{makeLessonPattern(row.tiet_bat_dau, row.tiet_ket_thuc)}</td>
                    <td>{row.ten_giang_vien}</td>
                    <td>{row.ten_phong}</td>
                    <td>{formatDate(row.ngay_bat_dau_hoc)}</td>
                    <td className="student-schedule-pattern">{row.weekPattern}</td>
                  </tr>
                ))}
                {displayedStudentTimetable.length === 0 && (
                  <tr>
                    <td colSpan={11} className="student-schedule-empty">Chưa có thời khóa biểu cho học kỳ này.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="student-schedule-print-actions">
            <button type="button" onClick={handlePrintRegistrationResult}>
              <PrinterIcon aria-hidden="true" />
              In
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
