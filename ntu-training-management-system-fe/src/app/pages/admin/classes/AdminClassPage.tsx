import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { apiDelete, apiGet, apiPost, apiPut } from '../../../../api/core/request'
import { useAlert } from '@/components/alert'
import { Pagination, getPageSizeNumber } from '@/components/pagination'
import './AdminClassPage.css'

interface DonVi {
  id: number
  ma_don_vi: string
  ten_don_vi: string
  loai_don_vi?: string | null
}

interface Lop {
  id: number
  don_vi_id: number
  lop_hoc_phan: string
  ten_hoc_phan: string | null
  ten_giang_vien: string | null
  si_so: number
  mo_hinh_dao_tao: string
  ma_khoi: string
  ten_khoi: string
  ma_don_vi: string
  ten_don_vi: string
  trang_thai: boolean
  don_vi?: DonVi | null
}

interface LecturerAccount {
  id: number
  username: string
  display_name: string | null
  email: string | null
  profile?: {
    don_vi_id?: number | null
  } | null
}

interface ListResponse<T> {
  data: T[]
}

interface MutateResponse {
  message: string
  data?: Lop
}

interface ClassForm {
  donViId: string
  lopHocPhan: string
  tenGiangVien: string
  moHinhDaoTao: string
  maKhoi: string
  tenKhoi: string
}

type ConfirmAction = 'edit' | 'delete'

interface ClassPayload {
  don_vi_id: number
  lop_hoc_phan: string
  ten_hoc_phan: string | null
  ten_giang_vien: string | null
  mo_hinh_dao_tao: string
  ma_khoi: string
  ten_khoi: string
}

const emptyForm: ClassForm = {
  donViId: '',
  lopHocPhan: '',
  tenGiangVien: '',
  moHinhDaoTao: 'Tín chỉ',
  maKhoi: '',
  tenKhoi: '',
}

