import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { apiGet, apiPost, apiPut } from '@/api/core/request'
import { API_BASE_URL } from '@/api/config/env'
import { printBrandHtml, printBrandStyles, printFaviconLink } from '@/app/branding'
import { useAlert } from '@/components/alert'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import './AdminStudentInfoPage.css'

type StudentAccount = {
  id: number
  username: string
  display_name: string | null
  email: string | null
  status: boolean
  profile?: {
    anh?: string | null
    anh_url?: string | null
    ten_sinh_vien?: string | null
    lop_id?: number | null
    ma_lop?: string | null
    nganh_dao_tao_id?: number | null
    ten_nganh_hoc?: string | null
    ngay_sinh?: string | null
    noi_sinh?: string | null
    gioi_tinh?: string | null
    email?: string | null
    ten_don_vi?: string | null
    he_dao_tao?: string | null
    nam_nhap_hoc?: string | number | null
    khoa_hoc?: string | null
    so_cccd?: string | null
    ngay_cap_cccd?: string | null
    noi_cap_cccd?: string | null
    ho_khau_tinh_thanh_pho?: string | null
    ho_khau_quan_huyen?: string | null
    so_dien_thoai?: string | null
    so_dien_thoai_gia_dinh?: string | null
    que_quan?: string | null
    que_quan_tinh_thanh_pho?: string | null
    que_quan_quan_huyen?: string | null
    dan_toc?: string | null
    ton_giao?: string | null
    dia_chi_lien_lac?: string | null
    ho_ten_cha?: string | null
    ho_ten_me?: string | null
    ngay_sinh_cha?: string | null
    ngay_sinh_me?: string | null
    que_quan_cha?: string | null
    que_quan_me?: string | null
    nghe_nghiep_cha?: string | null
    nghe_nghiep_me?: string | null
  } | null
}

type AccountsResponse = {
  data: StudentAccount[]
}

type StudentProfileEditWindowResponse = {
  data: {
    starts_at?: string | null
    ends_at?: string | null
    enabled: boolean
    is_open: boolean
  }
}

type ActiveTab = 'config' | 'lookup'
type StudentInfoAccess = 'admin' | 'training_officer' | 'manager'

type StudentInfoPageProps = {
  access?: StudentInfoAccess
}

type StudentCatalogResponse = {
  data: {
    don_vis: Array<{
      id: number
      lops?: Array<{ id: number; lop_hoc_phan: string }>
      nganh_dao_taos?: Array<{ id: number; ten_nganh: string }>
    }>
  }
}

const toMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return fallback
}

const display = (value?: string | null) => {
  const normalized = String(value ?? '').trim()
  return normalized || 'Chưa cập nhật'
}

const combinePlace = (...parts: Array<string | null | undefined>) => {
  const values = parts.map((part) => String(part ?? '').trim()).filter(Boolean)
  return values.length > 0 ? values.join(', ') : 'Chưa cập nhật'
}

const splitDateTime = (value?: string | null) => {
  const normalized = value?.slice(0, 16) ?? ''
  const [date = '', time = ''] = normalized.split('T')

  return { date, time }
}

const joinDateTime = (date: string, time: string) => {
  if (!date || !time) return null
  return `${date}T${time}`
}

