import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '@/api/core/request'
import { Alert, useAlert } from '@/components/alert'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import '../configuration/AdminConfigurationPage.css'

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

type StudyPlanPeriod = {
  id: number
  starts_at: string
  ends_at: string
  status: string
  target_term?: {
    nam_hoc?: string
    hoc_ky?: string
  } | null
}

function parseLocalDateTime(date: string, time: string) {
  if (!date || !time) {
    return null
  }

  const value = new Date(`${date}T${time}`)

  return Number.isNaN(value.getTime()) ? null : value
}

function termOrderValue(year?: string, semester?: string) {
  const startYear = Number(year?.slice(0, 4)) || 0
  const semesterOrder = semester === '1' ? 1 : semester === '2' ? 2 : semester === 'Hè' ? 3 : 9

  return startYear * 10 + semesterOrder
}

export default function AdminStudyPlanPage() {
  const { showAlert } = useAlert()
  const [isLoading, setIsLoading] = useState(true)
  const [academicYearsList, setAcademicYearsList] = useState<AcademicYear[]>([])
  const [studyPlanPeriods, setStudyPlanPeriods] = useState<StudyPlanPeriod[]>([])
  const [targetStudyPlanYear, setTargetStudyPlanYear] = useState('')
  const [targetStudyPlanSemester, setTargetStudyPlanSemester] = useState('1')
  const [studyPlanStartDate, setStudyPlanStartDate] = useState('')
  const [studyPlanStartTime, setStudyPlanStartTime] = useState('')
  const [studyPlanEndDate, setStudyPlanEndDate] = useState('')
  const [studyPlanEndTime, setStudyPlanEndTime] = useState('')
  const [currentAcademicTerm, setCurrentAcademicTerm] = useState<AcademicTerm | null>(null)
  const [studyPlanFormFeedback, setStudyPlanFormFeedback] = useState<{ variant: 'error' | 'success' | 'info', title: string, message: string } | null>(null)
  const [isSavingStudyPlanPeriod, setIsSavingStudyPlanPeriod] = useState(false)

  const targetStudyPlanYearTerms = academicYearsList.find((year) => year.nam_hoc === targetStudyPlanYear)?.hoc_kys ?? []
  const endTimeMin = studyPlanStartDate && studyPlanEndDate === studyPlanStartDate ? studyPlanStartTime : undefined

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setIsLoading(true)

      try {
        const termsResponse = await apiGet<AcademicTermsResponse>('/admin/academic-terms')

        if (!isMounted) return

        const years = termsResponse.nam_hocs ?? []
        const currentTerm = termsResponse.current_academic_term
        const firstTargetYear = currentTerm?.nam_hoc ?? years[0]?.nam_hoc ?? ''
        const firstTargetSemester = currentTerm?.hoc_ky ?? years.find((year) => year.nam_hoc === firstTargetYear)?.hoc_kys?.[0]?.hoc_ky ?? '1'

        setAcademicYearsList(years)
        setCurrentAcademicTerm(currentTerm)
        setTargetStudyPlanYear(firstTargetYear)
        setTargetStudyPlanSemester(firstTargetSemester)

        try {
          const periodsResponse = await apiGet<{ data: StudyPlanPeriod[] }>('/admin/study-plan-registration-periods')
          if (!isMounted) return
          setStudyPlanPeriods(periodsResponse.data ?? [])
        } catch {
          if (!isMounted) return
          setStudyPlanPeriods([])
        }
      } catch {
        if (!isMounted) return

        showAlert({
          title: 'Không tải được kế hoạch học tập',
          message: 'Vui lòng kiểm tra kết nối backend hoặc quyền quản trị.',
          variant: 'error',
        })
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [showAlert])

  useEffect(() => {
    const startDateTime = parseLocalDateTime(studyPlanStartDate, studyPlanStartTime)
    const endDateTime = parseLocalDateTime(studyPlanEndDate, studyPlanEndTime)

    if (startDateTime && endDateTime && endDateTime <= startDateTime) {
      setStudyPlanEndTime('')
    }
  }, [studyPlanEndDate, studyPlanEndTime, studyPlanStartDate, studyPlanStartTime])

  const showStudyPlanFormFeedback = (variant: 'error' | 'success' | 'info', title: string, message: string) => {
    setStudyPlanFormFeedback({ variant, title, message })
  }

  const handleSaveStudyPlanPeriod = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const selectedTargetTermId = targetStudyPlanYearTerms.find((term) => term.hoc_ky === targetStudyPlanSemester)?.id
    const startsAt = studyPlanStartDate && studyPlanStartTime ? `${studyPlanStartDate}T${studyPlanStartTime}` : ''
    const endsAt = studyPlanEndDate && studyPlanEndTime ? `${studyPlanEndDate}T${studyPlanEndTime}` : ''
    const startDateTime = parseLocalDateTime(studyPlanStartDate, studyPlanStartTime)
    const endDateTime = parseLocalDateTime(studyPlanEndDate, studyPlanEndTime)

    if (!selectedTargetTermId || !startsAt || !endsAt) {
      showStudyPlanFormFeedback('error', 'Thiếu thông tin', 'Vui lòng chọn học kỳ đăng ký và thời gian mở/đóng.')
      showAlert({
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn học kỳ đăng ký và thời gian mở/đóng.',
        variant: 'error',
      })
      return
    }

    if (!startDateTime || !endDateTime) {
      showStudyPlanFormFeedback('error', 'Ngày giờ không hợp lệ', 'Vui lòng kiểm tra lại ngày bắt đầu, giờ bắt đầu, ngày kết thúc và giờ kết thúc.')
      showAlert({
        title: 'Ngày giờ không hợp lệ',
        message: 'Vui lòng kiểm tra lại ngày bắt đầu, giờ bắt đầu, ngày kết thúc và giờ kết thúc.',
        variant: 'error',
      })
      return
    }

    if (endDateTime <= startDateTime) {
      showStudyPlanFormFeedback('error', 'Thời gian đăng ký chưa hợp lệ', 'Thời điểm kết thúc phải sau thời điểm bắt đầu.')
      showAlert({
        title: 'Thời gian đăng ký chưa hợp lệ',
        message: 'Thời điểm kết thúc phải sau thời điểm bắt đầu.',
        variant: 'error',
      })
      return
    }

    if (
      currentAcademicTerm
      && termOrderValue(targetStudyPlanYear, targetStudyPlanSemester) <= termOrderValue(currentAcademicTerm.nam_hoc, currentAcademicTerm.hoc_ky)
    ) {
      const message = 'Chỉ được mở đăng ký KHHT cho học kỳ tiếp theo hoặc tương lai, không được chọn học kỳ hiện tại.'
      showStudyPlanFormFeedback('error', 'Học kỳ đăng ký chưa hợp lệ', message)
      showAlert({
        title: 'Học kỳ đăng ký chưa hợp lệ',
        message,
        variant: 'error',
      })
      return
    }

    setIsSavingStudyPlanPeriod(true)
    showStudyPlanFormFeedback('info', 'Đang lưu', 'Đang gửi thiết lập thời gian đăng ký KHHT...')
    try {
      await apiPost('/admin/study-plan-registration-periods', {
        target_hoc_ky_id: Number(selectedTargetTermId),
        starts_at: startsAt,
        ends_at: endsAt,
        status: 'open',
      })
      const periodsResponse = await apiGet<{ data: StudyPlanPeriod[] }>('/admin/study-plan-registration-periods')
      setStudyPlanPeriods(periodsResponse.data ?? [])
      showAlert({
        title: 'Đã mở đăng ký KHHT',
        message: 'Sinh viên chỉ có thể đăng ký trong khoảng thời gian vừa thiết lập.',
        variant: 'success',
      })
      showStudyPlanFormFeedback('success', 'Đã mở đăng ký KHHT', 'Đã mở đăng ký KHHT thành công.')
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Vui lòng kiểm tra học kỳ mục tiêu và thời gian đăng ký.'
      showStudyPlanFormFeedback('error', 'Không thể mở đăng ký KHHT', message)
      showAlert({
        title: 'Không thể mở đăng ký KHHT',
        message,
        variant: 'error',
      })
    } finally {
      setIsSavingStudyPlanPeriod(false)
    }
  }

  return (
    <main className="ac-main">
      <section className="ac-section">
        <div className="ac-section-header">
          <h2 className="ac-section-title">Kế hoạch học tập</h2>
          <p className="ac-section-desc">Thiết lập thời gian để sinh viên đăng ký kế hoạch học tập cho học kỳ tiếp theo hoặc tương lai.</p>
        </div>

        <div className="ac-card">
          <form onSubmit={handleSaveStudyPlanPeriod}>
            <div className="ac-form-grid">
              <div className="ac-form-group">
                <label className="ac-label">Năm học đăng ký</label>
                <Select
                  className="ac-select"
                  value={targetStudyPlanYear}
                  disabled={isLoading}
                  onChange={(e) => {
                    const nextYear = e.target.value
                    const nextSemester = academicYearsList.find((year) => year.nam_hoc === nextYear)?.hoc_kys?.[0]?.hoc_ky ?? '1'

                    setTargetStudyPlanYear(nextYear)
                    setTargetStudyPlanSemester(nextSemester)
                  }}
                  options={academicYearsList.map((year) => ({
                    label: year.nam_hoc,
                    value: year.nam_hoc,
                  }))}
                />
              </div>
              <div className="ac-form-group">
                <label className="ac-label">Học kỳ đăng ký</label>
                <Select
                  className="ac-select"
                  value={targetStudyPlanSemester}
                  disabled={isLoading}
                  onChange={(e) => setTargetStudyPlanSemester(e.target.value)}
                  options={targetStudyPlanYearTerms.map((term) => ({
                    label: `Học kỳ ${term.hoc_ky}`,
                    value: term.hoc_ky,
                  }))}
                />
              </div>
              <div className="ac-form-group">
                <label className="ac-label">Ngày bắt đầu</label>
                <Input type="date" className="ac-input" value={studyPlanStartDate} onChange={(e) => setStudyPlanStartDate(e.target.value)} />
              </div>
              <div className="ac-form-group">
                <label className="ac-label">Giờ bắt đầu</label>
                <Input type="time" className="ac-input" value={studyPlanStartTime} onChange={(e) => setStudyPlanStartTime(e.target.value)} />
              </div>
              <div className="ac-form-group">
                <label className="ac-label">Ngày kết thúc</label>
                <Input type="date" className="ac-input" value={studyPlanEndDate} min={studyPlanStartDate || undefined} onChange={(e) => setStudyPlanEndDate(e.target.value)} />
              </div>
              <div className="ac-form-group">
                <label className="ac-label">Giờ kết thúc</label>
                <Input type="time" className="ac-input" value={studyPlanEndTime} min={endTimeMin} onChange={(e) => setStudyPlanEndTime(e.target.value)} />
              </div>
            </div>

            <div className="ac-form-actions">
              <Button
                type="button"
                className="ac-btn-save"
                disabled={isSavingStudyPlanPeriod || isLoading}
                onClick={() => void handleSaveStudyPlanPeriod()}
              >
                {isSavingStudyPlanPeriod ? 'Đang lưu...' : 'Mở đăng ký KHHT'}
              </Button>
            </div>
            {studyPlanFormFeedback && (
              <div style={{ marginTop: 12 }}>
                <Alert
                  variant={studyPlanFormFeedback.variant}
                  title={studyPlanFormFeedback.title}
                  message={studyPlanFormFeedback.message}
                />
              </div>
            )}
          </form>

          <div style={{ marginTop: 18, overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #e2e8f0', padding: 10, textAlign: 'left' }}>Học kỳ</th>
                  <th style={{ borderBottom: '1px solid #e2e8f0', padding: 10, textAlign: 'left' }}>Bắt đầu</th>
                  <th style={{ borderBottom: '1px solid #e2e8f0', padding: 10, textAlign: 'left' }}>Kết thúc</th>
                  <th style={{ borderBottom: '1px solid #e2e8f0', padding: 10, textAlign: 'left' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {studyPlanPeriods.map((period) => (
                  <tr key={period.id}>
                    <td style={{ borderBottom: '1px solid #edf2f7', padding: 10 }}>
                      {period.target_term?.nam_hoc} - HK {period.target_term?.hoc_ky}
                    </td>
                    <td style={{ borderBottom: '1px solid #edf2f7', padding: 10 }}>{period.starts_at}</td>
                    <td style={{ borderBottom: '1px solid #edf2f7', padding: 10 }}>{period.ends_at}</td>
                    <td style={{ borderBottom: '1px solid #edf2f7', padding: 10 }}>{period.status}</td>
                  </tr>
                ))}
                {studyPlanPeriods.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 12, color: '#64748b' }}>Chưa có đợt đăng ký KHHT.</td>
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
