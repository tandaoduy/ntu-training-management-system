import { useEffect, useMemo, useState } from 'react'
import { apiGet } from '@/api/core/request'

type StudyPlanCourseStat = {
  id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi: number
  so_luong_sinh_vien: number
}

type StudyPlanStatisticsResponse = {
  data: {
    term?: {
      nam_hoc?: string
      hoc_ky?: string
    } | null
    courses: StudyPlanCourseStat[]
  }
}

export default function TrainingOfficerStudyPlanStatisticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [termLabel, setTermLabel] = useState('Chưa có dữ liệu')
  const [courses, setCourses] = useState<StudyPlanCourseStat[]>([])
  const maxCount = useMemo(() => Math.max(1, ...courses.map((course) => Number(course.so_luong_sinh_vien))), [courses])

  useEffect(() => {
    let active = true

    const loadStatistics = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await apiGet<StudyPlanStatisticsResponse>('/training-officer/study-plan-statistics')
        if (!active) return

        const term = response.data.term
        setTermLabel(term ? `${term.nam_hoc} - Học kỳ ${term.hoc_ky}` : 'Chưa có đợt đăng ký')
        setCourses(response.data.courses ?? [])
      } catch {
        if (!active) return
        setError('Không tải được thống kê kế hoạch học tập.')
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadStatistics()

    return () => {
      active = false
    }
  }, [])

  return (
    <main style={{ background: '#f4f7fb', minHeight: '100vh', padding: 28 }}>
      <section style={{ background: '#fff', border: '1px solid #dce6f2', borderRadius: 8, padding: 22 }}>
        <p style={{ color: '#2e6fa8', fontSize: 13, fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Kế hoạch học tập</p>
        <h1 style={{ color: '#172033', fontSize: 28, margin: '6px 0' }}>Thống kê đăng ký KHHT</h1>
        <p style={{ color: '#52657b', margin: 0 }}>Học kỳ: <strong>{termLabel}</strong></p>
      </section>

      {error && <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, color: '#9a3412', fontWeight: 700, marginTop: 16, padding: 14 }}>{error}</div>}
      {isLoading && <div style={{ background: '#eef6ff', border: '1px solid #bfdbfe', borderRadius: 8, color: '#1d4e89', fontWeight: 700, marginTop: 16, padding: 14 }}>Đang tải thống kê...</div>}

      <section style={{ background: '#fff', border: '1px solid #dce6f2', borderRadius: 8, marginTop: 18, overflow: 'hidden' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ background: '#2f6fa5', color: '#fff' }}>
              <th style={{ padding: 10, textAlign: 'center' }}>STT</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Mã học phần</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Tên học phần</th>
              <th style={{ padding: 10, textAlign: 'center' }}>ĐVHT/TC</th>
              <th style={{ padding: 10, textAlign: 'center' }}>Số SV đăng ký</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Biểu đồ</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, index) => (
              <tr key={course.id} style={{ background: index % 2 === 0 ? '#f7f7f7' : '#e9e9e9' }}>
                <td style={{ padding: 10, textAlign: 'center', fontWeight: 700 }}>{index + 1}</td>
                <td style={{ padding: 10 }}>{course.ma_hoc_phan}</td>
                <td style={{ padding: 10, color: '#2563eb' }}>{course.ten_hoc_phan}</td>
                <td style={{ padding: 10, textAlign: 'center' }}>{course.so_tin_chi}</td>
                <td style={{ padding: 10, textAlign: 'center', fontWeight: 800 }}>{course.so_luong_sinh_vien}</td>
                <td style={{ padding: 10 }}>
                  <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                    <div style={{ background: '#dbeafe', height: 12, maxWidth: 420, width: '100%' }}>
                      <div style={{ background: '#2f6fa5', height: 12, width: `${(course.so_luong_sinh_vien / maxCount) * 100}%` }} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && courses.length === 0 && (
              <tr>
                <td colSpan={6} style={{ color: '#64748b', padding: 16 }}>Chưa có sinh viên đăng ký KHHT cho học kỳ này.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  )
}
