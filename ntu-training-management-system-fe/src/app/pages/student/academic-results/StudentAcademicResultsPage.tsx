import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet } from '@/api/core/request'
import { TRAINING_DEPARTMENT_NAME, printBrandHtml, printBrandStyles, printFaviconLink } from '@/app/branding'
import { authStorage } from '@/api/features/auth'
import { useAuth } from '@/api/query'
import { StudentHeader } from '../components/StudentHeader'
import './StudentAcademicResultsPage.css'

type AcademicYear = { id: number; nam_hoc: string }
type AcademicTerm = { id: number; nam_hoc_id: number; hoc_ky: string }
type CatalogResponse<T> = { data: T[] }

type GradeRow = {
  id: number
  hoc_ky_id: number
  nam_hoc_id?: number | null
  nam_hoc?: string | null
  hoc_ky?: string | null
  ten_nganh_hoc?: string | null
  ma_hoc_phan?: string | null
  ten_hoc_phan?: string | null
  so_tin_chi?: number | null
  nhom_hoc_phan?: string | null
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

type GradesResponse = { data: GradeRow[] }
type CurrentAcademicTermResponse = {
  data?: { nam_hoc?: string | null; hoc_ky?: string | null } | null
}

const scoreText = (value?: string | number | null) => {
  const score = numberValue(value)
  if (score === null) return ''
  return score.toFixed(1)
}
const weightText = (value: string | number | null | undefined, fallback: number) => {
  const parsed = value === null || value === undefined || value === '' ? fallback : Number(value)
  return Number.isFinite(parsed) ? parsed.toFixed(2) : ''
}
const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
const numberValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
const isPassFailCourse = (row: GradeRow) => row.grade_mode === 'pass_fail'
const normalizeText = (value: unknown) => String(value ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .trim()
const isExemptCourse = (row: GradeRow) => Boolean(row.exempt_grade)
  || normalizeText(row.letter_grade).includes('mien')
  || normalizeText(row.note).includes('mien')
  || (row.grade_mode === 'pass_fail' && row.result === 'passed' && numberValue(row.grade_point) === null)
const passFailScoreText = (value?: string | number | null) => {
  const score = numberValue(value)
  if (score === null) return ''
  return score >= 10 ? 'Đạt' : 'Chưa đạt'
}
const displayScore = (row: GradeRow, value?: string | number | null) => (
  isExemptCourse(row) ? 'Miễn' : isPassFailCourse(row) ? passFailScoreText(value) : scoreText(value)
)
const displayGradePoint = (row: GradeRow) => (
  isExemptCourse(row) ? 'Miễn' : scoreText(row.grade_point)
)

const completionMark = (row: GradeRow) => (
  row.result === 'passed' ? (isExemptCourse(row) ? '*(BL)' : '*') : ''
)

const termOrder = (year?: string | null, semester?: string | null) => {
  const startYear = Number(String(year ?? '').slice(0, 4))
  const semesterNumber = Number(String(semester ?? '').replace(/\D/g, '')) || (String(semester ?? '').toLowerCase().includes('h') ? 3 : 0)
  return (Number.isFinite(startYear) ? startYear : 0) * 10 + semesterNumber
}

const termKey = (row: GradeRow) => `${row.nam_hoc ?? ''}|${row.hoc_ky ?? ''}|${row.hoc_ky_id}`

function summarize(rows: GradeRow[]) {
  const totalCredits = rows.reduce((sum, row) => sum + Number(row.so_tin_chi ?? 0), 0)
  const gradedRows = rows.filter((row) => numberValue(row.average_score) !== null)
  const gradedCredits = gradedRows.reduce((sum, row) => sum + Number(row.so_tin_chi ?? 0), 0)
  const passedCredits = gradedRows
    .filter((row) => row.result !== 'failed')
    .reduce((sum, row) => sum + Number(row.so_tin_chi ?? 0), 0)
  const numericRows = gradedRows.filter((row) => !isPassFailCourse(row))
  const numericCredits = numericRows.reduce((sum, row) => sum + Number(row.so_tin_chi ?? 0), 0)
  const weighted10 = numericRows.reduce((sum, row) => sum + (numberValue(row.average_score) ?? 0) * Number(row.so_tin_chi ?? 0), 0)
  const weighted4 = numericRows.reduce((sum, row) => sum + (numberValue(row.grade_point) ?? 0) * Number(row.so_tin_chi ?? 0), 0)

  return {
    totalCredits,
    gradedCredits,
    passedCredits,
    average10: numericCredits ? weighted10 / numericCredits : 0,
    average4: numericCredits ? weighted4 / numericCredits : 0,
  }
}

export default function StudentAcademicResultsPage() {
  const navigate = useNavigate()
  const { user, me } = useAuth()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [terms, setTerms] = useState<AcademicTerm[]>([])
  const [rows, setRows] = useState<GradeRow[]>([])
  const [fromYearId, setFromYearId] = useState('')
  const [fromTermId, setFromTermId] = useState('')
  const [toYearId, setToYearId] = useState('')
  const [toTermId, setToTermId] = useState('')
  const [appliedFilter, setAppliedFilter] = useState({ fromYearId: '', fromTermId: '', toYearId: '', toTermId: '' })
  const [selectedDetail, setSelectedDetail] = useState<GradeRow | null>(null)
  const [sysAcademicYear, setSysAcademicYear] = useState('')
  const [sysSemester, setSysSemester] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) void me()
  }, [me, user])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setIsLoading(true)
      try {
        const [yearResponse, termResponse, gradeResponse, currentTermResponse] = await Promise.all([
          apiGet<CatalogResponse<AcademicYear>>('/academic-catalog/nam-hocs'),
          apiGet<CatalogResponse<AcademicTerm>>('/academic-catalog/hoc-kys'),
          apiGet<GradesResponse>('/student/grades'),
          apiGet<CurrentAcademicTermResponse>('/academic-catalog/current-term'),
        ])

        if (!mounted) return
        setYears(yearResponse.data)
        setTerms(termResponse.data)
        setRows(gradeResponse.data)
        setSysAcademicYear(currentTermResponse.data?.nam_hoc ?? '')
        setSysSemester(currentTermResponse.data?.hoc_ky ?? '')
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

  const termById = useMemo(() => new Map(terms.map((term) => [String(term.id), term])), [terms])
  const yearById = useMemo(() => new Map(years.map((year) => [String(year.id), year])), [years])

  const filteredRows = useMemo(() => {
    const fromTerm = termById.get(appliedFilter.fromTermId)
    const toTerm = termById.get(appliedFilter.toTermId)
    const fromYear = yearById.get(appliedFilter.fromYearId || String(fromTerm?.nam_hoc_id ?? ''))
    const toYear = yearById.get(appliedFilter.toYearId || String(toTerm?.nam_hoc_id ?? ''))
    const fromOrder = fromTerm || fromYear ? termOrder(fromYear?.nam_hoc, fromTerm?.hoc_ky ?? '0') : null
    const toOrder = toTerm || toYear ? termOrder(toYear?.nam_hoc, toTerm?.hoc_ky ?? '99') : null

    return rows
      .filter((row) => {
        const order = termOrder(row.nam_hoc, row.hoc_ky)
        return (fromOrder === null || order >= fromOrder) && (toOrder === null || order <= toOrder)
      })
      .sort((left, right) => termOrder(left.nam_hoc, left.hoc_ky) - termOrder(right.nam_hoc, right.hoc_ky)
        || String(left.ma_hoc_phan ?? '').localeCompare(String(right.ma_hoc_phan ?? ''), 'vi', { numeric: true }))
  }, [appliedFilter, rows, termById, yearById])

  const groupedRows = useMemo(() => {
    const groups = new Map<string, GradeRow[]>()
    filteredRows.forEach((row) => {
      const key = termKey(row)
      groups.set(key, [...(groups.get(key) ?? []), row])
    })

    return Array.from(groups.values())
  }, [filteredRows])

  const cumulativeByTerm = useMemo(() => {
    const summaries = new Map<string, ReturnType<typeof summarize>>()
    let accumulatedRows: GradeRow[] = []

    groupedRows.forEach((group) => {
      accumulatedRows = [...accumulatedRows, ...group]
      summaries.set(termKey(group[0]), summarize(accumulatedRows))
    })

    return summaries
  }, [groupedRows])

  const printResults = () => {
    const allSummary = summarize(filteredRows)
    const firstRow = filteredRows[0] ?? null
    const today = new Date()
    const printDate = `Khánh Hòa, Ngày ${today.getDate()} tháng ${String(today.getMonth() + 1).padStart(2, '0')} năm ${today.getFullYear()}`
    const html = `
      <!doctype html><html><head><meta charset="utf-8">${printFaviconLink}<title>Bảng điểm học kỳ</title>
      <style>
        ${printBrandStyles}
        body{font-family:"Times New Roman",serif;margin:18px;color:#111;font-size:12px}
        .top{display:grid;grid-template-columns:1fr;align-items:start;margin-bottom:8px}
        .school{text-align:center;font-weight:700;font-size:11px;line-height:1.35}
        .title{text-align:center;font-weight:700;font-size:15px;margin-top:4px}
        .meta{margin:10px auto 8px;width:520px;line-height:1.45}
        table{width:820px;max-width:100%;margin:12px auto 0;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #555;padding:3px 4px;font-size:11px}
        th{background:#f3f3f3}.center{text-align:center}.right{text-align:right}.term{font-weight:700;background:#eee}
        .summary{font-weight:700;background:#f5f5f5}
        .code{width:90px}.course{width:420px}.credit{width:44px}.score{width:66px}
        td.course-cell{white-space:normal;word-break:normal;overflow-wrap:break-word;line-height:1.15}
        .signature{margin:22px auto 0;width:820px;max-width:100%;box-sizing:border-box;padding-left:520px;text-align:center;font-size:13px;line-height:1.45}
      </style></head><body>
      <div class="top">${printBrandHtml(TRAINING_DEPARTMENT_NAME)}</div>
      <div class="title">BẢNG ĐIỂM HỌC KỲ</div>
      <div class="meta">
        Họ tên: <b>${escapeHtml(displayName)}</b><br/>
        Ngành: <b>${escapeHtml(firstRow?.ten_nganh_hoc)}</b><br/>
        Ngày: ${new Intl.DateTimeFormat('vi-VN').format(new Date())}<br/>
        Điểm TB tích lũy: <b>${allSummary.average10.toFixed(1)}</b>&nbsp;&nbsp; ĐVHT tích lũy: <b>${allSummary.passedCredits}</b>
      </div>
      <table><thead><tr><th class="code">Mã HP</th><th class="course">Tên môn học</th><th class="credit">TC</th><th class="score">KT</th><th class="score">GK</th><th class="score">Thi</th><th class="score">TK</th></tr></thead><tbody>
      ${groupedRows.map((group) => {
        const summary = summarize(group)
        return `
          <tr class="term"><td colspan="7">Học kỳ ${escapeHtml(group[0]?.hoc_ky)} năm học ${escapeHtml(group[0]?.nam_hoc)}</td></tr>
          ${group.map((row) => `<tr>
            <td>${escapeHtml(row.ma_hoc_phan)}</td><td class="course-cell">${escapeHtml(row.ten_hoc_phan)}</td><td class="center">${escapeHtml(row.so_tin_chi)}</td>
            <td class="center">${escapeHtml(displayScore(row, row.attendance_score))}</td><td class="center">${escapeHtml(displayScore(row, row.midterm_score))}</td><td class="center">${escapeHtml(displayScore(row, row.final_score))}</td>
            <td class="center">${escapeHtml(displayScore(row, row.average_score))}</td>
          </tr>`).join('')}
          <tr class="summary"><td colspan="2">TC/Điểm học kỳ</td><td class="center">${summary.totalCredits}</td><td colspan="3"></td><td class="center">${summary.average10.toFixed(1)}</td></tr>
        `
      }).join('')}
      </tbody></table>
      <div class="signature">
        <div><i>${printDate}</i></div>
        <div>TL.Hiệu trưởng</div>
        <div>Trưởng phòng Đào tạo Đại học</div>
      </div>
      </body></html>
    `
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }

  const cachedName = authStorage.getUser()?.name?.trim() || ''
  const displayName = user?.name?.trim() || cachedName

  return (
    <div className="sar-shell">
      <StudentHeader
        displayName={displayName}
        academicYear={sysAcademicYear}
        semester={sysSemester}
        onHomeClick={() => navigate('/sinhvien')}
        onLogoutClick={() => navigate('/login')}
      />

      <main className="sar-page">
        <section className="sar-panel">
          <div className="sar-title">Kết quả học tập sinh viên</div>

          <div className="sar-filters">
            <span>Từ năm học - học kỳ</span>
            <select value={fromYearId} onChange={(event) => { setFromYearId(event.target.value); setFromTermId('') }}>
              <option value="">---- Tất cả ----</option>
              {years.map((year) => <option key={year.id} value={year.id}>{year.nam_hoc}</option>)}
            </select>
            <select value={fromTermId} onChange={(event) => setFromTermId(event.target.value)}>
              <option value="">---- Tất cả ----</option>
              {terms.filter((term) => !fromYearId || String(term.nam_hoc_id) === fromYearId).map((term) => <option key={term.id} value={term.id}>{term.hoc_ky}</option>)}
            </select>

            <span>Đến năm học - học kỳ</span>
            <select value={toYearId} onChange={(event) => { setToYearId(event.target.value); setToTermId('') }}>
              <option value="">---- Tất cả ----</option>
              {years.map((year) => <option key={year.id} value={year.id}>{year.nam_hoc}</option>)}
            </select>
            <select value={toTermId} onChange={(event) => setToTermId(event.target.value)}>
              <option value="">---- Tất cả ----</option>
              {terms.filter((term) => !toYearId || String(term.nam_hoc_id) === toYearId).map((term) => <option key={term.id} value={term.id}>{term.hoc_ky}</option>)}
            </select>

            <div />
            <div className="sar-actions">
              <button type="button" onClick={() => setAppliedFilter({ fromYearId, fromTermId, toYearId, toTermId })}>Xem</button>
              <button type="button" onClick={printResults}>In</button>
            </div>
          </div>

          {isLoading ? (
            <div className="sar-empty">Đang tải kết quả học tập...</div>
          ) : groupedRows.length === 0 ? (
            <div className="sar-empty">Không có dữ liệu điểm.</div>
          ) : groupedRows.map((group) => {
            const summary = summarize(group)
            const cumulative = cumulativeByTerm.get(termKey(group[0])) ?? summary
            return (
              <section className="sar-term" key={termKey(group[0])}>
                <div className="sar-term-label">Học kỳ: {group[0]?.hoc_ky} - năm học: {group[0]?.nam_hoc}</div>
                <table className="sar-table">
                  <colgroup>
                    <col className="sar-col-stt" />
                    <col className="sar-col-code" />
                    <col className="sar-col-name" />
                    <col className="sar-col-group" />
                    <col className="sar-col-credit" />
                    <col className="sar-col-score" />
                    <col className="sar-col-score" />
                    <col className="sar-col-n" />
                    <col className="sar-col-detail" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Stt</th>
                      <th>Mã HP</th>
                      <th>Tên học phần</th>
                      <th>Nhóm</th>
                      <th>ĐVHT</th>
                      <th>Điểm HP hệ 10</th>
                      <th>Điểm HP hệ 4</th>
                      <th>N</th>
                      <th>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((row, index) => (
                      <tr key={row.id}>
                          <td>{index + 1}</td>
                          <td>{row.ma_hoc_phan}</td>
                          <td title={row.ten_hoc_phan ?? ''}>{row.ten_hoc_phan}</td>
                          <td>{row.nhom_hoc_phan}</td>
                          <td>{row.so_tin_chi}</td>
                          <td>{displayScore(row, row.average_score)}</td>
                          <td>{displayGradePoint(row)}</td>
                          <td>{completionMark(row)}</td>
                          <td><button type="button" className="sar-detail-btn" onClick={() => setSelectedDetail(row)}>i</button></td>
                        </tr>
                    ))}
                  </tbody>
                </table>
                <div className="sar-summary">
                  <span>Tổng số tín chỉ học kỳ <b>{summary.totalCredits.toFixed(1)}</b></span>
                  <span>Số tín chỉ tích lũy <b>{cumulative.passedCredits}</b></span>
                  <span>Điểm trung bình học kỳ hệ 10 <b>{summary.average10.toFixed(1)}</b></span>
                  <span>Điểm trung bình học kỳ hệ 4 <b>{summary.average4.toFixed(1)}</b></span>
                  <span>Điểm trung bình tích lũy hệ 10 <b>{cumulative.average10.toFixed(1)}</b></span>
                  <span>Điểm trung bình tích lũy hệ 4 <b>{cumulative.average4.toFixed(1)}</b></span>
                </div>
              </section>
            )
          })}
        </section>
      </main>

      {selectedDetail && (
        <div className="sar-modal-overlay" role="presentation" onClick={() => setSelectedDetail(null)}>
          <section className="sar-modal" role="dialog" aria-modal="true" aria-labelledby="sar-detail-title" onClick={(event) => event.stopPropagation()}>
            <div className="sar-modal-title" id="sar-detail-title">Chi tiết điểm môn học</div>
            <button type="button" className="sar-modal-close" onClick={() => setSelectedDetail(null)} aria-label="Đóng">×</button>
            <table className="sar-detail-table">
              <tbody>
                <tr><th>Điểm bộ phận ({weightText(selectedDetail.attendance_weight, 0)})</th><td>{displayScore(selectedDetail, selectedDetail.attendance_score)}</td></tr>
                <tr><th>Điểm giữa kỳ ({weightText(selectedDetail.midterm_weight, 0)})</th><td>{displayScore(selectedDetail, selectedDetail.midterm_score)}</td></tr>
                <tr><th>Điểm thi kết thúc ({weightText(selectedDetail.final_weight, 100)})</th><td>{displayScore(selectedDetail, selectedDetail.final_score)}</td></tr>
                <tr><th>Điểm HP hệ 10</th><td>{displayScore(selectedDetail, selectedDetail.average_score)}</td></tr>
                <tr><th>Điểm HP hệ 4</th><td>{displayGradePoint(selectedDetail)}</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  )
}

