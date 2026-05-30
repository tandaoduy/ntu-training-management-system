import { useCallback, useEffect, useMemo, useState } from 'react'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx-js-style'
import RoleLayout from '../../../layout/RoleLayout'
import { apiGet, apiPut } from '@/api/core/request'
import { printBrandHtml, printBrandStyles, printFaviconLink } from '@/app/branding'
import { useAlert } from '@/components/alert'
import './LecturerGradeEntryPage.css'

type GradeClass = {
  id: number
  hoc_ky_id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi: number
  lop_hoc_phan: string
  nhom_hoc_phan?: string | null
  ma_can_bo?: string | null
  ten_giang_vien?: string | null
  si_so?: number
  so_sinh_vien: number
  status?: string
  term?: { nam_hoc?: string | null; hoc_ky?: string | null } | null
  weights?: WeightConfig
}

type StudentGrade = {
  dang_ky_hoc_phan_id: number
  ma_sinh_vien?: string | null
  ho_ten?: string | null
  ma_lop?: string | null
  ngay_sinh?: string | null
  attendance_score?: string | number | null
  midterm_score?: string | number | null
  final_score?: string | number | null
  average_score?: string | number | null
  letter_grade?: string | null
  grade_point?: string | number | null
  result?: string | null
  note?: string | null
}

type WeightConfig = {
  attendance_weight: number | ''
  midterm_weight: number | ''
  final_weight: number | ''
}

type ClassDetailResponse = {
  data: {
    class: GradeClass
    students: StudentGrade[]
    grade_input_open: boolean
    grade_input_period: {
      starts_at?: string | null
      ends_at?: string | null
    } | null
    weights: WeightConfig
  }
}

type ClassesResponse = {
  data: GradeClass[]
  grade_input_open: boolean
  grade_input_period?: {
    starts_at?: string | null
    ends_at?: string | null
    status?: string | null
  } | null
}

type AcademicYear = {
  id: number
  nam_hoc: string
}

type AcademicTerm = {
  id: number
  nam_hoc_id: number
  hoc_ky: string
}

type CatalogResponse<T> = {
  data: T[]
}

const defaultWeights: WeightConfig = {
  attendance_weight: 10,
  midterm_weight: 30,
  final_weight: 60,
}

const messageFromError = (error: unknown, fallback: string) => (
  typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
    ? error.message
    : fallback
)

const formatDateTime = (value?: string | null) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

const formatDate = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const sortStudentsByCode = (students: StudentGrade[]) => (
  [...students].sort((left, right) => (
    String(left.ma_sinh_vien ?? '').localeCompare(String(right.ma_sinh_vien ?? ''), 'vi', { numeric: true })
  ))
)

const weightInputValue = (value: string) => {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '')
  const [integer = '', ...fractions] = normalized.split('.')
  return fractions.length ? `${integer}.${fractions.join('')}` : integer
}

const weightNumber = (value: number | '') => (value === '' ? 0 : Number(value))

const weightDisplayValue = (value: number | '') => (value === '' ? '' : String(value))

const safeFileName = (value: unknown) => String(value ?? '')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .replace(/[^\w.-]+/g, '_')
  .replace(/^_+|_+$/g, '')
  || 'bang_diem'
const legacyGradeSheetRows = (students: StudentGrade[], gradeClass: GradeClass | null, weights: WeightConfig) => [
  ['', '', `Danh Sách Điểm Sinh Viên (Hệ điểm 10)  Học phần: ${gradeClass?.ten_hoc_phan ?? ''}`],
  ['Mã cán bộ', gradeClass?.ma_can_bo ?? '', 'Tên cán bộ', gradeClass?.ten_giang_vien ?? ''],
  ['Mã học phần', gradeClass?.ma_hoc_phan ?? '', 'Nhóm học phần', gradeClass?.nhom_hoc_phan ?? ''],
  ['Năm học', gradeClass?.term?.nam_hoc ?? '', 'Học kỳ', gradeClass?.term?.hoc_ky ?? ''],
  ['', '', '', '', 'Mẫu:', `${weights.attendance_weight}|${weights.midterm_weight}|${weights.final_weight}`],
  ['Stt', 'Mã sinh viên', 'Tên sinh viên', 'Mã lớp', 'Điểm bộ phận', 'Điểm giữa kỳ', 'Điểm thi kết thúc', 'Ghi chú'],
  ...sortStudentsByCode(students).map((student, index) => [
    index + 1,
    student.ma_sinh_vien ?? '',
    student.ho_ten ?? '',
    student.ma_lop ?? '',
    student.attendance_score ?? '',
    student.midterm_score ?? '',
    student.final_score ?? '',
    student.note ?? '',
  ]),
]