export default function AdminClassPage() {
  const { showAlert } = useAlert()
  const [donVis, setDonVis] = useState<DonVi[]>([])
  const [lecturers, setLecturers] = useState<LecturerAccount[]>([])
  const [lops, setLops] = useState<Lop[]>([])
  const [form, setForm] = useState<ClassForm>(emptyForm)
  const [editForm, setEditForm] = useState<ClassForm>(emptyForm)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('10')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLop, setEditingLop] = useState<Lop | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: ConfirmAction; lop: Lop } | null>(null)
  const [pendingUpdate, setPendingUpdate] = useState<ClassPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const filteredLops = useMemo(() => {
    const keyword = query.trim().toLowerCase()

    if (!keyword) {
      return lops
    }

    return lops.filter((lop) =>
      [
        lop.lop_hoc_phan,
        lop.ten_giang_vien ?? '',
        lop.ma_khoi,
        lop.ma_don_vi,
        lop.ten_don_vi,
        lop.mo_hinh_dao_tao,
      ].some((value) => value.toLowerCase().includes(keyword)),
    )
  }, [lops, query])

  const pageSizeNumber = getPageSizeNumber(pageSize, filteredLops.length)
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredLops.length / pageSizeNumber))
  const pagedLops = useMemo(() => {
    if (pageSize === 'all') return filteredLops

    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * pageSizeNumber

    return filteredLops.slice(start, start + pageSizeNumber)
  }, [filteredLops, page, pageSize, pageSizeNumber, totalPages])

  useEffect(() => {
    setPage(1)
  }, [pageSize, query])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const loadData = useCallback(async () => {
    setLoading(true)

    try {
      const [donViResponse, lecturerResponse, lopResponse] = await Promise.all([
        apiGet<ListResponse<DonVi>>('/admin/don-vis'),
        apiGet<ListResponse<LecturerAccount>>('/admin/accounts', {
          params: { role: 'lecturer' },
        }),
        apiGet<ListResponse<Lop>>('/admin/lops'),
      ])

      setDonVis(donViResponse.data)
      setLecturers(lecturerResponse.data)
      setLops(lopResponse.data)
    } catch {
      showAlert({
        variant: 'error',
        title: 'Không tải được dữ liệu lớp',
        message: 'Vui lòng kiểm tra kết nối API hoặc phiên đăng nhập.',
      })
    } finally {
      setLoading(false)
    }
  }, [showAlert])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const resetForm = () => {
    setForm(emptyForm)
    setShowCreateModal(false)
  }

  const closeEditModal = () => {
    setEditingLop(null)
    setEditForm(emptyForm)
  }

  const fillEditForm = (lop: Lop) => {
    setEditingLop(lop)
    setEditForm({
      donViId: String(lop.don_vi_id),
      lopHocPhan: lop.lop_hoc_phan,
      tenGiangVien: lop.ten_giang_vien ?? '',
      moHinhDaoTao: lop.mo_hinh_dao_tao || 'Tín chỉ',
      maKhoi: lop.ma_khoi,
      tenKhoi: lop.ten_khoi,
    })
  }

  const saveClass = async (payload: ClassPayload, lopToUpdate: Lop | null) => {
    setSubmitting(true)

    try {
      const response = lopToUpdate
        ? await apiPut<MutateResponse, ClassPayload>(`/admin/lops/${lopToUpdate.id}`, payload)
        : await apiPost<MutateResponse, typeof payload>('/admin/lops', payload)

      const savedLop = response.data

      if (savedLop) {
        setLops((prev) => {
          if (!lopToUpdate) {
            return [savedLop, ...prev]
          }

          return prev.map((lop) => (lop.id === savedLop.id ? savedLop : lop))
        })
      } else {
        await loadData()
      }

      showAlert({
        variant: 'success',
        title: lopToUpdate ? 'Đã cập nhật lớp' : 'Đã tạo lớp',
        message: response.message,
      })
      if (lopToUpdate) {
        closeEditModal()
      } else {
        resetForm()
      }
    } catch {
      showAlert({
        variant: 'error',
        title: lopToUpdate ? 'Không cập nhật được lớp' : 'Không tạo được lớp',
        message: 'Vui lòng kiểm tra dữ liệu nhập và thử lại.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const buildPayload = (targetForm: ClassForm): ClassPayload | null => {
    if (
      !targetForm.donViId ||
      !targetForm.lopHocPhan.trim() ||
      !targetForm.moHinhDaoTao.trim() ||
      !targetForm.maKhoi.trim() ||
      !targetForm.tenKhoi.trim()
    ) {
      showAlert({
        variant: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập đủ các cột của lớp học.',
      })
      return null
    }

    return {
      don_vi_id: Number(targetForm.donViId),
      lop_hoc_phan: targetForm.lopHocPhan.trim(),
      ten_hoc_phan: null,
      ten_giang_vien: targetForm.tenGiangVien.trim() || null,
      mo_hinh_dao_tao: targetForm.moHinhDaoTao.trim(),
      ma_khoi: targetForm.maKhoi.trim(),
      ten_khoi: targetForm.tenKhoi.trim(),
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = buildPayload(form)

    if (!payload) {
      return
    }

    await saveClass(payload, null)
  }

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingLop) {
      return
    }

    const payload = buildPayload(editForm)

    if (!payload) {
      return
    }

    setPendingUpdate(payload)
    setConfirmAction({ type: 'edit', lop: editingLop })
  }

  const deleteLop = async (lop: Lop) => {
    try {
      const response = await apiDelete<{ message: string }>(`/admin/lops/${lop.id}`)
      setLops((prev) => prev.filter((item) => item.id !== lop.id))

      if (editingLop?.id === lop.id) {
        closeEditModal()
      }

      showAlert({
        variant: 'success',
        title: 'Đã xóa lớp',
        message: response.message,
      })
    } catch {
      showAlert({
        variant: 'error',
        title: 'Không xóa được lớp',
        message: 'Lớp có thể đang được sử dụng bởi hồ sơ sinh viên.',
      })
    }
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) {
      return
    }

    setConfirming(true)

    try {
      if (confirmAction.type === 'edit') {
        if (pendingUpdate) {
          await saveClass(pendingUpdate, confirmAction.lop)
          setPendingUpdate(null)
        }
      } else {
        await deleteLop(confirmAction.lop)
      }
      setConfirmAction(null)
    } finally {
      setConfirming(false)
    }
  }

  const closeConfirmModal = () => {
    setConfirmAction(null)
    setPendingUpdate(null)
  }

  const confirmTitle = confirmAction?.type === 'delete' ? 'Xác nhận xóa lớp' : 'Xác nhận sửa lớp'
  const confirmMessage = confirmAction
    ? confirmAction.type === 'delete'
      ? `Bạn có chắc chắn muốn xóa lớp "${confirmAction.lop.ma_khoi}"?`
      : `Lưu các thay đổi cho lớp "${confirmAction.lop.ma_khoi}"?`
    : ''
  const confirmButtonLabel = confirmAction?.type === 'delete' ? 'Xóa lớp' : 'Lưu thay đổi'

  return (
    <div className="acl-root">
      <div className="acl-header">
        <div>
          <h1 className="acl-title">Quản lý lớp học</h1>
          <p className="acl-subtitle">Tạo và cập nhật lớp hành chính dùng cho hồ sơ sinh viên.</p>
        </div>
        <button className="acl-btn-primary acl-header-action" type="button" onClick={() => setShowCreateModal(true)}>
          Tạo lớp học
        </button>
      </div>

      <div className="acl-layout">
        <section className="acl-list-card">
          <div className="acl-list-toolbar">
            <div>
              <h2>Danh sách lớp</h2>
              <span>{filteredLops.length} lớp</span>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm mã lớp, đơn vị..."
            />
          </div>

          <div className="acl-table-wrap">
            <table className="acl-table">
              <thead>
                <tr>
                  <th>Lớp hành chính</th>
                  <th>CVHT</th>
                  <th>Sĩ số</th>
                  <th>Mô hình đào tạo</th>
                  <th>Mã khối</th>
                  <th>Tên khối</th>
                  <th>Mã đơn vị</th>
                  <th>Tên đơn vị</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="acl-empty">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredLops.length ? (
                  pagedLops.map((lop) => (
                    <tr key={lop.id}>
                      <td className="acl-strong">{lop.lop_hoc_phan}</td>
                      <td>{lop.ten_giang_vien || 'Chưa có CVHT'}</td>
                      <td>{lop.si_so}</td>
                      <td>{lop.mo_hinh_dao_tao}</td>
                      <td>{lop.ma_khoi}</td>
                      <td>{lop.ten_khoi}</td>
                      <td>{lop.ma_don_vi}</td>
                      <td>{lop.ten_don_vi}</td>
                      <td>
                        <div className="acl-actions">
                          <button type="button" onClick={() => fillEditForm(lop)} title="Sửa lớp" aria-label="Sửa lớp">
                            <PencilSquareIcon className="acl-action-icon" />
                          </button>
                          <button type="button" className="danger" onClick={() => setConfirmAction({ type: 'delete', lop })} title="Xóa lớp" aria-label="Xóa lớp">
                            <TrashIcon className="acl-action-icon" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="acl-empty">Chưa có lớp phù hợp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredLops.length > 0 && (
            <div className="acl-pagination">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </section>
      </div>

      {showCreateModal && (
        <div className="acl-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="acl-create-title">
          <form className="acl-edit-modal" onSubmit={handleSubmit}>
            <div className="acl-edit-header">
              <h3 id="acl-create-title">Tạo lớp học</h3>
              <button type="button" className="acl-edit-close" onClick={resetForm} aria-label="Đóng">
                ×
              </button>
            </div>

            <div className="acl-edit-grid">
              <label className="acl-field">
                <span>Đơn vị</span>
                <select
                  value={form.donViId}
                  onChange={(event) => setForm((prev) => ({ ...prev, donViId: event.target.value }))}
                  required
                >
                  <option value="">Chọn đơn vị</option>
                  {donVis.map((donVi) => (
                    <option key={donVi.id} value={donVi.id}>
                      {donVi.ma_don_vi} - {donVi.ten_don_vi}
                    </option>
                  ))}
                </select>
              </label>

              <label className="acl-field">
                <span>Lớp hành chính</span>
                <input
                  value={form.lopHocPhan}
                  onChange={(event) => setForm((prev) => ({ ...prev, lopHocPhan: event.target.value }))}
                  required
                />
              </label>

              <label className="acl-field">
                <span>Giảng viên cố vấn học tập</span>
                <select
                  value={form.tenGiangVien}
                  onChange={(event) => setForm((prev) => ({ ...prev, tenGiangVien: event.target.value }))}
                >
                  <option value="">Không chọn CVHT</option>
                  {lecturers
                    .filter((lecturer) => !form.donViId || lecturer.profile?.don_vi_id === Number(form.donViId))
                    .map((lecturer) => {
                      const displayName = lecturer.display_name || lecturer.username

                      return (
                        <option key={lecturer.id} value={displayName}>
                          {lecturer.username} - {displayName}
                        </option>
                      )
                    })}
                </select>
              </label>

              <label className="acl-field">
                <span>Mô hình đào tạo</span>
                <select
                  value={form.moHinhDaoTao}
                  onChange={(event) => setForm((prev) => ({ ...prev, moHinhDaoTao: event.target.value }))}
                  required
                >
                  <option value="Tín chỉ">Tín chỉ</option>
                </select>
              </label>

              <label className="acl-field">
                <span>Mã khối</span>
                <input
                  value={form.maKhoi}
                  onChange={(event) => {
                    const value = event.target.value

                    setForm((prev) => ({
                      ...prev,
                      maKhoi: value,
                      tenKhoi: !prev.tenKhoi || prev.tenKhoi === prev.maKhoi ? value : prev.tenKhoi,
                    }))
                  }}
                  required
                />
              </label>

              <label className="acl-field">
                <span>Tên khối</span>
                <input
                  value={form.tenKhoi}
                  onChange={(event) => setForm((prev) => ({ ...prev, tenKhoi: event.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="acl-edit-actions">
              <button className="acl-confirm-cancel" type="button" onClick={resetForm} disabled={submitting}>
                Hủy
              </button>
              <button className="acl-btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Tạo lớp'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingLop && (
        <div className="acl-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="acl-edit-title">
          <form className="acl-edit-modal" onSubmit={handleEditSubmit}>
            <div className="acl-edit-header">
              <h3 id="acl-edit-title">Sửa lớp học</h3>
              <button type="button" className="acl-edit-close" onClick={closeEditModal} aria-label="Đóng">
                ×
              </button>
            </div>

            <div className="acl-edit-grid">
              <label className="acl-field">
                <span>Đơn vị</span>
                <select
                  value={editForm.donViId}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, donViId: event.target.value }))}
                  required
                >
                  <option value="">Chọn đơn vị</option>
                  {donVis.map((donVi) => (
                    <option key={donVi.id} value={donVi.id}>
                      {donVi.ma_don_vi} - {donVi.ten_don_vi}
                    </option>
                  ))}
                </select>
              </label>

              <label className="acl-field">
                <span>Lớp hành chính</span>
                <input
                  value={editForm.lopHocPhan}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, lopHocPhan: event.target.value }))}
                  required
                />
              </label>

              <label className="acl-field">
                <span>Giảng viên cố vấn học tập</span>
                <select
                  value={editForm.tenGiangVien}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, tenGiangVien: event.target.value }))}
                >
                  <option value="">Không chọn CVHT</option>
                  {lecturers
                    .filter((lecturer) => !editForm.donViId || lecturer.profile?.don_vi_id === Number(editForm.donViId))
                    .map((lecturer) => {
                      const displayName = lecturer.display_name || lecturer.username

                      return (
                        <option key={lecturer.id} value={displayName}>
                          {lecturer.username} - {displayName}
                        </option>
                      )
                    })}
                </select>
              </label>

              <label className="acl-field">
                <span>Mô hình đào tạo</span>
                <select
                  value={editForm.moHinhDaoTao}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, moHinhDaoTao: event.target.value }))}
                  required
                >
                  <option value="Tín chỉ">Tín chỉ</option>
                </select>
              </label>

              <label className="acl-field">
                <span>Mã khối</span>
                <input
                  value={editForm.maKhoi}
                  onChange={(event) => {
                    const value = event.target.value

                    setEditForm((prev) => ({
                      ...prev,
                      maKhoi: value,
                      tenKhoi: !prev.tenKhoi || prev.tenKhoi === prev.maKhoi ? value : prev.tenKhoi,
                    }))
                  }}
                  required
                />
              </label>

              <label className="acl-field">
                <span>Tên khối</span>
                <input
                  value={editForm.tenKhoi}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, tenKhoi: event.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="acl-edit-actions">
              <button className="acl-confirm-cancel" type="button" onClick={closeEditModal} disabled={submitting}>
                Hủy
              </button>
              <button className="acl-btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmAction && (
        <div className="acl-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="acl-confirm-title">
          <div className="acl-confirm-modal">
            <div className={`acl-confirm-icon ${confirmAction.type}`}>
              {confirmAction.type === 'delete' ? (
                <ExclamationTriangleIcon />
              ) : (
                <CheckCircleIcon />
              )}
            </div>
            <div className="acl-confirm-body">
              <h3 id="acl-confirm-title">{confirmTitle}</h3>
              <p>{confirmMessage}</p>
            </div>
            <div className="acl-confirm-actions">
              <button
                className="acl-confirm-cancel"
                type="button"
                onClick={closeConfirmModal}
                disabled={confirming}
              >
                Hủy
              </button>
              <button
                className={`acl-confirm-submit ${confirmAction.type}`}
                type="button"
                onClick={() => void handleConfirmAction()}
                disabled={confirming}
              >
                {confirming ? 'Đang xử lý...' : confirmButtonLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
