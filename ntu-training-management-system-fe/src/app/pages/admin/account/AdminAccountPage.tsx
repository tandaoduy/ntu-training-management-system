import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent, ReactNode } from 'react'

import { apiGet, apiPost } from '../../../../api/core/request'
import { useAlert } from '../../../../components/alert'
import './AdminAccountPage.css'

type RoleId = 'student' | 'lecturer' | 'training_officer' | 'manager'

interface RoleCard {
  id: RoleId
  title: string
  color: string
  icon: ReactNode
}

interface AdminAccount {
  id: number
  username: string
  role: string | null
  role_name: string | null
  status: boolean
  display_name: string | null
  email: string | null
}

interface AccountsResponse {
  data: AdminAccount[]
}

interface LopOption {
  id: number
  don_vi_id: number
  lop_hoc_phan: string
  si_so: number
  mo_hinh_dao_tao: string
  ma_khoi: string
  ten_khoi: string
  ma_don_vi: string
  ten_don_vi: string
}

interface NganhDaoTaoOption {
  id: number
  ma_nganh: string
  ten_nganh: string
  don_vi_id: number | null
  he_dao_tao: string
}

interface DonViOption {
  id: number
  ma_don_vi: string
  ten_don_vi: string
  loai_don_vi: string
  lops: LopOption[]
  nganh_dao_taos: NganhDaoTaoOption[]
}

interface StudentCatalogResponse {
  data: {
    don_vis: DonViOption[]
  }
}

interface NewAccountState {
  username: string
  fullName: string
  email: string
  password: string
  gioiTinh: string
  ngaySinh: string
  donViId: string
  lopId: string
  maLop: string
  tenDonVi: string
  nganhDaoTaoId: string
  tenNganhHoc: string
  heDaoTao: string
  soCccd: string
  noiSinh: string
  ngayCapCccd: string
  noiCapCccd: string
  hoKhauTinhThanhPho: string
  hoKhauQuanHuyen: string
  queQuanTinhThanhPho: string
  queQuanQuanHuyen: string
  queQuan: string
  danToc: string
  tonGiao: string
}

const EMPTY_ACCOUNT: NewAccountState = {
  username: '',
  fullName: '',
  email: '',
  password: '123456789',
  gioiTinh: '',
  ngaySinh: '',
  donViId: '',
  lopId: '',
  maLop: '',
  tenDonVi: '',
  nganhDaoTaoId: '',
  tenNganhHoc: '',
  heDaoTao: 'Đại học Chính quy',
  soCccd: '',
  noiSinh: '',
  ngayCapCccd: '',
  noiCapCccd: '',
  hoKhauTinhThanhPho: '',
  hoKhauQuanHuyen: '',
  queQuanTinhThanhPho: '',
  queQuanQuanHuyen: '',
  queQuan: '',
  danToc: '',
  tonGiao: '',
}

const ROLES: RoleCard[] = [
  {
    id: 'student',
    title: 'Sinh viên',
    color: '#3182ce',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
    ),
  },
  {
    id: 'lecturer',
    title: 'Cán bộ / Giảng viên',
    color: '#805ad5',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
  },
  {
    id: 'training_officer',
    title: 'Chuyên viên',
    color: '#38b2ac',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11h6"/><path d="M19 8v6"/></svg>
    ),
  },
  {
    id: 'manager',
    title: 'Quản lý',
    color: '#dd6b20',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
    ),
  },
]

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: string }).message
    if (message) return message
  }

  return fallback
}