const thinExcelBorder = {
  top: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
}

const legacyApplyGradeSheetStyles = (worksheet: XLSX.WorkSheet) => {
  const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1:H1')
  const titleCell = worksheet.C1
  if (titleCell?.v) {
    worksheet.A1 = titleCell
    delete worksheet.C1
  }

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
  ]

  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= 7; col += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: col })
      const cell = worksheet[address] ?? { t: 's', v: '' }
      const isTitle = row === 0
      const isHeader = row === 5
      const isMetaLabel = row >= 1 && row <= 4 && [0, 2, 4].includes(col)
      const isMetaValue = row >= 1 && row <= 4 && [1, 3, 5].includes(col)
      const isNameColumn = col === 2 && row >= 6

      cell.s = {
        font: {
          name: 'Times New Roman',
          sz: 14,
          bold: isTitle || isHeader || isMetaLabel || isMetaValue,
        },
        alignment: {
          vertical: 'center',
          horizontal: isTitle || isHeader || isMetaLabel || (!isNameColumn && row >= 6) ? 'center' : 'left',
          wrapText: true,
        },
        border: isTitle ? undefined : thinExcelBorder,
      }
      worksheet[address] = cell
    }
  }

  worksheet['!rows'] = [
    { hpt: 24 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 24 },
  ]
}

void legacyGradeSheetRows
void legacyApplyGradeSheetStyles

const buildGradeSheetRows = (students: StudentGrade[], gradeClass: GradeClass | null, weights: WeightConfig) => [
  ['', `Danh Sách Điểm Sinh Viên (Hệ điểm 10) - Học phần: ${gradeClass?.ten_hoc_phan ?? ''}`, '', '', '', '', '', ''],
  ['Mã cán bộ', gradeClass?.ma_can_bo ?? '', 'Tên cán bộ', gradeClass?.ten_giang_vien ?? '', '', '', '', ''],
  ['Mã học phần', gradeClass?.ma_hoc_phan ?? '', 'Nhóm học phần', gradeClass?.nhom_hoc_phan ?? '', '', '', '', ''],
  ['Năm học', gradeClass?.term?.nam_hoc ?? '', 'Học kỳ', gradeClass?.term?.hoc_ky ?? '', '', '', '', ''],
  ['', '', '', '', 'Mẫu:', `${weights.attendance_weight}|${weights.midterm_weight}|${weights.final_weight}`, '', ''],
  ['Stt', 'Mã sinh viên', 'Tên sinh viên', 'Mã lớp', 'Điểm bộ phận', 'Điểm giữa kỳ', 'Điểm thi kết thúc', 'Ghi chú'],
  ...sortStudentsByCode(students).map((student, index) => [
    index + 1,
    String(student.ma_sinh_vien ?? ''),
    student.ho_ten ?? '',
    student.ma_lop ?? '',
    student.attendance_score ?? '',
    student.midterm_score ?? '',
    student.final_score ?? '',
    student.note ?? '',
  ]),
]

