import { useEffect, useMemo, useState } from 'react'
import { CheckCircleIcon, EyeIcon, EyeSlashIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/solid'
import { apiDelete, apiGet, apiPut } from '@/api/core/request'
import { useAlert } from '@/components/alert'
import { Pagination, getPageSizeNumber } from '@/components/pagination'
import { useNavigate } from 'react-router-dom'
import RoleLayout from '../../../layout/RoleLayout'
import '../timetable/TrainingOfficerTimetablePage.css'

type AcademicYear = { id: number; nam_hoc: string }
type Semester = { id: number; nam_hoc_id: number; hoc_ky: string }
type ClassRegistration = {
  id: number
  hoc_ky_id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  lop_hoc_phan: string
  nhom_hoc_phan: string
  ten_giang_vien: string
  si_so_toi_da: number
  so_sv_da_dk: number
  status: 'open' | 'closed' | string
}

export default function TrainingOfficerCourseRegistrationPage() {
  const alert = useAlert()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [yearId, setYearId] = useState('')
  const [semesterValue, setSemesterValue] = useState('')
  const [items, setItems] = useState<ClassRegistration[]>([])
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [pageSize, setPageSize] = useState('10')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<ClassRegistration | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()
  const selectedTerm = semesters.find((term) => String(term.nam_hoc_id) === yearId && String(term.hoc_ky) === semesterValue)
  const selectedTermId = selectedTerm?.id
  const availableSemesters = useMemo(() => (
    yearId ? semesters.filter((term) => String(term.nam_hoc_id) === yearId) : semesters
  ), [semesters, yearId])

  const filteredItems = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    return items.filter((item) => {
      const matchesKeyword = keyword.length === 0
        || item.ma_hoc_phan.toLowerCase().includes(keyword)
        || item.ten_hoc_phan.toLowerCase().includes(keyword)
        || item.lop_hoc_phan.toLowerCase().includes(keyword)
        || item.ten_giang_vien.toLowerCase().includes(keyword)
        || item.nhom_hoc_phan.toLowerCase().includes(keyword)

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter

      return matchesKeyword && matchesStatus
    })
  }, [items, searchKeyword, statusFilter])

  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1
    const size = getPageSizeNumber(pageSize, filteredItems.length)
    return Math.max(1, Math.ceil(filteredItems.length / size))
  }, [filteredItems.length, pageSize])

  const pagedItems = useMemo(() => {
    if (pageSize === 'all') return filteredItems
    const size = getPageSizeNumber(pageSize, filteredItems.length)
    const start = (page - 1) * size
    return filteredItems.slice(start, start + size)
  }, [filteredItems, page, pageSize])

  const pageSizeNumber = getPageSizeNumber(pageSize, filteredItems.length)
  const displayFrom = filteredItems.length === 0 ? 0 : (page - 1) * pageSizeNumber + 1
  const displayTo = pageSize === 'all' ? filteredItems.length : Math.min(page * pageSizeNumber, filteredItems.length)

  const loadData = async (termId?: number) => {
    const [yearsResponse, semestersResponse, classesResponse] = await Promise.all([
      apiGet<{ data: AcademicYear[] }>('/academic-catalog/nam-hocs'),
      apiGet<{ data: Semester[] }>('/academic-catalog/hoc-kys'),
      apiGet<{ data: ClassRegistration[] }>('/training-officer/course-registration/classes', termId ? { params: { hoc_ky_id: termId } } : undefined),
    ])
    setYears(yearsResponse.data)
    setSemesters(semestersResponse.data)
    setItems(classesResponse.data)
    setDrafts(Object.fromEntries(classesResponse.data.map((item) => [item.id, String(item.si_so_toi_da)])))

    const firstTermId = termId ?? classesResponse.data[0]?.hoc_ky_id
    const firstTerm = semestersResponse.data.find((term) => term.id === firstTermId) ?? semestersResponse.data[0]
    if (firstTerm && !yearId && !semesterValue) {
      setYearId(String(firstTerm.nam_hoc_id))
      setSemesterValue(String(firstTerm.hoc_ky))
    }
  }

  useEffect(() => {
    loadData().catch(() => alert.showError('Không tải được dữ liệu', 'Vui lòng kiểm tra backend.'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedTermId) {
      loadData(selectedTermId).catch(() => alert.showError('Không tải được dữ liệu', 'Vui lòng kiểm tra backend.'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTermId])

  useEffect(() => {
    setPage(1)
  }, [searchKeyword, statusFilter, pageSize, selectedTermId])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const handleSave = async (item: ClassRegistration) => {
    const max = Number(drafts[item.id])
    if (!Number.isInteger(max) || max < 0) {
      alert.showError('Chỉ tiêu không hợp lệ', 'Số SVĐK tối đa phải là số nguyên không âm.')
      return
    }
    try {
      await apiPut(`/training-officer/course-registration/classes/${item.id}`, { si_so_toi_da: max, status: item.status })
      alert.showSuccess('Đã cập nhật', 'Chỉ tiêu đăng ký đã được lưu.')
      await loadData(selectedTermId)
    } catch (err) {
      alert.showError('Không lưu được', err instanceof Error ? err.message : 'Vui lòng thử lại.')
    }
  }

  const handleToggleVisibility = async (item: ClassRegistration) => {
    const nextStatus = item.status === 'open' ? 'closed' : 'open'
    const max = Number(drafts[item.id] ?? item.si_so_toi_da)

    if (!Number.isInteger(max) || max < 0) {
      alert.showError('Chỉ tiêu không hợp lệ', 'Số SVĐK tối đa phải là số nguyên không âm.')
      return
    }

    try {
      await apiPut(`/training-officer/course-registration/classes/${item.id}`, {
        si_so_toi_da: max,
        status: nextStatus,
      })
      alert.showSuccess(
        nextStatus === 'open' ? 'Đã hiện lớp học phần' : 'Đã ẩn lớp học phần',
        nextStatus === 'open'
          ? 'Sinh viên có thể thấy và đăng ký lớp học phần này.'
          : 'Sinh viên sẽ không thấy lớp học phần này trong danh sách đăng ký.',
      )
      await loadData(selectedTermId)
    } catch (err) {
      alert.showError('Không cập nhật được', err instanceof Error ? err.message : 'Vui lòng thử lại.')
    }
  }

  const handleOpenDetail = (item: ClassRegistration) => {
    navigate('/chuyenvien/registrations/' + item.id)
  }

  const handleDeleteClass = (item: ClassRegistration) => {
    setDeleteTarget(item)
  }

  const confirmDeleteClass = async () => {
    if (!deleteTarget || isDeleting) {
      return
    }

    setIsDeleting(true)
    try {
      await apiDelete(`/training-officer/course-registration/classes/${deleteTarget.id}`)
      alert.showSuccess('Đã xóa lớp học phần', 'Lớp học phần đã được xóa khỏi danh sách đăng ký.')
      setDeleteTarget(null)
      await loadData(selectedTermId)
    } catch (err) {
      alert.showError('Không xóa được', err instanceof Error ? err.message : 'Vui lòng thử lại.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <RoleLayout brandSubtitle="Hệ thống Đào tạo" roleLabel="CHUYÊN VIÊN" roleColor="orange" homeRoute="/chuyenvien" roleTitle="Chuyên viên đào tạo">
      <main className="to-timetable-page to-registration-page">
        <section className="to-timetable-panel to-registration-page-panel">
          <div className="to-timetable-panel-head to-registration-page-head">
            <h2>Đăng ký học phần</h2>
          </div>
          <div className="to-timetable-form to-timetable-form-horizontal to-registration-toolbar">
            <label className="span-3 to-registration-term-field">
              Năm học
              <select value={yearId} onChange={(event) => { setYearId(event.target.value); setSemesterValue('') }}>
                <option value="">Chọn năm học</option>
                {years.map((year) => <option key={year.id} value={year.id}>{year.nam_hoc}</option>)}
              </select>
            </label>
            <label className="span-3 to-registration-term-field">
              Học kỳ
              <select value={semesterValue} onChange={(event) => setSemesterValue(event.target.value)}>
                <option value="">Chọn học kỳ</option>
                {availableSemesters.map((term) => <option key={term.id} value={term.hoc_ky}>Học kỳ {term.hoc_ky}</option>)}
              </select>
            </label>
            <label className="span-4 to-registration-term-field">
              Tìm kiếm
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Mã HP, tên học phần, lớp, giảng viên..."
              />
            </label>
            <label className="span-2 to-registration-term-field">
              Trạng thái
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | 'open' | 'closed')}>
                <option value="all">Tất cả</option>
                <option value="open">Đang hiển thị</option>
                <option value="closed">Đang ẩn</option>
              </select>
            </label>
          </div>
          <div className="to-registration-filter-summary">
            Hiển thị {displayFrom}-{displayTo}/{filteredItems.length} lớp học phần (tổng: {items.length})
          </div>
          <div className="to-timetable-table-wrap to-registration-table-wrap">
            <table className="to-timetable-table to-timetable-summary-table to-registration-management-table to-registration-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã HP</th>
                  <th>Tên học phần</th>
                  <th>Nhóm</th>
                  <th>Lớp học phần</th>
                  <th>Giảng viên</th>
                  <th>SV đã ĐK</th>
                  <th>SVĐK tối đa</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item, index) => (
                  <tr key={item.id}>
                    <td><strong>{displayFrom + index}</strong></td>
                    <td>{item.ma_hoc_phan}</td>
                    <td>{item.ten_hoc_phan}</td>
                    <td>{item.nhom_hoc_phan}</td>
                    <td>{item.lop_hoc_phan}</td>
                    <td className="to-registration-lecturer-cell">{item.ten_giang_vien}</td>
                    <td>{item.so_sv_da_dk}</td>
                    <td>
                      <input
                        className="to-registration-quota-input"
                        type="number"
                        min="0"
                        value={drafts[item.id] ?? ''}
                        onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                      />
                    </td>
                    <td>
                      <div className="to-registration-action-group">
                        <button
                          type="button"
                          className={`to-registration-icon-btn action-visibility ${item.status === 'open' ? 'is-visible' : 'is-hidden'}`}
                          onClick={() => void handleToggleVisibility(item)}
                          title={item.status === 'open' ? 'Ẩn lớp khỏi sinh viên' : 'Hiện lớp cho sinh viên'}
                          aria-label={item.status === 'open' ? 'Ẩn lớp khỏi sinh viên' : 'Hiện lớp cho sinh viên'}
                        >
                          {item.status === 'open' ? <EyeIcon aria-hidden="true" /> : <EyeSlashIcon aria-hidden="true" />}
                        </button>
                        <button
                          type="button"
                          className="to-registration-icon-btn action-detail"
                          onClick={() => handleOpenDetail(item)}
                          title="Xem chi tiết"
                          aria-label="Xem chi tiết"
                        >
                          <MagnifyingGlassIcon aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="to-registration-icon-btn action-save"
                          onClick={() => void handleSave(item)}
                          title="Lưu chỉ tiêu"
                          aria-label="Lưu chỉ tiêu"
                        >
                          <CheckCircleIcon aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="to-registration-icon-btn action-delete"
                          onClick={() => handleDeleteClass(item)}
                          title="Xóa lớp học phần"
                          aria-label="Xóa lớp học phần"
                        >
                          <TrashIcon aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && <tr><td colSpan={9} className="to-timetable-empty">Không có lớp học phần phù hợp bộ lọc.</td></tr>}
              </tbody>
            </table>
          </div>
          {filteredItems.length > 0 && (
            <div className="to-registration-pagination">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                className="to-registration-pagination-control"
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </section>
        {deleteTarget && (
          <div className="to-registration-delete-overlay" role="presentation" onMouseDown={() => !isDeleting && setDeleteTarget(null)}>
            <section
              className="to-registration-delete-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-registration-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="to-registration-delete-icon">
                <TrashIcon aria-hidden="true" />
              </div>
              <div className="to-registration-delete-content">
                <h3 id="delete-registration-title">Xóa lớp học phần?</h3>
                <p>
                  {deleteTarget.ma_hoc_phan} - {deleteTarget.ten_hoc_phan}, nhóm {deleteTarget.nhom_hoc_phan}
                </p>
                <span>Lớp sẽ không còn xuất hiện trong danh sách đăng ký học phần.</span>
              </div>
              <div className="to-registration-delete-actions">
                <button type="button" className="secondary" disabled={isDeleting} onClick={() => setDeleteTarget(null)}>
                  Hủy
                </button>
                <button type="button" className="danger" disabled={isDeleting} onClick={() => void confirmDeleteClass()}>
                  {isDeleting ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </RoleLayout>
  )
}
