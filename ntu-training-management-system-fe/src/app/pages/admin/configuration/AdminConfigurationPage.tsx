import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '@/api/core/request'
import { useAlert } from '@/components/alert'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { isFourDigitYearDate, sanitizeDateInputValue } from '@/utils/dateInput'
import { clampPositiveInteger } from '@/utils/numberInput'
import './AdminConfigurationPage.css'

type AcademicTerm = {
  id: number
  nam_hoc_id: number
  nam_hoc: string
  hoc_ky: string
}

type AcademicYear = {
  id: number
  nam_hoc: string
  hoc_kys?: AcademicTerm[]
}

type AcademicTermsResponse = {
  nam_hocs: AcademicYear[]
  current_academic_term: AcademicTerm | null
}

type SwitchAcademicTermResponse = {
  data: {
    current_academic_term: AcademicTerm
  }
}

type WeekConfig = {
  id: number
  hoc_ky_id: number
  tuan_1_bat_dau: string
  so_tuan_mac_dinh: number
  hoc_ky?: {
    id: number
    hoc_ky: string
    nam_hoc?: string | null
  } | null
}

type TimetableCatalogResponse = {
  data: {
    cau_hinh_tuan_hocs: WeekConfig[]
  }
}

type WeekConfigForm = {
  hoc_ky_id: string
  tuan_1_bat_dau: string
  so_tuan_mac_dinh: string
}

const emptyWeekForm: WeekConfigForm = { hoc_ky_id: '', tuan_1_bat_dau: '', so_tuan_mac_dinh: '19' }

const toMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return fallback
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN')
}