const applyExportGradeSheetStyles = (worksheet: XLSX.WorkSheet) => {
  const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1:H1')
  worksheet['!merges'] = [
    { s: { r: 0, c: 1 }, e: { r: 0, c: 7 } },
  ]

  for (let row = 0; row <= range.e.r; row += 1) {
    for (let col = 0; col <= 7; col += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: col })
      const cell = worksheet[address] ?? { t: 's', v: '' }
      const isTitle = row === 0
      const isHeader = row === 5
      const isMetaBlock = row >= 1 && row <= 3 && col <= 3
      const isSampleBlock = row === 4 && col >= 4 && col <= 5
      const isTableBlock = row >= 5
      const isNameColumn = col === 2 && row >= 6
      const shouldHaveBorder = isMetaBlock || isSampleBlock || isTableBlock

      if (row >= 6 && col === 1) {
        cell.t = 's'
        cell.v = String(cell.v ?? '')
      }

      cell.s = {
        font: {
          name: 'Times New Roman',
          sz: 14,
          bold: isTitle || isHeader || isMetaBlock || isSampleBlock || col === 0,
        },
        alignment: {
          vertical: 'center',
          horizontal: isTitle || isHeader || isMetaBlock || isSampleBlock || (!isNameColumn && row >= 6) ? 'center' : 'left',
          wrapText: true,
        },
        border: shouldHaveBorder ? thinExcelBorder : undefined,
      }
      worksheet[address] = cell
    }
  }

  worksheet['!rows'] = [
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 22 },
    { hpt: 24 },
  ]
}

const gradeSheetHtml = (students: StudentGrade[], gradeClass: GradeClass | null, weights: WeightConfig, printable = false) => `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  ${printFaviconLink}
  <title>Bảng điểm tổng hợp</title>
  <style>
    ${printBrandStyles}
    body { font-family: "Times New Roman", serif; margin: ${printable ? '16px' : '0'}; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #000; font-size: 14pt; padding: 3px 5px; }
    .title { border: 0; font-size: 14pt; font-weight: 700; text-align: center; }
    .label { font-weight: 700; text-align: center; }
    .value { font-weight: 700; }
    .center { text-align: center; }
    .name { text-align: left; }
    .no-border { border: 0; }
  </style>
</head>
<body>
  ${printBrandHtml()}
  <table>
    <tr>
      <td class="title" colspan="8">Danh Sách Điểm Sinh Viên (Hệ điểm 10)&nbsp;&nbsp; Học phần: ${escapeHtml(gradeClass?.ten_hoc_phan)}</td>
    </tr>
    <tr>
      <td class="label">Mã cán bộ</td>
      <td class="value">${escapeHtml(gradeClass?.ma_can_bo)}</td>
      <td class="label">Tên cán bộ</td>
      <td class="value">${escapeHtml(gradeClass?.ten_giang_vien)}</td>
      <td class="no-border" colspan="4"></td>
    </tr>
    <tr>
      <td class="label">Mã học phần</td>
      <td class="value">${escapeHtml(gradeClass?.ma_hoc_phan)}</td>
      <td class="label">Nhóm học phần</td>
      <td class="value">${escapeHtml(gradeClass?.nhom_hoc_phan ?? '')}</td>
      <td class="no-border" colspan="4"></td>
    </tr>
    <tr>
      <td class="label">Năm học</td>
      <td class="value">${escapeHtml(gradeClass?.term?.nam_hoc)}</td>
      <td class="label">Học kỳ</td>
      <td class="value">${escapeHtml(gradeClass?.term?.hoc_ky)}</td>
      <td class="no-border" colspan="4"></td>
    </tr>
    <tr>
      <td class="no-border" colspan="4"></td>
      <td class="label">Mẫu:</td>
      <td class="value center">${weights.attendance_weight}|${weights.midterm_weight}|${weights.final_weight}</td>
      <td class="no-border" colspan="2"></td>
    </tr>
    <tr>
      <th>Stt</th>
      <th>Mã sinh viên</th>
      <th>Tên sinh viên</th>
      <th>Mã lớp</th>
      <th>Điểm bộ phận</th>
      <th>Điểm giữa kỳ</th>
      <th>Điểm thi kết thúc</th>
      <th>Ghi chú</th>
    </tr>
    ${sortStudentsByCode(students).map((student, index) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${escapeHtml(student.ma_sinh_vien)}</td>
        <td class="name">${escapeHtml(student.ho_ten)}</td>
        <td>${escapeHtml(student.ma_lop)}</td>
        <td class="center">${escapeHtml(student.attendance_score)}</td>
        <td class="center">${escapeHtml(student.midterm_score)}</td>
        <td class="center">${escapeHtml(student.final_score)}</td>
        <td>${escapeHtml(student.note)}</td>
      </tr>
    `).join('')}
  </table>
