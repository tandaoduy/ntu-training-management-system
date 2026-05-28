import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as XLSX from 'xlsx'
import RoleLayout from '../../../layout/RoleLayout'
import { apiGet, apiPut } from '@/api/core/request'
import { useAlert } from '@/components/alert'
import { Pagination, getPageSizeNumber } from '@/components/pagination'
import './LecturerGradeEntryPage.css'

type GradeClass = {
  id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi?: number | null
  nhom_hoc_phan?: string | null
  term?: { nam_hoc?: string | null; hoc_ky?: string | null } | null
}

type StudentGrade = {
  dang_ky_hoc_phan_id: number
  ma_sinh_vien?: string | null
  ho_ten?: string | null
  ma_lop?: string | null
  attendance_score?: string | number | null
  midterm_score?: string | number | null
  final_score?: string | number | null
  note?: string | null
}

type WeightConfig = {
  attendance_weight: number
  midterm_weight: number
  final_weight: number
  grade_mode?: 'numeric' | 'pass_fail'
}

type ClassDetailResponse = {
  data: {
    class: GradeClass
    students: StudentGrade[]
    grade_input_open: boolean
    weights: WeightConfig
  }
}

type GradeForm = Record<number, { attendance_score: string; midterm_score: string; final_score: string; note: string }>

const scoreValue = (value?: string | number | null) => (value === null || value === undefined ? '' : String(value))
const passFailValue = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') return ''
  if (value === 'passed' || value === 'Đạt') return 'passed'
  if (value === 'failed' || value === 'Chưa đạt') return 'failed'
  return Number(value) >= 10 ? 'passed' : 'failed'
}
const noteValue = (value?: string | null) => (value ?? '')
const sanitizeNote = (value: string) => value.replace(/[^\p{L}\p{N}\s]/gu, '')
const normalizeHeader = (value: unknown) => String(value ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/đ/g, 'd')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim()
const compactHeader = (value: unknown) => normalizeHeader(value).replace(/\s+/g, '')
const isStudentCodeHeader = (value: unknown) => {
  const header = normalizeHeader(value)
  const compact = compactHeader(value)
  return header === 'ma sinh vien'
    || compact === 'masinhvien'
    || compact === 'masv'
    || (header.includes('ma') && header.includes('sinh') && (header.includes('vien') || header.includes('sv')))
}
const isScoreHeader = (value: unknown, phrase: string) => {
  const compact = compactHeader(value)
  return compact.includes(phrase.replace(/\s+/g, ''))
}
const normalizeScore = (value: unknown) => {
  const text = String(value ?? '').trim().replace(',', '.')
  if (!text) return ''
  if (!/^(?:10(?:\.0{0,2})?|[0-9](?:\.\d{0,2})?)$/.test(text)) return null
  const score = Number(text)
  if (!Number.isFinite(score) || score < 0 || score > 10) return null
  return String(score)
}

const messageFromError = (error: unknown, fallback: string) => (
  typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
    ? error.message
    : fallback
)

