import { useState } from 'react'
import { useAlert } from '@/components/alert'
import './AdminConfigurationPage.css'

export default function AdminConfigurationPage() {
  const [isSaving, setIsSaving] = useState(false)
  const { showAlert } = useAlert()

  // Form state
  const [academicYearsList, setAcademicYearsList] = useState<string[]>(['2025-2026', '2024-2025', '2023-2024'])
  const [academicYearMode, setAcademicYearMode] = useState<'select' | 'new'>('select')
  const [academicYear, setAcademicYear] = useState(() => localStorage.getItem('sys_academic_year') || '2025-2026')
  const [newYearInput, setNewYearInput] = useState('')
  const [yearError, setYearError] = useState('')
  const [semester, setSemester] = useState(() => localStorage.getItem('sys_semester') || '2')

  const currentYear = new Date().getFullYear()

  const handleSave = (e: React.FormEvent) => {
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
      if (isNaN(yearNum) || yearNum < currentYear) {
        setYearError(`Năm học phải lớn hơn hoặc bằng năm hiện tại (${currentYear})`)
        return
      }
      yearToSave = `${yearNum}-${yearNum + 1}`
    }

    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      
      showAlert({
        title: 'Thành công',
        message: 'Đã cập nhật cấu hình thời gian thành công',
        variant: 'success'
      })

      // Cập nhật giao diện và localStorage như thể đã lưu vào DB
      localStorage.setItem('sys_academic_year', yearToSave)
      localStorage.setItem('sys_semester', semester)

      if (academicYearMode === 'new') {
        if (!academicYearsList.includes(yearToSave)) {
          setAcademicYearsList((prev) => [yearToSave, ...prev].sort((a, b) => b.localeCompare(a)))
        }
        setAcademicYear(yearToSave)
        setAcademicYearMode('select')
        setNewYearInput('')
      }
    }, 1000)
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
                    <select 
                      className="ac-select" 
                      value={academicYear} 
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setAcademicYearMode('new')
                          setNewYearInput('')
                          setYearError('')
                        } else {
                          setAcademicYear(e.target.value)
                        }
                      }}
                    >
                      <option value="new" style={{ fontWeight: 'bold', color: '#3182ce' }}>+ Tạo năm học mới</option>
                      {academicYearsList.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
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
                            if (!isNaN(yearNum) && yearNum >= currentYear) {
                              setNewYearInput(`${yearNum}-${yearNum + 1}`)
                            }
                          }}
                          onChange={(e) => {
                            // Chỉ cho phép nhập số
                            const val = e.target.value.replace(/\D/g, '')
                            setNewYearInput(val)
                            
                            if (val && parseInt(val, 10) < currentYear) {
                              setYearError(`Năm học phải lớn hơn hoặc bằng ${currentYear}`)
                            } else {
                              setYearError('')
                            }
                          }}
                          placeholder={`Nhập năm (VD: ${currentYear})`}
                          style={{ 
                            borderColor: yearError ? '#e53e3e' : undefined,
                            outlineColor: yearError ? '#e53e3e' : undefined
                          }}
                        />
                        <button 
                          type="button" 
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
                        </button>
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
                  <select 
                    className="ac-select" 
                    value={semester} 
                    onChange={(e) => setSemester(e.target.value)}
                  >
                    <option value="1">Học kỳ 1</option>
                    <option value="2">Học kỳ 2</option>
                    <option value="3">Học kỳ Hè</option>
                  </select>
                </div>
              </div>

              <div className="ac-form-actions">
                <button type="submit" className="ac-btn-save" disabled={isSaving}>
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
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  )
}
