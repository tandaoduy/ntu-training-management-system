import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties, FormEvent, ReactNode } from 'react'

import { apiDelete, apiGet, apiPost, apiPut } from '../../../../api/core/request'
import { useAlert } from '@/components/alert'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/button'
import { DatePicker } from '@/components/date-picker'
import { Input } from '@/components/input'
import { useModal } from '@/components/modal'
import { Pagination, getPageSizeNumber } from '@/components/pagination'
import { Select } from '@/components/select'
import { isFourDigitYearDate } from '@/utils/dateInput'
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
  profile?: {
    don_vi_id?: number | null
    ten_giang_vien?: string | null
    email?: string | null
    so_dien_thoai?: string | null
  } | null
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
  thoi_gian_dao_tao: number | string
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

interface DonVisResponse {
  data: Array<Pick<DonViOption, 'id' | 'ma_don_vi' | 'ten_don_vi' | 'loai_don_vi'>>
}

interface NewAccountState {
  username: string
  fullName: string
  email: string
  phone: string
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
  namNhapHoc: string
  khoaHoc: string
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
  diaChiLienLac: string
  danToc: string
  tonGiao: string
}

interface AccountFormErrors {
  username?: string
  fullName?: string
  email?: string
  phone?: string
  donViId?: string
  soCccd?: string
  namNhapHoc?: string
  ngaySinh?: string
  ngayCapCccd?: string
}

const EMPTY_ACCOUNT: NewAccountState = {
  username: '',
  fullName: '',
  email: '',
  phone: '',
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
  namNhapHoc: '',
  khoaHoc: '',
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
  diaChiLienLac: '',
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
    title: 'Chuyên viên phòng đào tạo',
    color: '#38b2ac',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11h6"/><path d="M19 8v6"/></svg>
    ),
  },
  {
    id: 'manager',
    title: 'Quản lý đơn vị',
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
const LECTURER_CODE_REGEX = /^\d{7}$/
const CCCD_REGEX = /^\d{12}$/
const ADMISSION_YEAR_REGEX = /^\d{4}$/
const MIN_ADMISSION_YEAR = 2023
const PERSON_NAME_REGEX = /^[\p{L}\p{M}\s]+$/u
const NTU_EMAIL_DOMAIN = '@ntu.edu.vn'
const sanitizeStudentCode = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 8)
}

const sanitizeLecturerCode = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 7)
}

const sanitizePhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 10)
}

const sanitizeCccd = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 12)
}

const sanitizeAdmissionYear = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 4)
}

const getTrainingDuration = (nganhDaoTao?: NganhDaoTaoOption): number => {
  if (/(MP|HV)$/u.test(nganhDaoTao?.ma_nganh ?? '')) {
    return 4.5
  }

  return Number(nganhDaoTao?.thoi_gian_dao_tao) || 4
}

const getAcademicCohort = (value: string, trainingDuration = 4): string => {
  const year = Number(value)

  return ADMISSION_YEAR_REGEX.test(value) && year >= MIN_ADMISSION_YEAR
    ? `${year}-${year + Math.ceil(trainingDuration)}`
    : ''
}

const sanitizePersonName = (value: string): string => {
  return value.replace(/[^\p{L}\p{M}\s]/gu, '').replace(/\s{2,}/g, ' ').normalize('NFC')
}

