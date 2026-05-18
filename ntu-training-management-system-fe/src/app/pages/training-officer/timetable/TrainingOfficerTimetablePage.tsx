import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useSearchParams } from 'react-router-dom'
import { useAlert } from '@/components/alert'
import { apiDelete, apiGet, apiPost, apiPut } from '@/api/core/request'
import { clampPositiveInteger } from '@/utils/numberInput'
import RoleLayout from '../../../layout/RoleLayout'
import './TrainingOfficerTimetablePage.css'

type AcademicYear = { id: number; nam_hoc: string }
type Semester = { id: number; nam_hoc_id: number; hoc_ky: string }
type ApiListResponse<T> = { data: T }

type Course = {
  id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi: number
}

type Lecturer = {
  id: number
  user_id: string
  ten_giang_vien: string
  chuc_vu?: string | null
  chuc_danh?: string | null
}

type Building = {
  id: number
  ma_giang_duong: string
  ten_giang_duong: string
  mo_ta?: string | null
}

type Room = {
  id: number | null
  giang_duong_id: number | null
  ma_phong: string
  suc_chua: number | null
  giang_duong?: Building
  da_xoa_phong_hoc?: boolean
}

type AdministrativeClass = {
  id: number
  lop_hoc_phan: string
  si_so: number
  ma_khoi?: string | null
  ten_khoi?: string | null
  ma_don_vi?: string | null
  ten_don_vi?: string | null
}

type ClassSection = {
  id: number
  hoc_phan_id: number | null
  hoc_ky_id: number
  lop_hanh_chinh_id?: number | null
  giang_vien_id?: number | null
  ma_hoc_phan: string
  lop_hoc_phan: string
  nhom_hoc_phan?: string | null
  ten_hoc_phan: string
  ten_giang_vien?: string | null
  si_so: number
  lop_hanh_chinh?: AdministrativeClass | null
  da_xoa_lop_hoc_phan?: boolean
}

type WeekConfig = {
  id: number
  hoc_ky_id: number
  tuan_1_bat_dau: string
  so_tuan_mac_dinh: number
  tuan_nghis: number[]
}

type TimetableItem = {
  id: number
  lop_hoc_phan_id: number | null
  phong_hoc_id: number | null
  hoc_ky_id: number
  thu: number
  tiet_bat_dau: number
  so_tiet: number
  tiet_ket_thuc: number
  tuan_bat_dau: number
  so_tuan: number
  tuan_ket_thuc: number
  ngay_bat_dau?: string | null
  ngay_ket_thuc?: string | null
  lop_hoc_phan?: ClassSection
  phong_hoc?: Room
}

type TimetableGroup = {
  key: string
  items: TimetableItem[]
  courseCode: string
  courseName: string
  classGroup: string
  lecturerName: string
  credits: number | ''
  maxStudents: number | ''
  registeredStudents: ''
}

type CatalogResponse = {
  data: {
    giang_duongs: Building[]
    phong_hocs: Room[]
    hoc_phans: Course[]
    giang_viens: Lecturer[]
    lop_hanh_chinhs: AdministrativeClass[]
    lop_hoc_phans: ClassSection[]
    cau_hinh_tuan_hocs: WeekConfig[]
  }
}

type TimetableForm = {
  nam_hoc_id: string
  hoc_ky: string
  hoc_phan_id: string
  lop_hanh_chinh_id: string
  lop_hoc_phan: string
  nhom_hoc_phan: string
  giang_vien_id: string
  si_so: string
  giang_duong_id: string
  phong_hoc_id: string
  thu: string
  tiet_bat_dau: string
  so_tiet: string
  tuan_bat_dau: string
  so_tuan: string
}

const emptyTimetableForm: TimetableForm = {
  nam_hoc_id: '',
  hoc_ky: '',
  hoc_phan_id: '',
  lop_hanh_chinh_id: '',
  lop_hoc_phan: '',
  nhom_hoc_phan: '01',
  giang_vien_id: '',
  si_so: '40',
  giang_duong_id: '',
  phong_hoc_id: '',
  thu: '2',
  tiet_bat_dau: '1',
  so_tiet: '3',
  tuan_bat_dau: '1',
  so_tuan: '',
}

const toMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return fallback
}

const compactClassGroup = (value?: string | null) => {
  const part = value?.split('-').pop()?.trim()
  return part && /^\d+$/.test(part) ? part.padStart(2, '0') : '01'
}

const normalizeClassGroup = (value: string) => {
  const trimmed = value.trim()
  return /^\d+$/.test(trimmed) ? trimmed.padStart(2, '0') : trimmed
}

