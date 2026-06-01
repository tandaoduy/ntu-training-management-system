import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AcademicCapIcon,
  ChartBarIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline'
import RoleLayout from '../../layout/RoleLayout'
import { apiGet, apiPost, apiPut } from '@/api/core/request'
import { TRAINING_DEPARTMENT_NAME, printBrandHtml, printBrandStyles, printFaviconLink } from '@/app/branding'
import { useAlert } from '@/components/alert'
import { Breadcrumbs } from '@/components/breadcrumbs/Breadcrumbs'
import './GradeViewPage.css'

type ViewerRole = 'student' | 'training_officer' | 'manager'
export type GradeTool = 'student' | 'section' | 'analysis' | 'edit'
type TranscriptMode = '10' | '4'
type AnalysisMode = 'section' | 'course'

type GradeRow = {
  id: number
  dang_ky_hoc_phan_id?: number
  hoc_ky_id: number
  nam_hoc_id?: number | null
  nam_hoc?: string | null
  hoc_ky?: string | null
  ma_sinh_vien?: string | null
  ho_ten?: string | null
  ma_lop?: string | null
  ten_nganh_hoc?: string | null
  ma_hoc_phan?: string | null
  ten_hoc_phan?: string | null
  so_tin_chi?: number | null
  lop_hoc_phan?: string | null
  nhom_hoc_phan?: string | null
  ten_giang_vien?: string | null
  attendance_score?: string | number | null
  midterm_score?: string | number | null
  final_score?: string | number | null
  attendance_weight?: string | number | null
  midterm_weight?: string | number | null
  final_weight?: string | number | null
  average_score?: string | number | null
  letter_grade?: string | null
  grade_point?: string | number | null
  result?: string | null
  note?: string | null
  exempt_grade?: boolean
  grade_mode?: 'numeric' | 'pass_fail' | string | null
}

type GradeResponse = { data: GradeRow[] }
type StudentLookupResponse = {
  data: GradeRow[]
  student: Pick<GradeRow, 'ma_sinh_vien' | 'ho_ten' | 'ma_lop' | 'ten_nganh_hoc'> | null
}
type CourseCatalogItem = {
  id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi?: number | null
}
type CourseCatalogResponse = { data: CourseCatalogItem[] }
type GradeEditDraft = {
  attendance_score: string
  midterm_score: string
  final_score: string
  average_score: string
}

const roleMeta = {
  student: {
    endpoint: '/student/grades',
    studentEndpoint: '',
    roleLabel: 'SINH VIÊN',
    roleColor: 'purple' as const,
    homeRoute: '/sinhvien',
    gradeRoute: '/sinhvien/diem',
  },
  training_officer: {
    endpoint: '/training-officer/grades',
    studentEndpoint: '/training-officer/grades/students',
    roleLabel: 'CHUYÊN VIÊN',
    roleColor: 'orange' as const,
    homeRoute: '/chuyenvien',
    gradeRoute: '/chuyenvien/diem',
  },
  manager: {
    endpoint: '/manager/grades',
    studentEndpoint: '/manager/grades/students',
    roleLabel: 'QUẢN LÍ',
    roleColor: 'teal' as const,
    homeRoute: '/quanly',
    gradeRoute: '/quanly/diem',
  },
}

const numberValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const scoreText = (value?: string | number | null) => {
  const score = numberValue(value)
  if (score === null) return ''
  return score.toFixed(1)
}