const sanitizeLettersOnly = (value: string): string => {
  return value.replace(/[^\p{L}\p{M}\s]/gu, '').replace(/\s{2,}/g, ' ').normalize('NFC')
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

const getPersonNameError = (value: string): string | undefined => {
  const fullName = value.trim()

  if (!fullName) {
    return 'Vui lòng nhập họ và tên.'
  }

  if (!PERSON_NAME_REGEX.test(fullName)) {
    return 'Họ và tên chỉ được gồm chữ cái và khoảng trắng.'
  }

  return undefined
}

const getPhoneError = (value: string): string | undefined => {
  if (!value || value.length === 10) {
    return undefined
  }

  return 'Số điện thoại phải gồm đúng 10 chữ số.'
}

const getEmailLocalPart = (value: string): string => {
  return value.replace(NTU_EMAIL_DOMAIN, '').split('@')[0] ?? ''
}

const normalizeNtuEmail = (value: string): string => {
  const localPart = getEmailLocalPart(value).trim()

  return localPart ? `${localPart}${NTU_EMAIL_DOMAIN}` : ''
}

const removeVietnameseMarks = (value: string): string => {
  return value
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const generateNtuEmailFromName = (value: string): string => {
  const words = normalizePersonName(value)
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return ''
  }

  const asciiWords = words.map((word) => removeVietnameseMarks(word).toLocaleLowerCase('vi-VN'))
  const lastNamePart = asciiWords.at(-1) ?? ''
  const initialPart = asciiWords
    .slice(0, -1)
    .map((word) => word.charAt(0))
    .join('')
  const localPart = `${lastNamePart}${initialPart}`.replace(/[^a-z0-9]/g, '')

  return localPart ? `${localPart}${NTU_EMAIL_DOMAIN}` : ''
}

const getClassBlockCode = (className: string): string => {
  const normalizedClassName = removeVietnameseMarks(className).toLocaleLowerCase('vi-VN')
  const match = normalizedClassName.match(/(\d+)\s*\.\s*([a-z0-9]+)/u)

  if (match) {
    return `${match[1]}${match[2]}`.replace(/[^a-z0-9]/g, '')
  }

  return normalizedClassName.split('-')[0]?.replace(/[^a-z0-9]/g, '') ?? ''
}

const buildStudentEmailLocalPart = (fullName: string, className: string, expandedLetters = 1): string => {
  const words = normalizePersonName(fullName)
    .split(/\s+/)
    .filter(Boolean)
  const classBlockCode = getClassBlockCode(className)

  if (words.length === 0 || !classBlockCode) {
    return ''
  }

  const asciiWords = words.map((word) => removeVietnameseMarks(word).toLocaleLowerCase('vi-VN'))
  const givenName = asciiWords.at(-1) ?? ''
  const prefixWords = asciiWords.slice(0, -1)
  const lastMiddleIndex = Math.max(0, prefixWords.length - 1)
  const nameInitials = prefixWords
    .map((word, index) => {
      const length = index === lastMiddleIndex ? expandedLetters : 1

      return word.slice(0, Math.max(1, length))
    })
    .join('')
  const localPart = [givenName, nameInitials, classBlockCode]
    .filter(Boolean)
    .join('.')
    .replace(/[^a-z0-9.]/g, '')

  return localPart
}

const shouldAutoGenerateEmail = (role: RoleId | null): boolean => {
  return role === 'lecturer' || role === 'training_officer'
}

export default function AdminAccountPage() {
  const { showAlert } = useAlert()
  const { open: openModal, close: closeModal } = useModal()
  const [selectedRole, setSelectedRole] = useState<RoleId | null>(null)
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingAccountId, setDeletingAccountId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AdminAccount | null>(null)
  const [createdAccount, setCreatedAccount] = useState<AdminAccount | null>(null)
  const [newAccount, setNewAccount] = useState<NewAccountState>(EMPTY_ACCOUNT)
  const [accountSearch, setAccountSearch] = useState('')
  const [unitFilter, setUnitFilter] = useState('')
  const [accountPage, setAccountPage] = useState(1)
  const [accountPageSize, setAccountPageSize] = useState('10')
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

  useEffect(() => {
    setAccountSearch('')
    setUnitFilter('')
    setAccountPage(1)
  }, [selectedRole])

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

  const loadDonVis = useCallback(async () => {
    setIsCatalogLoading(true)

    try {
      const response = await apiGet<DonVisResponse>('/admin/don-vis')
      setDonVis(response.data.map((donVi) => ({
        ...donVi,
        lops: [],
        nganh_dao_taos: [],
      })))
    } catch (error: unknown) {
      showAlert({
        title: 'Không tải được danh sách đơn vị',
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

  useEffect(() => {
    if (showModal && selectedRole && selectedRole !== 'student') {
      void loadDonVis()
    }
  }, [loadDonVis, showModal, selectedRole])

  useEffect(() => {
    if (selectedRole) {
      void loadDonVis()
    }
  }, [loadDonVis, selectedRole])

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
  const getAccountUnit = useCallback(
    (account: AdminAccount) => {
      return donVis.find((donVi) => donVi.id === account.profile?.don_vi_id)
    },
    [donVis],
  )

  const currentAccounts = useMemo(() => {
    if (!selectedRole) {
      return []
    }

    let roleAccounts = accounts.filter((account) => account.role === selectedRole)
    const keyword = accountSearch.trim().toLowerCase()

    roleAccounts = roleAccounts
      .filter((account) => {
        const unitId = account.profile?.don_vi_id
        const unit = getAccountUnit(account)

        if (unitFilter && String(unitId ?? '') !== unitFilter) {
          return false
        }

        if (!keyword) {
          return true
        }

        return [
          account.username,
          account.display_name ?? '',
          account.email ?? '',
          unit?.ten_don_vi ?? '',
          unit?.ma_don_vi ?? '',
        ].some((value) => value.toLowerCase().includes(keyword))
      })
      .sort((a, b) => a.username.localeCompare(b.username, 'vi', { numeric: true }))

    return roleAccounts
  }, [accountSearch, accounts, getAccountUnit, selectedRole, unitFilter])

  const accountPageSizeNumber = getPageSizeNumber(accountPageSize, currentAccounts.length)
  const totalAccountPages = accountPageSize === 'all'
    ? 1
    : Math.max(1, Math.ceil(currentAccounts.length / accountPageSizeNumber))
  const paginatedAccounts = useMemo(() => {
    const safePage = Math.min(accountPage, totalAccountPages)
    const startIndex = (safePage - 1) * accountPageSizeNumber

    return accountPageSize === 'all'
      ? currentAccounts
      : currentAccounts.slice(startIndex, startIndex + accountPageSizeNumber)
  }, [accountPage, accountPageSize, accountPageSizeNumber, currentAccounts, totalAccountPages])

  useEffect(() => {
    setAccountPage(1)
  }, [accountPageSize, accountSearch, unitFilter])

  useEffect(() => {
    if (accountPage > totalAccountPages) {
      setAccountPage(totalAccountPages)
    }
  }, [accountPage, totalAccountPages])

  const tableColumnCount = selectedRole === 'lecturer' ? 6 : 5
  const selectedDonVi = donVis.find((donVi) => String(donVi.id) === newAccount.donViId)
  const selectedLop = selectedDonVi?.lops.find((lop) => String(lop.id) === newAccount.lopId)
  const selectedNganhDaoTao = selectedDonVi?.nganh_dao_taos.find(
    (nganhDaoTao) => String(nganhDaoTao.id) === newAccount.nganhDaoTaoId,
  )
  const selectedTrainingDuration = getTrainingDuration(selectedNganhDaoTao)

  const findAccountByUsername = (username: string, exceptId?: number): AdminAccount | undefined => {
    const normalizedUsername = username.trim().toLowerCase()

    return accounts.find((account) =>
      account.id !== exceptId && account.username.trim().toLowerCase() === normalizedUsername,
    )
  }

  const findAccountByEmail = (email: string, exceptId?: number): AdminAccount | undefined => {
    const normalizedEmail = normalizeNtuEmail(email).trim().toLowerCase()

    if (!normalizedEmail) {
      return undefined
    }

    return accounts.find((account) =>
      account.id !== exceptId && (account.email ?? '').trim().toLowerCase() === normalizedEmail,
    )
  }

  const generateUniqueStudentEmail = (fullName: string, className: string, exceptId?: number): string => {
    const words = normalizePersonName(fullName).split(/\s+/).filter(Boolean)
    const lastMiddleNameLength = words.length > 1
      ? removeVietnameseMarks(words.at(-2) ?? '').replace(/[^a-z0-9]/gi, '').length
      : 1

    for (let expandedLetters = 1; expandedLetters <= Math.max(1, lastMiddleNameLength); expandedLetters += 1) {
      const localPart = buildStudentEmailLocalPart(fullName, className, expandedLetters)
      const email = localPart ? `${localPart}${NTU_EMAIL_DOMAIN}` : ''

      if (email && !findAccountByEmail(email, exceptId)) {
        return email
      }
    }

    const baseLocalPart = buildStudentEmailLocalPart(fullName, className, Math.max(1, lastMiddleNameLength))
    if (!baseLocalPart) {
      return ''
    }

    for (let suffix = 2; suffix < 1000; suffix += 1) {
      const email = `${baseLocalPart}${suffix}${NTU_EMAIL_DOMAIN}`

      if (!findAccountByEmail(email, exceptId)) {
        return email
      }
    }

    return `${baseLocalPart}${Date.now()}${NTU_EMAIL_DOMAIN}`
  }

  const generateAutoEmailForForm = (role: RoleId | null, fullName: string, className = '', exceptId?: number): string => {
    if (role === 'student') {
      return generateUniqueStudentEmail(fullName, className, exceptId)
    }

    return shouldAutoGenerateEmail(role) ? generateNtuEmailFromName(fullName) : ''
  }

  const validateAccountForm = (account: NewAccountState): AccountFormErrors => {
    const errors: AccountFormErrors = {}
    const fullName = account.fullName.trim()

    if (selectedRole === 'student' && !STUDENT_CODE_REGEX.test(account.username)) {
      errors.username = 'MSSV phải gồm đúng 8 chữ số.'
    }

    if (selectedRole === 'lecturer' && !LECTURER_CODE_REGEX.test(account.username)) {
      errors.username = 'Mã giảng viên phải gồm đúng 7 chữ số.'
    }

    if (selectedRole && selectedRole !== 'student' && !account.donViId) {
      errors.donViId = 'Vui lòng chọn đơn vị.'
    }

    if (findAccountByUsername(account.username)) {
      errors.username = 'Mã tài khoản này đã tồn tại ở một vai trò khác.'
    }

    if (selectedRole !== 'manager' && findAccountByEmail(account.email)) {
      errors.email = 'Email này đã được sử dụng ở một tài khoản khác.'
    }

    if (selectedRole === 'lecturer') {
      const phoneError = getPhoneError(account.phone)

      if (phoneError) {
        errors.phone = phoneError
      }
    }

    if (selectedRole === 'student' && !CCCD_REGEX.test(account.soCccd)) {
      errors.soCccd = 'Số CCCD phải gồm đúng 12 chữ số.'
    }

    if (selectedRole === 'student') {
      const admissionYear = Number(account.namNhapHoc)

      if (!ADMISSION_YEAR_REGEX.test(account.namNhapHoc) || admissionYear < MIN_ADMISSION_YEAR) {
        errors.namNhapHoc = `Năm nhập học phải từ ${MIN_ADMISSION_YEAR} trở đi.`
      }

      if (account.ngaySinh && !isFourDigitYearDate(account.ngaySinh)) {
        errors.ngaySinh = 'Năm trong ngày sinh chỉ được nhập đúng 4 chữ số.'
      }

      if (account.ngayCapCccd && !isFourDigitYearDate(account.ngayCapCccd)) {
        errors.ngayCapCccd = 'Năm trong ngày cấp CCCD chỉ được nhập đúng 4 chữ số.'
      }
    }

    const fullNameError = getPersonNameError(fullName)

    if (fullNameError) {
      errors.fullName = fullNameError
    }

    return errors
  }

  const getStudentCodeError = (value: string): string | undefined => {
    if (selectedRole !== 'student' || value.length === 0 || value.length === 8) {
      return undefined
    }

    return 'MSSV phải gồm đúng 8 chữ số.'
  }

  const getUsernameError = (value: string): string | undefined => {
    if (value.trim() && findAccountByUsername(value)) {
      return 'Mã tài khoản này đã tồn tại ở một vai trò khác.'
    }

    if (selectedRole === 'student') {
      return getStudentCodeError(value)
    }

    if (selectedRole === 'lecturer' && value.length > 0 && value.length !== 7) {
      return 'Mã giảng viên phải gồm đúng 7 chữ số.'
    }

    return undefined
  }

  const getCccdError = (value: string): string | undefined => {
    if (selectedRole !== 'student' || value.length === 0 || value.length === 12) {
      return undefined
    }

    return 'Số CCCD phải gồm đúng 12 chữ số.'
  }

  const getAdmissionYearError = (value: string): string | undefined => {
    if (selectedRole !== 'student' || value.length === 0) {
      return undefined
    }

    if (value.length < 4) {
      return 'Năm nhập học phải gồm đúng 4 chữ số.'
    }

    return Number(value) < MIN_ADMISSION_YEAR ? `Năm nhập học phải từ ${MIN_ADMISSION_YEAR} trở đi.` : undefined
  }

  const handleCreateAccount = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    if (!selectedRole) {
      return
    }

    const normalizedAccount = {
      ...newAccount,
      username: selectedRole === 'student'
        ? sanitizeStudentCode(newAccount.username)
        : selectedRole === 'lecturer'
          ? sanitizeLecturerCode(newAccount.username)
          : newAccount.username.trim(),
      soCccd: selectedRole === 'student' ? sanitizeCccd(newAccount.soCccd) : newAccount.soCccd.trim(),
      namNhapHoc: selectedRole === 'student' ? sanitizeAdmissionYear(newAccount.namNhapHoc) : newAccount.namNhapHoc.trim(),
      khoaHoc: selectedRole === 'student'
        ? getAcademicCohort(sanitizeAdmissionYear(newAccount.namNhapHoc), selectedTrainingDuration)
        : newAccount.khoaHoc.trim(),
      fullName: normalizePersonName(newAccount.fullName),
      email: selectedRole === 'manager'
        ? ''
        : normalizeNtuEmail(
          selectedRole === 'student'
            ? generateUniqueStudentEmail(newAccount.fullName, selectedLop?.lop_hoc_phan ?? newAccount.maLop) || newAccount.email
            : newAccount.email,
        ),
      phone: selectedRole === 'lecturer' ? sanitizePhoneNumber(newAccount.phone) : newAccount.phone.trim(),
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
        email: selectedRole === 'manager' ? undefined : normalizedAccount.email || null,
        phone: selectedRole === 'lecturer' ? normalizedAccount.phone || null : undefined,
        gioi_tinh: selectedRole === 'student' ? normalizedAccount.gioiTinh || null : undefined,
        ngay_sinh: selectedRole === 'student' ? normalizedAccount.ngaySinh || null : undefined,
        don_vi_id: selectedRole === 'student' || selectedRole === 'lecturer' || selectedRole === 'training_officer' || selectedRole === 'manager'
          ? Number(normalizedAccount.donViId) || null
          : undefined,
        lop_id: selectedRole === 'student' ? Number(normalizedAccount.lopId) || null : undefined,
        nganh_dao_tao_id: selectedRole === 'student' ? Number(normalizedAccount.nganhDaoTaoId) || null : undefined,
        ma_lop: selectedRole === 'student' ? selectedLop?.lop_hoc_phan ?? null : undefined,
        ten_don_vi: selectedRole === 'student' ? selectedDonVi?.ten_don_vi ?? null : undefined,
        ten_nganh_hoc: selectedRole === 'student' ? selectedNganhDaoTao?.ten_nganh ?? null : undefined,
        he_dao_tao: selectedRole === 'student' ? normalizedAccount.heDaoTao || null : undefined,
        nam_nhap_hoc: selectedRole === 'student' ? Number(normalizedAccount.namNhapHoc) || null : undefined,
        khoa_hoc: selectedRole === 'student' ? normalizedAccount.khoaHoc || null : undefined,
        so_cccd: selectedRole === 'student' ? normalizedAccount.soCccd.trim() || null : undefined,
        noi_sinh: selectedRole === 'student' ? normalizedAccount.noiSinh.trim() || null : undefined,
        ngay_cap_cccd: selectedRole === 'student' ? normalizedAccount.ngayCapCccd || null : undefined,
        noi_cap_cccd: selectedRole === 'student' ? sanitizeLettersOnly(normalizedAccount.noiCapCccd).trim() || null : undefined,
        ho_khau_tinh_thanh_pho: selectedRole === 'student' ? normalizedAccount.hoKhauTinhThanhPho.trim() || null : undefined,
        ho_khau_quan_huyen: selectedRole === 'student' ? normalizedAccount.hoKhauQuanHuyen.trim() || null : undefined,
        que_quan_tinh_thanh_pho: selectedRole === 'student' ? normalizedAccount.queQuanTinhThanhPho.trim() || null : undefined,
        que_quan_quan_huyen: selectedRole === 'student' ? normalizedAccount.queQuanQuanHuyen.trim() || null : undefined,
        que_quan: selectedRole === 'student' ? normalizedAccount.queQuan.trim() || null : undefined,
        dia_chi_lien_lac: selectedRole === 'student' ? normalizedAccount.diaChiLienLac.trim() || null : undefined,
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
        email: selectedRole === 'manager' ? null : normalizedAccount.email.trim() || null,
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

  const openCreateModal = () => {
    setEditingAccount(null)
    setNewAccount(EMPTY_ACCOUNT)
    setFormErrors({})
    setShowModal(true)
  }

  const openEditModal = (account: AdminAccount) => {
    setEditingAccount(account)
    setNewAccount({
      ...EMPTY_ACCOUNT,
      username: account.username,
      fullName: account.display_name ?? '',
      email: account.email ?? '',
      phone: account.profile?.so_dien_thoai ?? '',
      donViId: account.profile?.don_vi_id ? String(account.profile.don_vi_id) : '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleUpdateLecturer = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    if (!editingAccount) {
      return
    }

    const normalizedAccount = {
      ...newAccount,
      fullName: normalizePersonName(newAccount.fullName),
      email: normalizeNtuEmail(newAccount.email),
      phone: sanitizePhoneNumber(newAccount.phone),
    }
    const errors: AccountFormErrors = {}
    const fullNameError = getPersonNameError(normalizedAccount.fullName)

    if (fullNameError) {
      errors.fullName = fullNameError
    }

    if (!normalizedAccount.donViId) {
      errors.donViId = 'Vui lòng chọn đơn vị.'
    }

    if (findAccountByEmail(normalizedAccount.email, editingAccount.id)) {
      errors.email = 'Email này đã được sử dụng ở một tài khoản khác.'
    }

    const phoneError = getPhoneError(normalizedAccount.phone)

    if (phoneError) {
      errors.phone = phoneError
    }

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
      await apiPut(`/admin/accounts/${editingAccount.id}`, {
        profile: {
          ten_giang_vien: normalizedAccount.fullName,
          email: normalizedAccount.email || null,
          so_dien_thoai: normalizedAccount.phone || null,
          don_vi_id: Number(normalizedAccount.donViId),
        },
      })

      showAlert({
        title: 'Đã cập nhật giảng viên',
        message: `Thông tin tài khoản ${editingAccount.username} đã được lưu.`,
        variant: 'success',
      })
      setShowModal(false)
      setEditingAccount(null)
      setNewAccount(EMPTY_ACCOUNT)
      setFormErrors({})
      await loadAccounts()
    } catch (error: unknown) {
      showAlert({
        title: 'Cập nhật giảng viên thất bại',
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

  const confirmDeleteAccount = async (account: AdminAccount) => {
    setDeletingAccountId(account.id)

    try {
      await apiDelete(`/admin/accounts/${account.id}`)
      showAlert({
        title: 'Đã xóa tài khoản',
        message: `Tài khoản ${account.username} đã được xóa thành công.`,
        variant: 'success',
      })
      await loadAccounts()
    } catch (error: unknown) {
      showAlert({
        title: 'Xóa tài khoản thất bại',
        message: getErrorMessage(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    } finally {
      setDeletingAccountId(null)
    }
  }

  const handleDeleteAccount = (account: AdminAccount) => {
    const accountName = account.display_name || account.username

    openModal({
      title: 'Xác nhận xóa tài khoản',
      content: (
        <div className="aa-confirm-delete">
          <div className="aa-confirm-delete-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </div>
          <div>
            <p>
              Bạn có chắc muốn xóa tài khoản <strong>{accountName}</strong>?
            </p>
            <span>Thao tác này sẽ xóa tài khoản và hồ sơ liên kết khỏi hệ thống.</span>
          </div>
        </div>
      ),
      size: 'sm',
      dismissible: true,
      closeOnOverlayClick: false,
      actions: [
        {
          label: 'Hủy',
          variant: 'secondary',
        },
        {
          label: 'Xóa tài khoản',
          variant: 'danger',
          autoClose: false,
          onClick: () => {
            closeModal()
            void confirmDeleteAccount(account)
          },
        },
      ],
    })
  }

  return (
    <div className="aa-root">
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
              <div className="aa-role-content">
                <h3 className="aa-role-title">{role.title}</h3>
                <span className="aa-role-count">
                  {isLoading ? 'Đang tải...' : `${accountCounts[role.id]} tài khoản`}
                </span>
              </div>
              <svg className="aa-role-arrow" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          ))}
        </div>
      )}

      {selectedRole && activeRole && (
        <div className="aa-list-view">
          <div className="aa-toolbar">
            <Breadcrumbs
              className="aa-breadcrumbs"
              items={[
                {
                  label: (
                    <button type="button" className="aa-breadcrumb-button" onClick={() => setSelectedRole(null)}>
                      Danh sách vai trò
                    </button>
                  ),
                },
                { label: activeRole.title },
              ]}
            />
            <Button className="aa-btn-primary" onClick={openCreateModal}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Tạo tài khoản {activeRole.title.toLowerCase()}
            </Button>
          </div>

          {selectedRole && (
            <div className="aa-filter-bar">
              <Input
                type="search"
                className="aa-input"
                containerClassName="aa-filter-field"
                placeholder={selectedRole === 'manager' ? 'Tìm mã, tên, đơn vị...' : 'Tìm mã, tên, email...'}
                value={accountSearch}
                onChange={(event) => setAccountSearch(event.target.value)}
              />
              <Select
                className="aa-input"
                containerClassName="aa-filter-field"
                value={unitFilter}
                placeholder="Tất cả đơn vị"
                disabled={isCatalogLoading}
                options={donVis.map((donVi) => ({
                  label: `${donVi.ma_don_vi} - ${donVi.ten_don_vi}`,
                  value: String(donVi.id),
                }))}
                onChange={(event) => setUnitFilter(event.target.value)}
              />
              {(accountSearch || unitFilter) && (
                <Button
                  className="aa-btn-cancel"
                  variant="secondary"
                  onClick={() => {
                    setAccountSearch('')
                    setUnitFilter('')
                  }}
                >
                  Xóa lọc
                </Button>
              )}
            </div>
          )}

          <div className="aa-table-container">
            <table className="aa-table">
              <thead>
                <tr>
                  <th>Mã tài khoản</th>
                  <th>Họ và Tên</th>
                  {selectedRole === 'lecturer' && <th>Tên đơn vị</th>}
                  <th>{selectedRole === 'manager' ? 'Đơn vị quản lý' : 'Email'}</th>
                  <th>Trạng thái</th>
                  <th style={{ width: selectedRole === 'student' ? '124px' : selectedRole === 'lecturer' ? '150px' : '112px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={tableColumnCount} style={{ textAlign: 'center', padding: '32px', color: '#718096' }}>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumnCount} style={{ textAlign: 'center', padding: '32px', color: '#718096' }}>
                      Chưa có tài khoản nào
                    </td>
                  </tr>
                ) : (
                  paginatedAccounts.map((account) => (
                    <tr key={account.id}>
                      <td style={{ fontWeight: 500 }}>{account.username}</td>
                      <td>{account.display_name || account.username}</td>
                      {selectedRole === 'lecturer' && (
                        <td>
                          {donVis.find((donVi) => donVi.id === account.profile?.don_vi_id)?.ten_don_vi ?? 'Chưa có đơn vị'}
                        </td>
                      )}
                      <td>
                        {selectedRole === 'manager'
                          ? donVis.find((donVi) => donVi.id === account.profile?.don_vi_id)?.ten_don_vi ?? 'Chưa có đơn vị'
                          : account.email || 'Chưa có email'}
                      </td>
                      <td>
                        <span className={`aa-status ${account.status ? 'active' : 'inactive'}`}>
                          {account.status ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="aa-actions">
                          {selectedRole === 'lecturer' && (
                            <button
                              className="aa-action-btn aa-action-btn-edit"
                              title="Sửa giảng viên"
                              onClick={() => openEditModal(account)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                            </button>
                          )}
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
                          {selectedRole !== 'student' && (
                            <button
                              className="aa-action-btn aa-action-btn-danger"
                              title="Xóa tài khoản"
                              disabled={deletingAccountId === account.id}
                              onClick={() => handleDeleteAccount(account)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {currentAccounts.length > 0 && (
            <div className="aa-pagination">
              <Pagination
                page={accountPage}
                totalPages={totalAccountPages}
                onPageChange={setAccountPage}
                pageSize={accountPageSize}
                onPageSizeChange={setAccountPageSize}
              />
            </div>
          )}
        </div>
      )}

      {showModal && activeRole && (
        <div className="aa-modal-overlay">
          <div className="aa-modal">
            <div className="aa-modal-header">
              <h2>{editingAccount ? 'Sửa thông tin giảng viên' : `Tạo tài khoản ${activeRole.title} mới`}</h2>
              <button className="aa-btn-close" onClick={() => {
                setShowModal(false)
                setEditingAccount(null)
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <form onSubmit={editingAccount ? handleUpdateLecturer : handleCreateAccount} className="aa-form">
              <Input
                label={
                  selectedRole === 'student'
                    ? 'MSSV *'
                    : selectedRole === 'lecturer'
                      ? 'Mã giảng viên *'
                      : 'Mã tài khoản *'
                }
                type="text"
                className="aa-input"
                containerClassName="aa-form-group"
                required
                inputMode={selectedRole === 'student' || selectedRole === 'lecturer' ? 'numeric' : undefined}
                maxLength={selectedRole === 'student' ? 8 : selectedRole === 'lecturer' ? 7 : undefined}
                pattern={selectedRole === 'student' ? '\\d{8}' : selectedRole === 'lecturer' ? '\\d{7}' : undefined}
                placeholder={
                  selectedRole === 'student'
                    ? 'Nhập đúng 8 chữ số...'
                    : selectedRole === 'lecturer'
                      ? 'Nhập đúng 7 chữ số...'
                      : 'Nhập mã tài khoản...'
                }
                value={newAccount.username}
                error={formErrors.username}
                disabled={Boolean(editingAccount)}
                onChange={(event) => {
                  const username = selectedRole === 'student'
                    ? sanitizeStudentCode(event.target.value)
                    : selectedRole === 'lecturer'
                      ? sanitizeLecturerCode(event.target.value)
                      : event.target.value

                  setNewAccount({ ...newAccount, username })
                  setFormErrors({ ...formErrors, username: getUsernameError(username) })
                }}
              />
              <Input
                label={selectedRole === 'lecturer' ? 'Tên giảng viên *' : 'Họ và Tên *'}
                type="text"
                className="aa-input"
                containerClassName="aa-form-group"
                required
                placeholder="Nhập họ và tên..."
                value={newAccount.fullName}
                error={formErrors.fullName}
                onChange={(event) => {
                  const fullName = event.target.value
                  const autoEmail = generateAutoEmailForForm(selectedRole, fullName, newAccount.maLop, editingAccount?.id)
                  const email = selectedRole === 'manager' ? '' : autoEmail || newAccount.email

                  setNewAccount({
                    ...newAccount,
                    fullName,
                    email,
                  })
                  setFormErrors({
                    ...formErrors,
                    fullName: getPersonNameError(fullName),
                    email: selectedRole !== 'manager' && findAccountByEmail(email, editingAccount?.id)
                      ? 'Email này đã được sử dụng ở một tài khoản khác.'
                      : undefined,
                  })
                }}
                onBlur={() => {
                  const fullName = normalizePersonName(newAccount.fullName)
                  const autoEmail = generateAutoEmailForForm(selectedRole, fullName, newAccount.maLop, editingAccount?.id)
                  const email = selectedRole === 'manager' ? '' : autoEmail || newAccount.email

                  setNewAccount({
                    ...newAccount,
                    fullName,
                    email,
                  })
                  setFormErrors({
                    ...formErrors,
                    email: selectedRole !== 'manager' && findAccountByEmail(email, editingAccount?.id)
                      ? 'Email này đã được sử dụng ở một tài khoản khác.'
                      : undefined,
                  })
                }}
              />
              {selectedRole && selectedRole !== 'student' && (
                <Select
                  label={selectedRole === 'manager' ? 'Đơn vị quản lý *' : 'Tên đơn vị *'}
                  className="aa-input"
                  containerClassName="aa-form-group"
                  required
                  value={newAccount.donViId}
                  error={formErrors.donViId}
                  placeholder={isCatalogLoading ? 'Đang tải danh sách đơn vị...' : 'Chọn đơn vị'}
                  disabled={isCatalogLoading}
                  options={donVis.map((donVi) => ({
                    label: `${donVi.ma_don_vi} - ${donVi.ten_don_vi}`,
                    value: String(donVi.id),
                  }))}
                  onChange={(event) => {
                    const donVi = donVis.find((item) => String(item.id) === event.target.value)

                    setNewAccount({
                      ...newAccount,
                      donViId: event.target.value,
                      tenDonVi: donVi?.ten_don_vi ?? '',
                    })
                    setFormErrors({
                      ...formErrors,
                      donViId: event.target.value ? undefined : 'Vui lòng chọn đơn vị.',
                    })
                  }}
                />
              )}
              {selectedRole === 'lecturer' && (
                <Input
                  label="Số điện thoại"
                  type="text"
                  className="aa-input"
                  containerClassName="aa-form-group"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="\d{10}"
                  placeholder="Nhập đúng 10 chữ số..."
                  value={newAccount.phone}
                  error={formErrors.phone}
                  onChange={(event) => {
                    const phone = sanitizePhoneNumber(event.target.value)

                    setNewAccount({ ...newAccount, phone })
                    setFormErrors({ ...formErrors, phone: getPhoneError(phone) })
                  }}
                />
              )}
              {selectedRole !== 'manager' && (
                <div className="aa-form-group">
                  <label>Email liên hệ</label>
                  <div className={`aa-email-input ${formErrors.email ? 'aa-email-input-error' : ''}`}>
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
                        setFormErrors({
                          ...formErrors,
                          email: findAccountByEmail(localPart ? `${localPart}${NTU_EMAIL_DOMAIN}` : '', editingAccount?.id)
                            ? 'Email này đã được sử dụng ở một tài khoản khác.'
                            : undefined,
                        })
                      }}
                    />
                    <span>{NTU_EMAIL_DOMAIN}</span>
                  </div>
                  {formErrors.email && <span className="aa-field-error">{formErrors.email}</span>}
                </div>
              )}
              {selectedRole === 'student' && (
                <>
                  <div className="aa-form-grid">
                    <Select
                      label="Giới tính"
                      className="aa-input"
                      containerClassName="aa-form-group"
                      value={newAccount.gioiTinh}
                      onChange={(event) => setNewAccount({ ...newAccount, gioiTinh: event.target.value })}
                      placeholder="Chọn giới tính"
                      options={[
                        { label: 'Nam', value: 'Nam' },
                        { label: 'Nữ', value: 'Nữ' },
                        { label: 'Khác', value: 'Khác' },
                      ]}
                    />
                    <DatePicker
                      label="Ngày sinh"
                      className="aa-input"
                      containerClassName="aa-form-group"
                      value={newAccount.ngaySinh}
                      error={formErrors.ngaySinh}
                      onChange={(event) => setNewAccount({ ...newAccount, ngaySinh: event.target.value })}
                    />
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
                            email: selectedRole === 'student' ? '' : newAccount.email,
                            tenDonVi: donVi?.ten_don_vi ?? '',
                            nganhDaoTaoId: '',
                            tenNganhHoc: '',
                            khoaHoc: getAcademicCohort(newAccount.namNhapHoc, 4),
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
                          const maLop = lop?.lop_hoc_phan ?? ''
                          const autoEmail = generateAutoEmailForForm(selectedRole, newAccount.fullName, maLop, editingAccount?.id)
                          setNewAccount({
                            ...newAccount,
                            lopId: event.target.value,
                            maLop,
                            email: autoEmail || newAccount.email,
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
                            {lop.lop_hoc_phan}
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
                            khoaHoc: getAcademicCohort(newAccount.namNhapHoc, getTrainingDuration(nganhDaoTao)),
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
                    <Select
                      label="Hệ đào tạo"
                      className="aa-input"
                      containerClassName="aa-form-group"
                      value={newAccount.heDaoTao}
                      onChange={(event) => setNewAccount({ ...newAccount, heDaoTao: event.target.value })}
                      options={[
                        { label: 'Đại học Chính quy', value: 'Đại học Chính quy' },
                        { label: 'Vừa học vừa làm', value: 'Vừa học vừa làm' },
                        { label: 'Đào tạo từ xa', value: 'Đào tạo từ xa' },
                      ]}
                    />
                    <Input
                      label="Năm nhập học *"
                      type="text"
                      className="aa-input"
                      containerClassName="aa-form-group"
                      required
                      inputMode="numeric"
                      maxLength={4}
                      pattern="\d{4}"
                      placeholder="Ví dụ: 2023"
                      value={newAccount.namNhapHoc}
                      error={formErrors.namNhapHoc}
                      onChange={(event) => {
                        const namNhapHoc = sanitizeAdmissionYear(event.target.value)
                        setNewAccount({
                          ...newAccount,
                          namNhapHoc,
                          khoaHoc: getAcademicCohort(namNhapHoc, selectedTrainingDuration),
                        })
                        setFormErrors({ ...formErrors, namNhapHoc: getAdmissionYearError(namNhapHoc) })
                      }}
                    />
                    <Input
                      label="Khóa học"
                      type="text"
                      className="aa-input"
                      containerClassName="aa-form-group"
                      value={newAccount.khoaHoc || 'Tự động tính theo năm nhập học'}
                      disabled
                      readOnly
                    />
                    <Input
                      label="Số CCCD *"
                      type="text"
                      className="aa-input"
                      containerClassName="aa-form-group"
                      required
                      inputMode="numeric"
                      maxLength={12}
                      pattern="\d{12}"
                      placeholder="Nhập đúng 12 chữ số CCCD"
                      value={newAccount.soCccd}
                      error={formErrors.soCccd}
                      onChange={(event) => {
                        const soCccd = sanitizeCccd(event.target.value)
                        setNewAccount({ ...newAccount, soCccd })
                        setFormErrors({ ...formErrors, soCccd: getCccdError(soCccd) })
                      }}
                    />
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
                    <DatePicker
                      label="Ngày cấp CCCD"
                      className="aa-input"
                      containerClassName="aa-form-group"
                      value={newAccount.ngayCapCccd}
                      error={formErrors.ngayCapCccd}
                      onChange={(event) => setNewAccount({ ...newAccount, ngayCapCccd: event.target.value })}
                    />
                    <Input
                      label="Nơi cấp CCCD"
                      type="text"
                      className="aa-input"
                      containerClassName="aa-form-group"
                      value={newAccount.noiCapCccd}
                      onChange={(event) => setNewAccount({ ...newAccount, noiCapCccd: event.target.value })}
                      onBlur={() => setNewAccount({
                        ...newAccount,
                        noiCapCccd: sanitizeLettersOnly(newAccount.noiCapCccd),
                      })}
                    />
                    <div className="aa-form-group">
                      <label>Tỉnh/Thành phố quê quán</label>
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
                          {isProvincesLoading ? 'Đang tải...' : 'Chọn tỉnh/thành phố quê quán'}
                        </option>
                        {provinces.map((province) => (
                          <option key={province.id} value={province.id}>
                            {formatProvinceOption(province)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="aa-form-group">
                      <label>Xã/Phường/Đặc khu quê quán</label>
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
                            ? 'Chọn tỉnh/thành phố quê quán trước'
                            : queQuanDistricts.length === 0
                              ? 'Chưa có xã/phường/đặc khu'
                              : 'Chọn xã/phường/đặc khu quê quán'}
                        </option>
                        {queQuanDistricts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="aa-form-group">
                      <label>Tỉnh/Thành phố thường trú</label>
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
                          {isProvincesLoading ? 'Đang tải...' : 'Chọn tỉnh/thành phố thường trú'}
                        </option>
                        {provinces.map((province) => (
                          <option key={province.id} value={province.id}>
                            {formatProvinceOption(province)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="aa-form-group">
                      <label>Xã/Phường/Đặc khu thường trú</label>
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
                            ? 'Chọn tỉnh/thành phố thường trú trước'
                            : hoKhauDistricts.length === 0
                              ? 'Chưa có xã/phường/đặc khu'
                              : 'Chọn xã/phường/đặc khu thường trú'}
                        </option>
                        {hoKhauDistricts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="aa-form-group aa-form-group-wide">
                      <label>Địa chỉ hộ khẩu thường trú chi tiết</label>
                      <input
                        type="text"
                        className="aa-input"
                        placeholder="Nhập thôn/xóm, số nhà hoặc thông tin chi tiết nếu có"
                        value={newAccount.diaChiLienLac}
                        onChange={(event) => setNewAccount({ ...newAccount, diaChiLienLac: event.target.value })}
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
              {!editingAccount && (
                <Input
                  label="Mật khẩu mặc định"
                  type="text"
                  className="aa-input"
                  containerClassName="aa-form-group"
                  value={newAccount.password}
                  disabled
                  readOnly
                />
              )}
            </form>

            <div className="aa-form-actions">
              <Button className="aa-btn-cancel" variant="secondary" onClick={() => {
                setShowModal(false)
                setEditingAccount(null)
              }}>
                Hủy bỏ
              </Button>
              <Button
                className="aa-btn-primary"
                onClick={() => void (editingAccount ? handleUpdateLecturer() : handleCreateAccount())}
                disabled={isSaving}
              >
                {isSaving ? 'Đang lưu...' : editingAccount ? 'Lưu thay đổi' : 'Lưu tài khoản'}
              </Button>
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
              <Button className="aa-btn-primary" onClick={() => setCreatedAccount(null)}>
                Đã hiểu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