</body>
</html>`

const examListHtml = (students: StudentGrade[], gradeClass: GradeClass | null, weights: WeightConfig) => `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  ${printFaviconLink}
  <title>Danh sách sinh viên dự thi</title>
  <style>
    ${printBrandStyles}
    body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
    .school { font-weight: 700; margin-bottom: 8px; }
    .title { font-size: 18px; font-weight: 700; text-align: center; text-transform: uppercase; }
    .sub { font-weight: 700; text-align: center; margin: 4px 0 10px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 32px; margin-bottom: 12px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #555; font-size: 13px; padding: 4px 5px; }
    th { background: #f2f2f2; text-align: center; }
    .center { text-align: center; }
    .exam-footer { display: grid; grid-template-columns: 190px repeat(4, 1fr); gap: 18px; margin-top: 28px; page-break-inside: avoid; font-size: 13px; }
    .exam-counts { color: #555; font-style: italic; line-height: 1.55; }
    .signature { min-height: 92px; text-align: center; font-weight: 700; }
    .signature span { display: block; margin-top: 3px; font-weight: 400; font-style: italic; }
    .signature-row-2 { grid-column: 3 / 6; display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
  </style>
</head>
<body>
  ${printBrandHtml()}
  <div class="title">DANH SÁCH & PHIẾU GHI ĐIỂM SINH VIÊN THI LẦN 1</div>
  <div class="sub">Học kỳ ${escapeHtml(gradeClass?.term?.hoc_ky)} Năm học ${escapeHtml(gradeClass?.term?.nam_hoc)}</div>
  <div class="meta">
    <div>Môn học: <b>${escapeHtml(gradeClass?.ten_hoc_phan)} (${escapeHtml(gradeClass?.ma_hoc_phan)})</b> / Nhóm: <b>${escapeHtml(gradeClass?.lop_hoc_phan)}</b></div>
    <div>TC: <b>${escapeHtml(gradeClass?.so_tin_chi)}</b></div>
    <div>Ngày thi: ................ &nbsp;&nbsp; Giờ thi: ................ &nbsp;&nbsp; Phòng thi: ................</div>
    <div>CBGD: <b>${escapeHtml(gradeClass?.ten_giang_vien)}</b> &nbsp;&nbsp; ${weights.attendance_weight}% ${weights.midterm_weight}% ${weights.final_weight}%</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>TT</th>
        <th>Mã SV</th>
        <th>Họ và tên</th>
        <th>Ngày sinh</th>
        <th>Lớp</th>
        <th>Đ.KT</th>
        <th>Đ.GK</th>
        <th>Đ.Thi</th>
        <th>Ký tên</th>
        <th>Đề</th>
        <th>S.Tờ</th>
        <th>Ghi chú</th>
      </tr>
    </thead>
    <tbody>
      ${sortStudentsByCode(students).map((student, index) => `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${escapeHtml(student.ma_sinh_vien)}</td>
          <td>${escapeHtml(student.ho_ten)}</td>
          <td class="center">${formatDate(student.ngay_sinh)}</td>
          <td>${escapeHtml(student.ma_lop)}</td>
          <td class="center">${escapeHtml(student.attendance_score)}</td>
          <td class="center">${escapeHtml(student.midterm_score)}</td>
          <td class="center">${escapeHtml(student.final_score)}</td>
          <td></td>
          <td></td>
          <td></td>
          <td>${escapeHtml(student.note)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="exam-footer">
    <div class="exam-counts">
      <div>Số SV dự thi: ${sortStudentsByCode(students).length}</div>
      <div>Số SV vắng: ........</div>
      <div>Số bài thi: ........</div>
      <div>Số tờ giấy thi: ........</div>
    </div>
    <div class="signature">Chữ ký trưởng BM/ trưởng Khoa<span>(Ký, ghi rõ họ tên)</span></div>
    <div class="signature">Chữ ký CBCT 1<span>(Ký, ghi rõ họ tên)</span></div>
    <div class="signature">Chữ ký CB chấm thi 1<span>(Ký, ghi rõ họ tên)</span></div>
    <div></div>
    <div class="signature-row-2">
      <div class="signature">Chữ ký CBCT 2<span>(Ký, ghi rõ họ tên)</span></div>
      <div class="signature">Chữ ký CB chấm thi 2<span>(Ký, ghi rõ họ tên)</span></div>
    </div>
  </div>
</body>
</html>`

export default function LecturerGradeEntryPage() {
  const { showAlert } = useAlert()
  const navigate = useNavigate()
  const [classes, setClasses] = useState<GradeClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [detail, setDetail] = useState<ClassDetailResponse['data'] | null>(null)
  const [weights, setWeights] = useState<WeightConfig>(defaultWeights)
  const [draftWeights, setDraftWeights] = useState<WeightConfig>(defaultWeights)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([])
  const [currentTermConfig, setCurrentTermConfig] = useState<{ nam_hoc_id: number; id: number } | null>(null)
  const [yearId, setYearId] = useState('')
  const [termId, setTermId] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [periodText, setPeriodText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingWeights, setIsSavingWeights] = useState(false)

  const filteredClasses = useMemo(() => {
    const keyword = courseCode.trim().toLowerCase()
    if (!keyword) return classes

    return classes.filter((item) => (
      item.ma_hoc_phan?.toLowerCase().includes(keyword)
      || item.ten_hoc_phan?.toLowerCase().includes(keyword)
    ))
  }, [classes, courseCode])

  const courseOptions = useMemo(() => (
    Array.from(new Map(classes.map((item) => [item.ma_hoc_phan, item])).values())
  ), [classes])

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  )

  const loadClasses = useCallback(async (nextTermId = termId) => {
    setIsLoading(true)
    try {
      const response = await apiGet<ClassesResponse>('/lecturer/grade-entry/classes', {
        params: nextTermId ? { hoc_ky_id: Number(nextTermId) } : undefined,
      })
      setClasses(response.data)
      setPeriodText(response.grade_input_period
        ? `Thời gian nhập điểm: ${formatDateTime(response.grade_input_period.starts_at)} - ${formatDateTime(response.grade_input_period.ends_at)}`
        : 'Chưa cấu hình thời gian nhập điểm cho học kỳ này')
    } catch (error) {
      showAlert({
        title: 'Không tải được danh sách lớp',
        message: messageFromError(error, 'Nếu vừa cập nhật code backend, hãy chạy migration rồi thử lại.'),
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }, [showAlert, termId])

  const loadInitialCatalog = useCallback(async () => {
    try {
      const [yearsRes, currentRes] = await Promise.all([
        apiGet<CatalogResponse<AcademicYear>>('/academic-catalog/nam-hocs'),
        apiGet<{ data: { nam_hoc_id: number; id: number } | null }>('/academic-catalog/current-term'),
      ])
      setAcademicYears(yearsRes.data)
      if (currentRes.data) {
        setCurrentTermConfig(currentRes.data)
        setYearId(String(currentRes.data.nam_hoc_id))
      } else {
        setYearId(String(yearsRes.data[0]?.id ?? ''))
      }
    } catch (error) {
      showAlert({
        title: 'Không tải được dữ liệu năm học',
        message: messageFromError(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    }
  }, [showAlert])

  useEffect(() => {
    void loadInitialCatalog()
  }, [loadInitialCatalog])

  useEffect(() => {
    if (!yearId) {
      setAcademicTerms([])
      setTermId('')
      return
    }

    let isMounted = true
    apiGet<CatalogResponse<AcademicTerm>>('/academic-catalog/hoc-kys', {
      params: { nam_hoc_id: Number(yearId) },
    }).then((response) => {
      if (!isMounted) return
      setAcademicTerms(response.data)
      
      if (currentTermConfig && String(currentTermConfig.nam_hoc_id) === yearId) {
        setTermId(String(currentTermConfig.id))
      } else {
        setTermId(String(response.data[0]?.id ?? ''))
      }
    }).catch((error) => {
      if (!isMounted) return
      showAlert({
        title: 'Không tải được học kỳ',
        message: messageFromError(error, 'Vui lòng thử lại.'),
        variant: 'error',
      })
    })

    return () => {
      isMounted = false
    }
  }, [yearId, currentTermConfig, showAlert])

  const loadClassDetail = useCallback(async (classId: number) => {
    try {
      const response = await apiGet<ClassDetailResponse>(`/lecturer/grade-entry/classes/${classId}`)
      setDetail(response.data)
      setWeights(response.data.weights ?? defaultWeights)
      setDraftWeights(response.data.weights ?? defaultWeights)
    } catch (error) {
      showAlert({
        title: 'Không tải được bảng điểm',
        message: messageFromError(error, 'Vui lòng thử lại sau.'),
        variant: 'error',
      })
    }
  }, [showAlert])

  useEffect(() => {
    void loadClasses(termId)
  }, [loadClasses, termId])

  const openClass = (classId: number) => {
    setSelectedClassId(classId)
    void loadClassDetail(classId)
  }

  const saveWeights = async () => {
    if (!selectedClassId) return
    const total = weightNumber(draftWeights.attendance_weight) + weightNumber(draftWeights.midterm_weight) + weightNumber(draftWeights.final_weight)
    if (Math.round(total * 100) / 100 !== 100) {
      showAlert({ title: 'Trọng số chưa hợp lệ', message: 'Tổng trọng số phải bằng 100%.', variant: 'warning' })
      return
    }

    setIsSavingWeights(true)
    try {
      const response = await apiPut<{ data: WeightConfig }>(`/lecturer/grade-entry/classes/${selectedClassId}/weights`, {
        attendance_weight: weightNumber(draftWeights.attendance_weight),
        midterm_weight: weightNumber(draftWeights.midterm_weight),
        final_weight: weightNumber(draftWeights.final_weight),
      })
      setClasses((current) => current.map((item) => (
        item.id === selectedClassId ? { ...item, weights: response.data } : item
      )))
      setWeights(response.data)
      showAlert({ title: 'Đã lưu trọng số', message: 'Điểm trung bình đã được tính lại theo trọng số mới.', variant: 'success' })
      setShowWeightModal(false)
      await loadClassDetail(selectedClassId)
    } catch (error) {
      showAlert({ title: 'Lưu trọng số thất bại', message: messageFromError(error, 'Vui lòng thử lại sau.'), variant: 'error' })
    } finally {
      setIsSavingWeights(false)
    }
  }

  const updateDraftWeight = (field: keyof Pick<WeightConfig, 'attendance_weight' | 'midterm_weight' | 'final_weight'>, value: string) => {
    const nextValue = weightInputValue(value)
    setDraftWeights((current) => ({ ...current, [field]: nextValue === '' ? '' : Number(nextValue) }))
  }

  const exportExcel = () => {
    const gradeClass = detail?.class ?? selectedClass
    const worksheet = XLSX.utils.aoa_to_sheet(buildGradeSheetRows(detail?.students ?? [], gradeClass, weights))
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 18 },
      { wch: 32 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 20 },
      { wch: 22 },
    ]
    applyExportGradeSheetStyles(worksheet)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bang diem')
    XLSX.writeFile(workbook, `${safeFileName(`${gradeClass?.ma_hoc_phan ?? 'hoc_phan'}_${gradeClass?.nhom_hoc_phan ?? 'nhom'}_${gradeClass?.term?.nam_hoc ?? ''}_HK${gradeClass?.term?.hoc_ky ?? ''}`)}.xlsx`)
  }

  const openHtmlTab = (html: string) => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }

  const printGradeSheet = () => {
    openHtmlTab(gradeSheetHtml(detail?.students ?? [], detail?.class ?? selectedClass, weights, true))
  }

  const printExamList = () => {
    openHtmlTab(examListHtml(detail?.students ?? [], detail?.class ?? selectedClass, weights))
  }

  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="GIẢNG VIÊN"
      roleColor="blue"
      homeRoute="/canbo"
      roleTitle="Giảng viên"
    >
      <main className="lge-page">
        <section className="lge-filter-panel">
          <select className="lge-filter-label" value="nam_hoc" aria-label="Loại lọc năm học" disabled>
            <option value="nam_hoc">Năm học</option>
          </select>
          <select value={yearId} onChange={(event) => { setYearId(event.target.value); setTermId(''); setCourseCode(''); setDetail(null); setSelectedClassId(null) }}>
            <option value="">Năm học</option>
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>{year.nam_hoc}</option>
            ))}
          </select>

          <select className="lge-filter-label" value="hoc_ky" aria-label="Loại lọc học kỳ" disabled>
            <option value="hoc_ky">Học kỳ</option>
          </select>
          <select value={termId} onChange={(event) => { setTermId(event.target.value); setCourseCode(''); setDetail(null); setSelectedClassId(null) }}>
            <option value="">Học kỳ</option>
            {academicTerms.map((term) => (
              <option key={term.id} value={term.id}>{term.hoc_ky}</option>
            ))}
          </select>

          <select className="lge-filter-label" value="ma_hoc_phan" aria-label="Loại lọc mã học phần" disabled>
            <option value="ma_hoc_phan">Mã học phần</option>
          </select>
          <input list="lge-course-codes" value={courseCode} onChange={(event) => { setCourseCode(event.target.value); setDetail(null); setSelectedClassId(null) }} />
          <datalist id="lge-course-codes">
            {courseOptions.flatMap((item) => [
              <option key={`${item.ma_hoc_phan}-code`} value={item.ma_hoc_phan}>{item.ten_hoc_phan}</option>,
              <option key={`${item.ma_hoc_phan}-name`} value={item.ten_hoc_phan}>{item.ma_hoc_phan}</option>,
            ])}
          </datalist>
        </section>

        <section className="lge-class-panel">
          <div className="lge-period-line">{periodText}</div>
          <div className="lge-action-bar">
            {selectedClassId ? (
              <>
                <button type="button" className="lge-soft-btn" onClick={() => navigate(`/canbo/nhapdiem/nhapdiemnhomhocphan?classId=${selectedClassId}`)}>Nhập điểm nhóm học phần</button>
                <button type="button" className="lge-soft-btn" disabled={!detail} onClick={printGradeSheet}>In bảng điểm tổng hợp</button>
                <button type="button" className="lge-soft-btn" disabled={!detail} onClick={printExamList}>In danh sách sinh viên dự thi</button>
                <button type="button" className="lge-soft-btn" disabled={!detail} onClick={exportExcel}>Xuất Excel</button>
              </>
            ) : (
              <span className="lge-action-hint">Chọn một học phần trong bảng để hiển thị các thao tác nhập điểm.</span>
            )}
          </div>

          <div className="lge-total-row">Tổng số: {filteredClasses.length} dòng</div>

          <div className="lge-table-wrap">
            <table className="lge-table lge-class-table">
              <colgroup>
                <col className="lge-col-stt" />
                <col className="lge-col-code" />
                <col className="lge-col-name" />
                <col className="lge-col-group" />
                <col className="lge-col-credit" />
                <col className="lge-col-class" />
                <col className="lge-col-teacher" />
                <col className="lge-col-size" />
                <col className="lge-col-status" />
                <col className="lge-col-weight" />
                <col className="lge-col-lock" />
                <col className="lge-col-pick" />
                <col className="lge-col-edit" />
              </colgroup>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã học phần</th>
                  <th>Tên học phần</th>
                  <th>Nhóm</th>
                  <th>ĐVHT/TC</th>
                  <th>Tên lớp</th>
                  <th>Cán bộ giảng dạy</th>
                  <th>Sĩ số</th>
                  <th>Trạng thái</th>
                  <th>Hệ số</th>
                  <th>Khóa quyền nhập điểm</th>
                  <th>Chọn</th>
                  <th>Cập nhật hệ số loại điểm</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((item, index) => {
                  const itemWeights = item.id === selectedClassId ? weights : (item.weights ?? defaultWeights)

                  return (
                    <tr key={item.id} className={item.id === selectedClassId ? 'selected' : ''}>
                      <td>{index + 1}</td>
                      <td>{item.ma_hoc_phan}</td>
                      <td>{item.ten_hoc_phan}</td>
                      <td>{item.nhom_hoc_phan || '-'}</td>
                      <td>{item.so_tin_chi}</td>
                      <td>{item.lop_hoc_phan}</td>
                      <td>{item.ten_giang_vien}</td>
                      <td>{item.so_sinh_vien || item.si_so || 0}</td>
                      <td>{detail && item.id === selectedClassId ? (detail.grade_input_open ? 'Đang nhập điểm' : 'Khóa nhập điểm') : 'Chưa nhập bảng điểm'}</td>
                      <td>Điểm bộ phận ({weightNumber(itemWeights.attendance_weight).toFixed(2)})<br />Điểm giữa kỳ ({weightNumber(itemWeights.midterm_weight).toFixed(2)})<br />Điểm thi kết thúc ({weightNumber(itemWeights.final_weight).toFixed(2)})</td>
                      <td>
                        <span className={`lge-mini-status ${detail && item.id === selectedClassId && detail.grade_input_open ? 'open' : 'locked'}`}>
                          {detail && item.id === selectedClassId && detail.grade_input_open ? 'Mở' : 'Khóa'}
                        </span>
                      </td>
                      <td>
                        <label className="lge-choice-control" aria-label="Chọn lớp">
                          <input type="radio" checked={item.id === selectedClassId} onChange={() => openClass(item.id)} />
                          <span />
                        </label>
                      </td>
                      <td>
                        <button type="button" className="lge-icon-btn" onClick={() => { openClass(item.id); setShowWeightModal(true) }} title="Cập nhật hệ số loại điểm" aria-label="Cập nhật hệ số loại điểm">
                          <PencilSquareIcon />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {isLoading && <tr><td colSpan={13} className="lge-empty-cell">Đang tải lớp học phần...</td></tr>}
                {!isLoading && filteredClasses.length === 0 && <tr><td colSpan={13} className="lge-empty-cell">Chưa có lớp học phần để nhập điểm.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {showWeightModal && detail && (
          <div className="lge-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="lge-weight-title">
            <form className="lge-weight-modal" onSubmit={(event) => { event.preventDefault(); void saveWeights() }}>
              <div className="lge-weight-modal-header">
                <h2 id="lge-weight-title">Cập nhật hệ số loại điểm</h2>
                <button type="button" onClick={() => setShowWeightModal(false)} aria-label="Đóng">×</button>
              </div>
              <label>Điểm bộ phận<input value={weightDisplayValue(draftWeights.attendance_weight)} type="text" inputMode="decimal" onChange={(event) => updateDraftWeight('attendance_weight', event.target.value)} /></label>
              <label>Điểm giữa kỳ<input value={weightDisplayValue(draftWeights.midterm_weight)} type="text" inputMode="decimal" onChange={(event) => updateDraftWeight('midterm_weight', event.target.value)} /></label>
              <label>Điểm thi kết thúc<input value={weightDisplayValue(draftWeights.final_weight)} type="text" inputMode="decimal" onChange={(event) => updateDraftWeight('final_weight', event.target.value)} /></label>
              <p className={Math.round((Number(draftWeights.attendance_weight) + Number(draftWeights.midterm_weight) + Number(draftWeights.final_weight)) * 100) / 100 === 100 ? 'valid' : 'invalid'}>
                Tổng hệ số: {Number(draftWeights.attendance_weight) + Number(draftWeights.midterm_weight) + Number(draftWeights.final_weight)}
              </p>
              <div className="lge-weight-modal-actions">
                <button type="button" className="lge-soft-btn" onClick={() => setShowWeightModal(false)}>Hủy</button>
                <button type="submit" className="lge-primary-btn" disabled={isSavingWeights}>{isSavingWeights ? 'Đang lưu...' : 'Lưu hệ số'}</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </RoleLayout>
  )
}
