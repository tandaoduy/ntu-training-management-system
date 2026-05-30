import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDownTrayIcon, ChevronRightIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { apiGet } from '@/api/core/request'
import { LOGO_IMAGE_URL, MINISTRY_NAME, SCHOOL_NAME, printBrandHtml, printBrandStyles, printFaviconLink } from '@/app/branding'
import { formatDisplayDate, formatDisplayDateTime } from '@/utils/dateFormat'
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
  return formatDisplayDate(value)
}

const formatDateTime = (value?: string | null) => {
  return formatDisplayDateTime(value)
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

  const handlePrint = () => {
    if (!course) return

    const rows = students.map((student, index) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td class="center"><strong>${escapeExcelCell(student.ma_sinh_vien)}</strong></td>
        <td>${escapeExcelCell(student.ten_sinh_vien)}</td>
        <td class="center">${escapeExcelCell(student.ma_lop || '-')}</td>
        <td class="center">${escapeExcelCell(formatDate(student.ngay_sinh) || '-')}</td>
        <td class="center">${escapeExcelCell(formatDate(student.submitted_at) || '-')}</td>
      </tr>
    `).join('')

    const header = `
      <div class="top">
        <div>${printBrandHtml(MINISTRY_NAME)}</div>
        <div><div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div><div class="line">Độc lập - Tự do - Hạnh phúc</div></div>
      </div>
      <h1>DANH SÁCH SINH VIÊN ĐĂNG KÝ KHHT</h1>
      <div class="subtitle">
        Học phần: ${escapeExcelCell(course.ma_hoc_phan)} - ${escapeExcelCell(course.ten_hoc_phan)}<br/>
        Kỳ thống kê: ${escapeExcelCell(termLabel)}<br/>
        Số sinh viên: ${students.length}
      </div>
    `

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Không mở được cửa sổ in. Vui lòng cho phép trình duyệt mở popup rồi thử lại.')
      return
    }

    printWindow.document.write(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  ${printFaviconLink}
  <title>Danh sách đăng ký KHHT</title>
  <style>
    ${printBrandStyles}
    @page { size: A4 portrait; margin: 15mm 15mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #000; font-family: "Times New Roman", Arial, sans-serif; font-size: 13px; }
    .sheet { width: 100%; max-width: 800px; margin: 0 auto; }
    .top { display: grid; grid-template-columns: 1fr 1.15fr; gap: 24px; text-align: center; font-weight: 700; margin-bottom: 24px; }
    .top .line { display: inline-block; border-bottom: 1px solid #000; padding-bottom: 2px; }
    h1 { margin: 18px 0 6px; text-align: center; font-size: 16px; line-height: 1.25; font-weight: 700; text-transform: uppercase; }
    .subtitle { text-align: center; font-size: 13px; font-weight: 700; line-height: 1.4; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 12px; }
    th, td { border: 1px solid #000; padding: 6px; vertical-align: middle; line-height: 1.2; }
    th { text-align: center; font-weight: 700; background: #f7f7f7; }
    .center { text-align: center; }
    .print-toolbar { position: sticky; top: 0; display: flex; justify-content: flex-end; gap: 8px; padding: 8px 0; background: #fff; }
    .print-toolbar button { border: 1px solid #999; background: #fff; padding: 5px 12px; cursor: pointer; }
    
    /* Column widths */
    th:nth-child(1), td:nth-child(1) { width: 8%; }
    th:nth-child(2), td:nth-child(2) { width: 16%; }
    th:nth-child(3), td:nth-child(3) { width: 32%; }
    th:nth-child(4), td:nth-child(4) { width: 14%; }
    th:nth-child(5), td:nth-child(5) { width: 14%; }
    th:nth-child(6), td:nth-child(6) { width: 16%; }

    @media print { .print-toolbar { display: none; } .sheet { max-width: none; } }
  </style>
</head>
<body>
  <div class="print-toolbar"><button onclick="window.print()">In</button><button onclick="window.close()">Đóng</button></div>
  <div class="sheet">${header}<table>
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
      ${rows || '<tr><td colspan="6" class="center">Chưa có sinh viên đăng ký học phần này.</td></tr>'}
    </tbody>
  </table>
  <p style="margin-top: 12px; font-weight: 700;">- Tổng số sinh viên: ${students.length}</p>
  </div>
</body>
</html>`)
    printWindow.document.close()
    printWindow.opener = null
  }

  const handleExportExcel = () => {
    if (!course) return

    const generatedAt = formatDisplayDateTime(new Date().toISOString())
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
            .brand { text-align: center; font-weight: 700; }
            .brand img { width: 44px; height: 44px; object-fit: contain; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="6" class="brand"><img src="${LOGO_IMAGE_URL}" alt="NTU" /><br />${escapeExcelCell(SCHOOL_NAME)}</td></tr>
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

        <section id="training-officer-stat-print-area" className="sp-stat-panel sp-stat-detail-panel">
          <div className="sp-stat-panel-head">
            <div className="sp-stat-print-official">
              <div>
                <img src={LOGO_IMAGE_URL} alt="NTU" width={44} height={44} />
                <strong>{MINISTRY_NAME}</strong>
                <strong>{SCHOOL_NAME}</strong>
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
            <button type="button" onClick={handlePrint} className="sp-stat-action-btn" title="In danh sách">
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
