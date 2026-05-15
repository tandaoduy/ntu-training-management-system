import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDownTrayIcon, ChevronRightIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { apiGet } from '@/api/core/request'
import RoleLayout from '../../../layout/RoleLayout'
import './TrainingOfficerStudyPlanStatisticsPage.css'

type StudyPlanCourseStat = {
  id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi: number
  so_luong_sinh_vien?: number
}

type StudyPlanStudentRegistration = {
  id: number
  ma_sinh_vien: string
  ten_sinh_vien: string
  ngay_sinh?: string | null
  ma_lop?: string | null
  submitted_at?: string | null
}

type StudyPlanCourseDetailResponse = {
  data: {
    term?: {
      nam_hoc?: string
      hoc_ky?: string
    } | null
    course: StudyPlanCourseStat
    students: StudyPlanStudentRegistration[]
  }
}

type DetailParams = {
  hoc_ky_id?: string
  nam_hoc?: string
  hoc_ky?: string
}

const escapeExcelCell = (value: string | number | null | undefined) => (
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
)

const downloadFile = (content: BlobPart, fileName: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const formatDate = (value?: string | null) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('vi-VN')
}

const formatDateTime = (value?: string | null) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('vi-VN')
}

export default function TrainingOfficerStudyPlanCourseRegistrationsPage() {
  const { courseId } = useParams()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [course, setCourse] = useState<StudyPlanCourseStat | null>(null)
  const [students, setStudents] = useState<StudyPlanStudentRegistration[]>([])
  const [termLabel, setTermLabel] = useState('Tất cả học kỳ')

  useEffect(() => {
    let active = true

    const loadDetails = async () => {
      if (!courseId) {
        setError('Không xác định được học phần cần xem chi tiết.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const hocKyId = searchParams.get('hoc_ky_id')
        const namHoc = searchParams.get('nam_hoc')
        const hocKy = searchParams.get('hoc_ky')
        const params: DetailParams = {}

        if (hocKyId) {
          params.hoc_ky_id = hocKyId
        } else {
          if (namHoc) {
            params.nam_hoc = namHoc
          }
          if (hocKy) {
            params.hoc_ky = hocKy
          }
        }

        const response = await apiGet<StudyPlanCourseDetailResponse>(
          `/training-officer/study-plan-statistics/courses/${courseId}/students`,
          Object.keys(params).length > 0 ? { params } : undefined,
        )
        if (!active) return

        const term = response.data.term
        setCourse(response.data.course)
        setStudents(response.data.students ?? [])
        setTermLabel(term?.nam_hoc && term?.hoc_ky ? `${term.nam_hoc} - Học kỳ ${term.hoc_ky}` : 'Tất cả học kỳ')
      } catch {
        if (!active) return
        setError('Không tải được danh sách sinh viên đăng ký học phần này.')
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadDetails()

    return () => {
      active = false
    }
  }, [courseId, searchParams])

  const handleExportExcel = () => {
    if (!course) return

    const generatedAt = new Date().toLocaleString('vi-VN')
    const rows = students.map((student, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeExcelCell(student.ma_sinh_vien)}</td>
        <td>${escapeExcelCell(student.ten_sinh_vien)}</td>
        <td>${escapeExcelCell(student.ma_lop)}</td>
        <td>${escapeExcelCell(formatDate(student.ngay_sinh))}</td>
        <td>${escapeExcelCell(formatDateTime(student.submitted_at))}</td>
      </tr>
    `).join('')
    const workbook = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; }
            th, td { border: 1px solid #b7c5d8; padding: 8px; }
            th { background: #2f6fa5; color: #ffffff; }
            .title { font-size: 18px; font-weight: 700; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="6" class="title">Danh sách sinh viên đăng ký KHHT</td></tr>
            <tr><td colspan="6">Học phần: ${escapeExcelCell(course.ma_hoc_phan)} - ${escapeExcelCell(course.ten_hoc_phan)}</td></tr>
            <tr><td colspan="6">Kỳ thống kê: ${escapeExcelCell(termLabel)}</td></tr>
            <tr><td colspan="6">Xuất lúc: ${escapeExcelCell(generatedAt)}</td></tr>
            <tr>
              <th>STT</th>
              <th>Mã SV</th>
              <th>Họ tên</th>
              <th>Lớp</th>
              <th>Ngày sinh</th>
              <th>Ngày đăng ký</th>
            </tr>
            ${rows}
          </table>
        </body>
      </html>
    `

    const safeCourseCode = course.ma_hoc_phan.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase()
    downloadFile(
      `\ufeff${workbook}`,
      `ds-sv-dang-ky-khht-${safeCourseCode || course.id}.xls`,
      'application/vnd.ms-excel;charset=utf-8',
    )
  }

  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="CHUYÊN VIÊN"
      roleColor="orange"
      homeRoute="/chuyenvien"
      roleTitle="Chuyên viên đào tạo"
    >
      <main className="sp-stat-page">
        <nav className="sp-stat-breadcrumb" aria-label="Breadcrumb">
          <Link to="/chuyenvien/study-plan-statistics">Thống kê KHHT</Link>
          <ChevronRightIcon aria-hidden="true" />
          <span>Danh sách sinh viên đăng ký</span>
        </nav>

        {error && <div className="sp-stat-alert error">{error}</div>}
        {isLoading && <div className="sp-stat-alert info">Đang tải danh sách sinh viên...</div>}

        <section className="sp-stat-panel sp-stat-detail-panel">
          <div className="sp-stat-panel-head">
            <div className="sp-stat-print-official">
              <div>
                <strong>BỘ GIÁO DỤC VÀ ĐÀO TẠO</strong>
                <strong>TRƯỜNG ĐẠI HỌC NHA TRANG</strong>
              </div>
              <div>
                <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
                <strong>Độc lập - Tự do - Hạnh phúc</strong>
              </div>
            </div>
            <div>
              <h2>Danh sách sinh viên đăng ký KHHT</h2>
              <p className="sp-stat-print-meta">
                Học phần: {course ? `${course.ma_hoc_phan} - ${course.ten_hoc_phan}` : 'Đang tải'}.
                {' '}
                Kỳ thống kê: {termLabel}.
                {' '}
                Số sinh viên: {students.length}.
              </p>
            </div>
          </div>

          <div className="sp-stat-table-wrap">
            <table className="sp-stat-table sp-stat-detail-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã SV</th>
                  <th>Họ tên</th>
                  <th>Lớp</th>
                  <th>Ngày sinh</th>
                  <th>Ngày đăng ký</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td><strong>{student.ma_sinh_vien}</strong></td>
                    <td>{student.ten_sinh_vien}</td>
                    <td>{student.ma_lop || '-'}</td>
                    <td>{formatDate(student.ngay_sinh) || '-'}</td>
                    <td>
                      <span className="sp-stat-screen-value">{formatDateTime(student.submitted_at) || '-'}</span>
                      <span className="sp-stat-print-value">{formatDate(student.submitted_at) || '-'}</span>
                    </td>
                  </tr>
                ))}
                {!isLoading && students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="sp-stat-empty">Chưa có sinh viên đăng ký học phần này.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="sp-stat-print-total">- Tổng số sinh viên: {students.length}</p>

          <div className="sp-stat-detail-actions">
            <button type="button" onClick={() => window.print()} className="sp-stat-action-btn" title="In danh sách">
              <PrinterIcon aria-hidden="true" />
              <span>In</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="sp-stat-action-btn primary"
              disabled={students.length === 0}
              title="Xuất Excel"
            >
              <ArrowDownTrayIcon aria-hidden="true" />
              <span>Excel</span>
            </button>
          </div>
        </section>
      </main>
    </RoleLayout>
  )
}