const resolveImageUrl = (value?: string | null) => {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith('/')) return `${API_BASE_URL}${value}`
  if (value.startsWith('api/student-images/')) return `${API_BASE_URL}/${value}`
  if (value.startsWith('storage/')) return `${API_BASE_URL}/${value}`
  return `${API_BASE_URL}/api/student-images/${value}`
}

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const studentInfoSections = (student: StudentAccount): Array<{ title: string; fields: Array<[string, string]> }> => {
  const profile = student.profile
  return [
    {
      title: 'Thông tin cá nhân',
      fields: [
        ['Mã sinh viên', student.username],
        ['Họ tên', display(student.display_name || profile?.ten_sinh_vien)],
        ['Ngày sinh', display(profile?.ngay_sinh)],
        ['Nơi sinh', display(profile?.noi_sinh)],
        ['Giới tính', display(profile?.gioi_tinh)],
        ['Email', display(student.email || profile?.email)],
        ['Số điện thoại', display(profile?.so_dien_thoai)],
        ['Số CCCD', display(profile?.so_cccd)],
        ['Ngày cấp CCCD', display(profile?.ngay_cap_cccd)],
        ['Nơi cấp CCCD', display(profile?.noi_cap_cccd)],
      ],
    },
    {
      title: 'Thông tin học tập',
      fields: [
        ['Lớp', display(profile?.ma_lop)],
        ['Ngành học', display(profile?.ten_nganh_hoc)],
        ['Đơn vị', display(profile?.ten_don_vi)],
        ['Hệ đào tạo', display(profile?.he_dao_tao)],
        ['Năm nhập học', display(profile?.nam_nhap_hoc === null || profile?.nam_nhap_hoc === undefined ? null : String(profile.nam_nhap_hoc))],
        ['Khóa học', display(profile?.khoa_hoc)],
      ],
    },
    {
      title: 'Thông tin liên hệ và hộ khẩu',
      fields: [
        ['Hộ khẩu tỉnh/thành phố', display(profile?.ho_khau_tinh_thanh_pho)],
        ['Hộ khẩu quận/huyện', display(profile?.ho_khau_quan_huyen)],
        ['Quê quán', profile?.que_quan || combinePlace(profile?.que_quan_quan_huyen, profile?.que_quan_tinh_thanh_pho)],
        ['Dân tộc', display(profile?.dan_toc)],
        ['Tôn giáo', display(profile?.ton_giao)],
        ['Địa chỉ liên lạc', display(profile?.dia_chi_lien_lac)],
        ['Số điện thoại gia đình', display(profile?.so_dien_thoai_gia_dinh)],
      ],
    },
    {
      title: 'Thông tin gia đình',
      fields: [
        ['Họ tên cha', display(profile?.ho_ten_cha)],
        ['Ngày sinh cha', display(profile?.ngay_sinh_cha)],
        ['Quê quán cha', display(profile?.que_quan_cha)],
        ['Nghề nghiệp cha', display(profile?.nghe_nghiep_cha)],
        ['Họ tên mẹ', display(profile?.ho_ten_me)],
        ['Ngày sinh mẹ', display(profile?.ngay_sinh_me)],
        ['Quê quán mẹ', display(profile?.que_quan_me)],
        ['Nghề nghiệp mẹ', display(profile?.nghe_nghiep_me)],
      ],
    },
  ]
}

