import { useCallback, useEffect, useMemo, useState } from 'react'
import RoleLayout from '../../../layout/RoleLayout'
import { apiGet } from '@/api/core/request'
import './LecturerTimetablePage.css'

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
  const [rows, setRows] = useState<TimetableRow[]>([])
  const [weekNumbers, setWeekNumbers] = useState<number[]>(defaultWeekNumbers)
  const [isLoading, setIsLoading] = useState(true)

  const loadYears = useCallback(async () => {
    const response = await apiGet<CatalogResponse<AcademicYear>>('/academic-catalog/nam-hocs')
    setYearId((current) => current || String(response.data[0]?.id ?? ''))
  }, [])

  const loadTerms = useCallback(async (selectedYearId: string) => {
    if (!selectedYearId) {
      setTermId('')
      return
    }

    const response = await apiGet<CatalogResponse<AcademicTerm>>('/academic-catalog/hoc-kys', {
      params: { nam_hoc_id: Number(selectedYearId) },
    })
    setTermId((current) => current || String(response.data[0]?.id ?? ''))
  }, [])

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
    void loadYears()
  }, [loadYears])

  useEffect(() => {
    void loadTerms(yearId)
  }, [loadTerms, yearId])

  useEffect(() => {
    void loadTimetable()
  }, [loadTimetable])

  const displayRows = useMemo(() => mergeTimetableRows(rows), [rows])

  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="GIẢNG VIÊN"
      roleColor="blue"
      homeRoute="/canbo"
      roleTitle="Giảng viên"
    >
      <main className="lt-page">
        <section className="lt-panel">
          <div className="lt-header">
            <div>
              <h1>Thời khóa biểu cán bộ giảng dạy</h1>
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
