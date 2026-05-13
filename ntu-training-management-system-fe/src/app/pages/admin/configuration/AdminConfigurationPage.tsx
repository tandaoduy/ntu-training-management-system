import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '@/api/core/request'
import { useAlert } from '@/components/alert'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
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

export default function AdminConfigurationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { showAlert } = useAlert()

  const [academicYearsList, setAcademicYearsList] = useState<AcademicYear[]>([])
  const [academicYearMode, setAcademicYearMode] = useState<'select' | 'new'>('select')
  const [academicYear, setAcademicYear] = useState('')
  const [newYearInput, setNewYearInput] = useState('')
  const [yearError, setYearError] = useState('')
  const [semester, setSemester] = useState('2')

  const minAcademicYear = 2023

  const fetchAcademicTerms = async () => {
    const response = await apiGet<AcademicTermsResponse>('/admin/academic-terms')
    const years = response.nam_hocs ?? []
    const currentTerm = response.current_academic_term

    setAcademicYearsList(years)

    if (currentTerm) {
      setAcademicYear(currentTerm.nam_hoc)
      setSemester(currentTerm.hoc_ky)
      return
    }

    const firstYear = years[0]?.nam_hoc ?? ''
    setAcademicYear(firstYear)
    setSemester('2')
  }

  useEffect(() => {
    let isMounted = true

    const loadAcademicTerms = async () => {
      setIsLoading(true)

      try {
        const response = await apiGet<AcademicTermsResponse>('/admin/academic-terms')

        if (!isMounted) {
          return
        }

        const years = response.nam_hocs ?? []
        const currentTerm = response.current_academic_term

        setAcademicYearsList(years)
        setAcademicYear(currentTerm?.nam_hoc ?? years[0]?.nam_hoc ?? '')
        setSemester(currentTerm?.hoc_ky ?? '2')
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
                          onFocus={() => {
                            if (newYearInput.includes('-')) {
                              setNewYearInput(newYearInput.split('-')[0])
                            }
                          }}
                          onBlur={() => {
                            const yearStr = newYearInput.split('-')[0]
                            const yearNum = parseInt(yearStr, 10)
                            if (!isNaN(yearNum) && yearNum >= minAcademicYear) {
                              setNewYearInput(`${yearNum}-${yearNum + 1}`)
                            }
                          }}
                          onChange={(e) => {
                            // Chỉ cho phép nhập số
                            const val = e.target.value.replace(/\D/g, '')
                            setNewYearInput(val)
                            
                            if (val && parseInt(val, 10) < minAcademicYear) {
                              setYearError(`Năm học phải lớn hơn hoặc bằng ${minAcademicYear}`)
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

      </main>
    </>
  )
}
