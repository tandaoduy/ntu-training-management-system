import { useEffect, useMemo, useState } from 'react'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AcademicCapIcon,
  IdentificationIcon,
  HomeModernIcon,
  MapPinIcon,
  PhoneIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { apiGet, apiPut } from '@/api/core/request'
import { API_BASE_URL } from '@/api/config/env'
import { authStorage } from '../../../../api/features/auth'
import { useAuth } from '../../../../api/query'
import { Modal } from '@/components/modal'
import { StudentHeader } from '../components/StudentHeader'
import './StudentProfilePage.css'

type StudentProfile = {
  user_id?: string | null
  anh?: string | null
  anh_url?: string | null
  ten_sinh_vien?: string | null
  ngay_sinh?: string | null
  noi_sinh?: string | null
  gioi_tinh?: string | null
  email?: string | null
  so_dien_thoai?: string | null
  ma_lop?: string | null
  ten_nganh_hoc?: string | null
  ten_don_vi?: string | null
  he_dao_tao?: string | null
  nam_nhap_hoc?: string | number | null
  khoa_hoc?: string | null
  so_cccd?: string | null
  ngay_cap_cccd?: string | null
  noi_cap_cccd?: string | null
  ho_khau_tinh_thanh_pho?: string | null
  ho_khau_quan_huyen?: string | null
  que_quan?: string | null
  que_quan_tinh_thanh_pho?: string | null
  que_quan_quan_huyen?: string | null
  dan_toc?: string | null
  ton_giao?: string | null
  dia_chi_lien_lac?: string | null
  so_dien_thoai_gia_dinh?: string | null
  ho_ten_cha?: string | null
  ho_ten_me?: string | null
  ngay_sinh_cha?: string | null
  ngay_sinh_me?: string | null
  que_quan_cha?: string | null
  que_quan_me?: string | null
  nghe_nghiep_cha?: string | null
  nghe_nghiep_me?: string | null
  lop?: {
    ma_lop?: string | null
    lop_hoc_phan?: string | null
    ten_lop?: string | null
  } | null
}

type StudentDashboardResponse = {
  student?: StudentProfile | null
  freshStudent?: StudentProfile | null
  profile_edit_window?: {
    starts_at?: string | null
    ends_at?: string | null
    enabled: boolean
    is_open: boolean
  } | null
  hoc_ky_hien_hanh?: {
    nam_hoc?: string | null
    hoc_ky?: string | null
  } | null
}

type EditableProfileForm = {
  ngay_sinh: string
  noi_sinh: string
  gioi_tinh: string
  dan_toc: string
  ton_giao: string
  ho_khau_tinh_thanh_pho: string
  ho_khau_quan_huyen: string
  que_quan_tinh_thanh_pho: string
  que_quan_quan_huyen: string
  dia_chi_lien_lac: string
  so_dien_thoai: string
  so_dien_thoai_gia_dinh: string
  ho_ten_cha: string
  ngay_sinh_cha: string
  que_quan_cha_tinh_thanh_pho: string
  nghe_nghiep_cha: string
  ho_ten_me: string
  ngay_sinh_me: string
  que_quan_me_tinh_thanh_pho: string
  nghe_nghiep_me: string
}

type Province = {
  id: number
  name: string
  code: string | null
}

type ProvinceWithDistricts = Province & {
  districts?: District[]
}

type District = {
  id: number
  province_id: number
  name: string
  code: string | null
}

type ProvinceResponse = {
  data: ProvinceWithDistricts[]
}

type StudentCatalogResponse = {
  data: {
    dan_tocs: Array<{ id: number; ten_dan_toc: string; thu_tu: number }>
    ton_giaos: Array<{ id: number; ten_ton_giao: string; thu_tu: number }>
  }
}

type FormFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  inputMode?: 'numeric'
  maxLength?: number
  className?: string
}

