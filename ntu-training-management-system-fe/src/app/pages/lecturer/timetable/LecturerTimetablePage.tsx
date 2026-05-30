import { useCallback, useEffect, useMemo, useState } from 'react'
import { PrinterIcon } from '@heroicons/react/24/outline'
import RoleLayout from '../../../layout/RoleLayout'
import { apiGet } from '@/api/core/request'
import { MINISTRY_NAME, printBrandHtml, printBrandStyles, printFaviconLink } from '@/app/branding'
import { authStorage } from '../../../../api/features/auth'
import './LecturerTimetablePage.css'

const escapeHtml = (value: unknown) => (
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
)

type AcademicYear = { id: number; nam_hoc: string }
type AcademicTerm = { id: number; nam_hoc_id: number; hoc_ky: string }
type CatalogResponse<T> = { data: T[] }

type LecturerClass = {
  id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  lop_hoc_phan: string
  nhom_hoc_phan?: string | null
}

type TimetableRow = {
  id: number
  lop_hoc_phan_id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  nhom_hoc_phan?: string | null
  lop_hoc_phan: string
  so_tin_chi: number
  si_so: number
  so_sv_da_dk: number
  thu: number
  periods: number[]
  phong?: string | null
  ngay_bat_dau?: string | null
  weeks: number[]
}

type LecturerTimetableResponse = {
  data: TimetableRow[]
  classes?: LecturerClass[]
  week_numbers?: number[]
}

const periodNumbers = Array.from({ length: 13 }, (_, index) => index + 1)
const defaultWeekNumbers = Array.from({ length: 20 }, (_, index) => index + 1)

const formatShortDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

const makeLessonPattern = (periods: number[]) => (
  periodNumbers.map((period) => (periods.includes(period) ? String(period % 10) : '-')).join('')
)

const makeWeekPattern = (weeks: number[], weekNumbers: number[]) => (
  weekNumbers.map((week) => (weeks.includes(week) ? String(week % 10) : '-')).join('')
)

const earliestDate = (left?: string | null, right?: string | null) => {
  if (!left) return right ?? null
  if (!right) return left

  return new Date(left).getTime() <= new Date(right).getTime() ? left : right
}

const timetableMergeKey = (row: TimetableRow) => [
  row.lop_hoc_phan_id,
  row.ma_hoc_phan,
  row.nhom_hoc_phan ?? '',
  row.lop_hoc_phan,
  row.thu,
  row.periods.join('-'),
  row.phong ?? '',
].join('|')

const mergeTimetableRows = (items: TimetableRow[]) => {
  const groups = new Map<string, TimetableRow>()

  items.forEach((row) => {
    const key = timetableMergeKey(row)
    const existing = groups.get(key)

    if (!existing) {
      groups.set(key, { ...row, weeks: [...new Set(row.weeks)].sort((left, right) => left - right) })
      return
    }

    existing.ngay_bat_dau = earliestDate(existing.ngay_bat_dau, row.ngay_bat_dau)
    existing.weeks = [...new Set([...existing.weeks, ...row.weeks])].sort((left, right) => left - right)
    existing.so_sv_da_dk = Math.max(existing.so_sv_da_dk, row.so_sv_da_dk)
  })

  return Array.from(groups.values()).sort((left, right) => (
    left.thu - right.thu
    || Math.min(...left.periods) - Math.min(...right.periods)
    || left.ma_hoc_phan.localeCompare(right.ma_hoc_phan, 'vi', { numeric: true })
  ))
}

