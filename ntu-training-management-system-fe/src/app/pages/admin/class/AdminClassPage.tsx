import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { apiDelete, apiGet, apiPost, apiPut } from '../../../../api/core/request'
import { useAlert } from '../../../../components/alert'
import './AdminClassPage.css'

interface DonViOption {
  id: number
  ma_don_vi: string
  ten_don_vi: string
  loai_don_vi: string
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
  don_vi: DonViOption | null
}

interface LopsResponse {
  data: Lop[]
}

interface NewClassState {
  donViId: string
  lopHocPhan: string
  maKhoi: string
}

const EMPTY_CLASS: NewClassState = {
  donViId: '',
  lopHocPhan: '',
  maKhoi: '',
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: string }).message
    if (message) return message
  }

  return fallback
}

export default function AdminClassPage() {
  const { showAlert } = useAlert()
  const [lops, setLops] = useState<Lop[]>([])
  const [donVis, setDonVis] = useState<DonViOption[]>([])
  const [newClass, setNewClass] = useState<NewClassState>(EMPTY_CLASS)
  const [editingClass, setEditingClass] = useState<Lop | null>(null)
  const [pendingDeleteClass, setPendingDeleteClass] = useState<Lop | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const selectedDonVi = useMemo(
    () => donVis.find((donVi) => String(donVi.id) === newClass.donViId),
    [donVis, newClass.donViId],
  )
  const isEditing = Boolean(editingClass)

  const loadData = useCallback(async () => {
    setIsLoading(true)

    try {
      const catalogResponse = await apiGet<{ data: DonViOption[] }>('/admin/don-vis')
      setDonVis(catalogResponse.data)
    } catch (error: unknown) {
      showAlert({
        title: 'Không tải được danh sách đơn vị',
        message: getErrorMessage(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    }

    try {
      const classesResponse = await apiGet<LopsResponse>('/admin/lops')
      setLops(classesResponse.data)
    } catch (error: unknown) {
      setLops([])
      showAlert({
        title: 'Không tải được danh sách lớp',
        message: getErrorMessage(error, 'Bạn vẫn có thể chọn đơn vị sau khi danh sách đơn vị tải thành công.'),
        variant: 'warning',
      })
    } finally {
      setIsLoading(false)
    }
  }, [showAlert])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleCreateClass = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!newClass.donViId || !newClass.lopHocPhan.trim() || !newClass.maKhoi.trim()) {
      showAlert({
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn đơn vị, nhập lớp học phần và mã khối.',
        variant: 'warning',
      })
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        don_vi_id: Number(newClass.donViId),
        lop_hoc_phan: newClass.lopHocPhan.trim(),
        ma_khoi: newClass.maKhoi.trim(),
      }

      if (editingClass) {
        await apiPut(`/admin/lops/${editingClass.id}`, payload)
      } else {
        await apiPost('/admin/lops', payload)
      }

      showAlert({
        title: 'Thành công',
        message: editingClass
          ? `Đã cập nhật lớp ${newClass.lopHocPhan.trim()}.`
          : `Đã tạo lớp ${newClass.lopHocPhan.trim()}.`,
        variant: 'success',
      })

      setNewClass(EMPTY_CLASS)
      setEditingClass(null)
      await loadData()
    } catch (error: unknown) {
      showAlert({
        title: 'Tạo lớp thất bại',
        message: getErrorMessage(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'),
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditClass = (lop: Lop) => {
    setEditingClass(lop)
    setNewClass({
      donViId: String(lop.don_vi_id),
      lopHocPhan: lop.lop_hoc_phan,
      maKhoi: lop.ma_khoi,
    })
  }

  const handleCancelEdit = () => {
    setEditingClass(null)
    setNewClass(EMPTY_CLASS)
  }

  const handleToggleClassStatus = async (lop: Lop) => {
    try {
      await apiPost(`/admin/lops/${lop.id}/toggle-status`)
      showAlert({
        title: lop.trang_thai ? 'Đã khóa lớp' : 'Đã mở khóa lớp',
        message: `Lớp ${lop.lop_hoc_phan} đã được cập nhật trạng thái.`,
        variant: 'success',
      })
      await loadData()
    } catch (error: unknown) {
      showAlert({
        title: 'Cập nhật trạng thái thất bại',
        message: getErrorMessage(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    }
  }

  const confirmDeleteClass = async () => {
    if (!pendingDeleteClass) return

    try {
      await apiDelete(`/admin/lops/${pendingDeleteClass.id}`)
      showAlert({
        title: 'Đã xóa lớp',
        message: `Lớp ${pendingDeleteClass.lop_hoc_phan} đã được xóa.`,
        variant: 'success',
      })
      setPendingDeleteClass(null)
      await loadData()
    } catch (error: unknown) {
      showAlert({
        title: 'Xóa lớp thất bại',
        message: getErrorMessage(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    }
  }

  return (
    <main className="acl-root">
      <section className="acl-header">
        <div>
          <h1>Quản lý lớp hành chính</h1>
          <p>Tạo lớp theo đơn vị đào tạo để dùng khi khởi tạo tài khoản sinh viên.</p>
        </div>
      </section>

      <section className="acl-panel">
        <h2>{isEditing ? 'Sửa lớp' : 'Tạo lớp mới'}</h2>
        <form className="acl-form" onSubmit={handleCreateClass}>
          <div className="acl-form-grid">
            <div className="acl-form-group">
              <label>Mã đơn vị *</label>
              <select
                className="acl-input"
                required
                value={newClass.donViId}
                onChange={(event) => setNewClass({ ...newClass, donViId: event.target.value })}
              >
                <option value="">Chọn đơn vị</option>
                {donVis.map((donVi) => (
                  <option key={donVi.id} value={donVi.id}>
                    {donVi.ma_don_vi} - {donVi.ten_don_vi}
                  </option>
                ))}
              </select>
              {selectedDonVi && <span className="acl-hint">{selectedDonVi.ten_don_vi}</span>}
            </div>
            <div className="acl-form-group">
              <label>Lớp học phần *</label>
              <input
                className="acl-input"
                required
                placeholder="VD: 65.QTKD-1 (65.QTKD-1)"
                value={newClass.lopHocPhan}
                onChange={(event) => setNewClass({ ...newClass, lopHocPhan: event.target.value })}
              />
            </div>
            <div className="acl-form-group">
              <label>Mã khối *</label>
              <input
                className="acl-input"
                required
                placeholder="VD: 65.QTKD"
                value={newClass.maKhoi}
                onChange={(event) => setNewClass({ ...newClass, maKhoi: event.target.value })}
              />
            </div>
            <div className="acl-form-group">
              <label>Mô hình đào tạo</label>
              <input className="acl-input" value="Tín chỉ" disabled />
            </div>
            <div className="acl-form-group">
              <label>Sĩ số ban đầu</label>
              <input className="acl-input" value="0" disabled />
            </div>
          </div>
          <div className="acl-actions">
            {isEditing && (
              <button type="button" className="acl-secondary" onClick={handleCancelEdit}>
                Hủy sửa
              </button>
            )}
            <button type="submit" className="acl-primary" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Tạo lớp'}
            </button>
          </div>
        </form>
      </section>

      <section className="acl-panel">
        <div className="acl-table-header">
          <h2>Danh sách lớp</h2>
          <span>{isLoading ? 'Đang tải...' : `${lops.length} lớp`}</span>
        </div>
        <div className="acl-table-wrap">
          <table className="acl-table">
            <thead>
              <tr>
                <th>Stt</th>
                <th>Lớp học phần</th>
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
              {isLoading ? (
                <tr>
                  <td colSpan={10}>Đang tải dữ liệu...</td>
                </tr>
              ) : lops.length === 0 ? (
                <tr>
                  <td colSpan={10}>Chưa có lớp hành chính nào.</td>
                </tr>
              ) : (
                lops.map((lop, index) => (
                  <tr key={lop.id}>
                    <td>{index + 1}</td>
                    <td>{lop.lop_hoc_phan}</td>
                    <td>{lop.si_so}</td>
                    <td>{lop.mo_hinh_dao_tao}</td>
                    <td>{lop.ma_khoi}</td>
                    <td>{lop.ten_khoi}</td>
                    <td>{lop.ma_don_vi || lop.don_vi?.ma_don_vi || '-'}</td>
                    <td>{lop.ten_don_vi || lop.don_vi?.ten_don_vi || '-'}</td>
                    <td>
                      <span className={`acl-status ${lop.trang_thai ? 'active' : 'inactive'}`}>
                        {lop.trang_thai ? 'Đang dùng' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className="acl-row-actions">
                        <button
                          type="button"
                          className="acl-icon-btn"
                          title="Sửa lớp"
                          aria-label={`Sửa lớp ${lop.lop_hoc_phan}`}
                          onClick={() => handleEditClass(lop)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="acl-icon-btn"
                          title={lop.trang_thai ? 'Khóa lớp' : 'Mở khóa lớp'}
                          aria-label={`${lop.trang_thai ? 'Khóa' : 'Mở khóa'} lớp ${lop.lop_hoc_phan}`}
                          onClick={() => void handleToggleClassStatus(lop)}
                        >
                          {lop.trang_thai ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="11" x="3" y="11" rx="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="11" x="3" y="11" rx="2" />
                              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          className="acl-icon-danger"
                          title="Xóa lớp"
                          aria-label={`Xóa lớp ${lop.lop_hoc_phan}`}
                          onClick={() => setPendingDeleteClass(lop)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v5" />
                            <path d="M14 11v5" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {pendingDeleteClass && (
        <div className="acl-modal-overlay">
          <div className="acl-confirm-modal">
            <div className="acl-confirm-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
            </div>
            <h3>Xóa lớp?</h3>
            <p>
              Lớp <strong>{pendingDeleteClass.lop_hoc_phan}</strong> sẽ bị xóa khỏi danh sách.
            </p>
            <div className="acl-confirm-actions">
              <button type="button" className="acl-secondary" onClick={() => setPendingDeleteClass(null)}>
                Hủy bỏ
              </button>
              <button type="button" className="acl-danger-solid" onClick={() => void confirmDeleteClass()}>
                Xóa lớp
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