type SelectFieldProps = {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  className?: string
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const blank = ''

const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác']

const withCurrentOption = (options: string[], value: string) => {
  const normalized = value.trim()
  return normalized && !options.includes(normalized) ? [normalized, ...options] : options
}

const normalizePlaceName = (value: string) => (
  value
    .toLowerCase()
    .replace(/\b(thành phố|tỉnh)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
)

const formatProvinceOption = (province: Province) => (
  province.code ? `${province.code} - ${province.name}` : province.name
)

const display = (value?: string | number | null) => {
  const normalized = String(value ?? '').trim()
  return normalized || blank
}

const formatDate = (value?: string | null) => {
  if (!value) return blank
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return blank
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const toFormDate = (value?: string | null) => {
  const formatted = formatDate(value)
  return formatted === blank ? '' : formatted
}

const toApiDate = (value: string) => {
  const normalized = value.trim()
  if (!normalized) return null

  const match = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (!match) return undefined

  return `${match[3]}-${match[2]}-${match[1]}`
}

const sanitizePhone = (value: string) => value.replace(/\D/g, '').slice(0, 10)

const resolveImageUrl = (value?: string | null) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('/')) return `${API_BASE_URL}${value}`
  if (value.startsWith('api/student-images/')) return `${API_BASE_URL}/${value}`
  if (value.startsWith('storage/')) return `${API_BASE_URL}/${value}`
  return `${API_BASE_URL}/api/student-images/${value}`
}

const combinePlace = (...parts: Array<string | null | undefined>) => {
  const values = parts.map((part) => String(part ?? '').trim()).filter(Boolean)
  return values.length > 0 ? values.join(', ') : blank
}

const formFromStudent = (student?: StudentProfile | null): EditableProfileForm => {
  return {
    ngay_sinh: toFormDate(student?.ngay_sinh),
    noi_sinh: student?.noi_sinh ?? '',
    gioi_tinh: student?.gioi_tinh ?? '',
    dan_toc: student?.dan_toc ?? '',
    ton_giao: student?.ton_giao ?? '',
    ho_khau_tinh_thanh_pho: student?.ho_khau_tinh_thanh_pho ?? '',
    ho_khau_quan_huyen: student?.ho_khau_quan_huyen ?? '',
    que_quan_tinh_thanh_pho: student?.que_quan_tinh_thanh_pho ?? '',
    que_quan_quan_huyen: student?.que_quan_quan_huyen ?? '',
    dia_chi_lien_lac: student?.dia_chi_lien_lac ?? '',
    so_dien_thoai: student?.so_dien_thoai ?? '',
    so_dien_thoai_gia_dinh: student?.so_dien_thoai_gia_dinh ?? '',
    ho_ten_cha: student?.ho_ten_cha ?? '',
    ngay_sinh_cha: toFormDate(student?.ngay_sinh_cha),
    que_quan_cha_tinh_thanh_pho: student?.que_quan_cha ?? '',
    nghe_nghiep_cha: student?.nghe_nghiep_cha ?? '',
    ho_ten_me: student?.ho_ten_me ?? '',
    ngay_sinh_me: toFormDate(student?.ngay_sinh_me),
    que_quan_me_tinh_thanh_pho: student?.que_quan_me ?? '',
    nghe_nghiep_me: student?.nghe_nghiep_me ?? '',
  }
}

const Field = ({ label, value, onChange, placeholder, inputMode, maxLength, className }: FormFieldProps) => (
  <label className={className}>
    {label}
    <input
      value={value}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const SelectField = ({ label, value, options, onChange, className }: SelectFieldProps) => (
  <label className={className}>
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Chọn thông tin</option>
      {withCurrentOption(options, value).map((option) => (
        <option value={option} key={option}>{option}</option>
      ))}
    </select>
  </label>
)

const ProvinceField = ({ label, value, provinces, onChange, className }: {
  label: string
  value: string
  provinces: Province[]
  onChange: (provinceName: string) => void
  className?: string
}) => (
  <label className={className}>
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Chọn tỉnh/thành phố</option>
      {value && !provinces.some((province) => province.name === value) && (
        <option value={value}>{value}</option>
      )}
      {provinces.map((province) => (
        <option value={province.name} key={province.id}>{formatProvinceOption(province)}</option>
      ))}
    </select>
  </label>
)

const WardField = ({ label, value, districts, onChange, className }: {
  label: string
  value: string
  districts: District[]
  onChange: (districtName: string) => void
  className?: string
}) => (
  <label className={className}>
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Chọn xã/phường</option>
      {value && !districts.some((district) => district.name === value) && (
        <option value={value}>{value}</option>
      )}
      {districts.map((district) => (
        <option value={district.name} key={district.id}>{district.name}</option>
      ))}
    </select>
  </label>
)

const EditSection = ({ title, icon: Icon, children }: { title: string; icon: IconComponent; children: ReactNode }) => (
  <section className="student-profile-card student-profile-edit-section">
    <div className="student-profile-card-title">
      <Icon aria-hidden="true" />
      <h2>{title}</h2>
    </div>
    <div className="student-profile-edit-grid">{children}</div>
  </section>
)

const sectionIcons = {
  academic: AcademicCapIcon,
  personal: UserCircleIcon,
  identity: IdentificationIcon,
  address: MapPinIcon,
  contact: PhoneIcon,
  family: UsersIcon,
}

export default function StudentProfilePage() {
  const navigate = useNavigate()
  const { user, me } = useAuth()
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [catalogError, setCatalogError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profileEditOpen, setProfileEditOpen] = useState(false)
  const [profileForm, setProfileForm] = useState<EditableProfileForm>(() => formFromStudent(null))

  const [academicYear, setAcademicYear] = useState(() => {
    try {
      const cached = localStorage.getItem('student-current-academic-term')
      return cached ? JSON.parse(cached).year : '2024-2025'
    } catch {
      return '2024-2025'
    }
  })
  const [semester, setSemester] = useState(() => {
    try {
      const cached = localStorage.getItem('student-current-academic-term')
      return cached ? JSON.parse(cached).semester : '1'
    } catch {
      return '1'
    }
  })
  const [provinces, setProvinces] = useState<ProvinceWithDistricts[]>([])
  const [ethnicOptions, setEthnicOptions] = useState<string[]>([])
  const [religionOptions, setReligionOptions] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'personal' | 'address' | 'contact' | 'family'>('personal')

  useEffect(() => {
    if (!user) {
      void me()
    }
  }, [me, user])

  const [loadingCatalogs, setLoadingCatalogs] = useState(false)

  const loadCatalogs = async () => {
    if (provinces.length > 0) return;
    setLoadingCatalogs(true);
    setCatalogError('');
    try {
      const [provinceResponse, catalogResponse] = await Promise.all([
        apiGet<ProvinceResponse>('/provinces/with-districts'),
        apiGet<StudentCatalogResponse>('/admin/accounts/student-catalog'),
      ]);
      setProvinces(provinceResponse.data ?? []);
      setEthnicOptions((catalogResponse.data?.dan_tocs ?? []).map((item) => item.ten_dan_toc));
      setReligionOptions((catalogResponse.data?.ton_giaos ?? []).map((item) => item.ten_ton_giao));
      setCatalogError('');
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : 'Không tải được danh mục tỉnh/thành phố, dân tộc, tôn giáo.');
    } finally {
      setLoadingCatalogs(false);
    }
  };

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      const cachedStudent = localStorage.getItem('sp-student')
      if (!cachedStudent) {
        setLoading(true)
      }
      try {
        const response = await apiGet<StudentDashboardResponse>('/student/dashboard')
        if (!isMounted) return
        setStudent(response.student ?? null)
        setProfileEditOpen(Boolean(response.profile_edit_window?.is_open))
        setProfileForm(formFromStudent(response.student))
        
        const freshYear = response.hoc_ky_hien_hanh?.nam_hoc?.trim() || '2024-2025'
        const freshSem = response.hoc_ky_hien_hanh?.hoc_ky?.trim() || '1'
        setAcademicYear(freshYear)
        setSemester(freshSem)

        try {
          localStorage.setItem('sp-student', JSON.stringify(response.student ?? null))
          localStorage.setItem('student-current-academic-term', JSON.stringify({ year: freshYear, semester: freshSem }))
        } catch (e) {
          console.warn('Failed to save profile cache:', e)
        }
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Không tải được thông tin sinh viên.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  const updateForm = (field: keyof EditableProfileForm, value: string) => {
    setProfileForm((current) => ({
      ...current,
      [field]: field.includes('so_dien_thoai') ? sanitizePhone(value) : value,
    }))
  }

  const districtsForProvince = (provinceName: string) => {
    const normalized = normalizePlaceName(provinceName)
    if (!normalized) return []
    const matchedProvince = provinces.find((province) => normalizePlaceName(province.name) === normalized)
    return matchedProvince?.districts ?? []
  }

  const handleSaveProfile = async () => {
    const queQuanCha = profileForm.que_quan_cha_tinh_thanh_pho.trim()
    const queQuanMe = profileForm.que_quan_me_tinh_thanh_pho.trim()
    const phone = sanitizePhone(profileForm.so_dien_thoai)
    const familyPhone = sanitizePhone(profileForm.so_dien_thoai_gia_dinh)

    if ((phone && phone.length !== 10) || (familyPhone && familyPhone.length !== 10)) {
      setError('Số điện thoại phải gồm đúng 10 chữ số.')
      return
    }

    const ngaySinh = toApiDate(profileForm.ngay_sinh)
    const ngaySinhCha = toApiDate(profileForm.ngay_sinh_cha)
    const ngaySinhMe = toApiDate(profileForm.ngay_sinh_me)

    if ([ngaySinh, ngaySinhCha, ngaySinhMe].some((value) => value === undefined)) {
      setError('Ngày tháng trong form phải nhập theo định dạng ngày-tháng-năm, ví dụ 03-02-2005.')
      return
    }

    setSavingProfile(true)
    setError('')
    try {
      const response = await apiPut<StudentDashboardResponse, Partial<StudentProfile>>('/student/profile', {
        ngay_sinh: ngaySinh,
        noi_sinh: profileForm.noi_sinh.trim() || null,
        gioi_tinh: profileForm.gioi_tinh.trim() || null,
        dan_toc: profileForm.dan_toc.trim() || null,
        ton_giao: profileForm.ton_giao.trim() || null,
        ho_khau_tinh_thanh_pho: profileForm.ho_khau_tinh_thanh_pho.trim() || null,
        ho_khau_quan_huyen: profileForm.ho_khau_quan_huyen.trim() || null,
        que_quan_tinh_thanh_pho: profileForm.que_quan_tinh_thanh_pho.trim() || null,
        que_quan_quan_huyen: profileForm.que_quan_quan_huyen.trim() || null,
        dia_chi_lien_lac: profileForm.dia_chi_lien_lac.trim() || null,
        so_dien_thoai: phone || null,
        so_dien_thoai_gia_dinh: familyPhone || null,
        ho_ten_cha: profileForm.ho_ten_cha.trim() || null,
        ngay_sinh_cha: ngaySinhCha,
        que_quan_cha: queQuanCha || null,
        nghe_nghiep_cha: profileForm.nghe_nghiep_cha.trim() || null,
        ho_ten_me: profileForm.ho_ten_me.trim() || null,
        ngay_sinh_me: ngaySinhMe,
        que_quan_me: queQuanMe || null,
        nghe_nghiep_me: profileForm.nghe_nghiep_me.trim() || null,
      })
      setStudent(response.freshStudent ?? response.student ?? null)
      setProfileEditOpen(Boolean(response.profile_edit_window?.is_open))
      setProfileForm(formFromStudent(response.freshStudent ?? response.student))
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được thông tin sinh viên.')
    } finally {
      setSavingProfile(false)
    }
  }

  const sections = useMemo(() => {
    const className = student?.lop?.lop_hoc_phan || student?.lop?.ma_lop || student?.ma_lop

    return [
      {
        key: 'academic',
        title: 'Thông tin học vụ',
        icon: sectionIcons.academic,
        items: [
          ['Mã sinh viên', student?.user_id],
          ['Họ tên', student?.ten_sinh_vien],
          ['Lớp', className],
          ['Ngành đào tạo', student?.ten_nganh_hoc],
          ['Khoa/Đơn vị', student?.ten_don_vi],
          ['Hệ đào tạo', student?.he_dao_tao],
          ['Năm nhập học', student?.nam_nhap_hoc],
          ['Khóa học', student?.khoa_hoc],
        ],
      },
      {
        key: 'personal',
        title: 'Thông tin cá nhân',
        icon: sectionIcons.personal,
        items: [
          ['Ngày sinh', formatDate(student?.ngay_sinh)],
          ['Nơi sinh', student?.noi_sinh],
          ['Giới tính', student?.gioi_tinh],
          ['Dân tộc', student?.dan_toc],
          ['Tôn giáo', student?.ton_giao],
        ],
      },
      {
        key: 'identity',
        title: 'Căn cước công dân',
        icon: sectionIcons.identity,
        items: [
          ['Số CCCD', student?.so_cccd],
          ['Ngày cấp', formatDate(student?.ngay_cap_cccd)],
          ['Nơi cấp', student?.noi_cap_cccd],
        ],
      },
      {
        key: 'address',
        title: 'Hộ khẩu và quê quán',
        icon: sectionIcons.address,
        items: [
          ['Hộ khẩu', combinePlace(student?.ho_khau_quan_huyen, student?.ho_khau_tinh_thanh_pho)],
          ['Quê quán', student?.que_quan || combinePlace(student?.que_quan_quan_huyen, student?.que_quan_tinh_thanh_pho)],
        ],
      },
      {
        key: 'contact',
        title: 'Liên hệ',
        icon: sectionIcons.contact,
        items: [
          ['Email', student?.email],
          ['Số điện thoại', student?.so_dien_thoai],
          ['Địa chỉ liên lạc', student?.dia_chi_lien_lac],
          ['SĐT gia đình', student?.so_dien_thoai_gia_dinh],
        ],
      },
      {
        key: 'family',
        title: 'Thông tin gia đình',
        icon: sectionIcons.family,
        items: [
          ['Họ tên cha', student?.ho_ten_cha],
          ['Ngày sinh cha', formatDate(student?.ngay_sinh_cha)],
          ['Quê quán cha', student?.que_quan_cha],
          ['Nghề nghiệp cha', student?.nghe_nghiep_cha],
          ['Họ tên mẹ', student?.ho_ten_me],
          ['Ngày sinh mẹ', formatDate(student?.ngay_sinh_me)],
          ['Quê quán mẹ', student?.que_quan_me],
          ['Nghề nghiệp mẹ', student?.nghe_nghiep_me],
        ],
      },
    ]
  }, [student])



  const cachedUserName = authStorage.getUser()?.name?.trim() || null
  const displayName = user?.name?.trim() || cachedUserName || student?.ten_sinh_vien || ''
  const resolvedAvatarUrl = resolveImageUrl(student?.anh_url || student?.anh)
  const chips = [student?.user_id, student?.he_dao_tao, student?.khoa_hoc]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)

  return (
    <div className="student-profile-shell">
      <StudentHeader
        displayName={displayName}
        academicYear={academicYear}
        semester={semester}
        onHomeClick={() => navigate('/sinhvien')}
      />

      <main className="student-profile-page">
        <section className="student-profile-hero">
          <div className="student-profile-avatar">
            {resolvedAvatarUrl ? <img src={resolvedAvatarUrl} alt={display(student?.ten_sinh_vien)} /> : <UserCircleIcon aria-hidden="true" />}
          </div>
          <div>
            <p className="student-profile-eyebrow">Hồ sơ sinh viên</p>
            <h1>{display(student?.ten_sinh_vien)}</h1>
            <div className="student-profile-chips">
              {chips.map((chip, index) => (
                <span key={`${chip}-${index}`}>{chip}</span>
              ))}
            </div>
          </div>
          <HomeModernIcon className="student-profile-hero-icon" aria-hidden="true" />
        </section>

        {loading && <div className="student-profile-state">Đang tải thông tin sinh viên...</div>}
        {!loading && error && <div className="student-profile-state error">{error}</div>}
        {!loading && !error && !student && <div className="student-profile-state error">Không tìm thấy hồ sơ sinh viên.</div>}

        {!loading && !error && student && (
          <>
            {profileEditOpen && (
              <section className="student-profile-edit-card">
                <div>
                  <h2>Chỉnh sửa thông tin được phép</h2>
                  <p>Thông tin học vụ, CCCD, email và ảnh hồ sơ do nhà trường quản lý, sinh viên không được chỉnh sửa.</p>
                  {catalogError && <p className="student-profile-edit-warning">{catalogError}</p>}
                </div>
                <button type="button" onClick={() => {
                  setProfileForm(formFromStudent(student))
                  setError('')
                  setActiveTab('personal')
                  setEditing(true)
                  void loadCatalogs()
                }}>
                  Sửa thông tin
                </button>
              </section>
            )}

            {profileEditOpen && editing && (
              <Modal
                modal={{
                  id: 'student-profile-edit-modal',
                  title: 'Chỉnh sửa thông tin hồ sơ',
                  size: 'xl',
                  dismissible: true,
                  closeOnOverlayClick: false,
                  content: (
                    <div className="student-profile-edit-modal-layout-wrapper">
                      {error && (
                        <div className="student-profile-state error" style={{ marginTop: 0, marginBottom: 16 }}>
                          {error}
                        </div>
                      )}
                      {loadingCatalogs ? (
                        <div className="student-profile-state" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '14px', color: '#666' }}>Đang tải danh mục tỉnh thành, dân tộc, tôn giáo...</span>
                        </div>
                      ) : (
                        <div className="student-profile-edit-modal-layout">
                          {/* Left Sidebar Tabs */}
                          <aside className="student-profile-edit-sidebar">
                            <button
                              type="button"
                              className={`student-profile-edit-tab ${activeTab === 'personal' ? 'active' : ''}`}
                              onClick={() => setActiveTab('personal')}
                            >
                              <UserCircleIcon aria-hidden="true" />
                              <span>Thông tin cá nhân</span>
                            </button>
                            <button
                              type="button"
                              className={`student-profile-edit-tab ${activeTab === 'address' ? 'active' : ''}`}
                              onClick={() => setActiveTab('address')}
                            >
                              <MapPinIcon aria-hidden="true" />
                              <span>Hộ khẩu & Quê quán</span>
                            </button>
                            <button
                              type="button"
                              className={`student-profile-edit-tab ${activeTab === 'contact' ? 'active' : ''}`}
                              onClick={() => setActiveTab('contact')}
                            >
                              <PhoneIcon aria-hidden="true" />
                              <span>Liên hệ</span>
                            </button>
                            <button
                              type="button"
                              className={`student-profile-edit-tab ${activeTab === 'family' ? 'active' : ''}`}
                              onClick={() => setActiveTab('family')}
                            >
                              <UsersIcon aria-hidden="true" />
                              <span>Thông tin gia đình</span>
                            </button>
                          </aside>

                          {/* Right Content Area */}
                          <div className="student-profile-edit-main">
                            {activeTab === 'personal' && (
                              <EditSection title="Thông tin cá nhân" icon={UserCircleIcon}>
                                <Field label="Ngày sinh" value={profileForm.ngay_sinh} placeholder="ngày-tháng-năm" onChange={(value) => updateForm('ngay_sinh', value)} />
                                <ProvinceField label="Nơi sinh" value={profileForm.noi_sinh} provinces={provinces} onChange={(value) => updateForm('noi_sinh', value)} />
                                <SelectField label="Giới tính" value={profileForm.gioi_tinh} options={GENDER_OPTIONS} onChange={(value) => updateForm('gioi_tinh', value)} />
                                <SelectField label="Dân tộc" value={profileForm.dan_toc} options={ethnicOptions} onChange={(value) => updateForm('dan_toc', value)} />
                                <SelectField label="Tôn giáo" value={profileForm.ton_giao} options={religionOptions} onChange={(value) => updateForm('ton_giao', value)} />
                              </EditSection>
                            )}

                            {activeTab === 'address' && (
                              <EditSection title="Hộ khẩu và quê quán" icon={MapPinIcon}>
                                <ProvinceField label="Hộ khẩu tỉnh/thành phố" value={profileForm.ho_khau_tinh_thanh_pho} provinces={provinces} onChange={(value) => updateForm('ho_khau_tinh_thanh_pho', value)} />
                                <WardField label="Hộ khẩu xã/phường" value={profileForm.ho_khau_quan_huyen} districts={districtsForProvince(profileForm.ho_khau_tinh_thanh_pho)} onChange={(value) => updateForm('ho_khau_quan_huyen', value)} />
                                <ProvinceField label="Quê quán tỉnh/thành phố" value={profileForm.que_quan_tinh_thanh_pho} provinces={provinces} onChange={(value) => updateForm('que_quan_tinh_thanh_pho', value)} />
                                <WardField label="Quê quán xã/phường" value={profileForm.que_quan_quan_huyen} districts={districtsForProvince(profileForm.que_quan_tinh_thanh_pho)} onChange={(value) => updateForm('que_quan_quan_huyen', value)} />
                              </EditSection>
                            )}

                            {activeTab === 'contact' && (
                              <EditSection title="Liên hệ" icon={PhoneIcon}>
                                <Field label="Địa chỉ liên lạc" className="span-2" value={profileForm.dia_chi_lien_lac} onChange={(value) => updateForm('dia_chi_lien_lac', value)} />
                                <Field label="Số điện thoại liên lạc" value={profileForm.so_dien_thoai} inputMode="numeric" maxLength={10} onChange={(value) => updateForm('so_dien_thoai', value)} />
                                <Field label="Số điện thoại gia đình" value={profileForm.so_dien_thoai_gia_dinh} inputMode="numeric" maxLength={10} onChange={(value) => updateForm('so_dien_thoai_gia_dinh', value)} />
                              </EditSection>
                            )}

                            {activeTab === 'family' && (
                              <EditSection title="Thông tin gia đình" icon={UsersIcon}>
                                <div className="span-2 student-profile-edit-sub-header">Thông tin về Cha</div>
                                <Field label="Họ tên cha" value={profileForm.ho_ten_cha} onChange={(value) => updateForm('ho_ten_cha', value)} />
                                <Field label="Ngày sinh cha" value={profileForm.ngay_sinh_cha} placeholder="ngày-tháng-năm" onChange={(value) => updateForm('ngay_sinh_cha', value)} />
                                <ProvinceField label="Quê quán cha" value={profileForm.que_quan_cha_tinh_thanh_pho} provinces={provinces} onChange={(value) => updateForm('que_quan_cha_tinh_thanh_pho', value)} />
                                <Field label="Nghề nghiệp cha" value={profileForm.nghe_nghiep_cha} onChange={(value) => updateForm('nghe_nghiep_cha', value)} />

                                <div className="span-2 student-profile-edit-sub-header" style={{ marginTop: '16px' }}>Thông tin về Mẹ</div>
                                <Field label="Họ tên mẹ" value={profileForm.ho_ten_me} onChange={(value) => updateForm('ho_ten_me', value)} />
                                <Field label="Ngày sinh mẹ" value={profileForm.ngay_sinh_me} placeholder="ngày-tháng-năm" onChange={(value) => updateForm('ngay_sinh_me', value)} />
                                <ProvinceField label="Quê quán mẹ" value={profileForm.que_quan_me_tinh_thanh_pho} provinces={provinces} onChange={(value) => updateForm('que_quan_me_tinh_thanh_pho', value)} />
                                <Field label="Nghề nghiệp mẹ" value={profileForm.nghe_nghiep_me} onChange={(value) => updateForm('nghe_nghiep_me', value)} />
                              </EditSection>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ),
                  actions: [
                    {
                      label: 'Hủy',
                      variant: 'secondary',
                      autoClose: false,
                      onClick: () => {
                        setEditing(false)
                        setError('')
                        setProfileForm(formFromStudent(student))
                      }
                    },
                    {
                      label: savingProfile ? 'Đang lưu...' : 'Lưu thay đổi',
                      variant: 'primary',
                      autoClose: false,
                      onClick: () => {
                        void handleSaveProfile()
                      }
                    }
                  ]
                }}
                onClose={() => {
                  setEditing(false)
                  setError('')
                  setProfileForm(formFromStudent(student))
                }}
              />
            )}

            <div className="student-profile-grid">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <section className="student-profile-card" key={section.key}>
                    <div className="student-profile-card-title">
                      <Icon aria-hidden="true" />
                      <h2>{section.title}</h2>
                    </div>
                    <dl className="student-profile-list">
                      {section.items.map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{display(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