export default function LecturerTimetablePage() {
  const [yearId, setYearId] = useState('')
  const [termId, setTermId] = useState('')
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([])
  const [currentTermConfig, setCurrentTermConfig] = useState<{ nam_hoc_id: number; id: number } | null>(null)
  const [rows, setRows] = useState<TimetableRow[]>([])
  const [weekNumbers, setWeekNumbers] = useState<number[]>(defaultWeekNumbers)
  const [isLoading, setIsLoading] = useState(true)

  const loadInitialCatalog = useCallback(async () => {
    try {
      const [yearsRes, currentRes] = await Promise.all([
        apiGet<CatalogResponse<AcademicYear>>('/academic-catalog/nam-hocs'),
        apiGet<{ data: { nam_hoc_id: number; id: number } | null }>('/academic-catalog/current-term'),
      ])
      setAcademicYears(yearsRes.data)
      if (currentRes.data) {
        setCurrentTermConfig(currentRes.data)
        setYearId(String(currentRes.data.nam_hoc_id))
      } else {
        setYearId(String(yearsRes.data[0]?.id ?? ''))
      }
    } catch {
      // Fallback
    }
  }, [])

  useEffect(() => {
    void loadInitialCatalog()
  }, [loadInitialCatalog])

  useEffect(() => {
    if (!yearId) {
      setAcademicTerms([])
      setTermId('')
      return
    }

    let isMounted = true
    apiGet<CatalogResponse<AcademicTerm>>('/academic-catalog/hoc-kys', {
      params: { nam_hoc_id: Number(yearId) },
    }).then((response) => {
      if (!isMounted) return
      setAcademicTerms(response.data)
      
      if (currentTermConfig && String(currentTermConfig.nam_hoc_id) === yearId) {
        setTermId(String(currentTermConfig.id))
      } else {
        setTermId(String(response.data[0]?.id ?? ''))
      }
    }).catch(() => {
      // Ignore
    })

    return () => {
      isMounted = false
    }
  }, [yearId, currentTermConfig])

  const loadTimetable = useCallback(async () => {
    if (!termId) {
      setRows([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await apiGet<LecturerTimetableResponse>('/lecturer/timetable', {
        params: {
          hoc_ky_id: Number(termId),
        },
      })
      setRows(response.data ?? [])
      setWeekNumbers(response.week_numbers?.length ? response.week_numbers : defaultWeekNumbers)
    } finally {
      setIsLoading(false)
    }
  }, [termId])

  useEffect(() => {
    void loadTimetable()
  }, [loadTimetable])

  const displayRows = useMemo(() => mergeTimetableRows(rows), [rows])

  const handlePrint = () => {
    const cachedUser = authStorage.getUser()
    const lecturerName = cachedUser?.name?.trim() || ''
    const lecturerCode = cachedUser?.username || ''

    const currentYearText = academicYears.find(y => String(y.id) === yearId)?.nam_hoc || ''
    const currentTermText = academicTerms.find(t => String(t.id) === termId)?.hoc_ky || ''

    const header = `
      <div class="top">
        <div>${printBrandHtml(MINISTRY_NAME)}</div>
        <div><div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div><div class="line">Độc lập - Tự do - Hạnh phúc</div></div>
      </div>
      <h1>THỜI KHÓA BIỂU CÁN BỘ GIẢNG DẠY</h1>
      <div class="subtitle">Học kỳ: ${escapeHtml(currentTermText)}. Năm học: ${escapeHtml(currentYearText)}</div>
      <div class="lecturer-line" style="margin: 8px 0 4px; font-size: 14px;">
        <span>Tên cán bộ giảng dạy: <b>${escapeHtml(lecturerName)} (${escapeHtml(lecturerCode)})</b></span>
      </div>
    `

    const tableRows = displayRows.map((row, index) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${escapeHtml(row.ma_hoc_phan)}</td>
        <td class="center">${escapeHtml(row.nhom_hoc_phan || '-')}</td>
        <td>${escapeHtml(row.ten_hoc_phan)}</td>
        <td class="center">${escapeHtml(row.so_tin_chi)}</td>
        <td>${escapeHtml(row.lop_hoc_phan)}</td>
        <td class="center">${escapeHtml(row.si_so)}</td>
        <td class="center">${escapeHtml(row.so_sv_da_dk)}</td>
        <td class="center">${escapeHtml(row.thu)}</td>
        <td class="mono">${escapeHtml(makeLessonPattern(row.periods))}</td>
        <td class="center">${escapeHtml(row.phong || '-')}</td>
        <td class="center">${escapeHtml(formatShortDate(row.ngay_bat_dau))}</td>
        <td class="mono">${escapeHtml(makeWeekPattern(row.weeks, weekNumbers))}</td>
      </tr>
    `).join('')

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Không mở được cửa sổ in. Vui lòng cho phép trình duyệt mở popup rồi thử lại.')
      return
    }

    printWindow.document.write(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  ${printFaviconLink}
  <title>Thời khóa biểu giảng viên</title>
  <style>
    ${printBrandStyles}
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; font-family: "Times New Roman", Arial, sans-serif; font-size: 12px; }
    .sheet { width: 100%; max-width: 1100px; margin: 0 auto; }
    .top { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; text-align: center; font-weight: 700; }
    .top .line { display: inline-block; border-bottom: 1px solid #000; padding-bottom: 2px; }
    h1 { margin: 18px 0 2px; text-align: center; font-size: 20px; line-height: 1.15; }
    .subtitle { text-align: center; font-size: 15px; font-weight: 700; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 8px; }
    th, td { border: 1px solid #999; padding: 4px; vertical-align: top; line-height: 1.15; }
    th { text-align: center; font-weight: 700; background: #f7f7f7; }
    .center { text-align: center; }
    .mono { font-family: "Courier New", monospace; overflow-wrap: anywhere; text-align: center; }
    .print-toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; gap: 8px; padding: 8px 0; background: #fff; }
    .print-toolbar button { border: 1px solid #999; background: #fff; padding: 5px 12px; cursor: pointer; }
    
    /* Column widths */
    th:nth-child(1), td:nth-child(1) { width: 35px; }
    th:nth-child(2), td:nth-child(2) { width: 75px; }
    th:nth-child(3), td:nth-child(3) { width: 65px; }
    th:nth-child(4), td:nth-child(4) { width: 180px; }
    th:nth-child(5), td:nth-child(5) { width: 45px; }
    th:nth-child(6), td:nth-child(6) { width: 85px; }
    th:nth-child(7), td:nth-child(7) { width: 45px; }
    th:nth-child(8), td:nth-child(8) { width: 55px; }
    th:nth-child(9), td:nth-child(9) { width: 40px; }
    th:nth-child(10), td:nth-child(10) { width: 100px; }
    th:nth-child(11), td:nth-child(11) { width: 65px; }
    th:nth-child(12), td:nth-child(12) { width: 75px; }
    th:nth-child(13), td:nth-child(13) { width: 120px; }

    @media print { .print-toolbar { display: none; } .sheet { max-width: none; } }
  </style>
</head>
<body>
  <div class="print-toolbar"><button onclick="window.print()">In</button><button onclick="window.close()">Đóng</button></div>
  <div class="sheet">${header}<table class="list">
    <thead>
      <tr>
        <th>Stt</th>
        <th>Mã HP</th>
        <th>Nhóm</th>
        <th>Tên HP</th>
        <th>TC</th>
        <th>Lớp HP</th>
        <th>Sĩ số</th>
        <th>SVĐK</th>
        <th>Thứ</th>
        <th>Tiết học</th>
        <th>Phòng</th>
        <th>Ngày BĐ</th>
        <th>Tuần học</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows || '<tr><td colspan="13" class="center">Không có dữ liệu</td></tr>'}
    </tbody>
  </table></div>
</body>
</html>`)
    printWindow.document.close()
    printWindow.opener = null
  }

  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="GIẢNG VIÊN"
      roleColor="blue"
      homeRoute="/canbo"
      roleTitle="Giảng viên"
    >
      <main className="lt-page">
        <section className="lt-filter-panel" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#475569' }}>Năm học:</span>
            <select value={yearId} onChange={(event) => { setYearId(event.target.value); setTermId('') }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600 }}>
              <option value="">Chọn năm học</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>{year.nam_hoc}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#475569' }}>Học kỳ:</span>
            <select value={termId} onChange={(event) => setTermId(event.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '14px', fontWeight: 600 }}>
              <option value="">Chọn học kỳ</option>
              {academicTerms.map((term) => (
                <option key={term.id} value={term.id}>{term.hoc_ky}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="lt-panel">
          <div className="lt-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ margin: 0 }}>Thời khóa biểu cán bộ giảng dạy</h1>
            </div>
            <div>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#0f172a',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease'
                }}
                className="hover:bg-slate-50 hover:border-slate-300"
              >
                <PrinterIcon style={{ width: '18px', height: '18px', color: '#2f6fa5' }} aria-hidden="true" />
                <span>In thời khóa biểu</span>
              </button>
            </div>
          </div>

          <div className="lt-table-wrap">
            <table className="lt-table">
              <thead>
                <tr>
                  <th>Stt</th>
                  <th>Mã học phần</th>
                  <th>Nhóm học phần</th>
                  <th>Tên học phần</th>
                  <th>Số tín chỉ</th>
                  <th>Lớp học phần</th>
                  <th>Sĩ số</th>
                  <th>Sĩ số SVĐK</th>
                  <th>Thứ</th>
                  <th>Tiết học</th>
                  <th>Phòng học</th>
                  <th>Ngày BĐ dạy</th>
                  <th>Tuần học</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{row.ma_hoc_phan}</td>
                    <td>{row.nhom_hoc_phan || '-'}</td>
                    <td>{row.ten_hoc_phan}</td>
                    <td>{row.so_tin_chi}</td>
                    <td>{row.lop_hoc_phan}</td>
                    <td>{row.si_so}</td>
                    <td>{row.so_sv_da_dk}</td>
                    <td>{row.thu}</td>
                    <td className="lt-pattern">{makeLessonPattern(row.periods)}</td>
                    <td>{row.phong || '-'}</td>
                    <td>{formatShortDate(row.ngay_bat_dau)}</td>
                    <td className="lt-pattern">{makeWeekPattern(row.weeks, weekNumbers)}</td>
                  </tr>
                ))}
                {!isLoading && displayRows.length === 0 && (
                  <tr><td colSpan={13} className="lt-empty">Chưa có thời khóa biểu.</td></tr>
                )}
                {isLoading && (
                  <tr><td colSpan={13} className="lt-empty">Đang tải thời khóa biểu...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </RoleLayout>
  )
}
