import { PrinterIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '@/api/core/request'
import { MINISTRY_NAME, printBrandHtml, printBrandStyles, printFaviconLink } from '@/app/branding'
import { authStorage } from '../../../../api/features/auth'
import { useAuth } from '../../../../api/query'
import { useAlert } from '@/components/alert'
import { Modal } from '@/components/modal'
import { StudentHeader } from '../components/StudentHeader'
import './StudentTimetablePage.css'

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

type StudentAcademicInfo = {
  ma_lop?: string | null
  ten_nganh_hoc?: string | null
}

type CourseRegistrationResponse = {
  data: {
    registration_period: { term?: { nam_hoc?: string | null; hoc_ky?: string | null } | null } | null
    student_academic_info?: StudentAcademicInfo | null
    student_timetable: TimetableRow[]
  }
}

type CurrentAcademicTermResponse = {
  data?: {
    id?: number
    nam_hoc_id?: number
    nam_hoc?: string | null
    hoc_ky?: string | null
  } | null
}

type AcademicYear = { id: number; nam_hoc: string }
type AcademicTerm = { id: number; nam_hoc_id: number; hoc_ky: string }
type CatalogResponse<T> = { data: T[] }
type ViewMode = 'merged' | 'split'
type WeekSegment = { start: number; end: number }
type MergedTimetableRow = TimetableRow & {
  weekSegments: WeekSegment[]
  timetableIds: number[]
}

type TimetableCachePayload = {
  academicYears?: AcademicYear[]
  academicTerms?: AcademicTerm[]
  selectedYearId?: number | null
  selectedTermId?: number | null
  periodYear?: string
  periodSemester?: string
  sysAcademicYear?: string
  sysSemester?: string
  rows?: TimetableRow[]
  academicInfo?: StudentAcademicInfo | null
}

const PERIODS = Array.from({ length: 13 }, (_, index) => index + 1)
const WEEK_COUNT = 19
const WEEKS = Array.from({ length: WEEK_COUNT }, (_, index) => index + 1)
const DAYS = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
  { value: 8, label: 'Chủ nhật' },
]

const CURRENT_TERM_CACHE_KEY = 'student-current-academic-term'
const STUDENT_TIMETABLE_CACHE_PREFIX = 'student-timetable-page'
const PENDING_YEAR_ID = -1
const PENDING_TERM_ID = -1
const FALLBACK_CURRENT_TERM = {
  year: '2024-2025',
  semester: '1',
}

function isAcademicYearLabel(value?: string | null) {
  return /^\d{4}-\d{4}$/.test(value?.trim() ?? '')
}

function isSemesterLabel(value?: string | null) {
  const normalized = value?.trim()
  return Boolean(normalized && !isAcademicYearLabel(normalized))
}

function studentTimetableCacheKey(username?: string | null) {
  return `${STUDENT_TIMETABLE_CACHE_PREFIX}:${username?.trim() || 'current'}`
}

function readStudentTimetableCache(username?: string | null): TimetableCachePayload | null {
  try {
    const cached = window.localStorage.getItem(studentTimetableCacheKey(username))
    return cached ? JSON.parse(cached) as TimetableCachePayload : null
  } catch {
    return null
  }
}

function writeStudentTimetableCache(username: string | undefined | null, payload: TimetableCachePayload) {
  try {
    window.localStorage.setItem(studentTimetableCacheKey(username), JSON.stringify({
      ...payload,
      cachedAt: Date.now(),
    }))
  } catch {
    // Cache is only an instant-render helper; ignore storage failures.
  }
}

