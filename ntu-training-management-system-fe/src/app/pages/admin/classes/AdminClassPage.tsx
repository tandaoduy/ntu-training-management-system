import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { apiDelete, apiGet, apiPost, apiPut } from '../../../../api/core/request'
import { useAlert } from '@/components/alert'
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
  si_so: number
  mo_hinh_dao_tao: string
  ma_khoi: string
  ten_khoi: string
  ma_don_vi: string
  ten_don_vi: string
  trang_thai: boolean
  don_vi?: DonVi | null
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
  moHinhDaoTao: string
  maKhoi: string
  tenKhoi: string
}

type ConfirmAction = 'edit' | 'delete'

interface ClassPayload {
  don_vi_id: number
  lop_hoc_phan: string
  mo_hinh_dao_tao: string
  ma_khoi: string
  ten_khoi: string
}

const emptyForm: ClassForm = {
  donViId: '',
  lopHocPhan: '',
  moHinhDaoTao: 'Tín chỉ',
  maKhoi: '',
  tenKhoi: '',
}

export default function AdminClassPage() {
  const alert = useAlert()
  const [donVis, setDonVis] = useState<DonVi[]>([])
  const [lops, setLops] = useState<Lop[]>([])
  const [form, setForm] = useState<ClassForm>(emptyForm)
  const [query, setQuery] = useState('')
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
        lop.ma_khoi,
        lop.ma_don_vi,
        lop.ten_don_vi,
        lop.mo_hinh_dao_tao,
      ].some((value) => value.toLowerCase().includes(keyword)),
    )
  }, [lops, query])

  const loadData = async () => {
    setLoading(true)

    try {
      const [donViResponse, lopResponse] = await Promise.all([
        apiGet<ListResponse<DonVi>>('/admin/don-vis'),
        apiGet<ListResponse<Lop>>('/admin/lops'),
      ])

      setDonVis(donViResponse.data)
      setLops(lopResponse.data)
    } catch {
      alert.showAlert({
        variant: 'error',
        title: 'Không tải được dữ liệu lớp',
        message: 'Vui lòng kiểm tra kết nối API hoặc phiên đăng nhập.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditingLop(null)
  }

  const fillEditForm = (lop: Lop) => {
    setEditingLop(lop)
    setForm({
      donViId: String(lop.don_vi_id),
      lopHocPhan: lop.lop_hoc_phan,
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

      alert.showAlert({
        variant: 'success',
        title: lopToUpdate ? 'Đã cập nhật lớp' : 'Đã tạo lớp',
        message: response.message,
      })
      resetForm()
    } catch {
      alert.showAlert({
        variant: 'error',
        title: lopToUpdate ? 'Không cập nhật được lớp' : 'Không tạo được lớp',
        message: 'Vui lòng kiểm tra dữ liệu nhập và thử lại.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      !form.donViId ||
      !form.lopHocPhan.trim() ||
      !form.moHinhDaoTao.trim() ||
      !form.maKhoi.trim() ||
      !form.tenKhoi.trim()
    ) {
      alert.showAlert({
        variant: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập đủ các cột của lớp học.',
      })
      return
    }

    const payload: ClassPayload = {
      don_vi_id: Number(form.donViId),
      lop_hoc_phan: form.lopHocPhan.trim(),
      mo_hinh_dao_tao: form.moHinhDaoTao.trim(),
      ma_khoi: form.maKhoi.trim(),
      ten_khoi: form.tenKhoi.trim(),
    }

    if (editingLop) {
      setPendingUpdate(payload)
      setConfirmAction({ type: 'edit', lop: editingLop })
      return
    }

    await saveClass(payload, null)
  }

  const handleToggleStatus = async (lop: Lop) => {
    try {
      const response = await apiPost<MutateResponse>(`/admin/lops/${lop.id}/toggle-status`)

      const savedLop = response.data

      if (savedLop) {
        setLops((prev) => prev.map((item) => (item.id === lop.id ? savedLop : item)))
      }

      alert.showAlert({
        variant: 'success',
        title: 'Đã cập nhật trạng thái',
        message: response.message,
      })
    } catch {
      alert.showAlert({
        variant: 'error',
        title: 'Không đổi được trạng thái',
        message: 'Vui lòng thử lại sau.',
      })
    }
  }

  const deleteLop = async (lop: Lop) => {
    try {
      const response = await apiDelete<{ message: string }>(`/admin/lops/${lop.id}`)
      setLops((prev) => prev.filter((item) => item.id !== lop.id))

      if (editingLop?.id === lop.id) {
        resetForm()
      }

      alert.showAlert({
        variant: 'success',
        title: 'Đã xóa lớp',
        message: response.message,
      })
    } catch {
      alert.showAlert({
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
      </div>

      <div className="acl-layout">
        <form className="acl-form-card" onSubmit={handleSubmit}>
          <div className="acl-form-header">
            <h2>{editingLop ? 'Cập nhật lớp' : 'Tạo lớp học'}</h2>
            {editingLop && (
              <button className="acl-btn-link" type="button" onClick={resetForm}>
                Hủy sửa
              </button>
            )}
          </div>

          <label className="acl-field">
            <span>Đơn vị</span>
            <select
              value={form.donViId}
              onChange={(event) => {
                const donViId = event.target.value

                setForm((prev) => ({
                  ...prev,
                  donViId,
                }))
              }}
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
            <span>Lớp học phần</span>
            <input
              value={form.lopHocPhan}
              onChange={(event) => setForm((prev) => ({ ...prev, lopHocPhan: event.target.value }))}
              required
            />
          </label>

          <div className="acl-form-grid">
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
          </div>

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
            />
          </label>

          <div className="acl-form-actions">
            <button className="acl-btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : editingLop ? 'Lưu thay đổi' : 'Tạo lớp'}
            </button>
          </div>
        </form>

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
                  <th>Tên lớp học phần</th>
                  <th>Sĩ số</th>
                  <th>Mô hình đào tạo</th>
                  <th>Mã khối</th>
                  <th>Tên khối</th>
                  <th>Mã đơn vị</th>
                  <th>Tên đơn vị</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="acl-empty">Đang tải dữ liệu...</td>
                  </tr>
                ) : filteredLops.length ? (
                  filteredLops.map((lop) => (
                    <tr key={lop.id}>
                      <td className="acl-strong">{lop.lop_hoc_phan}</td>
                      <td>{lop.si_so}</td>
                      <td>{lop.mo_hinh_dao_tao}</td>
                      <td>{lop.ma_khoi}</td>
                      <td>{lop.ten_khoi}</td>
                      <td>{lop.ma_don_vi}</td>
                      <td>{lop.ten_don_vi}</td>
                      <td>
                        <button
                          className={`acl-status ${lop.trang_thai ? 'active' : 'inactive'}`}
                          type="button"
                          onClick={() => void handleToggleStatus(lop)}
                        >
                          {lop.trang_thai ? 'Đang dùng' : 'Tạm khóa'}
                        </button>
                      </td>
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
        </section>
      </div>

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
