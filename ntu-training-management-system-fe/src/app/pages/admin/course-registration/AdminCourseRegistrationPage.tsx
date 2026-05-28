import { useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '@/api/core/request'
import { useAlert } from '@/components/alert'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { formatDisplayDateTime } from '@/utils/dateFormat'
import '../configuration/AdminConfigurationPage.css'

type AcademicTerm = { id: number; nam_hoc_id: number; nam_hoc: string; hoc_ky: string }
type AcademicYear = { id: number; nam_hoc: string; hoc_kys?: AcademicTerm[] }
type TermsResponse = { nam_hocs: AcademicYear[]; current_academic_term: AcademicTerm | null }
type Period = {
  id: number
  hoc_ky_id: number
  starts_at: string
  ends_at: string
  term?: { nam_hoc?: string; hoc_ky?: string } | null
}

const formatDateTime = (value: string) => {
  return formatDisplayDateTime(value)
}

export default function AdminCourseRegistrationPage() {
  const { showAlert } = useAlert()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [yearId, setYearId] = useState('')
  const [semester, setSemester] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const availableSemesters = useMemo(() => (
    years.find((year) => String(year.id) === yearId)?.hoc_kys ?? []
  ), [yearId, years])

  const selectedTermId = availableSemesters.find((term) => String(term.hoc_ky) === semester)?.id
  const startsAt = startDate && startTime ? `${startDate}T${startTime}` : ''
  const endsAt = endDate && endTime ? `${endDate}T${endTime}` : ''

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [termsResponse, periodsResponse] = await Promise.all([
        apiGet<TermsResponse>('/admin/academic-terms'),
        apiGet<{ data: Period[] }>('/admin/course-registration-periods'),
      ])
      setYears(termsResponse.nam_hocs ?? [])
      setPeriods(periodsResponse.data ?? [])
      const current = termsResponse.current_academic_term
      if (current) {
        setYearId(String(current.nam_hoc_id))
        setSemester(String(current.hoc_ky))
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData().catch(() =>
      showAlert({ title: 'Không tải được dữ liệu', message: 'Vui lòng kiểm tra backend.', variant: 'error' })
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async () => {
    if (!selectedTermId || !startsAt || !endsAt) {
      showAlert({ title: 'Thiếu thông tin', message: 'Vui lòng chọn học kỳ và thời gian bắt đầu/kết thúc.', variant: 'error' })
      return
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      showAlert({ title: 'Thời gian không hợp lệ', message: 'Thời điểm kết thúc phải sau thời điểm bắt đầu.', variant: 'error' })
      return
    }

    setIsSaving(true)
    try {
      await apiPost('/admin/course-registration-periods', {
        hoc_ky_id: Number(selectedTermId),
        starts_at: startsAt,
        ends_at: endsAt,
        status: 'open',
      })
      showAlert({ title: 'Đã cấu hình', message: 'Sinh viên chỉ đăng ký được trong khoảng thời gian vừa mở.', variant: 'success' })
      await loadData()
    } catch (err) {
      showAlert({ title: 'Không lưu được', message: err instanceof Error ? err.message : 'Vui lòng thử lại.', variant: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="ac-main">
      <section className="ac-section">
        <div className="ac-section-header">
          <h2 className="ac-section-title">Đăng ký học phần</h2>
          <p className="ac-section-desc">Cấu hình thời gian mở đăng ký học phần cho sinh viên.</p>
        </div>

        <div className="ac-card">
          <form onSubmit={(e) => { e.preventDefault(); void handleSave() }}>
            <div className="ac-form-grid">
              <div className="ac-form-group">
                <label className="ac-label">Năm học</label>
                <Select
                  className="ac-select"
                  value={yearId}
                  disabled={isLoading}
                  onChange={(e) => { setYearId(e.target.value); setSemester('') }}
                  options={[
                    { label: 'Chọn năm học', value: '' },
                    ...years.map((year) => ({ label: year.nam_hoc, value: String(year.id) })),
                  ]}
                />
              </div>
              <div className="ac-form-group">
                <label className="ac-label">Học kỳ</label>
                <Select
                  className="ac-select"
                  value={semester}
                  disabled={isLoading}
                  onChange={(e) => setSemester(e.target.value)}
                  options={[
                    { label: 'Chọn học kỳ', value: '' },
                    ...availableSemesters.map((term) => ({ label: `Học kỳ ${term.hoc_ky}`, value: term.hoc_ky })),
                  ]}
                />
              </div>
              <div className="ac-form-group">
                <label className="ac-label">Ngày bắt đầu</label>
                <Input type="date" className="ac-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="ac-form-group">
                <label className="ac-label">Giờ bắt đầu</label>
                <Input type="time" className="ac-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="ac-form-group">
                <label className="ac-label">Ngày kết thúc</label>
                <Input type="date" className="ac-input" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="ac-form-group">
                <label className="ac-label">Giờ kết thúc</label>
                <Input type="time" className="ac-input" value={endTime} min={startDate && endDate === startDate ? startTime : undefined} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="ac-form-actions">
              <Button
                type="submit"
                className="ac-btn-save"
                disabled={isSaving || isLoading}
              >
                {isSaving ? 'Đang lưu...' : 'Mở đăng ký'}
              </Button>
            </div>
          </form>

          <div style={{ marginTop: 18, overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #e2e8f0', padding: 10, textAlign: 'left' }}>Học kỳ</th>
                  <th style={{ borderBottom: '1px solid #e2e8f0', padding: 10, textAlign: 'left' }}>Bắt đầu</th>
                  <th style={{ borderBottom: '1px solid #e2e8f0', padding: 10, textAlign: 'left' }}>Kết thúc</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => (
                  <tr key={period.id}>
                    <td style={{ borderBottom: '1px solid #edf2f7', padding: 10 }}>
                      {period.term?.nam_hoc} - Học kỳ {period.term?.hoc_ky}
                    </td>
                    <td style={{ borderBottom: '1px solid #edf2f7', padding: 10 }}>{formatDateTime(period.starts_at)}</td>
                    <td style={{ borderBottom: '1px solid #edf2f7', padding: 10 }}>{formatDateTime(period.ends_at)}</td>
                  </tr>
                ))}
                {periods.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: 12, color: '#64748b' }}>Chưa có đợt đăng ký.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  )
}