function readCachedCurrentTerm() {
  try {
    const cached = window.localStorage.getItem(CURRENT_TERM_CACHE_KEY)
    if (!cached) return FALLBACK_CURRENT_TERM
    const parsed = JSON.parse(cached) as { year?: string; semester?: string }
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
  if (!normalizedYear || !normalizedSemester) return
  window.localStorage.setItem(CURRENT_TERM_CACHE_KEY, JSON.stringify({
    year: normalizedYear,
    semester: normalizedSemester,
  }))
}

function formatDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function addDays(value: string | null | undefined, days: number) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function makeLessonPattern(start: number, end: number) {
  return PERIODS.map((period) => (period >= start && period <= end ? String(period % 10) : '-')).join('')
}

function makeWeekPatternFromSegments(segments: WeekSegment[]) {
  return WEEKS.map((week) => (
    segments.some((segment) => week >= segment.start && week <= segment.end) ? String(week % 10) : '-'
  )).join('')
}

function mergeWeekSegments(segments: WeekSegment[]) {
  return segments
    .slice()
    .sort((left, right) => left.start - right.start || left.end - right.end)
    .reduce<WeekSegment[]>((merged, segment) => {
      const last = merged.at(-1)
      if (!last || segment.start > last.end + 1) {
        merged.push({ ...segment })
        return merged
      }

      last.end = Math.max(last.end, segment.end)
      return merged
    }, [])
}

function timetableMergeKey(row: TimetableRow) {
  return [
    row.ma_hoc_phan,
    row.nhom_hoc_phan,
    row.ten_hoc_phan,
    row.so_tin_chi,
    row.lop_hoc_phan,
    row.thu,
    row.tiet_bat_dau,
    row.tiet_ket_thuc,
    row.ten_giang_vien,
    row.ten_phong,
  ].join('::')
}

function earliestDate(left?: string | null, right?: string | null) {
  if (!left) return right ?? null
  if (!right) return left

  const leftTime = new Date(left).getTime()
  const rightTime = new Date(right).getTime()
  if (Number.isNaN(leftTime)) return right
  if (Number.isNaN(rightTime)) return left

  return leftTime <= rightTime ? left : right
}

function mergeTimetableRows(rows: TimetableRow[]): MergedTimetableRow[] {
  const groups = new Map<string, MergedTimetableRow>()

  rows.forEach((row) => {
    const key = timetableMergeKey(row)
    const existing = groups.get(key)
    const segment = { start: row.tuan_bat_dau, end: row.tuan_ket_thuc }

    if (!existing) {
      groups.set(key, {
        ...row,
        weekSegments: [segment],
        timetableIds: [row.id],
      })
      return
    }

    existing.tuan_bat_dau = Math.min(existing.tuan_bat_dau, row.tuan_bat_dau)
    existing.tuan_ket_thuc = Math.max(existing.tuan_ket_thuc, row.tuan_ket_thuc)
    existing.ngay_bat_dau_hoc = earliestDate(existing.ngay_bat_dau_hoc, row.ngay_bat_dau_hoc)
    existing.weekSegments = mergeWeekSegments([...existing.weekSegments, segment])
    existing.timetableIds.push(row.id)
  })

  return Array.from(groups.values())
}

function rowsForWeek(rows: TimetableRow[], week: number) {
  return rows.filter((row) => row.tuan_bat_dau <= week && row.tuan_ket_thuc >= week)
}

function rowsForWeekSegment(rows: TimetableRow[], segment: WeekSegment) {
  return rows.filter((row) => row.tuan_bat_dau <= segment.end && row.tuan_ket_thuc >= segment.start)
}

function weekSignature(rows: TimetableRow[], week: number) {
  return rowsForWeek(rows, week)
    .map((row) => `${row.id}:${row.ma_hoc_phan}:${row.nhom_hoc_phan}:${row.thu}:${row.tiet_bat_dau}:${row.tiet_ket_thuc}:${row.ten_phong}`)
    .sort()
    .join('|')
}

function buildWeekSegments(rows: TimetableRow[], selectedWeek: string): WeekSegment[] {
  if (selectedWeek !== 'all') {
    const week = Number(selectedWeek)
    return Number.isFinite(week) ? [{ start: week, end: week }] : []
  }

  const segments: WeekSegment[] = []
  let currentStart = 0
  let currentEnd = 0
  let currentSignature = ''

  WEEKS.forEach((week) => {
    const signature = weekSignature(rows, week)
    if (!signature) {
      if (currentSignature) segments.push({ start: currentStart, end: currentEnd })
      currentStart = 0
      currentEnd = 0
      currentSignature = ''
      return
    }

    if (!currentSignature) {
      currentStart = week
      currentEnd = week
      currentSignature = signature
      return
    }

    if (signature === currentSignature) {
      currentEnd = week
      return
    }

    segments.push({ start: currentStart, end: currentEnd })
    currentStart = week
    currentEnd = week
    currentSignature = signature
  })

  if (currentSignature) segments.push({ start: currentStart, end: currentEnd })
  return segments
}

function weekStartDate(rows: TimetableRow[], week: number) {
  const anchor = rows
    .filter((row) => row.ngay_bat_dau_hoc)
    .sort((left, right) => left.tuan_bat_dau - right.tuan_bat_dau)[0]

  if (!anchor?.ngay_bat_dau_hoc) return null
  return addDays(anchor.ngay_bat_dau_hoc, (week - anchor.tuan_bat_dau) * 7)
}

function weekEndDate(rows: TimetableRow[], week: number) {
  return addDays(weekStartDate(rows, week), 6)
}

function weekSegmentTitle(rows: TimetableRow[], segment: WeekSegment) {
  return `Từ tuần ${segment.start} (${formatDate(weekStartDate(rows, segment.start))}) đến tuần ${segment.end} (${formatDate(weekEndDate(rows, segment.end))})`
}

function rowLabel(row: TimetableRow) {
  return `${row.ma_hoc_phan} - ${row.nhom_hoc_phan}\n${row.ten_hoc_phan}\nPhòng: ${row.ten_phong}`
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default function StudentTimetablePage() {
  const alert = useAlert()
  const navigate = useNavigate()
  const { user, me, logout } = useAuth()
  const cachedUsername = authStorage.getUser()?.username || null
  const cachedTimetable = useMemo(() => readStudentTimetableCache(cachedUsername), [cachedUsername])
  const lastLoadedTermIdRef = useRef<number | null>(cachedTimetable?.selectedTermId ?? null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [sysAcademicYear, setSysAcademicYear] = useState(() => cachedTimetable?.sysAcademicYear || readCachedCurrentTerm().year)
  const [sysSemester, setSysSemester] = useState(() => cachedTimetable?.sysSemester || readCachedCurrentTerm().semester)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => cachedTimetable?.academicYears ?? [])
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>(() => cachedTimetable?.academicTerms ?? [])
  const [selectedYearId, setSelectedYearId] = useState<number | null>(() => cachedTimetable?.selectedYearId ?? null)
  const [selectedTermId, setSelectedTermId] = useState<number | null>(() => cachedTimetable?.selectedTermId ?? null)
  const [periodYear, setPeriodYear] = useState(() => cachedTimetable?.periodYear ?? '')
  const [periodSemester, setPeriodSemester] = useState(() => cachedTimetable?.periodSemester ?? '')
  const [rows, setRows] = useState<TimetableRow[]>(() => cachedTimetable?.rows ?? [])
  const [academicInfo, setAcademicInfo] = useState<StudentAcademicInfo | null>(() => cachedTimetable?.academicInfo ?? null)
  const [viewMode, setViewMode] = useState<ViewMode>('merged')
  const [selectedWeek, setSelectedWeek] = useState('all')

  useEffect(() => {
    if (!user) void me()
  }, [me, user])

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        const [registrationResponse, termResponse, yearsResponse, termsResponse] = await Promise.all([
          apiGet<CourseRegistrationResponse>('/student/course-registration'),
          apiGet<CurrentAcademicTermResponse>('/academic-catalog/current-term').catch(() => null),
          apiGet<CatalogResponse<AcademicYear>>('/academic-catalog/nam-hocs'),
          apiGet<CatalogResponse<AcademicTerm>>('/academic-catalog/hoc-kys'),
        ])

        if (!isMounted) return

        const registrationData = registrationResponse.data
        const term = registrationData.registration_period?.term
        const currentTerm = termResponse?.data ?? null
        const years = yearsResponse.data ?? []
        const terms = termsResponse.data ?? []
        const year = term?.nam_hoc?.trim() || currentTerm?.nam_hoc?.trim() || readCachedCurrentTerm().year
        const semester = term?.hoc_ky?.trim() || currentTerm?.hoc_ky?.trim() || readCachedCurrentTerm().semester
        const selectedYear = years.find((item) => item.nam_hoc === year) ?? years[0] ?? null
        const selectedTerm = terms.find((item) => item.id === currentTerm?.id)
          ?? terms.find((item) => item.nam_hoc_id === selectedYear?.id && item.hoc_ky === semester)
          ?? terms.find((item) => item.nam_hoc_id === selectedYear?.id)
          ?? null

        setAcademicYears(years)
        setAcademicTerms(terms)
        setSelectedYearId(selectedYear?.id ?? null)
        setSelectedTermId(selectedTerm?.id ?? null)
        setPeriodYear(year)
        setPeriodSemester(semester)
        setSysAcademicYear(currentTerm?.nam_hoc?.trim() || year)
        setSysSemester(currentTerm?.hoc_ky?.trim() || semester)
        cacheCurrentTerm(currentTerm?.nam_hoc ?? year, currentTerm?.hoc_ky ?? semester)
        setRows(registrationData.student_timetable ?? [])
        setAcademicInfo(registrationData.student_academic_info ?? null)
        lastLoadedTermIdRef.current = selectedTerm?.id ?? null
        writeStudentTimetableCache(user?.username || cachedUsername, {
          academicYears: years,
          academicTerms: terms,
          selectedYearId: selectedYear?.id ?? null,
          selectedTermId: selectedTerm?.id ?? null,
          periodYear: year,
          periodSemester: semester,
          sysAcademicYear: currentTerm?.nam_hoc?.trim() || year,
          sysSemester: currentTerm?.hoc_ky?.trim() || semester,
          rows: registrationData.student_timetable ?? [],
          academicInfo: registrationData.student_academic_info ?? null,
        })
      } catch (err) {
        alert.showError('Không tải được thời khóa biểu', err instanceof Error ? err.message : 'Vui lòng thử lại.')
      }
    }

    void loadData()
    return () => {
      isMounted = false
    }
  }, [alert, cachedUsername, user?.username])

  useEffect(() => {
    if (!selectedTermId) return
    if (lastLoadedTermIdRef.current === selectedTermId) return
    let isMounted = true

    const loadTermTimetable = async () => {
      try {
        const response = await apiGet<CourseRegistrationResponse>(`/student/course-registration?hoc_ky_id=${selectedTermId}`)
        if (!isMounted) return
        const data = response.data
        const term = data.registration_period?.term
        setPeriodYear(term?.nam_hoc?.trim() || periodYear)
        setPeriodSemester(term?.hoc_ky?.trim() || periodSemester)
        setRows(data.student_timetable ?? [])
        setAcademicInfo(data.student_academic_info ?? null)
        setSelectedWeek('all')
        lastLoadedTermIdRef.current = selectedTermId
        writeStudentTimetableCache(user?.username || cachedUsername, {
          academicYears,
          academicTerms,
          selectedYearId,
          selectedTermId,
          periodYear: term?.nam_hoc?.trim() || periodYear,
          periodSemester: term?.hoc_ky?.trim() || periodSemester,
          sysAcademicYear,
          sysSemester,
          rows: data.student_timetable ?? [],
          academicInfo: data.student_academic_info ?? null,
        })
      } catch (err) {
        alert.showError('Không tải được thời khóa biểu', err instanceof Error ? err.message : 'Vui lòng thử lại.')
      }
    }

    void loadTermTimetable()
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTermId])

  const termsForSelectedYear = useMemo(() => (
    academicTerms.filter((term) => !selectedYearId || term.nam_hoc_id === selectedYearId)
  ), [academicTerms, selectedYearId])
  const selectedYearLabel = academicYears.find((year) => year.id === selectedYearId)?.nam_hoc
    || (isAcademicYearLabel(periodYear) ? periodYear : '')
    || (isAcademicYearLabel(sysAcademicYear) ? sysAcademicYear : '')
  const selectedSemesterLabel = academicTerms.find((term) => term.id === selectedTermId)?.hoc_ky
    || (isSemesterLabel(periodSemester) ? periodSemester : '')
    || (isSemesterLabel(sysSemester) ? sysSemester : '')
    || FALLBACK_CURRENT_TERM.semester
  const yearSelectValue = selectedYearId ?? (selectedYearLabel ? PENDING_YEAR_ID : '')
  const termSelectValue = selectedTermId ?? (selectedSemesterLabel ? PENDING_TERM_ID : '')
  const displayAcademicYears = selectedYearId || !selectedYearLabel
    ? academicYears
    : [{ id: PENDING_YEAR_ID, nam_hoc: selectedYearLabel }, ...academicYears]
  const displayTermsForSelectedYear = selectedTermId || !selectedSemesterLabel
    ? termsForSelectedYear
    : [{ id: PENDING_TERM_ID, nam_hoc_id: PENDING_YEAR_ID, hoc_ky: selectedSemesterLabel }, ...termsForSelectedYear]

  const selectedWeekSegments = useMemo(() => {
    if (viewMode !== 'split') return []
    return buildWeekSegments(rows, selectedWeek)
  }, [rows, selectedWeek, viewMode])

  const mergedRows = useMemo(() => (
    mergeTimetableRows(rows)
      .sort((left, right) => (
        left.thu - right.thu
        || left.tiet_bat_dau - right.tiet_bat_dau
        || left.ma_hoc_phan.localeCompare(right.ma_hoc_phan, 'vi')
      ))
  ), [rows])

  const handleLogout = () => {
    setShowLogoutConfirm(false)
    void logout()
    navigate('/login', { replace: true })
  }

  const cachedUserName = authStorage.getUser()?.name?.trim() || null
  const displayName = user?.name?.trim() || cachedUserName || ''
  const studentCode = user?.username || authStorage.getUser()?.username || ''
  const hasData = rows.length > 0

  const weeklyTableHtml = (weekRows: TimetableRow[]) => `
    <table class="week-grid">
      <thead><tr><th>Tiết</th>${DAYS.map((day) => `<th>${escapeHtml(day.label)}</th>`).join('')}</tr></thead>
      <tbody>
        ${PERIODS.map((period) => `
          <tr>
            <td class="period">${period}</td>
            ${DAYS.map((day) => {
              const covered = weekRows.some((row) => row.thu === day.value && row.tiet_bat_dau < period && row.tiet_ket_thuc >= period)
              if (covered) return ''
              const items = weekRows.filter((row) => row.thu === day.value && row.tiet_bat_dau === period)
              const rowSpan = Math.max(1, ...items.map((row) => row.tiet_ket_thuc - row.tiet_bat_dau + 1))
              return `<td rowspan="${rowSpan}">${items.map((row) => escapeHtml(rowLabel(row)).replace(/\n/g, '<br />')).join('<hr />')}</td>`
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `

  const openPrintWindow = (body: string) => {
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
  <title>Thời khóa biểu sinh viên</title>
  <style>
    ${printBrandStyles}
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; font-family: "Times New Roman", Arial, sans-serif; font-size: 13px; }
    .sheet { width: 100%; max-width: 900px; margin: 0 auto; }
    .top { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; text-align: center; font-weight: 700; }
    .top .line { display: inline-block; border-bottom: 1px solid #000; padding-bottom: 2px; }
    h1 { margin: 18px 0 2px; text-align: center; font-size: 18px; line-height: 1.15; }
    .subtitle { text-align: center; font-size: 15px; font-weight: 700; }
    .student-line { display: grid; grid-template-columns: 1.2fr 0.7fr 1fr; gap: 16px; margin: 8px 0 4px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #999; padding: 2px 4px; vertical-align: top; line-height: 1.12; }
    th { text-align: center; font-weight: 700; }
    .center { text-align: center; }
    .mono { font-family: "Courier New", monospace; overflow-wrap: anywhere; text-align: center; }
    .list th { background: #f7f7f7; }
    .week-title { margin: 14px 0 4px; font-weight: 700; text-align: center; }
    .week-grid th { background: #f7f7f7; }
    .week-grid th:first-child, .week-grid td:first-child { width: 28px; text-align: center; }
    .week-grid td { height: 19px; }
    .print-toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; gap: 8px; padding: 8px 0; background: #fff; }
    .print-toolbar button { border: 1px solid #999; background: #fff; padding: 5px 12px; cursor: pointer; }
    @media print { .print-toolbar { display: none; } .sheet { max-width: none; } }
  </style>
</head>
<body>
  <div class="print-toolbar"><button onclick="window.print()">In</button><button onclick="window.close()">Đóng</button></div>
  <div class="sheet">${body}</div>
</body>
</html>`)
    printWindow.document.close()
    printWindow.opener = null
  }

  const handlePrint = () => {
    const header = `
      <div class="top">
        <div>${printBrandHtml(MINISTRY_NAME)}</div>
        <div><div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div><div class="line">Độc lập - Tự do - Hạnh phúc</div></div>
      </div>
      <h1>THỜI KHÓA BIỂU SINH VIÊN</h1>
      <div class="subtitle">Học kỳ: ${escapeHtml(periodSemester)}. Năm học: ${escapeHtml(periodYear)}</div>
      <div class="student-line">
        <span>Tên sinh viên: <b>${escapeHtml(displayName)} (${escapeHtml(studentCode)})</b></span>
        <span>Lớp: <b>${escapeHtml(academicInfo?.ma_lop || '')}</b></span>
        <span>Ngành:<b>${escapeHtml(academicInfo?.ten_nganh_hoc || '')}</b></span>
      </div>
    `

    if (viewMode === 'merged') {
      const tableRows = mergedRows.map((row) => `
        <tr>
          <td>${escapeHtml(row.ma_hoc_phan)}</td>
          <td class="center">${escapeHtml(row.nhom_hoc_phan)}</td>
          <td>${escapeHtml(row.ten_hoc_phan)}</td>
          <td class="center">${escapeHtml(row.so_tin_chi)}</td>
          <td>${escapeHtml(row.lop_hoc_phan)}</td>
          <td class="center">${escapeHtml(row.thu)}</td>
          <td class="mono">${escapeHtml(makeLessonPattern(row.tiet_bat_dau, row.tiet_ket_thuc))}</td>
          <td>${escapeHtml(row.ten_giang_vien)}</td>
          <td class="center">${escapeHtml(row.ten_phong)}</td>
          <td class="center">${escapeHtml(formatDate(row.ngay_bat_dau_hoc))}</td>
          <td class="mono">${escapeHtml(makeWeekPatternFromSegments(row.weekSegments))}</td>
        </tr>
      `).join('')

      openPrintWindow(`${header}<table class="list">
        <tr><th>Mã HP</th><th>Nhóm</th><th>Tên HP</th><th>TC</th><th>Lớp HP</th><th>Thứ</th><th>Tiết học</th><th>CBGD</th><th>Phòng</th><th>Ngày BĐ</th><th>Tuần học</th></tr>
        ${tableRows || '<tr><td colspan="11" class="center">Không có dữ liệu</td></tr>'}
      </table>`)
      return
    }

    const splitBody = selectedWeekSegments.map((segment) => `
      <div class="week-title">${escapeHtml(weekSegmentTitle(rows, segment))}</div>
      ${weeklyTableHtml(rowsForWeekSegment(rows, segment))}
    `).join('')

    openPrintWindow(`${header}${splitBody || '<div class="center">Không có dữ liệu</div>'}`)
  }

  return (
    <div className="student-timetable-shell">
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
            id: 'student-timetable-logout-confirm',
            title: 'Xác nhận đăng xuất',
            content: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
            dismissible: true,
            closeOnOverlayClick: true,
            actions: [
              { label: 'Hủy', variant: 'secondary', autoClose: false, onClick: () => setShowLogoutConfirm(false) },
              { label: 'Đăng xuất', variant: 'danger', autoClose: false, onClick: () => void handleLogout() },
            ],
          }}
          onClose={() => setShowLogoutConfirm(false)}
        />
      )}

      <main className="student-timetable-page">
        <div className="portal-filters">
          <label>
            <span>Năm học</span>
            <select value={yearSelectValue} onChange={(event) => {
              const yearId = Number(event.target.value)
              if (yearId === PENDING_YEAR_ID) return
              const year = academicYears.find((item) => item.id === yearId)
              const firstTerm = academicTerms.find((item) => item.nam_hoc_id === yearId) ?? null
              setSelectedYearId(yearId || null)
              setPeriodYear(year?.nam_hoc ?? '')
              setSelectedTermId(firstTerm?.id ?? null)
              setPeriodSemester(firstTerm?.hoc_ky ?? '')
              setSelectedWeek('all')
              if (!firstTerm) setRows([])
            }}>
              {displayAcademicYears.map((year) => <option key={year.id} value={year.id}>{year.nam_hoc}</option>)}
            </select>
          </label>

          <label>
            <span>Học kỳ</span>
            <select value={termSelectValue} onChange={(event) => {
              const termId = Number(event.target.value)
              if (termId === PENDING_TERM_ID) return
              const term = academicTerms.find((item) => item.id === termId)
              setSelectedTermId(termId || null)
              setPeriodSemester(term?.hoc_ky ?? '')
              setSelectedWeek('all')
            }}>
              {displayTermsForSelectedYear.length === 0 && <option value="">Không có dữ liệu</option>}
              {displayTermsForSelectedYear.map((term) => <option key={term.id} value={term.id}>{term.hoc_ky}</option>)}
            </select>
          </label>

          <label>
            <span>Tùy chọn</span>
            <select value={viewMode} onChange={(event) => {
              setViewMode(event.target.value as ViewMode)
              setSelectedWeek('all')
            }}>
              <option value="merged">Ghép tuần vào trang</option>
              <option value="split">Tách trang theo tuần</option>
            </select>
          </label>

          {viewMode === 'split' && (
            <label>
              <span>Chọn tuần</span>
              <select value={selectedWeek} onChange={(event) => setSelectedWeek(event.target.value)}>
                <option value="all">---- Tất cả ----</option>
                {WEEKS.map((week) => (
                  <option key={week} value={week}>
                    Tuần {week} ({formatDate(weekStartDate(rows, week))} đến {formatDate(weekEndDate(rows, week))})
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {!hasData ? (
          <div className="portal-no-data">Không có dữ liệu</div>
        ) : viewMode === 'merged' ? (
          <div className="portal-table-wrap">
            <table className="portal-list-table">
              <thead>
                <tr>
                  <th>Mã học phần</th>
                  <th>Nhóm học phần</th>
                  <th>Tên học phần</th>
                  <th>Số tín chỉ/ĐVHT</th>
                  <th>Lớp học phần</th>
                  <th>Thứ</th>
                  <th>Tiết học</th>
                  <th>Tên cán bộ</th>
                  <th>Tên phòng</th>
                  <th>Tuần BĐ dạy</th>
                  <th>Tuần học</th>
                </tr>
              </thead>
              <tbody>
                {mergedRows.map((row) => (
                  <tr key={`${row.timetableIds.join('-')}-${row.thu}-${row.tiet_bat_dau}`}>
                    <td><strong>{row.ma_hoc_phan}</strong></td>
                    <td>{row.nhom_hoc_phan}</td>
                    <td>{row.ten_hoc_phan}</td>
                    <td className="center">{row.so_tin_chi}</td>
                    <td>{row.lop_hoc_phan}</td>
                    <td className="center">{row.thu}</td>
                    <td className="pattern">{makeLessonPattern(row.tiet_bat_dau, row.tiet_ket_thuc)}</td>
                    <td>{row.ten_giang_vien}</td>
                    <td>{row.ten_phong}</td>
                    <td className="center">{formatDate(row.ngay_bat_dau_hoc)}</td>
                    <td className="pattern">{makeWeekPatternFromSegments(row.weekSegments)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="weekly-stack">
            {selectedWeekSegments.map((segment) => (
              <section className="weekly-block" key={`${segment.start}-${segment.end}`}>
                <h2>{weekSegmentTitle(rows, segment)}</h2>
                <WeeklyGrid rows={rowsForWeekSegment(rows, segment)} />
              </section>
            ))}
          </div>
        )}

        <div className="portal-actions">
          <button type="button" onClick={handlePrint}>
            <PrinterIcon aria-hidden="true" />
            <span>In</span>
          </button>
        </div>

        <div className="student-timetable-print-info">
          <strong>THỜI KHÓA BIỂU SINH VIÊN</strong>
          <span>Học kỳ: {periodSemester}. Năm học: {periodYear}</span>
          <span>Tên sinh viên: <b>{displayName} ({studentCode})</b> Lớp: <b>{academicInfo?.ma_lop || ''}</b> Ngành: <b>{academicInfo?.ten_nganh_hoc || ''}</b></span>
        </div>
      </main>
    </div>
  )
}

function WeeklyGrid({ rows }: { rows: TimetableRow[] }) {
  return (
    <table className="weekly-grid-table">
      <thead>
        <tr>
          <th>Tiết</th>
          {DAYS.map((day) => <th key={day.value}>{day.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {PERIODS.map((period) => (
          <tr key={period}>
            <td className="period-cell">{period}</td>
            {DAYS.map((day) => {
              const covered = rows.some((row) => row.thu === day.value && row.tiet_bat_dau < period && row.tiet_ket_thuc >= period)
              if (covered) return null

              const items = rows.filter((row) => row.thu === day.value && row.tiet_bat_dau === period)
              const rowSpan = Math.max(1, ...items.map((row) => row.tiet_ket_thuc - row.tiet_bat_dau + 1))

              return (
                <td key={day.value} rowSpan={rowSpan}>
                  {items.map((row) => (
                    <div className="weekly-course" key={`${row.id}-${row.tiet_bat_dau}`}>
                      {rowLabel(row).split('\n').map((line) => <span key={line}>{line}</span>)}
                    </div>
                  ))}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