const digitPattern = (start: number, end: number, max: number, disabled: Set<number> = new Set()) => (
  Array.from({ length: max }, (_, index) => {
    const value = index + 1
    return value >= start && value <= end && !disabled.has(value) ? String(value % 10) : '-'
  }).join('')
)

const getTimetableGroupKey = (item: TimetableItem) => [
  item.hoc_ky_id,
  item.lop_hoc_phan?.hoc_phan_id ?? item.lop_hoc_phan?.ma_hoc_phan ?? '',
  item.lop_hoc_phan?.lop_hoc_phan ?? '',
  item.lop_hoc_phan?.nhom_hoc_phan ?? compactClassGroup(item.lop_hoc_phan?.lop_hoc_phan),
  item.lop_hoc_phan?.giang_vien_id ?? item.lop_hoc_phan?.ten_giang_vien ?? '',
].join('|')

export default function TrainingOfficerTimetablePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const alert = useAlert()
  const formPanelRef = useRef<HTMLElement | null>(null)
  const [years, setYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [administrativeClasses, setAdministrativeClasses] = useState<AdministrativeClass[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [classSections, setClassSections] = useState<ClassSection[]>([])
  const [weekConfigs, setWeekConfigs] = useState<WeekConfig[]>([])
  const [breakWeeks, setBreakWeeks] = useState<number[]>([])
  const [isSavingBreakWeeks, setIsSavingBreakWeeks] = useState(false)
  const [items, setItems] = useState<TimetableItem[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [timetableForm, setTimetableForm] = useState<TimetableForm>(emptyTimetableForm)
  const [courseCodeInput, setCourseCodeInput] = useState('')
  const [courseNameInput, setCourseNameInput] = useState('')
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null)

  const selectedRooms = useMemo(() => (
    timetableForm.giang_duong_id
      ? rooms.filter((room) => String(room.giang_duong_id) === timetableForm.giang_duong_id)
      : rooms
  ), [rooms, timetableForm.giang_duong_id])
  const conflictingRoomIds = useMemo(() => {
    const thu = Number(timetableForm.thu)
    const tietStart = Number(timetableForm.tiet_bat_dau)
    const soTiet = Number(timetableForm.so_tiet)
    const tuanStart = Number(timetableForm.tuan_bat_dau)
    const soTuan = Number(timetableForm.so_tuan)

    if (!thu || !tietStart || !soTiet || !tuanStart || !soTuan) return new Set<number>()

    const tietEnd = tietStart + soTiet - 1
    const tuanEnd = tuanStart + soTuan - 1

    const conflicted = new Set<number>()
    for (const item of items) {
      if (editingItemId && item.id === editingItemId) continue
      if (item.thu !== thu) continue
      const periodOverlap = item.tiet_bat_dau <= tietEnd && item.tiet_ket_thuc >= tietStart
      const weekOverlap = item.tuan_bat_dau <= tuanEnd && item.tuan_ket_thuc >= tuanStart
      if (periodOverlap && weekOverlap && item.phong_hoc_id) {
        conflicted.add(item.phong_hoc_id)
      }
    }
    return conflicted
  }, [items, timetableForm.thu, timetableForm.tiet_bat_dau, timetableForm.so_tiet, timetableForm.tuan_bat_dau, timetableForm.so_tuan, editingItemId])

  const selectedLecturer = lecturers.find((lecturer) => String(lecturer.id) === timetableForm.giang_vien_id)
  const selectedTerm = semesters.find((semester) => (
    String(semester.nam_hoc_id) === timetableForm.nam_hoc_id
    && String(semester.hoc_ky) === timetableForm.hoc_ky
  ))
  const selectedTermId = selectedTerm ? String(selectedTerm.id) : ''
  const availableSemesters = useMemo(() => (
    timetableForm.nam_hoc_id
      ? semesters.filter((semester) => String(semester.nam_hoc_id) === timetableForm.nam_hoc_id)
      : semesters
  ), [semesters, timetableForm.nam_hoc_id])
  const selectedTermLabel = selectedTerm
    ? `${years.find((year) => year.id === selectedTerm.nam_hoc_id)?.nam_hoc ?? ''} - Học kỳ ${selectedTerm.hoc_ky}`
    : 'Tất cả học kỳ'
  const selectedWeekConfig = weekConfigs.find((config) => String(config.hoc_ky_id) === selectedTermId)
  const displayedItems = useMemo(() => (
    selectedTermId
      ? items.filter((item) => String(item.hoc_ky_id) === selectedTermId)
      : items
  ), [items, selectedTermId])
  const timetableGroups = useMemo<TimetableGroup[]>(() => {
    const groups = new Map<string, TimetableItem[]>()

    displayedItems.forEach((item) => {
      const key = getTimetableGroupKey(item)
      groups.set(key, [...(groups.get(key) ?? []), item])
    })

    return Array.from(groups.entries()).map(([key, groupItems]) => {
      const firstItem = groupItems[0]
      const classSection = firstItem.lop_hoc_phan
      const course = courses.find((candidate) => (
        candidate.id === classSection?.hoc_phan_id
        || candidate.ma_hoc_phan === classSection?.ma_hoc_phan
      ))

      return {
        key,
        items: groupItems,
        courseCode: classSection?.ma_hoc_phan || '-',
        courseName: classSection?.ten_hoc_phan || 'Chưa cập nhật',
        classGroup: classSection?.nhom_hoc_phan || compactClassGroup(classSection?.lop_hoc_phan),
        lecturerName: classSection?.ten_giang_vien || 'Chưa cập nhật',
        credits: course?.so_tin_chi ?? ('' as const),
        maxStudents: classSection?.si_so ?? ('' as const),
        registeredStudents: '' as const,
      }
    }).sort((first, second) => (
      first.courseCode.localeCompare(second.courseCode, 'vi', { numeric: true })
      || first.courseName.localeCompare(second.courseName, 'vi', { numeric: true })
      || first.classGroup.localeCompare(second.classGroup, 'vi', { numeric: true })
    ))
  }, [courses, displayedItems])

  const loadAll = async () => {
    const [yearsResponse, semestersResponse, catalogsResponse, timetableResponse] = await Promise.all([
      apiGet<ApiListResponse<AcademicYear[]>>('/academic-catalog/nam-hocs'),
      apiGet<ApiListResponse<Semester[]>>('/academic-catalog/hoc-kys'),
      apiGet<CatalogResponse>('/training-officer/timetable/catalogs'),
      apiGet<ApiListResponse<TimetableItem[]>>('/training-officer/timetable'),
    ])

    setYears(yearsResponse.data)
    setSemesters(semestersResponse.data)
    setCourses(catalogsResponse.data.hoc_phans)
    setLecturers(catalogsResponse.data.giang_viens ?? [])
    setAdministrativeClasses(catalogsResponse.data.lop_hanh_chinhs)
    setBuildings(catalogsResponse.data.giang_duongs)
    setRooms(catalogsResponse.data.phong_hocs)
    setClassSections(catalogsResponse.data.lop_hoc_phans)
    setWeekConfigs(catalogsResponse.data.cau_hinh_tuan_hocs ?? [])
    setItems(timetableResponse.data)

    const firstSemester = semestersResponse.data[0]
    if (firstSemester && !timetableForm.nam_hoc_id && !timetableForm.hoc_ky) {
      setTimetableForm((current) => ({
        ...current,
        nam_hoc_id: String(firstSemester.nam_hoc_id),
        hoc_ky: String(firstSemester.hoc_ky),
      }))
    }
  }

  useEffect(() => {
    loadAll().catch((err) => setError(toMessage(err, 'Không tải được dữ liệu thời khóa biểu.')))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshCatalogs = async () => {
    const [catalogsResponse, timetableResponse] = await Promise.all([
      apiGet<CatalogResponse>('/training-officer/timetable/catalogs'),
      apiGet<ApiListResponse<TimetableItem[]>>('/training-officer/timetable'),
    ])

    setCourses(catalogsResponse.data.hoc_phans)
    setLecturers(catalogsResponse.data.giang_viens ?? [])
    setAdministrativeClasses(catalogsResponse.data.lop_hanh_chinhs)
    setBuildings(catalogsResponse.data.giang_duongs)
    setRooms(catalogsResponse.data.phong_hocs)
    setClassSections(catalogsResponse.data.lop_hoc_phans)
    setWeekConfigs(catalogsResponse.data.cau_hinh_tuan_hocs ?? [])
    setItems(timetableResponse.data)
  }

  useEffect(() => {
    setBreakWeeks(selectedWeekConfig?.tuan_nghis ?? [])
  }, [selectedWeekConfig])

  useEffect(() => {
    if (editingItemId || !selectedWeekConfig) {
      return
    }

    setTimetableForm((current) => {
      const currentWeekCount = Number(current.so_tuan)
      const nextWeekCount = String(selectedWeekConfig.so_tuan_mac_dinh)

      if (current.so_tuan && currentWeekCount > 0 && currentWeekCount <= selectedWeekConfig.so_tuan_mac_dinh) {
        return current
      }

      return { ...current, so_tuan: nextWeekCount }
    })
  }, [editingItemId, selectedWeekConfig])

  const ensureClassSection = async () => {
    const existing = classSections.find((item) => (
      String(item.hoc_ky_id) === selectedTermId
      && String(item.hoc_phan_id) === timetableForm.hoc_phan_id
      && (item.nhom_hoc_phan ?? '').trim().toLowerCase() === normalizeClassGroup(timetableForm.nhom_hoc_phan).toLowerCase()
      && item.lop_hoc_phan.trim().toLowerCase() === timetableForm.lop_hoc_phan.trim().toLowerCase()
    ))

    if (existing) {
      return existing.id
    }

    const response = await apiPost<{ data: ClassSection }>('/training-officer/timetable/class-sections', {
      hoc_ky_id: Number(selectedTermId),
      hoc_phan_id: Number(timetableForm.hoc_phan_id),
      lop_hanh_chinh_id: timetableForm.lop_hanh_chinh_id ? Number(timetableForm.lop_hanh_chinh_id) : null,
      lop_hoc_phan: timetableForm.lop_hoc_phan.trim(),
      nhom_hoc_phan: normalizeClassGroup(timetableForm.nhom_hoc_phan),
      giang_vien_id: Number(timetableForm.giang_vien_id),
      ten_giang_vien: selectedLecturer?.ten_giang_vien ?? null,
      si_so: Number(timetableForm.si_so),
    })

    return response.data.id
  }

  const handleSaveTimetable = async () => {
    setError('')
    setMessage('')

    if (
      !selectedTermId
      || !timetableForm.phong_hoc_id
      || !timetableForm.so_tuan
      || !timetableForm.hoc_phan_id
      || !timetableForm.lop_hoc_phan.trim()
      || !timetableForm.nhom_hoc_phan.trim()
      || !timetableForm.giang_vien_id
    ) {
      const validationMessage = 'Vui lòng chọn học kỳ, học phần, lớp học phần, nhóm học phần, giảng viên, phòng học và số tuần học.'
      setError(validationMessage)
      alert.showError('Thiếu thông tin', validationMessage)
      return
    }

    try {
      const classSectionId = await ensureClassSection()

      if (!Number.isInteger(classSectionId) || classSectionId <= 0) {
        const validationMessage = 'Không xác định được lớp học phần của lịch học cần sửa.'
        setError(validationMessage)
        alert.showError('Không cập nhật được', validationMessage)
        return
      }

      const payload = {
        hoc_ky_id: Number(selectedTermId),
        lop_hoc_phan_id: classSectionId,
        phong_hoc_id: Number(timetableForm.phong_hoc_id),
        thu: Number(timetableForm.thu),
        tiet_bat_dau: Number(timetableForm.tiet_bat_dau),
        so_tiet: Number(timetableForm.so_tiet),
        tuan_bat_dau: Number(timetableForm.tuan_bat_dau),
        so_tuan: Number(timetableForm.so_tuan),
      }

      if (editingItemId) {
        await apiPut(`/training-officer/timetable/${editingItemId}`, payload)
      } else {
        await apiPost('/training-officer/timetable', payload)
      }

      setTimetableForm((current) => ({
        ...emptyTimetableForm,
        nam_hoc_id: current.nam_hoc_id,
        hoc_ky: current.hoc_ky,
        giang_duong_id: current.giang_duong_id,
        so_tuan: selectedWeekConfig ? String(selectedWeekConfig.so_tuan_mac_dinh) : '',
      }))
      setCourseCodeInput('')
      setCourseNameInput('')
      setEditingItemId(null)
      const successMessage = editingItemId ? 'Đã cập nhật lịch học.' : 'Đã lưu thời khóa biểu.'
      setMessage(successMessage)
      alert.showSuccess(editingItemId ? 'Cập nhật thành công' : 'Thêm thành công', successMessage)
      await refreshCatalogs()
    } catch (err) {
      const errorMessage = toMessage(err, 'Không lưu được thời khóa biểu.')
      setError(errorMessage)
      alert.showError('Không lưu được', errorMessage)
    }
  }

  const handleEditItem = (item: TimetableItem) => {
    const classSection = item.lop_hoc_phan
    const lecturer = lecturers.find((candidate) => (
      candidate.id === classSection?.giang_vien_id
      || candidate.ten_giang_vien === classSection?.ten_giang_vien
    ))

    setEditingItemId(item.id)
    setCourseCodeInput(classSection?.ma_hoc_phan ?? '')
    setCourseNameInput(classSection?.ten_hoc_phan ?? '')
    setTimetableForm({
      nam_hoc_id: String(semesters.find((semester) => semester.id === item.hoc_ky_id)?.nam_hoc_id ?? ''),
      hoc_ky: String(semesters.find((semester) => semester.id === item.hoc_ky_id)?.hoc_ky ?? ''),
      hoc_phan_id: String(classSection?.hoc_phan_id ?? ''),
      lop_hanh_chinh_id: String(classSection?.lop_hanh_chinh_id ?? ''),
      lop_hoc_phan: classSection?.lop_hoc_phan ?? '',
      nhom_hoc_phan: classSection?.nhom_hoc_phan ?? compactClassGroup(classSection?.lop_hoc_phan),
      giang_vien_id: lecturer ? String(lecturer.id) : '',
      si_so: String(classSection?.si_so ?? 40),
      giang_duong_id: String(item.phong_hoc?.giang_duong_id ?? ''),
      phong_hoc_id: String(item.phong_hoc_id ?? ''),
      thu: String(item.thu),
      tiet_bat_dau: String(item.tiet_bat_dau),
      so_tiet: String(item.so_tiet),
      tuan_bat_dau: String(item.tuan_bat_dau),
      so_tuan: String(item.so_tuan),
    })
    window.requestAnimationFrame(() => {
      formPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleDeleteItem = async (item: TimetableItem) => {
    setError('')
    setMessage('')
    try {
      await apiDelete(`/training-officer/timetable/${item.id}`)
      const successMessage = 'Đã xóa lịch học.'
      setMessage(successMessage)
      alert.showSuccess('Xóa thành công', successMessage)
      await refreshCatalogs()
    } catch (err) {
      const errorMessage = toMessage(err, 'Không xóa được lịch học.')
      setError(errorMessage)
      alert.showError('Không xóa được', errorMessage)
    }
  }

  useEffect(() => {
    const editId = Number(searchParams.get('edit'))
    if (!editId || editingItemId === editId || items.length === 0) {
      return
    }

    const item = items.find((candidate) => candidate.id === editId)
    if (!item) {
      alert.showError('Không tìm thấy lịch học', 'Lịch học cần sửa không còn tồn tại.')
      setSearchParams({}, { replace: true })
      return
    }

    handleEditItem(item)
    alert.showInfo('Đã mở lịch học', 'Bạn có thể cập nhật thông tin trong biểu mẫu.')
    setSearchParams({}, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, searchParams, editingItemId])

  const toggleBreakWeek = (week: number) => {
    setBreakWeeks((current) => (
      current.includes(week)
        ? current.filter((item) => item !== week)
        : [...current, week].sort((a, b) => a - b)
    ))
  }

  const handleSaveBreakWeeks = async () => {
    setError('')
    setMessage('')

    if (!selectedTermId) {
      const validationMessage = 'Vui lòng chọn năm học và học kỳ trước khi đánh dấu tuần nghỉ.'
      setError(validationMessage)
      alert.showError('Thiếu học kỳ', validationMessage)
      return
    }

    setIsSavingBreakWeeks(true)
    try {
      await apiPost('/training-officer/timetable/break-weeks', {
        hoc_ky_id: Number(selectedTermId),
        tuan_nghis: breakWeeks,
      })
      const successMessage = 'Đã lưu tuần nghỉ.'
      setMessage(successMessage)
      alert.showSuccess('Lưu thành công', successMessage)
      await refreshCatalogs()
    } catch (err) {
      const errorMessage = toMessage(err, 'Không lưu được tuần nghỉ.')
      setError(errorMessage)
      alert.showError('Không lưu được', errorMessage)
    } finally {
      setIsSavingBreakWeeks(false)
    }
  }

  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="CHUYÊN VIÊN"
      roleColor="orange"
      homeRoute="/chuyenvien"
      roleTitle="Chuyên viên đào tạo"
    >
      <main className="to-timetable-page">
        {message && <div className="to-timetable-alert">{message}</div>}
        {error && <div className="to-timetable-alert error">{error}</div>}

        <div className="to-timetable-grid">
          <section ref={formPanelRef} className="to-timetable-panel to-timetable-form-panel">
            <div className="to-timetable-panel-head">
              <h2>Xếp thời khóa biểu</h2>
              <p>Chọn học phần, lớp, giảng viên, phòng và thời gian học trong một biểu mẫu.</p>
            </div>

            <div className="to-timetable-form to-timetable-form-horizontal">
              <div className="span-12 top-term-row">
                <label className="top-term-field">
                  Năm học
                  <select
                    value={timetableForm.nam_hoc_id}
                    onChange={(event) => {
                      const nextYearId = event.target.value
                      const nextSemester = semesters.find((semester) => String(semester.nam_hoc_id) === nextYearId)
                      setTimetableForm((current) => ({
                        ...current,
                        nam_hoc_id: nextYearId,
                        hoc_ky: nextSemester ? String(nextSemester.hoc_ky) : '',
                      }))
                    }}
                  >
                    <option value="">Chọn năm học</option>
                    {years.map((year) => (
                      <option key={year.id} value={year.id}>{year.nam_hoc}</option>
                    ))}
                  </select>
                </label>

                <label className="top-term-field">
                  Học kỳ
                  <select
                    value={timetableForm.hoc_ky}
                    onChange={(event) => setTimetableForm((current) => ({ ...current, hoc_ky: event.target.value }))}
                  >
                    <option value="">Chọn học kỳ</option>
                    {availableSemesters.map((semester) => (
                      <option key={semester.id} value={semester.hoc_ky}>Học kỳ {semester.hoc_ky}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="span-3">
                Mã học phần
                <input
                  list="to-course-code-options"
                  value={courseCodeInput}
                  onChange={(event) => {
                    const value = event.target.value.trim()
                    const selected = courses.find((course) => course.ma_hoc_phan.toLowerCase() === value.toLowerCase())
                    setCourseCodeInput(event.target.value)
                    setCourseNameInput(selected?.ten_hoc_phan ?? '')
                    setTimetableForm((current) => ({ ...current, hoc_phan_id: selected ? String(selected.id) : '' }))
                  }}
                  placeholder="Gõ hoặc chọn mã học phần"
                />
                <datalist id="to-course-code-options">
                  {courses.map((course) => (
                    <option key={course.id} value={course.ma_hoc_phan}>{course.ten_hoc_phan}</option>
                  ))}
                </datalist>
              </label>

              <label className="span-6">
                Tên học phần
                <input
                  list="to-course-name-options"
                  value={courseNameInput}
                  onChange={(event) => {
                    const value = event.target.value.trim()
                    const selected = courses.find((course) => course.ten_hoc_phan.toLowerCase() === value.toLowerCase())
                    setCourseNameInput(event.target.value)
                    setCourseCodeInput(selected?.ma_hoc_phan ?? '')
                    setTimetableForm((current) => ({ ...current, hoc_phan_id: selected ? String(selected.id) : '' }))
                  }}
                  placeholder="Gõ hoặc chọn tên học phần"
                />
                <datalist id="to-course-name-options">
                  {courses.map((course) => (
                    <option key={course.id} value={course.ten_hoc_phan}>{course.ma_hoc_phan}</option>
                  ))}
                </datalist>
              </label>

              <label className="span-3">
                Lớp hành chính
                <select
                  value={timetableForm.lop_hanh_chinh_id}
                  onChange={(event) => {
                    const selectedClass = administrativeClasses.find((item) => String(item.id) === event.target.value)
                    setTimetableForm((current) => ({
                      ...current,
                      lop_hanh_chinh_id: event.target.value,
                      lop_hoc_phan: selectedClass?.lop_hoc_phan ?? current.lop_hoc_phan,
                      nhom_hoc_phan: selectedClass ? compactClassGroup(selectedClass.lop_hoc_phan) : current.nhom_hoc_phan,
                    }))
                  }}
                >
                  <option value="">Tạo lớp mới</option>
                  {administrativeClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.lop_hoc_phan}{item.ten_khoi ? ` - ${item.ten_khoi}` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="span-3">
                Lớp học phần
                <input
                  value={timetableForm.lop_hoc_phan ?? ''}
                  onChange={(event) => setTimetableForm((current) => ({ ...current, lop_hoc_phan: event.target.value }))}
                  placeholder="Ví dụ: Hè-CNTT-1"
                />
              </label>

              <label className="span-2">
                Nhóm HP
                <input
                  value={timetableForm.nhom_hoc_phan ?? ''}
                  onChange={(event) => setTimetableForm((current) => ({ ...current, nhom_hoc_phan: event.target.value }))}
                  placeholder="01"
                />
              </label>

              <label className="span-2">
                Sĩ số
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[1-9][0-9]*"
                  value={timetableForm.si_so ?? ''}
                  onChange={(event) => setTimetableForm((current) => ({ ...current, si_so: clampPositiveInteger(event.target.value, 1000) }))}
                />
              </label>

              <label className="span-4">
                Giảng viên
                <select
                  value={timetableForm.giang_vien_id}
                  onChange={(event) => setTimetableForm((current) => ({ ...current, giang_vien_id: event.target.value }))}
                >
                  <option value="">Chọn giảng viên</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.user_id ? `${lecturer.user_id} - ` : ''}{lecturer.ten_giang_vien}
                    </option>
                  ))}
                </select>
              </label>

              <label className="span-2">
                Giảng đường
                <select
                  value={timetableForm.giang_duong_id}
                  onChange={(event) => setTimetableForm((current) => ({ ...current, giang_duong_id: event.target.value, phong_hoc_id: '' }))}
                >
                  <option value="">Tất cả</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.ma_giang_duong}</option>
                  ))}
                </select>
              </label>

              <label className="span-2">
                Phòng học
                <select value={timetableForm.phong_hoc_id} onChange={(event) => setTimetableForm((current) => ({ ...current, phong_hoc_id: event.target.value }))}>
                  <option value="">Chọn phòng</option>
                  {selectedRooms.map((room) => {
                    if (!room.id) return null
                    const isConflict = conflictingRoomIds.has(room.id)
                    return (
                      <option key={room.id} value={room.id} disabled={isConflict}>
                        {room.ma_phong} - {room.suc_chua} chỗ{isConflict ? ' Đã có lịch' : ''}
                      </option>
                    )
                  })}
                </select>
              </label>

              <label className="span-2">
                Thứ
                <select value={timetableForm.thu} onChange={(event) => setTimetableForm((current) => ({ ...current, thu: event.target.value }))}>
                  {[2, 3, 4, 5, 6, 7, 8].map((day) => (
                    <option key={day} value={day}>{day === 8 ? 'Chủ nhật' : `Thứ ${day}`}</option>
                  ))}
                </select>
              </label>

              <label className="span-2">
                Tiết bắt đầu
                <input type="text" inputMode="numeric" pattern="[1-9][0-9]*" value={timetableForm.tiet_bat_dau} onChange={(event) => setTimetableForm((current) => ({ ...current, tiet_bat_dau: clampPositiveInteger(event.target.value, 13) }))} />
              </label>

              <label className="span-2">
                Số tiết
                <input type="text" inputMode="numeric" pattern="[1-9][0-9]*" value={timetableForm.so_tiet} onChange={(event) => setTimetableForm((current) => ({ ...current, so_tiet: clampPositiveInteger(event.target.value, 13) }))} />
              </label>

              <label className="span-2">
                Tuần bắt đầu
                <input type="text" inputMode="numeric" pattern="[1-9][0-9]*" value={timetableForm.tuan_bat_dau} onChange={(event) => setTimetableForm((current) => ({ ...current, tuan_bat_dau: clampPositiveInteger(event.target.value, 52) }))} />
              </label>

              <label className="span-2">
                Số tuần học
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[1-9][0-9]*"
                  value={timetableForm.so_tuan}
                  placeholder={selectedWeekConfig ? String(selectedWeekConfig.so_tuan_mac_dinh) : 'Chưa cấu hình'}
                  onChange={(event) => setTimetableForm((current) => ({
                    ...current,
                    so_tuan: clampPositiveInteger(event.target.value, selectedWeekConfig?.so_tuan_mac_dinh ?? 52),
                  }))}
                />
              </label>

              <div className="to-timetable-form-actions span-4">
                <button type="button" className="to-timetable-btn" onClick={() => void handleSaveTimetable()}>
                  {editingItemId ? 'Cập nhật lịch học' : 'Lưu lịch học'}
                </button>
                {editingItemId && (
                  <button type="button" className="to-timetable-btn secondary" onClick={() => { setEditingItemId(null); setTimetableForm(emptyTimetableForm); setCourseCodeInput(''); setCourseNameInput('') }}>
                    Hủy sửa
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="to-timetable-panel">
            <div className="to-timetable-panel-head">
              <h2>Đánh dấu tuần nghỉ</h2>
              <p>{selectedWeekConfig ? `${selectedTermLabel} có ${selectedWeekConfig.so_tuan_mac_dinh} tuần.` : 'Vui lòng cấu hình tuần học trước khi đánh dấu tuần nghỉ.'}</p>
            </div>
            <div className="to-break-week-box">
              {selectedWeekConfig ? (
                <>
                  <div className="to-break-week-grid">
                    {Array.from({ length: selectedWeekConfig.so_tuan_mac_dinh }, (_, index) => index + 1).map((week) => (
                      <label key={week} className="to-break-week-item">
                        <input
                          type="checkbox"
                          checked={breakWeeks.includes(week)}
                          onChange={() => toggleBreakWeek(week)}
                        />
                        <span>Tuần {week}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" className="to-timetable-btn to-break-week-save" onClick={() => void handleSaveBreakWeeks()} disabled={isSavingBreakWeeks}>
                    {isSavingBreakWeeks ? 'Đang lưu...' : 'Lưu tuần nghỉ'}
                  </button>
                </>
              ) : (
                <div className="to-timetable-empty">Chưa có cấu hình tuần học cho học kỳ này.</div>
              )}
            </div>
          </section>

          <section className="to-timetable-panel">
            <div className="to-timetable-panel-head">
              <h2>Lịch học đã xếp</h2>
              <p>{selectedTermLabel}</p>
            </div>
            <div className="to-timetable-table-wrap">
              <div className="to-timetable-total">Tổng số: <strong>{timetableGroups.length}</strong> dòng</div>
              <table className="to-timetable-table to-timetable-summary-table">
                <thead>
                  <tr>
                    <th>Stt</th>
                    <th>Mã học phần</th>
                    <th>Tên học phần</th>
                    <th>Nhóm học phần</th>
                    <th>Cán bộ giảng dạy</th>
                    <th>Số tín chỉ/ĐVHT</th>
                    <th>Sĩ số SVĐK tối đa</th>
                    <th>Số SV đã ĐK</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {timetableGroups.map((group, index) => {
                    const isExpanded = expandedGroupKey === group.key

                    return (
                      <Fragment key={group.key}>
                        <tr className={isExpanded ? 'is-expanded' : undefined}>
                      <td><strong>{index + 1}</strong></td>
                      <td>{group.courseCode}</td>
                      <td>{group.courseName}</td>
                      <td>{group.classGroup}</td>
                      <td>{group.lecturerName}</td>
                      <td>{group.credits}</td>
                      <td>{group.maxStudents}</td>
                      <td>{group.registeredStudents}</td>
                      <td>
                        <button
                          type="button"
                          className="to-timetable-detail-btn"
                          onClick={() => setExpandedGroupKey(isExpanded ? null : group.key)}
                          title="Xem thời khóa biểu"
                          aria-label={`Xem thời khóa biểu ${group.courseCode}`}
                          aria-expanded={isExpanded}
                        >
                          <EyeIcon aria-hidden="true" />
                        </button>
                      </td>
                        </tr>
                        {isExpanded && (
                          <tr className="to-timetable-detail-row">
                            <td colSpan={9}>
                              <table className="to-timetable-detail-table">
                                <thead>
                                  <tr>
                                    <th colSpan={8}>Thời khóa biểu</th>
                                  </tr>
                                  <tr>
                                    <th>Thứ</th>
                                    <th>Mã học phần</th>
                                    <th>Nhóm học phần</th>
                                    <th>Tên học phần</th>
                                    <th>Tiết học</th>
                                    <th>Tên phòng</th>
                                    <th>Tuần học</th>
                                    <th>Thao tác</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {group.items.map((item) => {
                                    const weekConfig = weekConfigs.find((config) => config.hoc_ky_id === item.hoc_ky_id)
                                    const disabledWeeks = new Set(weekConfig?.tuan_nghis ?? [])
                                    const maxWeeks = weekConfig?.so_tuan_mac_dinh ?? item.tuan_ket_thuc

                                    return (
                                      <tr key={item.id}>
                                        <td><strong>{item.thu === 8 ? 'CN' : item.thu}</strong></td>
                                        <td>{item.lop_hoc_phan?.ma_hoc_phan || '-'}</td>
                                        <td>{item.lop_hoc_phan?.nhom_hoc_phan || compactClassGroup(item.lop_hoc_phan?.lop_hoc_phan)}</td>
                                        <td>{item.lop_hoc_phan?.ten_hoc_phan || 'Chưa cập nhật'}</td>
                                        <td className="to-pattern-cell">{digitPattern(item.tiet_bat_dau, item.tiet_ket_thuc, 13)}</td>
                                        <td>{item.phong_hoc?.ma_phong || '-'}</td>
                                        <td className="to-pattern-cell">{digitPattern(item.tuan_bat_dau, item.tuan_ket_thuc, maxWeeks, disabledWeeks)}</td>
                                        <td>
                                          <div className="to-timetable-actions">
                                            <button
                                              type="button"
                                              className="to-timetable-action-icon-btn"
                                              onClick={() => handleEditItem(item)}
                                              title="Sửa lịch học"
                                              aria-label="Sửa lịch học"
                                            >
                                              <PencilSquareIcon aria-hidden="true" />
                                            </button>
                                            <button
                                              type="button"
                                              className="to-timetable-action-icon-btn danger"
                                              onClick={() => void handleDeleteItem(item)}
                                              title="Xóa lịch học"
                                              aria-label="Xóa lịch học"
                                            >
                                              <TrashIcon aria-hidden="true" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                  {timetableGroups.length === 0 && (
                    <tr><td colSpan={9} className="to-timetable-empty">Chưa có lịch học.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </RoleLayout>
  )
}
