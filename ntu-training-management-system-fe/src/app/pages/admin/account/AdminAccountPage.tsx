import { useCallback, useEffect, useMemo, useState } from 'react'
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

interface DanTocOption {
  id: number
  ten_dan_toc: string
  thu_tu: number
}

interface TonGiaoOption {
  id: number
  ten_ton_giao: string
  thu_tu: number
}

interface Province {
  id: number
  name: string
  code: string | null
}

interface District {
  id: number
  province_id: number
  name: string
  code: string | null
}

interface ProvinceResponse {
  data: Province[]
}

interface DistrictResponse {
  data: District[]
}

interface StudentCatalogResponse {
  data: {
    don_vis: DonViOption[]
    dan_tocs: DanTocOption[]
    ton_giaos: TonGiaoOption[]
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
  hoKhauTinhThanhPhoId: string
  hoKhauQuanHuyenId: string
  queQuanTinhThanhPhoId: string
  queQuanQuanHuyenId: string
  hoKhauTinhThanhPho: string
  hoKhauQuanHuyen: string
  queQuanTinhThanhPho: string
  queQuanQuanHuyen: string
  queQuan: string
  danToc: string
  tonGiao: string
}

interface AccountFormErrors {
  username?: string
  fullName?: string
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
  hoKhauTinhThanhPhoId: '',
  hoKhauQuanHuyenId: '',
  queQuanTinhThanhPhoId: '',
  queQuanQuanHuyenId: '',
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

const formatProvinceOption = (province: Province): string => {
  return province.code ? `${province.code} - ${province.name}` : province.name
}

const STUDENT_CODE_REGEX = /^\d{8}$/
const PERSON_NAME_REGEX = /^[\p{L}\s]+$/u
const NTU_EMAIL_DOMAIN = '@ntu.edu.vn'

const sanitizeStudentCode = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 8)
}

const sanitizePersonName = (value: string): string => {
  return value.replace(/[^\p{L}\s]/gu, '').replace(/\s{2,}/g, ' ')
}

const normalizePersonName = (value: string): string => {
  return sanitizePersonName(value)
    .trim()
    .split(/\s+/)
    .map((word) => {
      const lowerWord = word.toLocaleLowerCase('vi-VN')

      return lowerWord.charAt(0).toLocaleUpperCase('vi-VN') + lowerWord.slice(1)
    })
    .join(' ')
}

const getEmailLocalPart = (value: string): string => {
  return value.replace(NTU_EMAIL_DOMAIN, '').split('@')[0] ?? ''
}