const isExemptCourse = (row: GradeRow) => Boolean(row.exempt_grade)
  || normalizeSearch(row.letter_grade).includes('mien')
  || normalizeSearch(row.note).includes('mien')
  || (row.grade_mode === 'pass_fail' && row.result === 'passed' && numberValue(row.grade_point) === null)

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const normalizeSearch = (value: unknown) => String(value ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .trim()

const isValidScoreText = (value: string) => value === '' || /^(?:10(?:\.0?)?|[0-9](?:\.\d?)?)$/.test(value)

const gradeFields = [
  { key: 'attendance_score', weight: 'attendance_weight', label: 'Điểm bộ phận' },
  { key: 'midterm_score', weight: 'midterm_weight', label: 'Điểm giữa kỳ' },
  { key: 'final_score', weight: 'final_weight', label: 'Điểm thi kết thúc' },
] as const

const activeGradeFields = (row: GradeRow) => gradeFields.filter((field) => (
  Number(row[field.weight] ?? 0) > 0 || numberValue(row[field.key]) !== null
))

const calculatedAverage = (row: GradeRow, draft: GradeEditDraft) => {
  const fields = activeGradeFields(row)
  const totalWeight = fields.reduce((sum, field) => sum + Number(row[field.weight] ?? 0), 0)
  if (!fields.length || totalWeight <= 0) return ''
  if (fields.some((field) => numberValue(draft[field.key]) === null)) return ''

  const total = fields.reduce((sum, field) => (
    sum + (numberValue(draft[field.key]) ?? 0) * Number(row[field.weight] ?? 0)
  ), 0)

  return (total / totalWeight).toFixed(1)
}

const termKey = (row: GradeRow) => `${row.nam_hoc ?? ''}|${row.hoc_ky ?? ''}|${row.hoc_ky_id}`
const courseKey = (row: GradeRow) => `${row.ma_hoc_phan ?? ''}|${row.ten_hoc_phan ?? ''}`
const sectionKey = (row: GradeRow) => `${courseKey(row)}|${row.lop_hoc_phan ?? row.nhom_hoc_phan ?? ''}`

const termOrder = (row: GradeRow) => {
  const startYear = Number(String(row.nam_hoc ?? '').slice(0, 4))
  const semester = Number(String(row.hoc_ky ?? '').replace(/\D/g, '')) || (String(row.hoc_ky ?? '').toLowerCase().includes('h') ? 3 : 0)
  return (Number.isFinite(startYear) ? startYear : 0) * 10 + semester
}

const sortByStudentCode = (left: GradeRow, right: GradeRow) => (
  String(left.ma_sinh_vien ?? '').localeCompare(String(right.ma_sinh_vien ?? ''), 'vi', { numeric: true })
)

const letterGradeFromAverage = (value?: string | number | null) => {
  const score = numberValue(value)
  if (score === null) return ''
  if (score < 3) return 'F'
  if (score < 4) return 'D-'
  if (score < 4.5) return 'D'
  if (score < 5) return 'D+'
  if (score < 5.5) return 'C-'
  if (score < 6) return 'C'
  if (score < 6.5) return 'C+'
  if (score < 7) return 'B-'
  if (score < 8) return 'B'
  if (score < 8.5) return 'B+'
  if (score < 9) return 'A-'
  return 'A'
}

const gradePointFromLetter = (letter: string) => {
  switch (letter) {
    case 'A': return 4
    case 'A-': return 3.7
    case 'B+': return 3.5
    case 'B': return 3
    case 'B-': return 2.7
    case 'C+': return 2.5
    case 'C': return 2
    case 'C-': return 1.7
    case 'D+': return 1.5
    case 'D': return 1
    case 'D-': return 0.7
    default: return 0
  }
}

const gradePointFromAverage = (value?: string | number | null) => {
  const score = numberValue(value)
  return score === null ? null : gradePointFromLetter(letterGradeFromAverage(score))
}

const isPassedCourse = (row: GradeRow) => (
  row.grade_mode === 'pass_fail'
    ? row.result === 'passed'
    : numberValue(row.average_score) !== null && letterGradeFromAverage(row.average_score) !== 'F'
)

const passFailScoreText = (value?: string | number | null) => {
  const score = numberValue(value)
  if (score === null) return ''
  return score >= 10 ? 'Đạt' : 'Chưa đạt'
}

const displayScore = (row: GradeRow, value?: string | number | null) => (
  isExemptCourse(row) ? 'Miễn' : row.grade_mode === 'pass_fail' ? passFailScoreText(value) : scoreText(value)
)

const completionMark = (row: GradeRow) => (
  isPassedCourse(row) ? (isExemptCourse(row) ? '*(BL)' : '*') : ''
)

function groupedTerms(rows: GradeRow[]) {
  const groups = new Map<string, GradeRow[]>()
  rows
    .slice()
    .sort((left, right) => termOrder(left) - termOrder(right) || String(left.ma_hoc_phan ?? '').localeCompare(String(right.ma_hoc_phan ?? ''), 'vi', { numeric: true }))
    .forEach((row) => {
      const key = termKey(row)
      groups.set(key, [...(groups.get(key) ?? []), row])
    })
  return Array.from(groups.entries()).map(([key, items]) => ({ key, items }))
}

function printDocument(title: string, html: string) {
  const documentHtml = `<!doctype html><html><head><meta charset="utf-8">${printFaviconLink}<title>${escapeHtml(title)}</title>
    <style>
      ${printBrandStyles}
      body{font-family:"Times New Roman",serif;margin:22px;color:#111;font-size:12px}
      .school{text-align:center;font-weight:700;line-height:1.35}.title{text-align:center;font-weight:700;font-size:15px;margin:8px 0 12px}
      .meta{width:620px;max-width:100%;margin:0 auto 10px;line-height:1.5}
      table{width:860px;max-width:100%;margin:10px auto 0;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #555;padding:3px 5px;font-size:11px}
      th{background:#f2f2f2}.center{text-align:center}.term,.summary{font-weight:700;background:#eee}
      .course-cell{white-space:normal;word-break:normal;overflow-wrap:break-word;line-height:1.15}
      .transcript-table th:nth-child(1){width:90px}.transcript-table th:nth-child(2){width:390px}.transcript-table th:nth-child(3){width:48px}
      .section-table th:nth-child(1){width:44px}.section-table th:nth-child(2){width:92px}.section-table th:nth-child(3){width:210px}.section-table th:nth-child(4){width:90px}
      .signature{margin:26px auto 0;width:860px;max-width:100%;box-sizing:border-box;padding-left:540px;text-align:center;font-size:13px;line-height:1.45}
    </style></head><body>${html}</body></html>`
  const url = URL.createObjectURL(new Blob([documentHtml], { type: 'text/html;charset=utf-8' }))
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

function transcriptHtml(rows: GradeRow[], studentCode: string, mode: TranscriptMode) {
  const first = rows[0]
  const summarizeTranscript = (items: GradeRow[]) => {
    const gradedRows = items.filter((row) => row.grade_mode === 'pass_fail' ? row.result !== 'pending' : (mode === '4' ? gradePointFromAverage(row.average_score) : numberValue(row.average_score)) !== null)
    const credits = gradedRows.filter(isPassedCourse).reduce((sum, row) => sum + Number(row.so_tin_chi ?? 0), 0)
    const weightedCredits = gradedRows.reduce((sum, row) => sum + Number(row.so_tin_chi ?? 0), 0)
    const weighted = gradedRows.reduce((sum, row) => sum + (row.grade_mode === 'pass_fail' ? 0 : ((mode === '4' ? gradePointFromAverage(row.average_score) : numberValue(row.average_score)) ?? 0) * Number(row.so_tin_chi ?? 0)), 0)

    return {
      credits,
      average: weightedCredits ? weighted / weightedCredits : 0,
    }
  }
  const summary = summarizeTranscript(rows)
  const today = new Date()
  const scoreHeader = mode === '4' ? '<th>Chữ</th><th>N</th>' : '<th>KT</th><th>GK</th><th>Thi</th><th>TK</th><th>N</th>'
  const scoreCells = (row: GradeRow) => (
    mode === '4'
      ? `<td class="center">${escapeHtml(row.grade_mode === 'pass_fail' ? row.letter_grade : letterGradeFromAverage(row.average_score))}</td><td class="center">${completionMark(row)}</td>`
      : `<td class="center">${escapeHtml(displayScore(row, row.attendance_score))}</td><td class="center">${escapeHtml(displayScore(row, row.midterm_score))}</td><td class="center">${escapeHtml(displayScore(row, row.final_score))}</td><td class="center">${escapeHtml(displayScore(row, row.average_score))}</td><td class="center">${completionMark(row)}</td>`
  )
  const summaryColspan = mode === '4' ? 5 : 8
  return `
    ${printBrandHtml(TRAINING_DEPARTMENT_NAME)}
    <div class="title">BẢNG ĐIỂM HỌC KỲ - HỆ ${mode}</div>
    <div class="meta">
      Họ tên: <b>${escapeHtml(first?.ho_ten)}</b> - ${escapeHtml(studentCode)}<br/>
      Lớp: <b>${escapeHtml(first?.ma_lop)}</b><br/>
      Ngành: <b>${escapeHtml(first?.ten_nganh_hoc)}</b><br/>
      Điểm TB tích lũy: <b>${summary.average.toFixed(1)}</b>&nbsp;&nbsp; ĐVHT tích lũy: <b>${summary.credits}</b>
    </div>
    <table class="transcript-table"><thead><tr><th>Mã HP</th><th>Tên môn học</th><th>TC</th>${scoreHeader}</tr></thead><tbody>
      ${groupedTerms(rows).map(({ items }) => {
        const termSummary = summarizeTranscript(items)
        return `
          <tr class="term"><td colspan="${summaryColspan}">Học kỳ ${escapeHtml(items[0]?.hoc_ky)} năm học ${escapeHtml(items[0]?.nam_hoc)}</td></tr>
          ${items.map((row) => `<tr><td>${escapeHtml(row.ma_hoc_phan)}</td><td class="course-cell">${escapeHtml(row.ten_hoc_phan)}</td><td class="center">${escapeHtml(row.so_tin_chi)}</td>${scoreCells(row)}</tr>`).join('')}
          <tr class="summary"><td colspan="2">TC/Điểm học kỳ</td><td class="center">${termSummary.credits}</td><td colspan="${mode === '4' ? 1 : 4}"></td><td class="center">${termSummary.average.toFixed(1)}</td></tr>
        `
      }).join('')}
    </tbody></table>
    <div class="signature"><div><i>Khánh Hòa, Ngày ${today.getDate()} tháng ${String(today.getMonth() + 1).padStart(2, '0')} năm ${today.getFullYear()}</i></div><div>TL.Hiệu trưởng</div><div>Trưởng phòng Đào tạo Đại học</div></div>
  `.replace(/<th>N<\/th>/g, '')
    .replace(/<td class="center">\*?<\/td>(?=<\/tr>)/g, '')
    .replace(/colspan="5"/g, 'colspan="4"')
    .replace(/colspan="8"/g, 'colspan="7"')
    .replace(/<td colspan="1"><\/td><td class="center">/g, '<td class="center">')
    .replace(/<td colspan="4"><\/td><td class="center">/g, '<td colspan="3"></td><td class="center">')
}

function sectionHtml(rows: GradeRow[]) {
  const first = rows[0]
  return `
    ${printBrandHtml(TRAINING_DEPARTMENT_NAME)}
    <div class="title">BẢNG ĐIỂM LỚP HỌC PHẦN</div>
    <div class="meta">
      Học phần: <b>${escapeHtml(first?.ma_hoc_phan)} - ${escapeHtml(first?.ten_hoc_phan)}</b><br/>
      Lớp học phần/Nhóm: <b>${escapeHtml(first?.lop_hoc_phan ?? first?.nhom_hoc_phan)}</b><br/>
      Giảng viên: <b>${escapeHtml(first?.ten_giang_vien)}</b>
    </div>
    <table class="section-table"><thead><tr><th>Stt</th><th>Mã SV</th><th>Họ tên</th><th>Lớp</th><th>KT</th><th>GK</th><th>Thi</th><th>TK</th></tr></thead><tbody>
      ${rows.slice().sort(sortByStudentCode).map((row, index) => `<tr><td class="center">${index + 1}</td><td>${escapeHtml(row.ma_sinh_vien)}</td><td class="course-cell">${escapeHtml(row.ho_ten)}</td><td>${escapeHtml(row.ma_lop)}</td><td class="center">${escapeHtml(scoreText(row.attendance_score))}</td><td class="center">${escapeHtml(scoreText(row.midterm_score))}</td><td class="center">${escapeHtml(scoreText(row.final_score))}</td><td class="center">${escapeHtml(scoreText(row.average_score))}</td></tr>`).join('')}
    </tbody></table>
  `
}

const median = (values: number[]) => {
  if (!values.length) return 0
  const sorted = values.slice().sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

const scoreCountBins = (scores: number[]) => Array.from({ length: 10 }, (_, index) => {
  const min = index
  const max = index + 1
  return {
    label: String(index + 1),
    count: scores.filter((score) => index === 9 ? score >= min && score <= max : score >= min && score < max).length,
  }
})

const scoreRangeBins = (scores: number[]) => [
  { label: '< 4.0', count: scores.filter((score) => score < 4).length },
  { label: '4.0 - 4.9', count: scores.filter((score) => score >= 4 && score < 5).length },
  { label: '5.0 - 6.4', count: scores.filter((score) => score >= 5 && score < 6.5).length },
  { label: '6.5 - 7.9', count: scores.filter((score) => score >= 6.5 && score < 8).length },
  { label: '8.0 - 10', count: scores.filter((score) => score >= 8).length },
]

const kdePoints = (scores: number[]) => {
  if (!scores.length) return []
  const bandwidth = Math.max(0.45, 1.06 * Math.sqrt(scores.reduce((sum, score) => sum + (score - (scores.reduce((a, b) => a + b, 0) / scores.length)) ** 2, 0) / scores.length) * scores.length ** -0.2)
  return Array.from({ length: 81 }, (_, index) => {
    const x = index / 8
    const density = scores.reduce((sum, score) => {
      const z = (x - score) / bandwidth
      return sum + Math.exp(-0.5 * z * z) / (bandwidth * Math.sqrt(2 * Math.PI))
    }, 0) / scores.length
    return { x, density }
  })
}

type ChartBin = { label: string; count: number }

const barChartSvg = (bins: ChartBin[], maxCount: number, xLabel: string, yLabel: string, fillClass: string) => {
  const chartLeft = 10
  const chartTop = 8
  const chartWidth = 86
  const chartHeight = 72
  const slot = chartWidth / Math.max(1, bins.length)
  const barWidth = Math.min(slot * 0.58, 7)

  return (
    <svg className="gv-oxy-chart" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label={xLabel}>
      <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartTop + chartHeight} className="gv-axis" />
      <line x1={chartLeft} y1={chartTop + chartHeight} x2={chartLeft + chartWidth} y2={chartTop + chartHeight} className="gv-axis" />
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const tickValue = Math.round(maxCount * ratio)
        const previousValue = Math.round(maxCount * (ratio - 0.25))
        const showTick = ratio === 0 || tickValue !== previousValue
        return (
        <g key={ratio}>
          <line x1={chartLeft} y1={chartTop + chartHeight - chartHeight * ratio} x2={chartLeft + chartWidth} y2={chartTop + chartHeight - chartHeight * ratio} className="gv-grid-line" />
          {showTick && <text x={chartLeft - 2} y={chartTop + chartHeight - chartHeight * ratio + 1.4} className="gv-axis-tick" textAnchor="end">{tickValue}</text>}
        </g>
      )})}
      {bins.map((bin, index) => {
        const height = maxCount ? (bin.count / maxCount) * (chartHeight - 4) : 0
        const visibleHeight = Math.max(height, 1.5)
        const x = chartLeft + slot * index + (slot - barWidth) / 2
        const y = chartTop + chartHeight - visibleHeight
        return (
          <g key={bin.label}>
            <rect x={x} y={y} width={barWidth} height={visibleHeight} className={fillClass} />
            <text x={x + barWidth / 2} y={chartTop + chartHeight + 6} className="gv-axis-label" textAnchor="middle">{bin.label}</text>
          </g>
        )
      })}
      <text x={chartLeft + chartWidth / 2} y="98" className="gv-axis-title" textAnchor="middle">{xLabel}</text>
      <text x="3" y={chartTop + chartHeight / 2} className="gv-axis-title gv-axis-title-y" textAnchor="middle">{yLabel}</text>
    </svg>
  )
}