export default function LecturerGradeEntryDetailPage() {
  const { showAlert } = useAlert()
  const [searchParams] = useSearchParams()
  const classId = Number(searchParams.get('classId') ?? 0)
  const [detail, setDetail] = useState<ClassDetailResponse['data'] | null>(null)
  const [gradeForm, setGradeForm] = useState<GradeForm>({})
  const [studentCodeFilter, setStudentCodeFilter] = useState('')
  const [studentNameFilter, setStudentNameFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const selectedClass = detail?.class ?? null
  const weights = useMemo(() => detail?.weights ?? { attendance_weight: 10, midterm_weight: 30, final_weight: 60 }, [detail])
  const isSingleCredit = Number(selectedClass?.so_tin_chi ?? 0) === 1
  const gradeMode = weights.grade_mode ?? 'numeric'
  const visibleStudents = useMemo(() => {
    const code = studentCodeFilter.trim().toLowerCase()
    const name = studentNameFilter.trim().toLowerCase()
    const className = classFilter.trim().toLowerCase()

    return [...(detail?.students ?? [])]
      .filter((student) => (
        (!code || String(student.ma_sinh_vien ?? '').toLowerCase().includes(code))
        && (!name || String(student.ho_ten ?? '').toLowerCase().includes(name))
        && (!className || String(student.ma_lop ?? '').toLowerCase().includes(className))
      ))
      .sort((first, second) => {
        const left = String(first.ma_sinh_vien ?? '')
        const right = String(second.ma_sinh_vien ?? '')
        return left.localeCompare(right, 'vi', { numeric: true })
      })
  }, [classFilter, detail, studentCodeFilter, studentNameFilter])
  const pageSizeNumber = getPageSizeNumber(pageSize, visibleStudents.length)
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(visibleStudents.length / pageSizeNumber))
  const safePage = Math.min(page, totalPages)
  const pagedStudents = pageSize === 'all'
    ? visibleStudents
    : visibleStudents.slice((safePage - 1) * pageSizeNumber, safePage * pageSizeNumber)

  useEffect(() => {
    setPage(1)
  }, [classFilter, pageSize, studentCodeFilter, studentNameFilter])

  const loadClassDetail = useCallback(async () => {
    if (!classId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await apiGet<ClassDetailResponse>(`/lecturer/grade-entry/classes/${classId}`)
      setDetail(response.data)
      setGradeForm(Object.fromEntries(response.data.students.map((student) => [
        student.dang_ky_hoc_phan_id,
        {
          attendance_score: response.data.weights.grade_mode === 'pass_fail' ? passFailValue(student.attendance_score) : scoreValue(student.attendance_score),
          midterm_score: response.data.weights.grade_mode === 'pass_fail' ? passFailValue(student.midterm_score) : scoreValue(student.midterm_score),
          final_score: response.data.weights.grade_mode === 'pass_fail' ? passFailValue(student.final_score) : scoreValue(student.final_score),
          note: noteValue(student.note),
        },
      ])))
    } catch (error) {
      showAlert({
        title: 'Không tải được bảng điểm',
        message: messageFromError(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }, [classId, showAlert])

  useEffect(() => {
    void loadClassDetail()
  }, [loadClassDetail])

  const updateScore = (registrationId: number, field: keyof GradeForm[number], value: string) => {
    if (gradeMode === 'pass_fail') {
      if (value !== '' && value !== 'passed' && value !== 'failed') return

      setGradeForm((current) => ({
        ...current,
        [registrationId]: {
          attendance_score: current[registrationId]?.attendance_score ?? '',
          midterm_score: current[registrationId]?.midterm_score ?? '',
          final_score: current[registrationId]?.final_score ?? '',
          note: current[registrationId]?.note ?? '',
          [field]: value,
        },
      }))
      return
    }

    const cleanValue = value.replace(',', '.')
    if (cleanValue !== '' && !/^\d{0,2}(\.\d{0,2})?$/.test(cleanValue)) return
    if (cleanValue !== '') {
      const numericValue = Number(cleanValue)
      if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 10) return
    }

    setGradeForm((current) => ({
      ...current,
      [registrationId]: {
        attendance_score: current[registrationId]?.attendance_score ?? '',
        midterm_score: current[registrationId]?.midterm_score ?? '',
        final_score: current[registrationId]?.final_score ?? '',
        note: current[registrationId]?.note ?? '',
        [field]: cleanValue,
      },
    }))
  }

  const updateNote = (registrationId: number, value: string) => {
    setGradeForm((current) => ({
      ...current,
      [registrationId]: {
        attendance_score: current[registrationId]?.attendance_score ?? '',
        midterm_score: current[registrationId]?.midterm_score ?? '',
        final_score: current[registrationId]?.final_score ?? '',
        note: sanitizeNote(value),
      },
    }))
  }

  const updateGradeMode = (mode: 'numeric' | 'pass_fail') => {
    if (mode === 'pass_fail' && !isSingleCredit) {
      showAlert({
        title: 'Không thể chọn Đạt / Chưa đạt',
        message: 'Kiểu điểm Đạt / Chưa đạt chỉ áp dụng cho học phần 1 tín chỉ.',
        variant: 'warning',
      })
      return
    }

    setDetail((current) => current
      ? {
          ...current,
          weights: {
            ...current.weights,
            grade_mode: mode,
          },
        }
      : current)
    setGradeForm((current) => Object.fromEntries(Object.entries(current).map(([registrationId, scores]) => [
      registrationId,
      {
        ...scores,
        attendance_score: '',
        midterm_score: '',
        final_score: mode === 'pass_fail' ? passFailValue(scores.final_score) : '',
      },
    ])))
  }

  const gradePayload = (form: GradeForm) => Object.entries(form).map(([registrationId, scores]) => ({
    dang_ky_hoc_phan_id: Number(registrationId),
    attendance_score: isSingleCredit || weights.attendance_weight === 0 || scores.attendance_score === '' ? null : gradeMode === 'pass_fail' ? scores.attendance_score : Number(scores.attendance_score),
    midterm_score: isSingleCredit || weights.midterm_weight === 0 || scores.midterm_score === '' ? null : gradeMode === 'pass_fail' ? scores.midterm_score : Number(scores.midterm_score),
    final_score: weights.final_weight === 0 || scores.final_score === '' ? null : gradeMode === 'pass_fail' ? scores.final_score : Number(scores.final_score),
    note: scores.note.trim() || null,
  }))

  const persistGrades = async (form: GradeForm) => {
    await apiPut(`/lecturer/grade-entry/classes/${classId}/grades`, {
      grade_mode: gradeMode,
      grades: gradePayload(form),
    })
  }

  const saveGrades = async () => {
    if (!classId) return

    try {
      if (gradeMode === 'pass_fail' && !isSingleCredit) {
        showAlert({
          title: 'Không thể lưu điểm',
          message: 'Kiểu điểm Đạt / Chưa đạt chỉ áp dụng cho học phần 1 tín chỉ.',
          variant: 'warning',
        })
        return
      }

      await persistGrades(gradeForm)

      showAlert({ title: 'Đã lưu điểm', message: 'Hệ thống đã tự tính điểm trung bình.', variant: 'success' })
      await loadClassDetail()
    } catch (error) {
      showAlert({
        title: 'Lưu điểm thất bại',
        message: messageFromError(error, 'Vui lòng kiểm tra thời gian nhập điểm và dữ liệu điểm.'),
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const importExcelFile = async (file: File) => {
    if (!detail || !classId) return
    if (!detail.grade_input_open) {
      showAlert({ title: 'Khóa nhập điểm', message: 'Hiện không trong thời gian nhập điểm.', variant: 'warning' })
      return
    }
    if (gradeMode === 'pass_fail') {
      showAlert({ title: 'Chưa hỗ trợ file Đạt/Chưa đạt', message: 'Vui lòng nhập trực tiếp kiểu điểm Đạt / Chưa đạt.', variant: 'warning' })
      return
    }

    setIsSaving(true)
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
      const headerIndex = rows.findIndex((row) => (
        row.some(isStudentCodeHeader)
        || row.some((cell) => isScoreHeader(cell, 'diem bo phan') || isScoreHeader(cell, 'diem giua ky') || isScoreHeader(cell, 'diem thi ket thuc'))
      ))
      if (headerIndex < 0) {
        showAlert({ title: 'File không đúng mẫu', message: 'Không tìm thấy cột Mã sinh viên trong file Excel.', variant: 'warning' })
        return
      }

      const headers = rows[headerIndex].map(normalizeHeader)
      const rawHeaderRow = rows[headerIndex]
      const codeIndex = rawHeaderRow.findIndex(isStudentCodeHeader)
      const noteIndex = headers.findIndex((header) => header === 'ghi chu' || header.replace(/\s+/g, '') === 'ghichu')
      const scoreColumns: Array<{ field: keyof GradeForm[number]; index: number; enabled: boolean }> = [
        { field: 'attendance_score', index: rawHeaderRow.findIndex((header) => isScoreHeader(header, 'diem bo phan')), enabled: !isSingleCredit && weights.attendance_weight > 0 },
        { field: 'midterm_score', index: rawHeaderRow.findIndex((header) => isScoreHeader(header, 'diem giua ky')), enabled: !isSingleCredit && weights.midterm_weight > 0 },
        { field: 'final_score', index: rawHeaderRow.findIndex((header) => isScoreHeader(header, 'diem thi ket thuc') || isScoreHeader(header, 'diem ket thuc')), enabled: weights.final_weight > 0 },
      ]

      if (codeIndex < 0) {
        showAlert({ title: 'File không đúng mẫu', message: 'Không xác định được cột Mã sinh viên trong file Excel.', variant: 'warning' })
        return
      }

      const fallbackScoreStartIndex = codeIndex + 3
      const normalizedScoreColumns = scoreColumns.map((column, index) => ({
        ...column,
        index: column.index >= 0 ? column.index : fallbackScoreStartIndex + index,
      }))

      const studentByCode = new Map((detail.students ?? []).map((student) => [String(student.ma_sinh_vien ?? '').trim(), student]))
      const nextForm: GradeForm = { ...gradeForm }
      let importedCells = 0
      let skippedCells = 0

      rows.slice(headerIndex + 1).forEach((row) => {
        const studentCode = String(row[codeIndex] ?? '').trim()
        const student = studentByCode.get(studentCode)
        if (!student) return

        const current = nextForm[student.dang_ky_hoc_phan_id] ?? { attendance_score: '', midterm_score: '', final_score: '', note: '' }
        const next = { ...current }
        normalizedScoreColumns.forEach(({ field, index, enabled }) => {
          if (!enabled || index < 0) return
          const rawValue = row[index]
          if (String(rawValue ?? '').trim() === '') return
          const score = normalizeScore(rawValue)
          if (score === null) {
            skippedCells += 1
            return
          }
          next[field] = score
          importedCells += 1
        })
        if (noteIndex >= 0 && String(row[noteIndex] ?? '').trim()) {
          next.note = sanitizeNote(String(row[noteIndex] ?? ''))
        }
        nextForm[student.dang_ky_hoc_phan_id] = next
      })

      if (!importedCells) {
        showAlert({ title: 'Không có điểm hợp lệ', message: 'File chưa có ô điểm hợp lệ theo các cột đã chuẩn hóa.', variant: 'warning' })
        return
      }

      setGradeForm(nextForm)
      // Import only fills the form; the Thuc hien button is the single save point.
      showAlert({
        title: 'Đã đọc điểm từ file Excel',
        message: `Đã đưa ${importedCells} ô điểm hợp lệ vào bảng. Bấm Thực hiện để lưu vào hệ thống.${skippedCells ? ` Bỏ qua ${skippedCells} ô không hợp lệ.` : ''}`,
        variant: 'success',
      })
    } catch (error) {
      showAlert({ title: 'Import điểm thất bại', message: messageFromError(error, 'Vui lòng kiểm tra file Excel và thử lại.'), variant: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="GIẢNG VIÊN"
      roleColor="blue"
      homeRoute="/canbo"
      roleTitle="Giảng viên"
    >
      <main className="lge-page">
        <nav className="lge-breadcrumb" aria-label="Breadcrumb">
          <Link to="/canbo/nhapdiem">Danh sách học phần</Link>
          <span>›</span>
          <span>Nhập điểm nhóm học phần</span>
        </nav>

        <section className="lge-grade-entry-shell" id="lecturer-grade-print-area">
          <div className="lge-entry-course-line">
            {selectedClass ? `Học phần: ${selectedClass.ten_hoc_phan} (${selectedClass.ma_hoc_phan})` : 'Học phần: Đang tải'}
            {selectedClass ? ` | Nhóm học phần: ${selectedClass.nhom_hoc_phan || '-'}` : ''}
          </div>

          <div className="lge-entry-filter">
            <span className="lge-entry-filter-label">Mã sinh viên</span>
            <label aria-label="Mã sinh viên">
              <input value={studentCodeFilter} onChange={(event) => setStudentCodeFilter(event.target.value)} />
            </label>

            <span className="lge-entry-filter-label">Họ tên sinh viên</span>
            <label aria-label="Họ tên sinh viên">
              <input value={studentNameFilter} onChange={(event) => setStudentNameFilter(event.target.value)} />
            </label>

            <span className="lge-entry-filter-label">Mã lớp</span>
            <label aria-label="Mã lớp">
              <input value={classFilter} onChange={(event) => setClassFilter(event.target.value)} />
            </label>
          </div>

          <div className="lge-entry-meta">
            {detail && <strong>{detail.grade_input_open ? 'Đang mở nhập điểm' : 'Đã khóa nhập điểm'}</strong>}
            {detail && (
              <label className="lge-grade-mode">
                <span>Kiểu nhập điểm</span>
                <select value={gradeMode} disabled={!detail.grade_input_open} onChange={(event) => updateGradeMode(event.target.value as 'numeric' | 'pass_fail')}>
                  <option value="numeric">Điểm số</option>
                  <option value="pass_fail" disabled={!isSingleCredit}>Đạt / Chưa đạt</option>
                </select>
              </label>
            )}
            <input
              ref={importInputRef}
              type="file"
              accept=".xls,.xlsx,.csv"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void importExcelFile(file)
              }}
            />
            <button type="button" className="lge-soft-btn" disabled={!detail || isSaving || !detail.grade_input_open} onClick={() => importInputRef.current?.click()}>
              Nhập điểm học phần từ file Excel
            </button>
          </div>

          <div className="lge-table-wrap">
            <table className="lge-table lge-entry-table">
              <colgroup>
                <col className="lge-entry-stt" />
                <col className="lge-entry-code" />
                <col className="lge-entry-name" />
                <col className="lge-entry-class" />
                <col className="lge-entry-score" />
                <col className="lge-entry-score" />
                <col className="lge-entry-score" />
                <col className="lge-entry-note" />
              </colgroup>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã SV</th>
                  <th>Họ tên sinh viên</th>
                  <th>Mã lớp</th>
                  <th>Điểm bộ phận</th>
                  <th>Điểm giữa kỳ</th>
                  <th>Điểm thi kết thúc</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {pagedStudents.map((student, index) => {
                  const form = gradeForm[student.dang_ky_hoc_phan_id] ?? { attendance_score: '', midterm_score: '', final_score: '', note: '' }

                  return (
                    <tr key={student.dang_ky_hoc_phan_id}>
                      <td>{pageSize === 'all' ? index + 1 : (safePage - 1) * pageSizeNumber + index + 1}</td>
                      <td>{student.ma_sinh_vien}</td>
                      <td>{student.ho_ten}</td>
                      <td>{student.ma_lop}</td>
                      {(['attendance_score', 'midterm_score', 'final_score'] as const).map((field) => (
                        <td key={field}>
                          {gradeMode === 'pass_fail' ? (
                            <select
                              className="lge-score-input"
                              value={form[field]}
                              disabled={!detail?.grade_input_open || field !== 'final_score' || (field === 'final_score' && weights.final_weight === 0)}
                              onChange={(event) => updateScore(student.dang_ky_hoc_phan_id, field, event.target.value)}
                            >
                              <option value=""></option>
                              <option value="passed">Đạt</option>
                              <option value="failed">Chưa đạt</option>
                            </select>
                          ) : (
                            <input
                              className="lge-score-input"
                              value={form[field]}
                              disabled={!detail?.grade_input_open || (isSingleCredit && field !== 'final_score') || (field === 'attendance_score' && weights.attendance_weight === 0) || (field === 'midterm_score' && weights.midterm_weight === 0) || (field === 'final_score' && weights.final_weight === 0)}
                              inputMode="decimal"
                              type="text"
                              pattern="^(10(\.0{0,2})?|[0-9](\.\d{0,2})?)$"
                              title="Chỉ nhập số từ 0 đến 10, tối đa 2 chữ số thập phân."
                              onChange={(event) => updateScore(student.dang_ky_hoc_phan_id, field, event.target.value)}
                            />
                          )}
                        </td>
                      ))}
                      <td>
                        <input
                          className="lge-note-input"
                          value={form.note}
                          disabled={!detail?.grade_input_open}
                          aria-label="Ghi chú"
                          onChange={(event) => updateNote(student.dang_ky_hoc_phan_id, event.target.value)}
                        />
                      </td>
                    </tr>
                  )
                })}
                {isLoading && <tr><td colSpan={8} className="lge-empty-cell">Đang tải bảng điểm...</td></tr>}
                {!isLoading && !detail && <tr><td colSpan={8} className="lge-empty-cell">Chưa chọn lớp học phần.</td></tr>}
                {!isLoading && detail && visibleStudents.length === 0 && <tr><td colSpan={8} className="lge-empty-cell">Không có sinh viên phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="lge-entry-pagination">
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>

          <div className="lge-entry-savebar">
            <button type="button" className="lge-primary-btn" disabled={!detail || isSaving || !detail.grade_input_open} onClick={() => void saveGrades()}>
              {isSaving ? 'Đang lưu...' : 'Thực hiện'}
            </button>
            <button type="button" className="lge-soft-btn" disabled={!detail}>
              Cập nhật hệ số loại điểm
            </button>
            <Link className="lge-soft-link" to="/canbo/nhapdiem">Trở về</Link>
          </div>
        </section>
      </main>
    </RoleLayout>
  )
}