export default function AdminAccountPage() {
  const { showAlert } = useAlert()
  const [selectedRole, setSelectedRole] = useState<RoleId | null>(null)
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [createdAccount, setCreatedAccount] = useState<AdminAccount | null>(null)
  const [newAccount, setNewAccount] = useState<NewAccountState>(EMPTY_ACCOUNT)
  const [donVis, setDonVis] = useState<DonViOption[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)

  const loadAccounts = async () => {
    setIsLoading(true)

    try {
      const response = await apiGet<AccountsResponse>('/admin/accounts')
      setAccounts(response.data)
    } catch (error: unknown) {
      showAlert({
        title: 'Không tải được tài khoản',
        message: getErrorMessage(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadAccounts()
  }, [])

  const loadStudentCatalog = async () => {
    setIsCatalogLoading(true)

    try {
      const response = await apiGet<StudentCatalogResponse>('/admin/accounts/student-catalog')
      setDonVis(response.data.don_vis)
    } catch (error: unknown) {
      showAlert({
        title: 'Không tải được danh mục lớp',
        message: getErrorMessage(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    } finally {
      setIsCatalogLoading(false)
    }
  }

  useEffect(() => {
    if (showModal && selectedRole === 'student') {
      void loadStudentCatalog()
    }
  }, [showModal, selectedRole])

  const accountCounts = useMemo(() => {
    return ROLES.reduce<Record<RoleId, number>>((acc, role) => {
      acc[role.id] = accounts.filter((account) => account.role === role.id).length
      return acc
    }, {
      student: 0,
      lecturer: 0,
      training_officer: 0,
      manager: 0,
    })
  }, [accounts])

  const activeRole = ROLES.find((role) => role.id === selectedRole)
  const currentAccounts = selectedRole
    ? accounts.filter((account) => account.role === selectedRole)
    : []
  const selectedDonVi = donVis.find((donVi) => String(donVi.id) === newAccount.donViId)
  const selectedLop = selectedDonVi?.lops.find((lop) => String(lop.id) === newAccount.lopId)
  const selectedNganhDaoTao = selectedDonVi?.nganh_dao_taos.find(
    (nganhDaoTao) => String(nganhDaoTao.id) === newAccount.nganhDaoTaoId,
  )

  const handleCreateAccount = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    if (!selectedRole || !newAccount.username.trim() || !newAccount.fullName.trim()) {
      return
    }

    setIsSaving(true)

    try {
      await apiPost('/admin/accounts', {
        role: selectedRole,
        username: newAccount.username.trim(),
        password: newAccount.password || '123456789',
        name: newAccount.fullName.trim(),
        email: newAccount.email.trim() || null,
        gioi_tinh: selectedRole === 'student' ? newAccount.gioiTinh || null : undefined,
        ngay_sinh: selectedRole === 'student' ? newAccount.ngaySinh || null : undefined,
        don_vi_id: selectedRole === 'student' ? Number(newAccount.donViId) || null : undefined,
        lop_id: selectedRole === 'student' ? Number(newAccount.lopId) || null : undefined,
        nganh_dao_tao_id: selectedRole === 'student' ? Number(newAccount.nganhDaoTaoId) || null : undefined,
        ma_lop: selectedRole === 'student' ? selectedLop?.ma_khoi ?? null : undefined,
        ten_don_vi: selectedRole === 'student' ? selectedDonVi?.ten_don_vi ?? null : undefined,
        ten_nganh_hoc: selectedRole === 'student' ? selectedNganhDaoTao?.ten_nganh ?? null : undefined,
        he_dao_tao: selectedRole === 'student' ? newAccount.heDaoTao || null : undefined,
        so_cccd: selectedRole === 'student' ? newAccount.soCccd.trim() || null : undefined,
        noi_sinh: selectedRole === 'student' ? newAccount.noiSinh.trim() || null : undefined,
        ngay_cap_cccd: selectedRole === 'student' ? newAccount.ngayCapCccd || null : undefined,
        noi_cap_cccd: selectedRole === 'student' ? newAccount.noiCapCccd.trim() || null : undefined,
        ho_khau_tinh_thanh_pho: selectedRole === 'student' ? newAccount.hoKhauTinhThanhPho.trim() || null : undefined,
        ho_khau_quan_huyen: selectedRole === 'student' ? newAccount.hoKhauQuanHuyen.trim() || null : undefined,
        que_quan_tinh_thanh_pho: selectedRole === 'student' ? newAccount.queQuanTinhThanhPho.trim() || null : undefined,
        que_quan_quan_huyen: selectedRole === 'student' ? newAccount.queQuanQuanHuyen.trim() || null : undefined,
        que_quan: selectedRole === 'student' ? newAccount.queQuan.trim() || null : undefined,
        dan_toc: selectedRole === 'student' ? newAccount.danToc.trim() || null : undefined,
        ton_giao: selectedRole === 'student' ? newAccount.tonGiao.trim() || null : undefined,
      })

      showAlert({
        title: 'Thành công',
        message: `Đã tạo tài khoản ${newAccount.username.trim()} thành công.`,
        variant: 'success',
      })

      setShowModal(false)
      setNewAccount(EMPTY_ACCOUNT)
      await loadAccounts()
      setCreatedAccount({
        id: Date.now(),
        username: newAccount.username.trim(),
        role: selectedRole,
        role_name: activeRole?.title ?? null,
        status: true,
        display_name: newAccount.fullName.trim(),
        email: newAccount.email.trim() || null,
      })
    } catch (error: unknown) {
      showAlert({
        title: 'Tạo tài khoản thất bại',
        message: getErrorMessage(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'),
        variant: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleLock = async (account: AdminAccount) => {
    const action = account.status ? 'lock' : 'unlock'

    try {
      await apiPost(`/admin/accounts/${account.id}/${action}`)
      await loadAccounts()
    } catch (error: unknown) {
      showAlert({
        title: 'Cập nhật trạng thái thất bại',
        message: getErrorMessage(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    }
  }

  return (
    <div className="aa-root">
      <div className="aa-header">
        <div>
          <h1 className="aa-title">Quản lý Tài khoản</h1>
          <p className="aa-subtitle">Quản lý danh sách tài khoản và phân quyền người dùng trong hệ thống</p>
        </div>
      </div>

      {!selectedRole && (
        <div className="aa-card-grid">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              className="aa-role-card"
              style={{ '--card-color': role.color } as CSSProperties}
              onClick={() => setSelectedRole(role.id)}
            >
              <div className="aa-role-icon">{role.icon}</div>
              <h3 className="aa-role-title">{role.title}</h3>
              <span className="aa-role-count">
                {isLoading ? 'Đang tải...' : `${accountCounts[role.id]} tài khoản`}
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedRole && activeRole && (
        <div className="aa-list-view">
          <div className="aa-toolbar">
            <button className="aa-btn-back" onClick={() => setSelectedRole(null)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Quay lại danh sách vai trò
            </button>
            <button className="aa-btn-primary" onClick={() => setShowModal(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Tạo tài khoản {activeRole.title.toLowerCase()}
            </button>
          </div>

          <div className="aa-table-container">
            <table className="aa-table">
              <thead>
                <tr>
                  <th>Mã tài khoản</th>
                  <th>Họ và Tên</th>
                  <th>Email</th>
                  <th>Trạng thái</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#718096' }}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#718096' }}>
                      Chưa có tài khoản nào
                    </td>
                  </tr>
                ) : (
                  currentAccounts.map((account) => (
                    <tr key={account.id}>
                      <td style={{ fontWeight: 500 }}>{account.username}</td>
                      <td>{account.display_name || account.username}</td>
                      <td>{account.email || 'Chưa có email'}</td>
                      <td>
                        <span className={`aa-status ${account.status ? 'active' : 'inactive'}`}>
                          {account.status ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="aa-actions">
                          <button
                            className="aa-action-btn"
                            title={account.status ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            onClick={() => void handleToggleLock(account)}
                          >
                            {account.status ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && activeRole && (
        <div className="aa-modal-overlay">
          <div className="aa-modal">
            <div className="aa-modal-header">
              <h2>Tạo tài khoản {activeRole.title} mới</h2>
              <button className="aa-btn-close" onClick={() => setShowModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="aa-form">
              <div className="aa-form-group">
                <label>Mã tài khoản / MSSV *</label>
                <input
                  type="text"
                  className="aa-input"
                  required
                  placeholder="Nhập mã tài khoản..."
                  value={newAccount.username}
                  onChange={(event) => setNewAccount({ ...newAccount, username: event.target.value })}
                />
              </div>
              <div className="aa-form-group">
                <label>Họ và Tên *</label>
                <input
                  type="text"
                  className="aa-input"
                  required
                  placeholder="Nhập họ và tên..."
                  value={newAccount.fullName}
                  onChange={(event) => setNewAccount({ ...newAccount, fullName: event.target.value })}
                />
              </div>
              <div className="aa-form-group">
                <label>Email liên hệ</label>
                <input
                  type="email"
                  className="aa-input"
                  placeholder="Nhập email..."
                  value={newAccount.email}
                  onChange={(event) => setNewAccount({ ...newAccount, email: event.target.value })}
                />
              </div>
              {selectedRole === 'student' && (
                <>
                  <div className="aa-form-note">
                    Các thông tin lý lịch bên dưới do quản trị viên khởi tạo. Sinh viên chỉ được tự cập nhật tôn giáo trong hồ sơ cá nhân.
                  </div>
                  <div className="aa-form-grid">
                    <div className="aa-form-group">
                      <label>Giới tính</label>
                      <select
                        className="aa-input"
                        value={newAccount.gioiTinh}
                        onChange={(event) => setNewAccount({ ...newAccount, gioiTinh: event.target.value })}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div className="aa-form-group">
                      <label>Ngày sinh</label>
                      <input
                        type="date"
                        className="aa-input"
                        value={newAccount.ngaySinh}
                        onChange={(event) => setNewAccount({ ...newAccount, ngaySinh: event.target.value })}
                      />
                    </div>
                    <div className="aa-form-group">
                      <label>Mã đơn vị</label>
                      <select
                        className="aa-input"
                        value={newAccount.donViId}
                        onChange={(event) => {
                          const donVi = donVis.find((item) => String(item.id) === event.target.value)
                          setNewAccount({
                            ...newAccount,
                            donViId: event.target.value,
                            lopId: '',
                            maLop: '',
                            tenDonVi: donVi?.ten_don_vi ?? '',
                            nganhDaoTaoId: '',
                            tenNganhHoc: '',
                          })
                        }}
                        disabled={isCatalogLoading}
                      >
                        <option value="">{isCatalogLoading ? 'Đang tải đơn vị...' : 'Chọn mã đơn vị'}</option>
                        {donVis.map((donVi) => (
                          <option key={donVi.id} value={donVi.id}>
                            {donVi.ma_don_vi} - {donVi.ten_don_vi}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="aa-form-group">
                      <label>Mã lớp</label>
                      <select
                        className="aa-input"
                        value={newAccount.lopId}
                        onChange={(event) => {
                          const lop = selectedDonVi?.lops.find((item) => String(item.id) === event.target.value)
                          setNewAccount({
                            ...newAccount,
                            lopId: event.target.value,
                            maLop: lop?.ma_khoi ?? '',
                          })
                        }}
                        disabled={!newAccount.donViId || isCatalogLoading}
                      >
                        <option value="">
                          {!newAccount.donViId
                            ? 'Chọn đơn vị trước'
                            : selectedDonVi?.lops.length
                              ? 'Chọn mã lớp'
                              : 'Đơn vị này chưa có lớp'}
                        </option>
                        {selectedDonVi?.lops.map((lop) => (
                          <option key={lop.id} value={lop.id}>
                            {lop.ma_khoi} - {lop.lop_hoc_phan}
                          </option>
                        ))}
                      </select>
                      {selectedDonVi && (
                        <span className="aa-field-hint">{selectedDonVi.ten_don_vi}</span>
                      )}
                    </div>
                    <div className="aa-form-group">
                      <label>Tên ngành học</label>
                      <select
                        className="aa-input"
                        value={newAccount.nganhDaoTaoId}
                        onChange={(event) => {
                          const nganhDaoTao = selectedDonVi?.nganh_dao_taos.find(
                            (item) => String(item.id) === event.target.value,
                          )

                          setNewAccount({
                            ...newAccount,
                            nganhDaoTaoId: event.target.value,
                            tenNganhHoc: nganhDaoTao?.ten_nganh ?? '',
                            heDaoTao: nganhDaoTao?.he_dao_tao ?? newAccount.heDaoTao,
                          })
                        }}
                        disabled={!newAccount.donViId || isCatalogLoading}
                      >
                        <option value="">
                          {!newAccount.donViId
                            ? 'Chọn đơn vị trước'
                            : selectedDonVi?.nganh_dao_taos.length
                              ? 'Chọn ngành học'
                              : 'Đơn vị này chưa có ngành'}
                        </option>
                        {selectedDonVi?.nganh_dao_taos.map((nganhDaoTao) => (
                          <option key={nganhDaoTao.id} value={nganhDaoTao.id}>
                            {nganhDaoTao.ma_nganh} - {nganhDaoTao.ten_nganh}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="aa-form-group">
                      <label>Hệ đào tạo</label>
                      <select
                        className="aa-input"
                        value={newAccount.heDaoTao}
                        onChange={(event) => setNewAccount({ ...newAccount, heDaoTao: event.target.value })}
                      >
                        <option value="Đại học Chính quy">Đại học Chính quy</option>
                        <option value="Vừa học vừa làm">Vừa học vừa làm</option>
                        <option value="Đào tạo từ xa">Đào tạo từ xa</option>
                      </select>
                    </div>
                    <div className="aa-form-group">
                      <label>Số CMND/CCCD</label>
                      <input
                        type="text"
                        className="aa-input"
                        value={newAccount.soCccd}
                        onChange={(event) => setNewAccount({ ...newAccount, soCccd: event.target.value })}
                      />
                    </div>
                    <div className="aa-form-group">
                      <label>Nơi sinh</label>
                      <input
                        type="text"
                        className="aa-input"
                        value={newAccount.noiSinh}
                        onChange={(event) => setNewAccount({ ...newAccount, noiSinh: event.target.value })}
                      />
                    </div>
                    <div className="aa-form-group">
                      <label>Ngày cấp CMND/CCCD</label>
                      <input
                        type="date"
                        className="aa-input"
                        value={newAccount.ngayCapCccd}
                        onChange={(event) => setNewAccount({ ...newAccount, ngayCapCccd: event.target.value })}
                      />
                    </div>
                    <div className="aa-form-group">
                      <label>Nơi cấp CMND/CCCD</label>
                      <input
                        type="text"
                        className="aa-input"
                        value={newAccount.noiCapCccd}
                        onChange={(event) => setNewAccount({ ...newAccount, noiCapCccd: event.target.value })}
                      />
                    </div>
                    <div className="aa-form-group">
                      <label>Hộ khẩu tỉnh/thành phố</label>
                      <input
                        type="text"
                        className="aa-input"
                        value={newAccount.hoKhauTinhThanhPho}
                        onChange={(event) => setNewAccount({ ...newAccount, hoKhauTinhThanhPho: event.target.value })}
                      />
                    </div>
                    <div className="aa-form-group">
                      <label>Hộ khẩu quận/huyện</label>
                      <input
                        type="text"
                        className="aa-input"
                        value={newAccount.hoKhauQuanHuyen}
                        onChange={(event) => setNewAccount({ ...newAccount, hoKhauQuanHuyen: event.target.value })}
                      />
                    </div>
                    <div className="aa-form-group">
                      <label>Tỉnh/thành phố quê quán</label>
                      <input
                        type="text"
                        className="aa-input"
                        value={newAccount.queQuanTinhThanhPho}
                        onChange={(event) => setNewAccount({ ...newAccount, queQuanTinhThanhPho: event.target.value })}
                      />
                    </div>
                    <div className="aa-form-group">
                      <label>Quận/huyện quê quán</label>
                      <input
                        type="text"
                        className="aa-input"
                        value={newAccount.queQuanQuanHuyen}
                        onChange={(event) => setNewAccount({ ...newAccount, queQuanQuanHuyen: event.target.value })}
                      />
                    </div>
                    <div className="aa-form-group aa-form-group-wide">
                      <label>Quê quán</label>
                      <input
                        type="text"
                        className="aa-input"
                        placeholder="Địa chỉ quê quán chi tiết"
                        value={newAccount.queQuan}
                        onChange={(event) => setNewAccount({ ...newAccount, queQuan: event.target.value })}
                      />
                    </div>
                    <div className="aa-form-group">
                      <label>Dân tộc</label>
                      <input
                        type="text"
                        className="aa-input"
                        placeholder="VD: Kinh"
                        value={newAccount.danToc}
                        onChange={(event) => setNewAccount({ ...newAccount, danToc: event.target.value })}
                      />
                    </div>
                    <div className="aa-form-group">
                      <label>Tôn giáo</label>
                      <input
                        type="text"
                        className="aa-input"
                        placeholder="VD: Không, Phật giáo..."
                        value={newAccount.tonGiao}
                        onChange={(event) => setNewAccount({ ...newAccount, tonGiao: event.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="aa-form-group">
                <label>Mật khẩu mặc định</label>
                <input
                  type="text"
                  className="aa-input"
                  value={newAccount.password}
                  onChange={(event) => setNewAccount({ ...newAccount, password: event.target.value })}
                />
              </div>
            </form>

            <div className="aa-form-actions">
              <button className="aa-btn-cancel" onClick={() => setShowModal(false)}>
                Hủy bỏ
              </button>
              <button className="aa-btn-primary" onClick={() => void handleCreateAccount()} disabled={isSaving}>
                {isSaving ? 'Đang lưu...' : 'Lưu tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {createdAccount && (
        <div className="aa-modal-overlay">
          <div className="aa-modal aa-success-modal">
            <div className="aa-modal-header">
              <h2>Tạo tài khoản thành công</h2>
              <button className="aa-btn-close" onClick={() => setCreatedAccount(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="aa-success-body">
              <div className="aa-success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <p>
                Tài khoản <strong>{createdAccount.username}</strong> đã được tạo cho <strong>{createdAccount.display_name}</strong>.
              </p>
              <p className="aa-success-muted">Mật khẩu mặc định: 123456789</p>
            </div>
            <div className="aa-form-actions">
              <button className="aa-btn-primary" onClick={() => setCreatedAccount(null)}>
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
