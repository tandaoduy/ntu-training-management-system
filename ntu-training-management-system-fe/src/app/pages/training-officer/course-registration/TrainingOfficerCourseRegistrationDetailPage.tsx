import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiGet, apiPost } from '@/api/core/request'
import { PAGE_SIZE_OPTIONS, getPageSizeLabel, getPageSizeNumber } from '@/components/pagination'
import { useAlert } from '@/components/alert'
import RoleLayout from '../../../layout/RoleLayout'
import '../timetable/TrainingOfficerTimetablePage.css'

type ClassRegistration = {
  id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  nhom_hoc_phan: string
}

type TimetableRow = {
  id: number
  ma_hoc_phan: string
  nhom_hoc_phan: string
  ten_hoc_phan: string
  thu: number
  tiet_bat_dau: number
  tiet_ket_thuc: number
  tuan_bat_dau: number
  tuan_ket_thuc: number
  ten_phong: string
}

type RegisteredStudent = {
  id: number
  ma_sinh_vien: string
  ho_ten: string
  gioi_tinh: string
  ma_lop: string
}

type ClassDetail = {
  class: ClassRegistration
  timetable: TimetableRow[]
  students: RegisteredStudent[]
}

type StudentFilterField = 'ma_sinh_vien' | 'ho_ten' | 'ma_lop'
type StudentSortField = 'ma_sinh_vien' | 'ho_ten' | 'ma_lop'
type SortDirection = 'asc' | 'desc'

const makeLessonPattern = (start: number, end: number) => (
  Array.from({ length: 10 }, (_, index) => {
    const lesson = index + 1
    return lesson >= start && lesson <= end ? String(lesson % 10) : '-'
  }).join('')
)

const makeWeekPatternForRows = (rows: TimetableRow[]) => {
  const activeWeeks = new Set<number>()

  rows.forEach((row) => {
    for (let week = row.tuan_bat_dau; week <= row.tuan_ket_thuc; week += 1) {
      activeWeeks.add(week)
    }
  })

  return Array.from({ length: 19 }, (_, index) => {
    const week = index + 1
    return activeWeeks.has(week) ? String(week % 10) : '-'
  }).join('')
}

const timetableGroupKey = (row: TimetableRow) => [
  row.thu,
  row.ma_hoc_phan,
  row.nhom_hoc_phan,
  row.ten_hoc_phan,
  row.tiet_bat_dau,
  row.tiet_ket_thuc,
  row.ten_phong,
].join('|')

const mergeTimetableRows = (rows: TimetableRow[]) => {
  const groups = new Map<string, TimetableRow[]>()

  rows.forEach((row) => {
    const key = timetableGroupKey(row)
    groups.set(key, [...(groups.get(key) ?? []), row])
  })

  return Array.from(groups.entries()).map(([key, groupRows]) => ({
    key,
    first: groupRows[0] as TimetableRow,
    rows: groupRows,
  }))
}

const includesText = (value: string | null | undefined, keyword: string) => (
  value?.toLowerCase().includes(keyword.toLowerCase()) ?? false
)

const compareText = (left: string | null | undefined, right: string | null | undefined) => (
  (left ?? '').localeCompare(right ?? '', 'vi', { numeric: true, sensitivity: 'base' })
)

export default function TrainingOfficerCourseRegistrationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showError, showSuccess } = useAlert()
  const [detail, setDetail] = useState<ClassDetail | null>(null)
  const [studentFilters, setStudentFilters] = useState<Record<StudentFilterField, string>>({
    ma_sinh_vien: '',
    ho_ten: '',
    ma_lop: '',
  })
  const [studentSortField, setStudentSortField] = useState<StudentSortField>('ma_sinh_vien')
  const [studentSortDirection, setStudentSortDirection] = useState<SortDirection>('asc')
  const [pageSize, setPageSize] = useState('all')
  const [studentCodeToAdd, setStudentCodeToAdd] = useState('')
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)

  const mergedTimetable = useMemo(() => (
    mergeTimetableRows(detail?.timetable ?? [])
  ), [detail?.timetable])

  const filteredStudents = useMemo(() => {
    const filters = studentFilters

    return (detail?.students ?? [])
      .filter((student) => (
        includesText(student.ma_sinh_vien, filters.ma_sinh_vien)
        && includesText(student.ho_ten, filters.ho_ten)
        && includesText(student.ma_lop, filters.ma_lop)
      ))
      .sort((left, right) => {
        const result = compareText(left[studentSortField], right[studentSortField])
        return studentSortDirection === 'asc' ? result : -result
      })
      .slice(0, getPageSizeNumber(pageSize, detail?.students.length ?? 0))
  }, [detail?.students, pageSize, studentFilters, studentSortDirection, studentSortField])

  const loadDetail = useCallback(async () => {
    if (!id) {
      return
    }

    try {
      const response = await apiGet<{ data: ClassDetail }>(`/training-officer/course-registration/classes/${id}`)
      setDetail(response.data)
    } catch (err) {
      showError('Không tải được chi tiết', err instanceof Error ? err.message : 'Vui lòng thử lại.')
    }
  }, [id, showError])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const handleAddStudent = async () => {
    const code = studentCodeToAdd.trim()
    if (!id) {
      return
    }

    if (!/^\d{8}$/.test(code)) {
      showError('Mã sinh viên không hợp lệ', 'Mã sinh viên phải gồm đúng 8 chữ số, không nhập chữ hoặc ký tự đặc biệt.')
      return
    }

    if (!code || !id) {
      showError('Chưa nhập mã sinh viên', 'Vui lòng nhập mã sinh viên cần thêm vào lớp.')
      return
    }

    try {
      await apiPost(`/training-officer/course-registration/classes/${id}/students`, { ma_sinh_vien: code })
      setStudentCodeToAdd('')
      setIsAddStudentModalOpen(false)
      showSuccess('Đã thêm sinh viên', 'Sinh viên đã được thêm vào lớp học phần, có thể vượt chỉ tiêu tối đa.')
      await loadDetail()
    } catch (err) {
      showError('Không thêm được sinh viên', err instanceof Error ? err.message : 'Vui lòng thử lại.')
    }
  }

  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="CHUYÊN VIÊN"
      roleColor="orange"
      homeRoute="/chuyenvien"
      roleTitle="Chuyên viên đào tạo"
    >
      <main className="to-timetable-page">
        {!detail ? (
          <div className="to-registration-detail-loading">Đang tải dữ liệu...</div>
        ) : (
          <>
            <div className="to-timetable-breadcrumb">
              <a href="#" onClick={(event) => { event.preventDefault(); navigate(-1) }}>Danh sách lớp học phần</a>
              <span>/</span>
              <span>Chi tiết lớp học phần</span>
            </div>

            <section className="to-timetable-panel">
              <div className="to-timetable-panel-head to-registration-detail-head">
                <h2>
                  Chi tiết lớp học phần: {detail.class.ma_hoc_phan} - {detail.class.ten_hoc_phan} (Nhóm {detail.class.nhom_hoc_phan})
                </h2>
                <button
                  type="button"
                  className="to-registration-add-student-open"
                  onClick={() => setIsAddStudentModalOpen(true)}
                >
                  Thêm sinh viên
                </button>
              </div>
              <div className="to-timetable-detail-page-body">
                <div className="to-registration-add-student-card">
                  <div>
                    <strong>Thêm sinh viên vào lớp học phần</strong>
                    <span>Hệ thống sẽ kiểm tra trùng thời khóa biểu trước khi thêm. Có thể thêm vượt chỉ tiêu tối đa.</span>
                  </div>
                  <div className="to-registration-add-student-form">
                    <input
                      value={studentCodeToAdd}
                      onChange={(event) => setStudentCodeToAdd(event.target.value)}
                      placeholder="Nhập mã sinh viên"
                    />
                    <button type="button" onClick={() => void handleAddStudent()}>Thêm vào lớp</button>
                  </div>
                </div>
                <div className="to-registration-detail-filter">
                  <label>
                    <span>Mã sinh viên</span>
                    <input
                      value={studentFilters.ma_sinh_vien}
                      onChange={(event) => setStudentFilters((current) => ({ ...current, ma_sinh_vien: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Họ tên sinh viên</span>
                    <input
                      value={studentFilters.ho_ten}
                      onChange={(event) => setStudentFilters((current) => ({ ...current, ho_ten: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Mã lớp</span>
                    <input
                      value={studentFilters.ma_lop}
                      onChange={(event) => setStudentFilters((current) => ({ ...current, ma_lop: event.target.value }))}
                    />
                  </label>
                  <div className="to-registration-detail-filter-row">
                    <strong>Sắp xếp</strong>
                    <select value={studentSortField} onChange={(event) => setStudentSortField(event.target.value as StudentSortField)}>
                      <option value="ma_sinh_vien">Mã sinh viên</option>
                      <option value="ho_ten">Họ tên sinh viên</option>
                      <option value="ma_lop">Mã lớp</option>
                    </select>
                    <select value={studentSortDirection} onChange={(event) => setStudentSortDirection(event.target.value as SortDirection)}>
                      <option value="asc">Tăng dần</option>
                      <option value="desc">Giảm dần</option>
                    </select>
                  </div>
                  <label>
                    <span>Số dòng mỗi trang</span>
                    <select value={pageSize} onChange={(event) => setPageSize(event.target.value)}>
                      {PAGE_SIZE_OPTIONS.map((value) => (
                        <option key={value} value={value}>{getPageSizeLabel(value)}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <table className="to-timetable-detail-table">
                  <thead>
                    <tr><th colSpan={7}>Thời khóa biểu</th></tr>
                    <tr>
                      <th>Thứ</th>
                      <th>Mã học phần</th>
                      <th>Nhóm học phần</th>
                      <th>Tên học phần</th>
                      <th>Tiết học</th>
                      <th>Tên phòng</th>
                      <th>Tuần học</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedTimetable.map(({ key, first, rows }) => (
                      <tr key={key}>
                        <td><strong>{first.thu}</strong></td>
                        <td>{first.ma_hoc_phan}</td>
                        <td>{first.nhom_hoc_phan}</td>
                        <td>{first.ten_hoc_phan}</td>
                        <td className="to-pattern-cell">{makeLessonPattern(first.tiet_bat_dau, first.tiet_ket_thuc)}</td>
                        <td>{first.ten_phong}</td>
                        <td className="to-pattern-cell">{makeWeekPatternForRows(rows)}</td>
                      </tr>
                    ))}
                    {mergedTimetable.length === 0 && (
                      <tr><td colSpan={7} className="to-timetable-empty">Chưa có thời khóa biểu.</td></tr>
                    )}
                  </tbody>
                </table>

                <div className="to-registration-detail-total">
                  Tổng số: {filteredStudents.length}/{detail.students.length} sinh viên
                </div>
                <table className="to-timetable-detail-table">
                  <thead>
                    <tr>
                      <th>Stt</th>
                      <th>Mã sinh viên</th>
                      <th>Họ tên sinh viên</th>
                      <th>Giới tính</th>
                      <th>Mã lớp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr key={student.id ?? student.ma_sinh_vien}>
                        <td>{index + 1}</td>
                        <td>{student.ma_sinh_vien}</td>
                        <td>{student.ho_ten}</td>
                        <td>{student.gioi_tinh}</td>
                        <td>{student.ma_lop}</td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr><td colSpan={5} className="to-timetable-empty">Không có sinh viên phù hợp.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            {isAddStudentModalOpen && (
              <div
                className="to-registration-modal-overlay"
                role="presentation"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    setIsAddStudentModalOpen(false)
                  }
                }}
              >
                <section className="to-registration-add-student-modal" role="dialog" aria-modal="true" aria-labelledby="add-student-title">
                  <div className="to-registration-modal-head">
                    <div>
                      <h3 id="add-student-title">Thêm sinh viên vào lớp học phần</h3>
                      <p>Hệ thống sẽ kiểm tra trùng thời khóa biểu trước khi thêm. Có thể thêm vượt chỉ tiêu tối đa.</p>
                    </div>
                    <button
                      type="button"
                      className="to-registration-modal-close"
                      aria-label="Đóng"
                      onClick={() => setIsAddStudentModalOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                  <label className="to-registration-modal-field">
                    <span>Mã sinh viên</span>
                    <input
                      autoFocus
                      inputMode="numeric"
                      maxLength={8}
                      pattern="\d{8}"
                      value={studentCodeToAdd}
                      onChange={(event) => setStudentCodeToAdd(event.target.value.replace(/\D/g, '').slice(0, 8))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void handleAddStudent()
                        }
                      }}
                      placeholder="Nhập đúng 8 chữ số"
                    />
                  </label>
                  <div className="to-registration-modal-actions">
                    <button type="button" className="secondary" onClick={() => setIsAddStudentModalOpen(false)}>Hủy</button>
                    <button type="button" onClick={() => void handleAddStudent()}>Thêm vào lớp</button>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </RoleLayout>
  )
}