export default function AdminStudentInfoPage({ access = 'admin' }: StudentInfoPageProps) {
  const { showAlert } = useAlert()
  const canConfigure = access === 'admin'
  const canUploadImage = access === 'admin'
  const canEditAcademicInfo = access === 'training_officer'
  const isSimpleLookup = access !== 'admin'
  const [activeTab, setActiveTab] = useState<ActiveTab>(canConfigure ? 'config' : 'lookup')
  const [students, setStudents] = useState<StudentAccount[]>([])
  const [catalog, setCatalog] = useState<StudentCatalogResponse['data'] | null>(null)
  const [search, setSearch] = useState('')
  const [studentCode, setStudentCode] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingWindow, setIsSavingWindow] = useState(false)
  const [uploadingImageId, setUploadingImageId] = useState<number | null>(null)
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null)
  const [academicDrafts, setAcademicDrafts] = useState<Record<number, { lop_id: string; nganh_dao_tao_id: string }>>({})
  const [profileWindow, setProfileWindow] = useState({
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    is_open: false,
  })

  const setWindowFromResponse = (data: StudentProfileEditWindowResponse['data']) => {
    const start = splitDateTime(data.starts_at)
    const end = splitDateTime(data.ends_at)

    setProfileWindow({
      start_date: start.date,
      start_time: start.time,
      end_date: end.date,
      end_time: end.time,
      is_open: data.is_open,
    })
  }

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [accountsResponse, profileWindowResponse, catalogResponse] = await Promise.all([
        apiGet<AccountsResponse>('/admin/accounts', { params: { role: 'student' } }),
        canConfigure ? apiGet<StudentProfileEditWindowResponse>('/admin/student-profile-edit-window') : Promise.resolve(null),
        canEditAcademicInfo ? apiGet<StudentCatalogResponse>('/admin/accounts/student-catalog') : Promise.resolve(null),
      ])

      setStudents(accountsResponse.data)
      setAcademicDrafts(Object.fromEntries(accountsResponse.data.map((student) => [
        student.id,
        {
          lop_id: String(student.profile?.lop_id ?? ''),
          nganh_dao_tao_id: String(student.profile?.nganh_dao_tao_id ?? ''),
        },
      ])))
      if (profileWindowResponse) setWindowFromResponse(profileWindowResponse.data)
      if (catalogResponse) setCatalog(catalogResponse.data)
    } catch (error) {
      showAlert({
        title: 'Không tải được thông tin sinh viên',
        message: toMessage(error, 'Vui lòng kiểm tra backend hoặc quyền quản trị.'),
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return students

    return students.filter((student) => [
      student.username,
      student.display_name ?? '',
      student.email ?? '',
      student.profile?.ma_lop ?? '',
      student.profile?.ten_nganh_hoc ?? '',
      student.profile?.so_dien_thoai ?? '',
    ].some((value) => value.toLowerCase().includes(keyword)))
  }, [search, students])

  const allClasses = useMemo(() => (
    catalog?.don_vis.flatMap((unit) => unit.lops ?? []) ?? []
  ), [catalog])

  const allMajors = useMemo(() => (
    catalog?.don_vis.flatMap((unit) => unit.nganh_dao_taos ?? []) ?? []
  ), [catalog])

  const updateAcademicDraft = (studentId: number, field: 'lop_id' | 'nganh_dao_tao_id', value: string) => {
    setAcademicDrafts((current) => ({
      ...current,
      [studentId]: {
        lop_id: current[studentId]?.lop_id ?? '',
        nganh_dao_tao_id: current[studentId]?.nganh_dao_tao_id ?? '',
        [field]: value,
      },
    }))
  }

  const handleSaveAcademicInfo = async (student: StudentAccount) => {
    const draft = academicDrafts[student.id]
    if (!draft) return

    setSavingStudentId(student.id)
    try {
      const response = await apiPut<{ data: StudentAccount }, { lop_id: number | null; nganh_dao_tao_id: number | null }>(
        `/training-officer/students/${student.id}/academic-info`,
        {
          lop_id: draft.lop_id ? Number(draft.lop_id) : null,
          nganh_dao_tao_id: draft.nganh_dao_tao_id ? Number(draft.nganh_dao_tao_id) : null,
        },
      )

      setStudents((current) => current.map((item) => (item.id === student.id ? response.data : item)))
      showAlert({
        title: 'Đã cập nhật sinh viên',
        message: 'Lớp và ngành học của sinh viên đã được lưu.',
        variant: 'success',
      })
    } catch (error) {
      showAlert({
        title: 'Không cập nhật được sinh viên',
        message: toMessage(error, 'Vui lòng kiểm tra quyền chuyên viên hoặc dữ liệu lớp/ngành.'),
        variant: 'error',
      })
    } finally {
      setSavingStudentId(null)
    }
  }

  const handleSaveProfileWindow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const startsAt = joinDateTime(profileWindow.start_date, profileWindow.start_time)
    const endsAt = joinDateTime(profileWindow.end_date, profileWindow.end_time)

    if (!startsAt || !endsAt) {
      showAlert({
        title: 'Thiếu thời gian',
        message: 'Vui lòng nhập đủ ngày bắt đầu, giờ bắt đầu, ngày kết thúc và giờ kết thúc.',
        variant: 'warning',
      })
      return
    }

    setIsSavingWindow(true)
    try {
      const response = await apiPost<StudentProfileEditWindowResponse, {
        starts_at: string | null
        ends_at: string | null
        enabled: boolean
      }>('/admin/student-profile-edit-window', {
        starts_at: startsAt,
        ends_at: endsAt,
        enabled: true,
      })

      setWindowFromResponse(response.data)
      showAlert({
        title: 'Đã lưu cấu hình',
        message: 'Thời gian sinh viên chỉnh sửa thông tin đã được cập nhật.',
        variant: 'success',
      })
    } catch (error) {
      showAlert({
        title: 'Lưu thất bại',
        message: toMessage(error, 'Không thể lưu thời gian chỉnh sửa thông tin.'),
        variant: 'error',
      })
    } finally {
      setIsSavingWindow(false)
    }
  }

  const handleUploadStudentImage = async (student: StudentAccount, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const formData = new FormData()
    formData.append('anh', file)
    setUploadingImageId(student.id)

    try {
      await apiPost(`/admin/accounts/${student.id}/upload-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      showAlert({
        title: 'Đã cập nhật ảnh',
        message: `Ảnh hồ sơ của ${student.display_name || student.username} đã được lưu.`,
        variant: 'success',
      })
      await loadData()
    } catch (error) {
      showAlert({
        title: 'Không lưu được ảnh',
        message: toMessage(error, 'Vui lòng chọn ảnh JPG/PNG/GIF dưới 5MB và thử lại.'),
        variant: 'error',
      })
    } finally {
      setUploadingImageId(null)
    }
  }

  const handleFindStudent = () => {
    const code = studentCode.trim()
    const student = students.find((item) => item.username === code)
    setSelectedStudent(student ?? null)

    if (!student) {
      showAlert({
        title: 'Không tìm thấy sinh viên',
        message: 'Vui lòng kiểm tra lại mã sinh viên.',
        variant: 'warning',
      })
    }
  }

  const printStudentInfo = () => {
    if (!selectedStudent) return

    const student = selectedStudent
    const sections = studentInfoSections(student)
    const rows = sections.flatMap((section) => [
      [section.title, '__SECTION__'] as [string, string],
      ...section.fields,
    ])
    const printTitle = 'Thông tin sinh viên'
    const html = `<!doctype html><html><head><meta charset="utf-8">${printFaviconLink}<title>${printTitle}</title>
      <style>
        ${printBrandStyles}
        body{font-family:"Times New Roman",serif;margin:24px;color:#111;font-size:14px}
        .print-school{text-align:center;font-size:16px;font-weight:700;margin:0 0 4px}
        .print-school ~ .print-school{display:none}
        h1{text-align:center;font-size:18px;margin:0 0 20px}
        table{width:720px;max-width:100%;margin:0 auto;border-collapse:collapse}
        th,td{border:1px solid #555;padding:8px 10px;text-align:left}
        th{width:220px;background:#f3f3f3}
        .toolbar{display:none}
      </style></head><body>
        ${printBrandHtml()}
        <div class="toolbar"><button onclick="window.print()">In</button><button onclick="window.close()">Đóng</button></div>
        <h1>THÔNG TIN SINH VIÊN</h1>
        <table>
          <tr><th>Họ tên sinh viên</th><td>${escapeHtml(display(student.display_name || student.profile?.ten_sinh_vien))}</td></tr>
          <tr><th>Lớp</th><td>${escapeHtml(display(student.profile?.ma_lop))}</td></tr>
          ${rows.map(([label, value]) => value === '__SECTION__'
            ? `<tr><th colspan="2" style="background:#e5e7eb;text-align:left">${escapeHtml(label)}</th></tr>`
            : `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}
        </table>
      </body></html>`
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.setTimeout(() => printWindow.print(), 250)
  }

  return (
    <main className="asi-main">
      <section className="asi-section">
        {access === 'admin' && <div className="asi-section-header">
          <div>
            <h2 className="asi-section-title">Thông tin sinh viên</h2>
            <p className="asi-section-desc">Cấu hình thời gian chỉnh sửa và tra cứu hồ sơ sinh viên.</p>
          </div>
          {canConfigure && <div className={`asi-window-badge ${profileWindow.is_open ? 'open' : 'closed'}`}>
            {profileWindow.is_open ? 'Đang mở chỉnh sửa' : 'Đang đóng chỉnh sửa'}
          </div>}
        </div>}

        {canConfigure && <div className="asi-tabs" role="tablist" aria-label="Thông tin sinh viên">
          <button
            type="button"
            className={`asi-tab ${activeTab === 'config' ? 'active' : ''}`}
            aria-selected={activeTab === 'config'}
            onClick={() => setActiveTab('config')}
          >
            Cấu hình chỉnh sửa
          </button>
          <button
            type="button"
            className={`asi-tab ${activeTab === 'lookup' ? 'active' : ''}`}
            aria-selected={activeTab === 'lookup'}
            onClick={() => setActiveTab('lookup')}
          >
            Tra cứu thông tin sinh viên
          </button>
        </div>}

        {canConfigure && activeTab === 'config' && (
          <div className="asi-card asi-config-card">
            <form onSubmit={handleSaveProfileWindow}>
              <div className="asi-form-grid">
                <label className="asi-form-group">
                  <span className="asi-label">Ngày bắt đầu</span>
                  <Input
                    type="date"
                    className="asi-input"
                    value={profileWindow.start_date}
                    onChange={(event) => setProfileWindow((current) => ({ ...current, start_date: event.target.value }))}
                  />
                </label>
                <label className="asi-form-group">
                  <span className="asi-label">Giờ bắt đầu</span>
                  <Input
                    type="time"
                    className="asi-input"
                    value={profileWindow.start_time}
                    onChange={(event) => setProfileWindow((current) => ({ ...current, start_time: event.target.value }))}
                  />
                </label>
                <label className="asi-form-group">
                  <span className="asi-label">Ngày kết thúc</span>
                  <Input
                    type="date"
                    className="asi-input"
                    value={profileWindow.end_date}
                    min={profileWindow.start_date || undefined}
                    onChange={(event) => setProfileWindow((current) => ({ ...current, end_date: event.target.value }))}
                  />
                </label>
                <label className="asi-form-group">
                  <span className="asi-label">Giờ kết thúc</span>
                  <Input
                    type="time"
                    className="asi-input"
                    value={profileWindow.end_time}
                    min={profileWindow.start_date && profileWindow.end_date === profileWindow.start_date ? profileWindow.start_time : undefined}
                    onChange={(event) => setProfileWindow((current) => ({ ...current, end_time: event.target.value }))}
                  />
                </label>
              </div>

              <div className="asi-form-actions">
                <Button type="submit" className="asi-save-btn" disabled={isSavingWindow}>
                  {isSavingWindow ? 'Đang lưu...' : 'Lưu cấu hình'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {isSimpleLookup && (
          <div className="asi-card asi-manager-lookup">
            <div className="asi-student-code-form">
              <label>
                <span>Mã sinh viên</span>
                <Input
                  value={studentCode}
                  onChange={(event) => setStudentCode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleFindStudent()
                  }}
                />
              </label>
              <Button type="button" className="asi-execute-btn" onClick={handleFindStudent}>
                <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                Thực hiện
              </Button>
            </div>

            {selectedStudent && (
              <div className="asi-student-print-card">
                <div className="asi-student-summary-line">
                  <span>Họ tên sinh viên:</span>
                  <strong>{display(selectedStudent.display_name || selectedStudent.profile?.ten_sinh_vien)}</strong>
                  <span>- Lớp:</span>
                  <strong>{display(selectedStudent.profile?.ma_lop)}</strong>
                </div>
                <div className="asi-student-info-sections">
                  {studentInfoSections(selectedStudent).map((section) => (
                    <section className="asi-student-info-section" key={section.title}>
                      <h3>{section.title}</h3>
                      <div className="asi-student-info-grid">
                        {section.fields.map(([label, value]) => (
                          <div className="asi-student-info-row" key={`${section.title}-${label}`}>
                            <span>{label}</span>
                            <strong>{value}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
                <Button type="button" className="asi-print-btn" onClick={printStudentInfo}>
                  In thông tin
                </Button>
              </div>
            )}
          </div>
        )}

        {access === 'admin' && activeTab === 'lookup' && (
          <div className="asi-card">
            <div className="asi-toolbar">
              <div className="asi-card-title">
                <h2>Tra cứu thông tin sinh viên</h2>
                <span>{filteredStudents.length} / {students.length} sinh viên</span>
              </div>
              <Input
                type="search"
                className="asi-search"
                placeholder="Tìm MSSV, họ tên, lớp, ngành, SĐT..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="asi-table-wrap">
              <table className="asi-table">
                <thead>
                  <tr>
                    <th>Ảnh</th>
                    <th>MSSV</th>
                    <th>Họ tên</th>
                    <th>Lớp</th>
                    <th>Ngành</th>
                    <th>Liên hệ</th>
                    <th>Quê quán</th>
                    {canUploadImage && <th>Ảnh hồ sơ</th>}
                    {canEditAcademicInfo && <th>Cập nhật</th>}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7 + (canUploadImage ? 1 : 0) + (canEditAcademicInfo ? 1 : 0)} className="asi-empty">Đang tải danh sách sinh viên...</td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7 + (canUploadImage ? 1 : 0) + (canEditAcademicInfo ? 1 : 0)} className="asi-empty">Không tìm thấy sinh viên phù hợp.</td>
                    </tr>
                  ) : filteredStudents.map((student) => {
                    const imageUrl = resolveImageUrl(student.profile?.anh_url || student.profile?.anh)
                    const draft = academicDrafts[student.id] ?? { lop_id: '', nganh_dao_tao_id: '' }

                    return (
                      <tr key={student.id}>
                        <td>
                          <div className="asi-avatar">
                            {imageUrl ? <img src={imageUrl} alt={display(student.display_name)} /> : <span>{student.display_name?.charAt(0) || 'S'}</span>}
                          </div>
                        </td>
                        <td className="asi-code">{student.username}</td>
                        <td>{display(student.display_name || student.profile?.ten_sinh_vien)}</td>
                        <td>
                          {canEditAcademicInfo ? (
                            <select className="asi-inline-select" value={draft.lop_id} onChange={(event) => updateAcademicDraft(student.id, 'lop_id', event.target.value)}>
                              <option value="">Chưa chọn lớp</option>
                              {allClasses.map((item) => <option key={item.id} value={item.id}>{item.lop_hoc_phan}</option>)}
                            </select>
                          ) : display(student.profile?.ma_lop)}
                        </td>
                        <td>
                          {canEditAcademicInfo ? (
                            <select className="asi-inline-select" value={draft.nganh_dao_tao_id} onChange={(event) => updateAcademicDraft(student.id, 'nganh_dao_tao_id', event.target.value)}>
                              <option value="">Chưa chọn ngành</option>
                              {allMajors.map((item) => <option key={item.id} value={item.id}>{item.ten_nganh}</option>)}
                            </select>
                          ) : display(student.profile?.ten_nganh_hoc)}
                        </td>
                        <td>
                          <div className="asi-stack">
                            <span>{display(student.profile?.so_dien_thoai)}</span>
                            <small>GĐ: {display(student.profile?.so_dien_thoai_gia_dinh)}</small>
                          </div>
                        </td>
                        <td>{student.profile?.que_quan || combinePlace(student.profile?.que_quan_quan_huyen, student.profile?.que_quan_tinh_thanh_pho)}</td>
                        {canUploadImage && <td>
                          <label className={`asi-upload ${uploadingImageId === student.id ? 'loading' : ''}`}>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/gif"
                              disabled={uploadingImageId === student.id}
                              onChange={(event) => void handleUploadStudentImage(student, event)}
                            />
                            {uploadingImageId === student.id ? 'Đang tải...' : 'Chọn ảnh'}
                          </label>
                        </td>}
                        {canEditAcademicInfo && (
                          <td>
                            <Button type="button" className="asi-save-small" disabled={savingStudentId === student.id} onClick={() => void handleSaveAcademicInfo(student)}>
                              {savingStudentId === student.id ? 'Đang lưu...' : 'Lưu'}
                            </Button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