export default function AdminConfigurationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingWeekConfig, setIsSavingWeekConfig] = useState(false)
  const { showAlert } = useAlert()

  const [academicYearsList, setAcademicYearsList] = useState<AcademicYear[]>([])
  const [academicYearMode, setAcademicYearMode] = useState<'select' | 'new'>('select')
  const [academicYear, setAcademicYear] = useState('')
  const [newYearInput, setNewYearInput] = useState('')
  const [yearError, setYearError] = useState('')
  const [semester, setSemester] = useState('2')
  const [weekConfigs, setWeekConfigs] = useState<WeekConfig[]>([])
  const [weekForm, setWeekForm] = useState<WeekConfigForm>(emptyWeekForm)

  const minAcademicYear = 2023

  const termOptions = academicYearsList.flatMap((year) =>
    (year.hoc_kys ?? []).map((term) => ({
      id: term.id,
      label: `${year.nam_hoc} - Học kỳ ${term.hoc_ky}`,
    })),
  )

  const fetchTimetableManagementCatalogs = async () => {
    const response = await apiGet<TimetableCatalogResponse>('/admin/timetable-management/catalogs')

    setWeekConfigs(response.data.cau_hinh_tuan_hocs)
  }

  const fetchAcademicTerms = async () => {
    const response = await apiGet<AcademicTermsResponse>('/admin/academic-terms')
    const years = response.nam_hocs ?? []
    const currentTerm = response.current_academic_term

    setAcademicYearsList(years)

    if (currentTerm) {
      setAcademicYear(currentTerm.nam_hoc)
      setSemester(currentTerm.hoc_ky)
      setWeekForm((current) => ({ ...current, hoc_ky_id: String(currentTerm.id) }))
      return
    }

    const firstYear = years[0]?.nam_hoc ?? ''
    const firstTerm = years.flatMap((year) => year.hoc_kys ?? [])[0]
    setAcademicYear(firstYear)
    setSemester('2')
    if (firstTerm) {
      setWeekForm((current) => ({ ...current, hoc_ky_id: String(firstTerm.id) }))
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadAcademicTerms = async () => {
      setIsLoading(true)

      try {
        const [response, timetableCatalogsResponse] = await Promise.all([
          apiGet<AcademicTermsResponse>('/admin/academic-terms'),
          apiGet<TimetableCatalogResponse>('/admin/timetable-management/catalogs'),
        ])

        if (!isMounted) {
          return
        }

        const years = response.nam_hocs ?? []
        const currentTerm = response.current_academic_term

        setAcademicYearsList(years)
        setAcademicYear(currentTerm?.nam_hoc ?? years[0]?.nam_hoc ?? '')
        setSemester(currentTerm?.hoc_ky ?? '2')
        setWeekConfigs(timetableCatalogsResponse.data.cau_hinh_tuan_hocs)

        const firstTerm = years.flatMap((year) => year.hoc_kys ?? [])[0]
        const selectedTermId = currentTerm?.id ?? firstTerm?.id
        if (selectedTermId) {
          setWeekForm((current) => ({ ...current, hoc_ky_id: String(selectedTermId) }))
        }
      } catch {
        if (!isMounted) {
          return
        }

        showAlert({
          title: 'Không tải được cấu hình',
          message: 'Vui lòng kiểm tra kết nối backend hoặc quyền cấu hình năm học.',
          variant: 'error',
        })
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadAcademicTerms()

    return () => {
      isMounted = false
    }
  }, [showAlert])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    let yearToSave = academicYear

    // Validate new year
    if (academicYearMode === 'new') {
      if (!newYearInput) {
        setYearError('Vui lòng nhập năm học')
        return
      }
      const yearStr = newYearInput.split('-')[0]
      if (!/^\d{4}$/.test(yearStr)) {
        setYearError('Năm học phải gồm đúng 4 chữ số')
        return
      }
      const yearNum = parseInt(yearStr, 10)
      if (isNaN(yearNum) || yearNum < minAcademicYear) {
        setYearError(`Năm học phải lớn hơn hoặc bằng ${minAcademicYear}`)
        return
      }
      yearToSave = `${yearNum}-${yearNum + 1}`
    }

    if (!yearToSave) {
      setYearError('Vui lòng chọn năm học')
      return
    }

    setIsSaving(true)
    try {
      const response = await apiPost<SwitchAcademicTermResponse, { nam_hoc: string; hoc_ky: string }>(
        '/admin/academic-terms/switch',
        {
          nam_hoc: yearToSave,
          hoc_ky: semester,
        },
      )

      const currentTerm = response.data.current_academic_term

      showAlert({
        title: 'Thành công',
        message: `Đã cập nhật năm học ${currentTerm.nam_hoc}, học kỳ ${currentTerm.hoc_ky} cho toàn hệ thống`,
        variant: 'success'
      })

      if (academicYearMode === 'new') {
        setAcademicYear(yearToSave)
        setAcademicYearMode('select')
        setNewYearInput('')
      }

      try {
        await fetchAcademicTerms()
      } catch {
        setAcademicYear(currentTerm.nam_hoc)
        setSemester(currentTerm.hoc_ky)
      }
    } catch {
      showAlert({
        title: 'Lưu thất bại',
        message: 'Không thể cập nhật cấu hình năm học/học kỳ. Vui lòng thử lại.',
        variant: 'error'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveWeekConfig = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!weekForm.hoc_ky_id || !weekForm.tuan_1_bat_dau || !weekForm.so_tuan_mac_dinh) {
      showAlert({
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn học kỳ, ngày bắt đầu tuần 1 và số tuần mặc định.',
        variant: 'warning',
      })
      return
    }

    if (!isFourDigitYearDate(weekForm.tuan_1_bat_dau)) {
      showAlert({
        title: 'Ngày không hợp lệ',
        message: 'Năm trong ngày bắt đầu tuần 1 chỉ được nhập đúng 4 chữ số.',
        variant: 'error',
      })
      return
    }

    setIsSavingWeekConfig(true)
    try {
      await apiPost('/admin/timetable-management/week-configs', {
        hoc_ky_id: Number(weekForm.hoc_ky_id),
        tuan_1_bat_dau: weekForm.tuan_1_bat_dau,
        so_tuan_mac_dinh: Number(weekForm.so_tuan_mac_dinh),
      })

      showAlert({
        title: 'Thành công',
        message: 'Đã lưu cấu hình tuần học.',
        variant: 'success',
      })

      await fetchTimetableManagementCatalogs()
    } catch (error) {
      showAlert({
        title: 'Lưu thất bại',
        message: toMessage(error, 'Không thể lưu cấu hình tuần học. Vui lòng thử lại.'),
        variant: 'error',
      })
    } finally {
      setIsSavingWeekConfig(false)
    }
  }

  return (
    <>
      {/* ── MAIN CONTENT ── */}
      <main className="ac-main">
        {/* Section: Time Settings */}
        <section className="ac-section">
          <div className="ac-section-header">
            <h2 className="ac-section-title">Thiết lập thời gian hệ thống</h2>
            <p className="ac-section-desc">Cấu hình năm học, học kỳ và các mốc thời gian quan trọng áp dụng cho toàn trường.</p>
          </div>

          <div className="ac-card">
            <form onSubmit={handleSave}>
              <div className="ac-form-grid">
                {/* Academic Year */}
                <div className="ac-form-group">
                  <label className="ac-label">Năm học</label>
                  {academicYearMode === 'select' ? (
                    <div>
                      <Select
                        className="ac-select"
                        value={academicYear}
                        disabled={isLoading}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        options={academicYearsList.map((year) => ({
                          label: year.nam_hoc,
                          value: year.nam_hoc,
                        }))}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          const nextStartYear = Math.max(
                            minAcademicYear,
                            ...academicYearsList
                              .map((year) => parseInt(year.nam_hoc.slice(0, 4), 10))
                              .filter((year) => !Number.isNaN(year)),
                          ) + 1

                          setAcademicYearMode('new')
                          setNewYearInput(String(nextStartYear))
                          setYearError('')
                        }}
                        style={{
                          marginTop: '8px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#1f2937',
                          fontWeight: 700,
                        }}
                      >
                        + Tạo năm học mới
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Input
                          type="text"
                          className="ac-input"
                          value={newYearInput}
                          inputMode="numeric"
                          maxLength={4}
                          pattern="\d{4}"
                          onFocus={() => {
                            if (newYearInput.includes('-')) {
                              setNewYearInput(newYearInput.split('-')[0])
                            }
                          }}
                          onBlur={() => {
                            const yearStr = newYearInput.split('-')[0]
                            const yearNum = parseInt(yearStr, 10)
                            if (/^\d{4}$/.test(yearStr) && !isNaN(yearNum) && yearNum >= minAcademicYear) {
                              setNewYearInput(`${yearNum}-${yearNum + 1}`)
                            }
                          }}
                          onChange={(e) => {
                            // Chỉ cho phép nhập số
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                            setNewYearInput(val)
                            
                            if (val.length === 4 && parseInt(val, 10) < minAcademicYear) {
                              setYearError(`Năm học phải lớn hơn hoặc bằng ${minAcademicYear}`)
                            } else if (val && val.length < 4) {
                              setYearError('Năm học phải gồm đúng 4 chữ số')
                            } else {
                              setYearError('')
                            }
                          }}
                          placeholder={`Nhập năm (VD: ${minAcademicYear})`}
                          style={{ 
                            borderColor: yearError ? '#e53e3e' : undefined,
                            outlineColor: yearError ? '#e53e3e' : undefined
                          }}
                        />
                        <Button
                          type="button" 
                          variant="secondary"
                          onClick={() => {
                            setAcademicYearMode('select')
                            setYearError('')
                          }}
                          style={{ 
                            padding: '10px 16px', 
                            borderRadius: '10px', 
                            border: '1px solid #e2e8f0', 
                            background: '#f7fafc', 
                            cursor: 'pointer',
                            fontWeight: 600,
                            color: '#4a5568',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Hủy
                        </Button>
                      </div>
                      {newYearInput && !yearError && !newYearInput.includes('-') && (
                        <span style={{ color: '#38a169', fontSize: '0.85rem', marginTop: '6px', display: 'block', fontWeight: 500 }}>
                          Năm học sẽ được tạo: {newYearInput}-{parseInt(newYearInput.split('-')[0], 10) + 1}
                        </span>
                      )}
                      {yearError && (
                        <span style={{ color: '#e53e3e', fontSize: '0.85rem', marginTop: '6px', display: 'block', fontWeight: 500 }}>
                          {yearError}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Semester */}
                <div className="ac-form-group">
                  <label className="ac-label">Học kỳ</label>
                  <Select
                    className="ac-select"
                    value={semester}
                    disabled={isLoading}
                    onChange={(e) => setSemester(e.target.value)}
                    options={[
                      { label: 'Học kỳ 1', value: '1' },
                      { label: 'Học kỳ 2', value: '2' },
                      { label: 'Học kỳ Hè', value: 'Hè' },
                    ]}
                  />
                </div>
              </div>

              <div className="ac-form-actions">
                <Button type="submit" className="ac-btn-save" disabled={isLoading || isSaving}>
                  {isSaving ? (
                    <>
                      <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                      Lưu cấu hình
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section className="ac-section">
          <div className="ac-section-header">
            <h2 className="ac-section-title">Cấu hình tuần học</h2>
            <p className="ac-section-desc">Quy định ngày bắt đầu tuần 1 và số tuần mặc định cho từng học kỳ.</p>
          </div>

          <div className="ac-card">
            <form onSubmit={handleSaveWeekConfig}>
              <div className="ac-form-grid">
                <div className="ac-form-group">
                  <label className="ac-label">Học kỳ</label>
                  <Select
                    className="ac-select"
                    value={weekForm.hoc_ky_id}
                    disabled={isLoading}
                    onChange={(event) => setWeekForm((current) => ({ ...current, hoc_ky_id: event.target.value }))}
                    options={[
                      { label: 'Chọn học kỳ', value: '' },
                      ...termOptions.map((term) => ({ label: term.label, value: String(term.id) })),
                    ]}
                  />
                </div>

                <div className="ac-form-group">
                  <label className="ac-label">Tuần 1 bắt đầu</label>
                  <Input
                    type="date"
                    className="ac-input"
                    value={weekForm.tuan_1_bat_dau}
                    disabled={isLoading}
                    onChange={(event) => setWeekForm((current) => ({
                      ...current,
                      tuan_1_bat_dau: sanitizeDateInputValue(event.target.value),
                    }))}
                  />
                </div>

                <div className="ac-form-group">
                  <label className="ac-label">Số tuần mặc định</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[1-9][0-9]*"
                    className="ac-input"
                    value={weekForm.so_tuan_mac_dinh}
                    disabled={isLoading}
                    onChange={(event) => setWeekForm((current) => ({
                      ...current,
                      so_tuan_mac_dinh: clampPositiveInteger(event.target.value, 52),
                    }))}
                  />
                </div>
              </div>

              <div className="ac-form-actions">
                <Button type="submit" className="ac-btn-save" disabled={isLoading || isSavingWeekConfig}>
                  {isSavingWeekConfig ? 'Đang lưu...' : 'Lưu cấu hình tuần học'}
                </Button>
              </div>
            </form>

            <div className="ac-week-list">
              {weekConfigs.map((config) => (
                <div className="ac-week-item" key={config.id}>
                  <strong>
                    {config.hoc_ky?.nam_hoc ?? 'Năm học'} - Học kỳ {config.hoc_ky?.hoc_ky ?? config.hoc_ky_id}
                  </strong>
                  <span>Tuần 1: {formatDate(config.tuan_1_bat_dau)} - {config.so_tuan_mac_dinh} tuần</span>
                </div>
              ))}
              {weekConfigs.length === 0 && (
                <div className="ac-empty-state">Chưa có cấu hình tuần học.</div>
              )}
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