const normalizeNtuEmail = (value: string): string => {
  const localPart = getEmailLocalPart(value).trim()

  return localPart ? `${localPart}${NTU_EMAIL_DOMAIN}` : ''
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
  const [formErrors, setFormErrors] = useState<AccountFormErrors>({})
  const [donVis, setDonVis] = useState<DonViOption[]>([])
  const [danTocs, setDanTocs] = useState<DanTocOption[]>([])
  const [tonGiaos, setTonGiaos] = useState<TonGiaoOption[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [hoKhauDistricts, setHoKhauDistricts] = useState<District[]>([])
  const [queQuanDistricts, setQueQuanDistricts] = useState<District[]>([])
  const [isProvincesLoading, setIsProvincesLoading] = useState(false)

  const loadAccounts = useCallback(async () => {
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
  }, [showAlert])

  useEffect(() => {
    void loadAccounts()
  }, [loadAccounts])

  const loadStudentCatalog = useCallback(async () => {
    setIsCatalogLoading(true)

    try {
      const response = await apiGet<StudentCatalogResponse>('/admin/accounts/student-catalog')
      setDonVis(response.data.don_vis)
      setDanTocs(response.data.dan_tocs)
      setTonGiaos(response.data.ton_giaos)
    } catch (error: unknown) {
      showAlert({
        title: 'Không tải được danh mục sinh viên',
        message: getErrorMessage(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    } finally {
      setIsCatalogLoading(false)
    }
  }, [showAlert])

  const loadProvinces = useCallback(async () => {
    setIsProvincesLoading(true)
    try {
      const response = await apiGet<ProvinceResponse>('/provinces')
      setProvinces(response.data)
    } catch (error: unknown) {
      showAlert({
        title: 'Không tải được danh sách tỉnh thành',
        message: getErrorMessage(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    } finally {
      setIsProvincesLoading(false)
    }
  }, [showAlert])

  const loadDistrictsByProvince = useCallback(
    async (province: Province, type: 'hokhau' | 'quequan') => {
      if (type === 'hokhau') {
        setHoKhauDistricts([])
      } else {
        setQueQuanDistricts([])
      }

      try {
        const response = await apiGet<DistrictResponse>('/districts', {
          params: {
            province_id: String(province.id),
            province_code: province.code ?? '',
            province_name: province.name,
          },
        })
        if (type === 'hokhau') {
          setHoKhauDistricts(response.data)
        } else {
          setQueQuanDistricts(response.data)
        }
      } catch (error: unknown) {
        showAlert({
          title: 'Không tải được danh sách xã/phường/đặc khu',
          message: getErrorMessage(error, 'Vui lòng thử lại sau.'),
          variant: 'error',
        })
      }
    },
    [showAlert],
  )

  useEffect(() => {
    if (showModal && selectedRole === 'student') {
      void loadStudentCatalog()
      void loadProvinces()
    }
  }, [loadStudentCatalog, loadProvinces, showModal, selectedRole])

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

  const validateAccountForm = (account: NewAccountState): AccountFormErrors => {
    const errors: AccountFormErrors = {}
    const fullName = account.fullName.trim()

    if (selectedRole === 'student' && !STUDENT_CODE_REGEX.test(account.username)) {
      errors.username = 'MSSV phải gồm đúng 8 chữ số.'
    }

    if (!fullName) {
      errors.fullName = 'Vui lòng nhập họ và tên.'
    } else if (!PERSON_NAME_REGEX.test(fullName)) {
      errors.fullName = 'Họ và tên chỉ được gồm chữ cái và khoảng trắng.'
    }

    return errors
  }

  const getStudentCodeError = (value: string): string | undefined => {
    if (selectedRole !== 'student' || value.length === 0 || value.length === 8) {
      return undefined
    }

    return 'MSSV phải gồm đúng 8 chữ số.'
  }

  const handleCreateAccount = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    if (!selectedRole) {
      return
    }

    const normalizedAccount = {
      ...newAccount,
      username: selectedRole === 'student' ? sanitizeStudentCode(newAccount.username) : newAccount.username.trim(),
      fullName: normalizePersonName(newAccount.fullName),
      email: normalizeNtuEmail(newAccount.email),
    }
    const errors = validateAccountForm(normalizedAccount)
    setNewAccount(normalizedAccount)
    setFormErrors(errors)

    if (Object.keys(errors).length > 0) {
      showAlert({
        title: 'Dữ liệu chưa hợp lệ',
        message: Object.values(errors)[0] ?? 'Vui lòng kiểm tra lại thông tin.',
        variant: 'error',
      })

      return
    }

    setIsSaving(true)

    try {
      await apiPost('/admin/accounts', {
        role: selectedRole,
        username: normalizedAccount.username,
        password: normalizedAccount.password || '123456789',
        name: normalizedAccount.fullName,
        email: normalizedAccount.email || null,
        gioi_tinh: selectedRole === 'student' ? normalizedAccount.gioiTinh || null : undefined,
        ngay_sinh: selectedRole === 'student' ? normalizedAccount.ngaySinh || null : undefined,
        don_vi_id: selectedRole === 'student' ? Number(normalizedAccount.donViId) || null : undefined,
        lop_id: selectedRole === 'student' ? Number(normalizedAccount.lopId) || null : undefined,
        nganh_dao_tao_id: selectedRole === 'student' ? Number(normalizedAccount.nganhDaoTaoId) || null : undefined,
        ma_lop: selectedRole === 'student' ? selectedLop?.ma_khoi ?? null : undefined,
        ten_don_vi: selectedRole === 'student' ? selectedDonVi?.ten_don_vi ?? null : undefined,
        ten_nganh_hoc: selectedRole === 'student' ? selectedNganhDaoTao?.ten_nganh ?? null : undefined,
        he_dao_tao: selectedRole === 'student' ? normalizedAccount.heDaoTao || null : undefined,
        so_cccd: selectedRole === 'student' ? normalizedAccount.soCccd.trim() || null : undefined,
        noi_sinh: selectedRole === 'student' ? normalizedAccount.noiSinh.trim() || null : undefined,
        ngay_cap_cccd: selectedRole === 'student' ? normalizedAccount.ngayCapCccd || null : undefined,
        noi_cap_cccd: selectedRole === 'student' ? normalizedAccount.noiCapCccd.trim() || null : undefined,
        ho_khau_tinh_thanh_pho: selectedRole === 'student' ? normalizedAccount.hoKhauTinhThanhPho.trim() || null : undefined,
        ho_khau_quan_huyen: selectedRole === 'student' ? normalizedAccount.hoKhauQuanHuyen.trim() || null : undefined,
        que_quan_tinh_thanh_pho: selectedRole === 'student' ? normalizedAccount.queQuanTinhThanhPho.trim() || null : undefined,
        que_quan_quan_huyen: selectedRole === 'student' ? normalizedAccount.queQuanQuanHuyen.trim() || null : undefined,
        que_quan: selectedRole === 'student' ? normalizedAccount.queQuan.trim() || null : undefined,
        dan_toc: selectedRole === 'student' ? normalizedAccount.danToc.trim() || null : undefined,
        ton_giao: selectedRole === 'student' ? normalizedAccount.tonGiao.trim() || null : undefined,
      })

      showAlert({
        title: 'Thành công',
        message: `Đã tạo tài khoản ${normalizedAccount.username} thành công.`,
        variant: 'success',
      })

      setShowModal(false)
      setNewAccount(EMPTY_ACCOUNT)
      setFormErrors({})
      await loadAccounts()
      setCreatedAccount({
        id: Date.now(),
        username: normalizedAccount.username,
        role: selectedRole,
        role_name: activeRole?.title ?? null,
        status: true,
        display_name: normalizedAccount.fullName,
        email: normalizedAccount.email.trim() || null,
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
                  inputMode={selectedRole === 'student' ? 'numeric' : undefined}
                  maxLength={selectedRole === 'student' ? 8 : undefined}
                  pattern={selectedRole === 'student' ? '\\d{8}' : undefined}
                  placeholder={selectedRole === 'student' ? 'Nhập đúng 8 chữ số...' : 'Nhập mã tài khoản...'}
                  value={newAccount.username}
                  onChange={(event) => {
                    const username = selectedRole === 'student'
                      ? sanitizeStudentCode(event.target.value)
                      : event.target.value

                    setNewAccount({ ...newAccount, username })
                    setFormErrors({ ...formErrors, username: getStudentCodeError(username) })
                  }}
                />
                {formErrors.username && <span className="aa-field-error">{formErrors.username}</span>}
              </div>
              <div className="aa-form-group">
                <label>Họ và Tên *</label>
                <input
                  type="text"
                  className="aa-input"
                  required
                  placeholder="Nhập họ và tên..."
                  value={newAccount.fullName}
                  onChange={(event) => {
                    setNewAccount({ ...newAccount, fullName: sanitizePersonName(event.target.value) })
                    setFormErrors({ ...formErrors, fullName: undefined })
                  }}
                  onBlur={() => setNewAccount({
                    ...newAccount,
                    fullName: normalizePersonName(newAccount.fullName),
                  })}
                />
                {formErrors.fullName && <span className="aa-field-error">{formErrors.fullName}</span>}
              </div>
              <div className="aa-form-group">
                <label>Email liên hệ</label>
                <div className="aa-email-input">
                  <input
                    type="text"
                    className="aa-input aa-email-local"
                    placeholder="Nhập email..."
                    value={getEmailLocalPart(newAccount.email)}
                    onChange={(event) => {
                      const localPart = getEmailLocalPart(event.target.value)
                      setNewAccount({
                        ...newAccount,
                        email: localPart ? `${localPart}${NTU_EMAIL_DOMAIN}` : '',
                      })
                    }}
                  />
                  <span>{NTU_EMAIL_DOMAIN}</span>
                </div>
              </div>
              {selectedRole === 'student' && (
                <>
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
                      <select
                        className="aa-input"
                        value={newAccount.noiSinh}
                        onChange={(event) => setNewAccount({ ...newAccount, noiSinh: event.target.value })}
                        disabled={isProvincesLoading}
                      >
                        <option value="">
                          {isProvincesLoading ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                        </option>
                        {provinces.map((province) => (
                          <option key={province.id} value={province.name}>
                            {formatProvinceOption(province)}
                          </option>
                        ))}
                      </select>
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
                      <select
                        className="aa-input"
                        value={newAccount.hoKhauTinhThanhPhoId}
                        onChange={(event) => {
                          const selectedProvince = provinces.find((p) => String(p.id) === event.target.value)
                          setNewAccount({
                            ...newAccount,
                            hoKhauTinhThanhPhoId: event.target.value,
                            hoKhauTinhThanhPho: selectedProvince?.name || '',
                            hoKhauQuanHuyenId: '',
                            hoKhauQuanHuyen: '',
                          })
                          if (selectedProvince) {
                            void loadDistrictsByProvince(selectedProvince, 'hokhau')
                          } else {
                            setHoKhauDistricts([])
                          }
                        }}
                        disabled={isProvincesLoading}
                      >
                        <option value="">
                          {isProvincesLoading ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                        </option>
                        {provinces.map((province) => (
                          <option key={province.id} value={province.id}>
                            {formatProvinceOption(province)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="aa-form-group">
                      <label>Hộ khẩu xã/phường/đặc khu</label>
                      <select
                        className="aa-input"
                        value={newAccount.hoKhauQuanHuyenId}
                        onChange={(event) => {
                          setNewAccount({
                            ...newAccount,
                            hoKhauQuanHuyenId: event.target.value,
                            hoKhauQuanHuyen: hoKhauDistricts.find((d) => String(d.id) === event.target.value)?.name || '',
                          })
                        }}
                        disabled={!newAccount.hoKhauTinhThanhPhoId || hoKhauDistricts.length === 0}
                      >
                        <option value="">
                          {!newAccount.hoKhauTinhThanhPhoId
                            ? 'Chọn tỉnh/thành phố trước'
                            : hoKhauDistricts.length === 0
                              ? 'Chưa có xã/phường/đặc khu'
                              : 'Chọn xã/phường/đặc khu'}
                        </option>
                        {hoKhauDistricts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="aa-form-group">
                      <label>Tỉnh/thành phố quê quán</label>
                      <select
                        className="aa-input"
                        value={newAccount.queQuanTinhThanhPhoId}
                        onChange={(event) => {
                          const selectedProvince = provinces.find((p) => String(p.id) === event.target.value)
                          setNewAccount({
                            ...newAccount,
                            queQuanTinhThanhPhoId: event.target.value,
                            queQuanTinhThanhPho: selectedProvince?.name || '',
                            queQuanQuanHuyenId: '',
                            queQuanQuanHuyen: '',
                          })
                          if (selectedProvince) {
                            void loadDistrictsByProvince(selectedProvince, 'quequan')
                          } else {
                            setQueQuanDistricts([])
                          }
                        }}
                        disabled={isProvincesLoading}
                      >
                        <option value="">
                          {isProvincesLoading ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                        </option>
                        {provinces.map((province) => (
                          <option key={province.id} value={province.id}>
                            {formatProvinceOption(province)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="aa-form-group">
                      <label>Xã/phường/đặc khu quê quán</label>
                      <select
                        className="aa-input"
                        value={newAccount.queQuanQuanHuyenId}
                        onChange={(event) => {
                          setNewAccount({
                            ...newAccount,
                            queQuanQuanHuyenId: event.target.value,
                            queQuanQuanHuyen: queQuanDistricts.find((d) => String(d.id) === event.target.value)?.name || '',
                          })
                        }}
                        disabled={!newAccount.queQuanTinhThanhPhoId || queQuanDistricts.length === 0}
                      >
                        <option value="">
                          {!newAccount.queQuanTinhThanhPhoId
                            ? 'Chọn tỉnh/thành phố trước'
                            : queQuanDistricts.length === 0
                              ? 'Chưa có xã/phường/đặc khu'
                              : 'Chọn xã/phường/đặc khu'}
                        </option>
                        {queQuanDistricts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
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
                      <select
                        className="aa-input"
                        value={newAccount.danToc}
                        onChange={(event) => setNewAccount({ ...newAccount, danToc: event.target.value })}
                        disabled={isCatalogLoading}
                      >
                        <option value="">
                          {isCatalogLoading ? 'Đang tải dân tộc...' : 'Chọn dân tộc'}
                        </option>
                        {danTocs.map((danToc) => (
                          <option key={danToc.id} value={danToc.ten_dan_toc}>
                            {danToc.ten_dan_toc}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="aa-form-group">
                      <label>Tôn giáo</label>
                      <select
                        className="aa-input"
                        value={newAccount.tonGiao}
                        onChange={(event) => setNewAccount({ ...newAccount, tonGiao: event.target.value })}
                        disabled={isCatalogLoading}
                      >
                        <option value="">
                          {isCatalogLoading ? 'Đang tải tôn giáo...' : 'Chọn tôn giáo'}
                        </option>
                        {tonGiaos.map((tonGiao) => (
                          <option key={tonGiao.id} value={tonGiao.ten_ton_giao}>
                            {tonGiao.ten_ton_giao}
                          </option>
                        ))}
                      </select>
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
                  disabled
                  readOnly
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