export default function GradeViewPage({ viewerRole, tool }: { viewerRole: ViewerRole, tool?: GradeTool }) {
  const meta = roleMeta[viewerRole]
  const { showAlert } = useAlert()
  const [rows, setRows] = useState<GradeRow[]>([])
  const [studentCodeInput, setStudentCodeInput] = useState('')
  const [selectedStudentCode, setSelectedStudentCode] = useState('')
  const [studentLookup, setStudentLookup] = useState<GradeRow[]>([])
  const [studentLookupInfo, setStudentLookupInfo] = useState<Pick<GradeRow, 'ma_sinh_vien' | 'ho_ten' | 'ma_lop' | 'ten_nganh_hoc'> | null>(null)
  const [selectedTermKeys, setSelectedTermKeys] = useState<string[]>([])
  const [sectionCourseQuery, setSectionCourseQuery] = useState('')
  const [selectedSectionKey, setSelectedSectionKey] = useState('')
  const [analysisCourseKey, setAnalysisCourseKey] = useState('')
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('section')
  const [analysisSectionKey, setAnalysisSectionKey] = useState('')
  const [transcriptMode, setTranscriptMode] = useState<TranscriptMode>('10')
  const [gradeDrafts, setGradeDrafts] = useState<Record<number, GradeEditDraft>>({})
  const [completedCourseForm, setCompletedCourseForm] = useState({ ma_hoc_phan: '', hoc_ky_id: '' })
  const [courseCatalog, setCourseCatalog] = useState<CourseCatalogItem[]>([])
  const [editingGradeRow, setEditingGradeRow] = useState<GradeRow | null>(null)
  const [, setIsLoading] = useState(true)

  const refreshStudentLookup = async (code = selectedStudentCode) => {
    if (!code || !meta.studentEndpoint) return

    const response = await apiGet<StudentLookupResponse>(`${meta.studentEndpoint}/${encodeURIComponent(code)}`)
    setStudentLookupInfo(response.student)
    setStudentLookup(response.data)
    setRows((current) => [
      ...current.filter((row) => String(row.ma_sinh_vien ?? '') !== code),
      ...response.data,
    ])
  }

  const courseOptions = useMemo(() => Array.from(
    rows.reduce((map, row) => map.set(courseKey(row), row), new Map<string, GradeRow>()).values(),
  ).sort((left, right) => String(left.ma_hoc_phan ?? '').localeCompare(String(right.ma_hoc_phan ?? ''), 'vi', { numeric: true })), [rows])

  const sectionCourseMatches = useMemo(() => {
    const keyword = normalizeSearch(sectionCourseQuery)
    if (!keyword) return []

    return courseOptions.filter((row) => {
      const code = normalizeSearch(row.ma_hoc_phan)
      const name = normalizeSearch(row.ten_hoc_phan)
      const optionLabel = normalizeSearch(`${row.ma_hoc_phan ?? ''} - ${row.ten_hoc_phan ?? ''}`)
      return code === keyword || name === keyword || optionLabel === keyword
    })
  }, [courseOptions, sectionCourseQuery])

  const sectionOptions = useMemo(() => {
    const matchedCourseKeys = new Set(sectionCourseMatches.map(courseKey))
    return Array.from(
      rows
        .filter((row) => matchedCourseKeys.has(courseKey(row)))
        .reduce((map, row) => map.set(sectionKey(row), row), new Map<string, GradeRow>()).values(),
    ).sort((left, right) => (
      String(left.ma_hoc_phan ?? '').localeCompare(String(right.ma_hoc_phan ?? ''), 'vi', { numeric: true })
      || String(left.lop_hoc_phan ?? left.nhom_hoc_phan ?? '').localeCompare(String(right.lop_hoc_phan ?? right.nhom_hoc_phan ?? ''), 'vi', { numeric: true })
    ))
  }, [rows, sectionCourseMatches])

  const selectedSectionRows = useMemo(() => (
    selectedSectionKey ? rows.filter((row) => sectionKey(row) === selectedSectionKey) : []
  ), [rows, selectedSectionKey])

  const studentRows = useMemo(() => {
    const code = selectedStudentCode.trim()
    return code ? rows.filter((row) => String(row.ma_sinh_vien ?? '') === code) : []
  }, [rows, selectedStudentCode])

  const selectedStudentRows = studentRows.length ? studentRows : studentLookup
  const studentDisplayRows = useMemo(() => (
    selectedStudentRows.length
      ? selectedStudentRows
      : studentLookupInfo
        ? [{ id: -1, hoc_ky_id: 0, ...studentLookupInfo }]
        : []
  ), [selectedStudentRows, studentLookupInfo])
  const studentTerms = useMemo(() => groupedTerms(selectedStudentRows), [selectedStudentRows])
  const studentTermKeys = useMemo(() => studentTerms.map((term) => term.key), [studentTerms])
  const studentPrintRows = useMemo(() => (
    selectedTermKeys.length
      ? selectedStudentRows.filter((row) => selectedTermKeys.includes(termKey(row)))
      : []
  ), [selectedTermKeys, selectedStudentRows])
  const studentEditRows = useMemo(() => (
    selectedTermKeys.length
      ? selectedStudentRows.filter((row) => selectedTermKeys.includes(termKey(row)))
      : selectedStudentRows
  ), [selectedTermKeys, selectedStudentRows])

  useEffect(() => {
    setGradeDrafts(Object.fromEntries(
      selectedStudentRows
        .filter((row) => row.dang_ky_hoc_phan_id)
        .map((row) => [row.dang_ky_hoc_phan_id as number, {
          attendance_score: scoreText(row.attendance_score),
          midterm_score: scoreText(row.midterm_score),
          final_score: scoreText(row.final_score),
          average_score: scoreText(row.average_score),
        }]),
    ))
  }, [selectedStudentRows])

  const analysisSectionOptions = useMemo(() => Array.from(
    rows
      .filter((row) => analysisCourseKey && courseKey(row) === analysisCourseKey)
      .reduce((map, row) => map.set(sectionKey(row), row), new Map<string, GradeRow>()).values(),
  ).sort((left, right) => String(left.lop_hoc_phan ?? left.nhom_hoc_phan ?? '').localeCompare(String(right.lop_hoc_phan ?? right.nhom_hoc_phan ?? ''), 'vi', { numeric: true })), [analysisCourseKey, rows])

  const analysisRows = useMemo(() => {
    if (!analysisCourseKey) return []
    if (analysisMode === 'section') {
      return analysisSectionKey ? rows.filter((row) => sectionKey(row) === analysisSectionKey) : []
    }
    return rows.filter((row) => courseKey(row) === analysisCourseKey)
  }, [analysisCourseKey, analysisMode, analysisSectionKey, rows])
  const analysisScores = useMemo(() => analysisRows.map((row) => numberValue(row.average_score)).filter((value): value is number => value !== null), [analysisRows])
  const analysisMean = analysisScores.length ? analysisScores.reduce((sum, value) => sum + value, 0) / analysisScores.length : 0
  const analysisMedian = median(analysisScores)
  const pointBins = useMemo(() => scoreCountBins(analysisScores), [analysisScores])
  const rangeBins = useMemo(() => scoreRangeBins(analysisScores), [analysisScores])
  const densityPoints = useMemo(() => kdePoints(analysisScores), [analysisScores])
  const maxPointBin = Math.max(1, ...pointBins.map((bin) => bin.count))
  const maxRangeBin = Math.max(1, ...rangeBins.map((bin) => bin.count))
  const maxDensity = Math.max(0.01, ...densityPoints.map((point) => point.density))
  const densityPath = densityPoints.map((point, index) => {
    const x = 10 + (point.x / 10) * 86
    const y = 80 - (point.density / maxDensity) * 72
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')
  const densityAreaPath = densityPath ? `${densityPath} L 96 80 L 10 80 Z` : ''
  const densityPeakX = densityPoints.reduce((peak, point) => point.density > peak.density ? point : peak, { x: 0, density: -1 }).x

  useEffect(() => {
    let mounted = true

    const loadGrades = async () => {
      setIsLoading(true)
      try {
        const response = await apiGet<GradeResponse>(meta.endpoint)
        if (!mounted) return
        setRows(response.data)
        const firstCourse = response.data[0] ? courseKey(response.data[0]) : ''
        setAnalysisCourseKey(firstCourse)
      } catch (error) {
        showAlert({
          title: 'Không tải được điểm',
          message: typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' ? error.message : 'Vui lòng thử lại sau.',
          variant: 'error',
        })
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void loadGrades()

    return () => {
      mounted = false
    }
  }, [meta.endpoint, showAlert])

  useEffect(() => {
    if (viewerRole !== 'training_officer' || tool !== 'edit') return

    let mounted = true
    const loadCourseCatalog = async () => {
      try {
        const response = await apiGet<CourseCatalogResponse>('/academic-catalog/hoc-phans')
        if (mounted) setCourseCatalog(response.data)
      } catch {
        if (mounted) setCourseCatalog([])
      }
    }

    void loadCourseCatalog()

    return () => {
      mounted = false
    }
  }, [tool, viewerRole])

  useEffect(() => {
    setSelectedSectionKey((current) => (
      current && sectionOptions.some((row) => sectionKey(row) === current) ? current : ''
    ))
  }, [sectionOptions])

  useEffect(() => {
    setAnalysisSectionKey((current) => (
      current && analysisSectionOptions.some((row) => sectionKey(row) === current)
        ? current
        : (analysisSectionOptions[0] ? sectionKey(analysisSectionOptions[0]) : '')
    ))
  }, [analysisSectionOptions])

  useEffect(() => {
    setSelectedTermKeys(studentTermKeys)
  }, [studentTermKeys])

  useEffect(() => {
    const selectedTerm = studentTerms.find((term) => selectedTermKeys.includes(term.key)) ?? studentTerms[0]
    const termId = selectedTerm?.items[0]?.hoc_ky_id
    if (tool === 'edit' && termId && !completedCourseForm.hoc_ky_id) {
      setCompletedCourseForm((current) => ({ ...current, hoc_ky_id: String(termId) }))
    }
  }, [completedCourseForm.hoc_ky_id, selectedTermKeys, studentTerms, tool])

  const toggleStudentTerm = (key: string, checked: boolean) => {
    setSelectedTermKeys((current) => (
      checked
        ? Array.from(new Set([...current, key]))
        : current.filter((item) => item !== key)
    ))
  }

  const findStudent = async () => {
    const code = studentCodeInput.trim()
    setSelectedStudentCode(code)
    setSelectedTermKeys([])
    setStudentLookup([])
    setStudentLookupInfo(null)

    if (!code || rows.some((row) => String(row.ma_sinh_vien ?? '') === code) || !meta.studentEndpoint) {
      return
    }

    try {
      const response = await apiGet<StudentLookupResponse>(`${meta.studentEndpoint}/${encodeURIComponent(code)}`)
      if (response.student) {
        setStudentLookupInfo(response.student)
        setStudentLookup(response.data)
        return
      }

      showAlert({ title: 'Không tìm thấy sinh viên', message: 'Mã sinh viên không tồn tại trong hệ thống.', variant: 'warning' })
    } catch (error) {
      showAlert({
        title: 'Không tìm thấy sinh viên',
        message: typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' ? error.message : 'Vui lòng thử lại sau.',
        variant: 'warning',
      })
    }
    return
    if (code && !rows.some((row) => String(row.ma_sinh_vien ?? '') === code)) {
      showAlert({ title: 'Không tìm thấy sinh viên', message: 'Mã sinh viên không có trong dữ liệu điểm hiện tại.', variant: 'warning' })
    }
  }

  const printStudentTranscript = () => {
    if (!studentPrintRows.length) {
      showAlert({ title: 'Chưa có dữ liệu in', message: 'Vui lòng nhập mã sinh viên và chọn học kỳ cần in.', variant: 'warning' })
      return
    }
    printDocument('Bảng điểm sinh viên', transcriptHtml(studentPrintRows, selectedStudentCode, transcriptMode))
  }

  const printSection = () => {
    if (!selectedSectionRows.length) {
      showAlert({ title: 'Chưa chọn lớp học phần', message: 'Vui lòng chọn học phần và lớp học phần cần in.', variant: 'warning' })
      return
    }
    printDocument('Bảng điểm lớp học phần', sectionHtml(selectedSectionRows))
  }

  const updateGradeDraft = (registrationId: number, field: keyof GradeEditDraft, value: string) => {
    if (field !== 'average_score' && !isValidScoreText(value)) return
    setGradeDrafts((current) => ({
      ...current,
      [registrationId]: {
        ...(current[registrationId] ?? { attendance_score: '', midterm_score: '', final_score: '', average_score: '' }),
        [field]: value,
      },
    }))
  }

  const editStudentGrade = async (row: GradeRow) => {
    if (viewerRole !== 'training_officer' || !row.dang_ky_hoc_phan_id) return false

    const draft = gradeDrafts[row.dang_ky_hoc_phan_id]
    const averageScore = draft ? calculatedAverage(row, draft) : ''
    if (!draft || !averageScore) {
      showAlert({ title: 'Chưa đủ điểm', message: 'Vui lòng nhập đầy đủ điểm thành phần từ 0 đến 10.', variant: 'warning' })
      return false
    }

    try {
      await apiPut(`/training-officer/grades/registrations/${row.dang_ky_hoc_phan_id}`, {
        attendance_score: draft.attendance_score || null,
        midterm_score: draft.midterm_score || null,
        final_score: draft.final_score || null,
        average_score: averageScore,
      })
      showAlert({ title: 'Đã sửa điểm', message: 'Bảng điểm sinh viên đã được cập nhật.', variant: 'success' })
      await refreshStudentLookup(String(row.ma_sinh_vien ?? selectedStudentCode))
      return true
    } catch (error) {
      showAlert({
        title: 'Không sửa được điểm',
        message: typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' ? error.message : 'Vui lòng thử lại.',
        variant: 'error',
      })
      return false
    }
  }

  const addCompletedCourse = async () => {
    if (viewerRole !== 'training_officer') return
    const code = selectedStudentCode.trim()
    if (!code) {
      showAlert({ title: 'Chưa chọn sinh viên', message: 'Vui lòng nhập mã sinh viên trước.', variant: 'warning' })
      return
    }

    if (!completedCourseForm.ma_hoc_phan.trim() || !completedCourseForm.hoc_ky_id) {
      showAlert({ title: 'Chưa nhập học phần', message: 'Vui lòng nhập mã học phần và ID học kỳ.', variant: 'warning' })
      return
    }

    try {
      await apiPost(`/training-officer/grades/students/${encodeURIComponent(code)}/completed-courses`, {
        ma_hoc_phan: completedCourseForm.ma_hoc_phan.trim(),
        hoc_ky_id: Number(completedCourseForm.hoc_ky_id),
        note: 'Miễn',
      })
      showAlert({ title: 'Đã thêm học phần', message: 'Học phần đã miễn/hoàn thành đã được thêm vào bảng điểm.', variant: 'success' })
      setCompletedCourseForm({ ma_hoc_phan: '', hoc_ky_id: '' })
      await refreshStudentLookup(code)
    } catch (error) {
      showAlert({
        title: 'Không thêm được học phần',
        message: typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' ? error.message : 'Vui lòng thử lại.',
        variant: 'error',
      })
    }
  }

  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel={meta.roleLabel}
      roleColor={meta.roleColor}
      homeRoute={meta.homeRoute}
      roleTitle={meta.roleLabel}
    >
      <main className="gv-page">
        {viewerRole !== 'student' && !tool && (
          <section className="gv-tool-list">
            <article className="gv-tool-row">
              <Link className="gv-tool-summary" to={`${meta.gradeRoute}/insinhvien`}>
                <span className="gv-tool-icon gv-tool-icon-blue"><DocumentTextIcon aria-hidden="true" /></span>
                <span className="gv-tool-copy">
                  <strong>In bảng điểm sinh viên</strong>
                  <small>Tra cứu theo mã sinh viên</small>
                </span>
                <ChevronRightIcon aria-hidden="true" />
              </Link>
            </article>

            <article className="gv-tool-row">
              <Link className="gv-tool-summary" to={`${meta.gradeRoute}/inlophocphan`}>
                <span className="gv-tool-icon gv-tool-icon-purple"><AcademicCapIcon aria-hidden="true" /></span>
                <span className="gv-tool-copy">
                  <strong>In bảng điểm lớp học phần</strong>
                  <small>Chọn học phần và lớp học phần</small>
                </span>
                <ChevronRightIcon aria-hidden="true" />
              </Link>
            </article>

            <article className="gv-tool-row">
              <Link className="gv-tool-summary" to={`${meta.gradeRoute}/phodiem`}>
                <span className="gv-tool-icon gv-tool-icon-teal"><ChartBarIcon aria-hidden="true" /></span>
                <span className="gv-tool-copy">
                  <strong>Phân tích phổ điểm theo môn học</strong>
                  <small>Xem phân bố điểm của từng học phần</small>
                </span>
                <ChevronRightIcon aria-hidden="true" />
              </Link>
            </article>

            {viewerRole === 'training_officer' && (
              <article className="gv-tool-row">
                <Link className="gv-tool-summary" to={`${meta.gradeRoute}/chinhsuadiem`}>
                  <span className="gv-tool-icon gv-tool-icon-blue"><DocumentTextIcon aria-hidden="true" /></span>
                  <span className="gv-tool-copy">
                    <strong>Chỉnh sửa điểm</strong>
                    <small>Sửa điểm và thêm môn miễn/hoàn thành cho sinh viên</small>
                  </span>
                  <ChevronRightIcon aria-hidden="true" />
                </Link>
              </article>
            )}
          </section>
        )}

        {viewerRole !== 'student' && tool && (
          <section className="gv-detail-page">
            <Breadcrumbs
              className="gv-breadcrumbs"
              items={[
                { label: 'Quản lí điểm', href: meta.gradeRoute },
                { label: tool === 'student' ? 'In bảng điểm sinh viên' : tool === 'section' ? 'In bảng điểm lớp học phần' : tool === 'edit' ? 'Chỉnh sửa điểm' : 'Phân tích phổ điểm' },
              ]}
            />

            {(tool === 'student' || tool === 'edit') && (
              <article className="gv-detail-card">
                <div className="gv-student-search">
                  <label>
                    <span>Mã sinh viên</span>
                    <input value={studentCodeInput} onChange={(event) => setStudentCodeInput(event.target.value)} />
                  </label>
                  <button type="button" onClick={findStudent}>
                    <MagnifyingGlassIcon aria-hidden="true" />
                    <span>Thực hiện</span>
                  </button>
                </div>
                {studentDisplayRows[0] && (
                  <div className="gv-student-info-line">
                    <span>Họ tên sinh viên:</span>
                    <strong>{studentDisplayRows[0].ho_ten || 'Chưa có thông tin'}</strong>
                    <span>- Lớp:</span>
                    <strong>{studentDisplayRows[0].ma_lop || 'Chưa có lớp'}</strong>
                  </div>
                )}
                {studentTerms.length > 0 && (
                  <div className="gv-term-picker">
                    <div className="gv-term-heading">{tool === 'edit' ? 'Chọn học kỳ chỉnh sửa' : 'Chọn học kỳ in'}</div>
                    <table>
                      <thead><tr><th>Stt</th><th>Năm học</th><th>Học kỳ</th><th>Chọn</th></tr></thead>
                      <tbody>
                        {studentTerms.map(({ key, items }, index) => (
                          <tr key={key}>
                            <td>{index + 1}</td>
                            <td>{items[0]?.nam_hoc}</td>
                            <td>{items[0]?.hoc_ky}</td>
                            <td><input type="checkbox" checked={selectedTermKeys.includes(key)} onChange={(event) => toggleStudentTerm(key, event.target.checked)} /></td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={3}>Chọn tất cả</td>
                          <td><input type="checkbox" checked={studentTermKeys.length > 0 && selectedTermKeys.length === studentTermKeys.length} onChange={(event) => setSelectedTermKeys(event.target.checked ? studentTermKeys : [])} /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {studentDisplayRows.length > 0 && tool !== 'edit' && (
                  <div className="gv-print-options">
                    <div className="gv-print-mode" aria-label="Hệ điểm">
                      <label>
                        <input
                          type="radio"
                          name="transcriptMode"
                          value="10"
                          checked={transcriptMode === '10'}
                          onChange={() => setTranscriptMode('10')}
                        />
                        <span>Hệ điểm 10</span>
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="transcriptMode"
                          value="4"
                          checked={transcriptMode === '4'}
                          onChange={() => setTranscriptMode('4')}
                        />
                        <span>Hệ điểm 4</span>
                      </label>
                    </div>
                    <button type="button" className="gv-print-button" onClick={printStudentTranscript}>
                      <PrinterIcon aria-hidden="true" />
                      <span>In bảng điểm</span>
                    </button>
                  </div>
                )}
                {viewerRole === 'training_officer' && tool === 'edit' && studentDisplayRows.length > 0 && (
                  <div className="gv-completed-course-form">
                    <label>
                      <span>Mã học phần miễn</span>
                      <select value={completedCourseForm.ma_hoc_phan} onChange={(event) => setCompletedCourseForm((current) => ({ ...current, ma_hoc_phan: event.target.value }))}>
                        <option value="">-- Chọn học phần --</option>
                        {courseCatalog.map((course) => (
                          <option key={course.id} value={course.ma_hoc_phan}>
                            {course.ma_hoc_phan} - {course.ten_hoc_phan}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Học kỳ</span>
                      <select value={completedCourseForm.hoc_ky_id} onChange={(event) => setCompletedCourseForm((current) => ({ ...current, hoc_ky_id: event.target.value }))}>
                        <option value="">-- Chọn học kỳ --</option>
                        {studentTerms.map(({ key, items }) => (
                          <option key={key} value={items[0]?.hoc_ky_id}>{items[0]?.nam_hoc} - HK {items[0]?.hoc_ky}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" className="gv-print-button" onClick={addCompletedCourse}>
                      <span>Thêm môn miễn</span>
                    </button>
                  </div>
                )}
                {viewerRole === 'training_officer' && tool === 'edit' && studentEditRows.length > 0 && (
                  <div className="gv-section-list gv-edit-grade-list">
                    <table>
                      <thead>
                        <tr>
                          <th>Mã HP</th>
                          <th>Tên học phần</th>
                          <th>Năm học</th>
                          <th>Học kỳ</th>
                          <th>Chuyên cần</th>
                          <th>Giữa kỳ</th>
                          <th>Cuối kỳ</th>
                          <th>Điểm TK</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentEditRows.map((row) => {
                          const isExempt = isExemptCourse(row)
                          return (
                            <tr key={`${row.dang_ky_hoc_phan_id ?? row.id}-${row.ma_hoc_phan}`}>
                              <td>{row.ma_hoc_phan}</td>
                              <td>{row.ten_hoc_phan}</td>
                              <td>{row.nam_hoc}</td>
                              <td>{row.hoc_ky}</td>
                              <td>{displayScore(row, row.attendance_score) || '-'}</td>
                              <td>{displayScore(row, row.midterm_score) || '-'}</td>
                              <td>{displayScore(row, row.final_score) || '-'}</td>
                              <td>{displayScore(row, row.average_score) || '-'}</td>
                              <td>
                                <button
                                  type="button"
                                  className="gv-icon-action"
                                  disabled={isExempt}
                                  onClick={() => setEditingGradeRow(row)}
                                  aria-label={`Sửa điểm ${row.ma_hoc_phan ?? ''}`}
                                  title="Sửa điểm"
                                >
                                  <PencilSquareIcon aria-hidden="true" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            )}

            {tool === 'section' && (
              <article className="gv-detail-card">
                <div className="gv-inline-form">
                  <label>
                    <span>Học phần</span>
                    <input
                      list="gv-section-course-options"
                      value={sectionCourseQuery}
                      onChange={(event) => setSectionCourseQuery(event.target.value)}
                      placeholder="Nhập mã hoặc tên học phần"
                    />
                    <span hidden>
                    <input
                      list="gv-section-course-options"
                      value={sectionCourseQuery}
                      onChange={(event) => setSectionCourseQuery(event.target.value)}
                      placeholder="Nhập mã hoặc tên học phần"
                    />
                    <datalist id="gv-section-course-options">
                      {courseOptions.map((row) => <option key={courseKey(row)} value={`${row.ma_hoc_phan ?? ''} - ${row.ten_hoc_phan ?? ''}`} />)}
                    </datalist>
                    </span>
                  </label>
                  <label>
                    <span>Lớp học phần</span>
                    <select value={selectedSectionKey} onChange={(event) => setSelectedSectionKey(event.target.value)}>
                      <option value="">-- Chọn nhóm học phần --</option>
                      {sectionOptions.map((row) => (
                        <option key={sectionKey(row)} value={sectionKey(row)}>
                          {row.ma_hoc_phan} - {row.ten_hoc_phan} - {row.lop_hoc_phan ?? row.nhom_hoc_phan}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" onClick={printSection}>In danh sách</button>
                </div>
                <div className="gv-section-list">
                  <table>
                    <thead><tr><th>Stt</th><th>Mã HP</th><th>Tên học phần</th><th>Lớp học phần</th><th>Số SV có điểm</th></tr></thead>
                    <tbody>
                      {sectionOptions.map((row, index) => (
                        <tr key={sectionKey(row)} onClick={() => setSelectedSectionKey(sectionKey(row))} className={sectionKey(row) === selectedSectionKey ? 'is-selected' : ''}>
                          <td>{index + 1}</td>
                          <td>{row.ma_hoc_phan}</td>
                          <td>{row.ten_hoc_phan}</td>
                          <td>{row.lop_hoc_phan ?? row.nhom_hoc_phan}</td>
                          <td>{rows.filter((item) => sectionKey(item) === sectionKey(row)).length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            )}

            {tool === 'analysis' && (
              <article className="gv-detail-card">
                <div className="gv-analysis-tabs" role="tablist" aria-label="Chế độ phân tích">
                  <button type="button" className={analysisMode === 'section' ? 'is-active' : ''} onClick={() => setAnalysisMode('section')}>Vẽ theo nhóm HP</button>
                  <button type="button" className={analysisMode === 'course' ? 'is-active' : ''} onClick={() => setAnalysisMode('course')}>Vẽ theo môn học</button>
                </div>
                <div className="gv-inline-form">
                  <label>
                    <span>Môn học</span>
                    <select value={analysisCourseKey} onChange={(event) => setAnalysisCourseKey(event.target.value)}>
                      {courseOptions.map((row) => <option key={courseKey(row)} value={courseKey(row)}>{row.ma_hoc_phan} - {row.ten_hoc_phan}</option>)}
                    </select>
                  </label>
                  {analysisMode === 'section' && (
                    <label>
                      <span>Nhóm HP</span>
                      <select value={analysisSectionKey} onChange={(event) => setAnalysisSectionKey(event.target.value)}>
                        {analysisSectionOptions.map((row) => <option key={sectionKey(row)} value={sectionKey(row)}>{row.lop_hoc_phan ?? row.nhom_hoc_phan}</option>)}
                      </select>
                    </label>
                  )}
                </div>
                <div className="gv-analysis">
                  <div className="gv-analysis-stats">
                    <span>Số lượng: <b>{analysisScores.length}</b></span>
                    <span>Trung bình: <b>{analysisMean.toFixed(1)}</b></span>
                    <span>Trung vị: <b>{analysisMedian.toFixed(1)}</b></span>
                  </div>
                  <div className="gv-analysis-charts">
                    <section className="gv-chart-panel gv-chart-panel-wide">
                      <h3>Phân bố điểm số</h3>
                      {barChartSvg(pointBins, maxPointBin, 'Điểm số', 'Số lượng sinh viên', 'gv-svg-bar-blue')}
                    </section>
                    <section className="gv-chart-panel">
                      <h3>Phân bố điểm theo khoảng</h3>
                      {barChartSvg(rangeBins, maxRangeBin, 'Khoảng điểm', 'Số lượng sinh viên', 'gv-svg-bar-red')}
                    </section>
                    <section className="gv-chart-panel">
                      <h3>Đường mật độ phân bố điểm (KDE)</h3>
                      <svg className="gv-oxy-chart gv-kde-chart" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label="KDE">
                        <line x1="10" y1="8" x2="10" y2="80" className="gv-axis" />
                        <line x1="10" y1="80" x2="96" y2="80" className="gv-axis" />
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => <line key={ratio} x1="10" y1={80 - 72 * ratio} x2="96" y2={80 - 72 * ratio} className="gv-grid-line" />)}
                        {[0, 2, 4, 6, 8, 10].map((tick) => <text key={tick} x={10 + tick * 8.6} y="86" className="gv-axis-label" textAnchor="middle">{tick}</text>)}
                        <text x="53" y="98" className="gv-axis-title" textAnchor="middle">Điểm số</text>
                        <text x="3" y="44" className="gv-axis-title gv-axis-title-y" textAnchor="middle">Mật độ</text>
                        <line x1={(10 + densityPeakX * 8.6).toFixed(2)} y1="8" x2={(10 + densityPeakX * 8.6).toFixed(2)} y2="80" className="gv-kde-pass-line" />
                        {densityAreaPath && <path d={densityAreaPath} className="gv-kde-area" />}
                        {densityPath && <path d={densityPath} className="gv-kde-line" />}
                      </svg>
                    </section>
                  </div>
                </div>
              </article>
            )}
          </section>
        )}

        {editingGradeRow && editingGradeRow.dang_ky_hoc_phan_id && (() => {
          const registrationId = editingGradeRow.dang_ky_hoc_phan_id
          const draft = gradeDrafts[registrationId] ?? { attendance_score: '', midterm_score: '', final_score: '', average_score: '' }
          const fields = activeGradeFields(editingGradeRow)
          const averageScore = calculatedAverage(editingGradeRow, draft)

          return (
            <div className="gv-modal-overlay" role="presentation" onClick={() => setEditingGradeRow(null)}>
              <section className="gv-grade-modal" role="dialog" aria-modal="true" aria-labelledby="gv-edit-grade-title" onClick={(event) => event.stopPropagation()}>
                <div className="gv-grade-modal-head">
                  <div>
                    <h2 id="gv-edit-grade-title">Sửa điểm học phần</h2>
                    <p>{editingGradeRow.ma_hoc_phan} - {editingGradeRow.ten_hoc_phan}</p>
                  </div>
                  <button type="button" className="gv-modal-close" onClick={() => setEditingGradeRow(null)} aria-label="Đóng">×</button>
                </div>
                <div className="gv-grade-modal-grid">
                  {fields.map((field) => (
                    <label key={field.key}>
                      <span>{field.label} ({Number(editingGradeRow[field.weight] ?? 0).toFixed(2)})</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={draft[field.key]}
                        onChange={(event) => updateGradeDraft(registrationId, field.key, event.target.value)}
                      />
                    </label>
                  ))}
                  <label>
                    <span>Điểm TK</span>
                    <output>{averageScore || '-'}</output>
                  </label>
                </div>
                <div className="gv-grade-modal-actions">
                  <button type="button" onClick={() => setEditingGradeRow(null)}>Hủy</button>
                  <button
                    type="button"
                    className="primary"
                    onClick={async () => {
                      const updated = await editStudentGrade(editingGradeRow)
                      if (updated) setEditingGradeRow(null)
                    }}
                  >
                    Lưu
                  </button>
                </div>
              </section>
            </div>
          )
        })()}
      </main>
    </RoleLayout>
  )
}
