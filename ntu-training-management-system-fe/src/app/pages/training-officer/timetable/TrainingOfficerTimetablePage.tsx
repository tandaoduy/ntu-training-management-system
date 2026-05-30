import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { EyeIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useSearchParams } from 'react-router-dom'
import { useAlert } from '@/components/alert'
import { apiDelete, apiGet, apiPost, apiPut } from '@/api/core/request'
import { Pagination } from '@/components/pagination'
import { clampPositiveInteger } from '@/utils/numberInput'
import RoleLayout from '../../../layout/RoleLayout'
import './TrainingOfficerTimetablePage.css'

type AcademicYear = { id: number; nam_hoc: string }
type Semester = { id: number; nam_hoc_id: number; hoc_ky: string }
type ApiListResponse<T> = { data: T }

type Course = {
  id: number
  don_vi_id?: number | null
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi: number
  don_vi?: {
    id: number
    ma_don_vi: string
    ten_don_vi: string
  } | null
}

type Lecturer = {
  id: number
  user_id: string
  ten_giang_vien: string
  don_vi_id?: number | null
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
  si_so_toi_da?: number | null
  so_sv_da_dk?: number
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
  registeredStudents: number | ''
}

type TimetableDisplayRow = {
  key: string
  items: TimetableItem[]
  firstItem: TimetableItem
}

type TimetableSlot = {
  id: string
  giang_duong_id: string
  phong_hoc_id: string
  thu: string
  tiet_bat_dau: string
  so_tiet: string
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
    current_hoc_ky_id?: number | null
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
    if (
      error.message.includes('No query results for model [App\\Models\\ThoiKhoaBieu]')
      || ('status' in error && error.status === 404)
    ) {
      return 'Lịch học này không còn tồn tại. Danh sách sẽ được tải lại.'
    }

    return error.message
  }

  return fallback
}

const isMissingTimetableError = (error: unknown) => (
  typeof error === 'object'
  && error !== null
  && (
    ('status' in error && error.status === 404)
    || ('message' in error
      && typeof error.message === 'string'
      && error.message.includes('No query results for model [App\\Models\\ThoiKhoaBieu]'))
  )
)

const compactClassGroup = (value?: string | null) => {
  const part = value?.split('-').pop()?.trim()
  return part && /^\d+$/.test(part) ? part.padStart(2, '0') : '01'
}

const normalizeClassGroup = (value: string) => {
  const trimmed = value.trim()
  return /^\d+$/.test(trimmed) ? trimmed.padStart(2, '0') : trimmed
}

const normalizeClassSectionCode = (value: string) => value.trim().toUpperCase()

const rangesOverlap = (firstStart: number, firstEnd: number, secondStart: number, secondEnd: number) => (
  firstStart <= secondEnd && firstEnd >= secondStart
)

const digitPattern = (start: number, end: number, max: number, disabled: Set<number> = new Set()) => (
  Array.from({ length: max }, (_, index) => {
    const value = index + 1
    return value >= start && value <= end && !disabled.has(value) ? String(value % 10) : '-'
  }).join('')
)

const digitPatternForItems = (items: TimetableItem[], max: number, disabled: Set<number> = new Set()) => {
  const activeValues = new Set<number>()

  items.forEach((item) => {
    for (let value = item.tuan_bat_dau; value <= item.tuan_ket_thuc; value += 1) {
      if (!disabled.has(value)) {
        activeValues.add(value)
      }
    }
  })

  return Array.from({ length: max }, (_, index) => {
    const value = index + 1
    return activeValues.has(value) ? String(value % 10) : '-'
  }).join('')
}

const getTimetableDisplayKey = (item: TimetableItem) => [
  item.hoc_ky_id,
  item.thu,
  item.lop_hoc_phan_id ?? item.lop_hoc_phan?.id ?? '',
  item.lop_hoc_phan?.ma_hoc_phan ?? '',
  item.lop_hoc_phan?.lop_hoc_phan ?? '',
  item.lop_hoc_phan?.nhom_hoc_phan ?? compactClassGroup(item.lop_hoc_phan?.lop_hoc_phan),
  item.lop_hoc_phan?.ten_hoc_phan ?? '',
  item.tiet_bat_dau,
  item.tiet_ket_thuc,
  item.phong_hoc_id ?? item.phong_hoc?.ma_phong ?? '',
].join('|')

const mergeTimetableDisplayRows = (items: TimetableItem[]): TimetableDisplayRow[] => {
  const rows = new Map<string, TimetableItem[]>()

  items.forEach((item) => {
    const key = getTimetableDisplayKey(item)
    rows.set(key, [...(rows.get(key) ?? []), item])
  })

  return Array.from(rows.entries()).map(([key, rowItems]) => ({
    key,
    items: rowItems.sort((first, second) => first.tuan_bat_dau - second.tuan_bat_dau),
    firstItem: rowItems[0],
  }))
}

const getTimetableGroupKey = (item: TimetableItem) => [
  item.hoc_ky_id,
  item.lop_hoc_phan?.hoc_phan_id ?? item.lop_hoc_phan?.ma_hoc_phan ?? '',
  item.lop_hoc_phan?.lop_hoc_phan ?? '',
  item.lop_hoc_phan?.nhom_hoc_phan ?? compactClassGroup(item.lop_hoc_phan?.lop_hoc_phan),
  item.lop_hoc_phan?.giang_vien_id ?? item.lop_hoc_phan?.ten_giang_vien ?? '',
].join('|')

const isLecturerInCourseUnit = (lecturer: Lecturer, course?: Course) => (
  !course?.don_vi_id || Number(lecturer.don_vi_id) === Number(course.don_vi_id)
)

export default function TrainingOfficerTimetablePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const alert = useAlert()
  const formPanelRef = useRef<HTMLElement | null>(null)
  const [years, setYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [classSections, setClassSections] = useState<ClassSection[]>([])
  const [administrativeClasses, setAdministrativeClasses] = useState<AdministrativeClass[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [weekConfigs, setWeekConfigs] = useState<WeekConfig[]>([])
  const [items, setItems] = useState<TimetableItem[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [timetableForm, setTimetableForm] = useState<TimetableForm>(emptyTimetableForm)
  const [courseCodeInput, setCourseCodeInput] = useState('')
  const [courseNameInput, setCourseNameInput] = useState('')
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [editingItemIds, setEditingItemIds] = useState<number[]>([])
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null)
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([])
  const [selectedTeachingWeeks, setSelectedTeachingWeeks] = useState<number[]>([])
  const [groupKeyword, setGroupKeyword] = useState('')
  const [groupPageSize, setGroupPageSize] = useState('10')
  const [groupPage, setGroupPage] = useState(1)

  const selectedTerm = semesters.find((semester) => (
    String(semester.nam_hoc_id) === timetableForm.nam_hoc_id
    && String(semester.hoc_ky) === timetableForm.hoc_ky
  ))
  const selectedTermId = selectedTerm ? String(selectedTerm.id) : ''
  const selectedCourse = courses.find((course) => String(course.id) === timetableForm.hoc_phan_id)
  const filteredLecturers = useMemo(() => (
    selectedCourse?.don_vi_id
      ? lecturers.filter((lecturer) => isLecturerInCourseUnit(lecturer, selectedCourse))
      : lecturers
  ), [lecturers, selectedCourse])
  const selectedLecturer = lecturers.find((lecturer) => String(lecturer.id) === timetableForm.giang_vien_id)
  const activeClassSectionIds = useMemo(() => new Set(
    items
      .filter((item) => !selectedTermId || String(item.hoc_ky_id) === selectedTermId)
      .map((item) => item.lop_hoc_phan_id ?? item.lop_hoc_phan?.id ?? null)
      .filter((id): id is number => typeof id === 'number')
  ), [items, selectedTermId])
  const duplicateClassGroupMessage = useMemo(() => {
    const normalizedGroup = normalizeClassGroup(timetableForm.nhom_hoc_phan)
    const sectionCode = normalizeClassSectionCode(timetableForm.lop_hoc_phan)

    if (!selectedTermId || !timetableForm.hoc_phan_id || !normalizedGroup) {
      return ''
    }

    const duplicate = classSections.find((section) => (
      activeClassSectionIds.has(section.id)
      && String(section.hoc_ky_id) === selectedTermId
      && (
        String(section.hoc_phan_id ?? '') === timetableForm.hoc_phan_id
        || section.ma_hoc_phan === selectedCourse?.ma_hoc_phan
      )
      && normalizeClassGroup(section.nhom_hoc_phan ?? '') === normalizedGroup
      && normalizeClassSectionCode(section.lop_hoc_phan) !== sectionCode
    ))

    return duplicate
      ? `Mã học phần ${duplicate.ma_hoc_phan} đã có nhóm học phần ${normalizedGroup}. Vui lòng nhập nhóm khác.`
      : ''
  }, [
    activeClassSectionIds,
    classSections,
    selectedCourse?.ma_hoc_phan,
    selectedTermId,
    timetableForm.hoc_phan_id,
    timetableForm.lop_hoc_phan,
    timetableForm.nhom_hoc_phan,
  ])

  const duplicateClassNameMessage = useMemo(() => {
    const sectionCode = normalizeClassSectionCode(timetableForm.lop_hoc_phan)
    const normalizedGroup = normalizeClassGroup(timetableForm.nhom_hoc_phan)

    if (!selectedTermId || !timetableForm.hoc_phan_id || !sectionCode) {
      return ''
    }

    const duplicate = classSections.find((section) => (
      activeClassSectionIds.has(section.id)
      && String(section.hoc_ky_id) === selectedTermId
      && (
        String(section.hoc_phan_id ?? '') === timetableForm.hoc_phan_id
        || section.ma_hoc_phan === selectedCourse?.ma_hoc_phan
      )
      && normalizeClassSectionCode(section.lop_hoc_phan) === sectionCode
      && normalizeClassGroup(section.nhom_hoc_phan ?? '') !== normalizedGroup
    ))

    return duplicate
      ? `Mã học phần ${duplicate.ma_hoc_phan} đã có lớp học phần "${sectionCode}". Một môn học không thể có 2 lớp học phần cùng tên. Vui lòng nhập tên lớp khác.`
      : ''
  }, [
    activeClassSectionIds,
    classSections,
    selectedCourse?.ma_hoc_phan,
    selectedTermId,
    timetableForm.hoc_phan_id,
    timetableForm.lop_hoc_phan,
    timetableForm.nhom_hoc_phan,
  ])

  const duplicateExistingGroupMessage = useMemo(() => {
    if (editingItemId) return '' // Allow editing existing
    const normalizedGroup = normalizeClassGroup(timetableForm.nhom_hoc_phan)
    if (!selectedTermId || !timetableForm.hoc_phan_id || !normalizedGroup) {
      return ''
    }

    const duplicate = classSections.find((section) => (
      activeClassSectionIds.has(section.id)
      && String(section.hoc_ky_id) === selectedTermId
      && (
        String(section.hoc_phan_id ?? '') === timetableForm.hoc_phan_id
        || section.ma_hoc_phan === selectedCourse?.ma_hoc_phan
      )
      && normalizeClassGroup(section.nhom_hoc_phan ?? '') === normalizedGroup
    ))

    return duplicate
      ? `Nhóm học phần ${normalizedGroup} đã được tạo và lưu lịch học. Không thể thêm chèn thêm lịch học mới vào nhóm này.`
      : ''
  }, [
    activeClassSectionIds,
    classSections,
    selectedCourse?.ma_hoc_phan,
    selectedTermId,
    timetableForm.hoc_phan_id,
    timetableForm.nhom_hoc_phan,
    editingItemId,
  ])
  const applySelectedCourse = (course: Course | undefined, patch: Partial<TimetableForm> = {}) => {
    setTimetableForm((current) => {
      const currentLecturer = lecturers.find((lecturer) => String(lecturer.id) === current.giang_vien_id)
      const shouldKeepLecturer = course && currentLecturer
        ? isLecturerInCourseUnit(currentLecturer, course)
        : true

      return {
        ...current,
        ...patch,
        hoc_phan_id: course ? String(course.id) : '',
        giang_vien_id: shouldKeepLecturer ? current.giang_vien_id : '',
      }
    })
  }
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
        maxStudents: firstItem.si_so_toi_da ?? classSection?.si_so ?? ('' as const),
        registeredStudents: firstItem.so_sv_da_dk ?? ('' as const),
      }
    }).sort((first, second) => (
      first.courseCode.localeCompare(second.courseCode, 'vi', { numeric: true })
      || first.courseName.localeCompare(second.courseName, 'vi', { numeric: true })
      || first.classGroup.localeCompare(second.classGroup, 'vi', { numeric: true })
    ))
  }, [courses, displayedItems])

  const filteredTimetableGroups = useMemo(() => {
    const keyword = groupKeyword.trim().toLowerCase()

    if (!keyword) {
      return timetableGroups
    }

    return timetableGroups.filter((group) => (
      group.courseCode.toLowerCase().includes(keyword)
      || group.courseName.toLowerCase().includes(keyword)
      || group.classGroup.toLowerCase().includes(keyword)
      || group.lecturerName.toLowerCase().includes(keyword)
    ))
  }, [groupKeyword, timetableGroups])

  const totalGroupPages = useMemo(() => {
    if (groupPageSize === 'all') return 1
    const size = Number(groupPageSize)
    return Math.max(1, Math.ceil(filteredTimetableGroups.length / size))
  }, [filteredTimetableGroups.length, groupPageSize])

  const pagedTimetableGroups = useMemo(() => {
    if (groupPageSize === 'all') return filteredTimetableGroups
    const size = Number(groupPageSize)
    const start = (groupPage - 1) * size
    return filteredTimetableGroups.slice(start, start + size)
  }, [filteredTimetableGroups, groupPage, groupPageSize])

  const displayFrom = useMemo(() => {
    if (filteredTimetableGroups.length === 0) return 0
    if (groupPageSize === 'all') return 1
    return (groupPage - 1) * Number(groupPageSize) + 1
  }, [filteredTimetableGroups.length, groupPage, groupPageSize])

  const displayTo = useMemo(() => {
    if (groupPageSize === 'all') return filteredTimetableGroups.length
    return Math.min(groupPage * Number(groupPageSize), filteredTimetableGroups.length)
  }, [filteredTimetableGroups.length, groupPage, groupPageSize])

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
    setClassSections(catalogsResponse.data.lop_hoc_phans ?? [])
    setAdministrativeClasses(catalogsResponse.data.lop_hanh_chinhs)
    setBuildings(catalogsResponse.data.giang_duongs)
    setRooms(catalogsResponse.data.phong_hocs)
    setWeekConfigs(catalogsResponse.data.cau_hinh_tuan_hocs ?? [])
    setItems(timetableResponse.data)

    const currentHocKyId = catalogsResponse.data.current_hoc_ky_id
    const defaultSemester = semestersResponse.data.find((semester) => semester.id === currentHocKyId) || semestersResponse.data[0]
    if (defaultSemester && !timetableForm.nam_hoc_id && !timetableForm.hoc_ky) {
      setTimetableForm((current) => ({
        ...current,
        nam_hoc_id: String(defaultSemester.nam_hoc_id),
        hoc_ky: String(defaultSemester.hoc_ky),
      }))
    }
  }

  useEffect(() => {
    loadAll().catch((err) => setError(toMessage(err, 'Không tải được dữ liệu thời khóa biểu.')))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshTimetableOnly = async () => {
    const timetableResponse = await apiGet<ApiListResponse<TimetableItem[]>>('/training-officer/timetable')
    setItems(timetableResponse.data)
  }

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

  useEffect(() => {
    if (editingItemId) {
      return
    }

    if (!selectedWeekConfig) {
      setSelectedTeachingWeeks([])
      return
    }

    const disabledWeeks = new Set(selectedWeekConfig.tuan_nghis ?? [])
    setSelectedTeachingWeeks(Array.from({ length: selectedWeekConfig.so_tuan_mac_dinh }, (_, index) => index + 1)
      .filter((week) => !disabledWeeks.has(week)))
  }, [editingItemId, selectedWeekConfig])

  const ensureClassSection = async () => {
    const sectionCode = normalizeClassSectionCode(timetableForm.lop_hoc_phan)
    const response = await apiPost<{ data: ClassSection }>('/training-officer/timetable/class-sections', {
      hoc_ky_id: Number(selectedTermId),
      hoc_phan_id: Number(timetableForm.hoc_phan_id),
      lop_hanh_chinh_id: timetableForm.lop_hanh_chinh_id ? Number(timetableForm.lop_hanh_chinh_id) : null,
      lop_hoc_phan: sectionCode,
      nhom_hoc_phan: normalizeClassGroup(timetableForm.nhom_hoc_phan),
      giang_vien_id: Number(timetableForm.giang_vien_id),
      ten_giang_vien: selectedLecturer?.ten_giang_vien ?? null,
      si_so: Number(timetableForm.si_so),
    })

    const newSection = response.data
    setClassSections((prev) => {
      if (prev.some((s) => s.id === newSection.id)) return prev
      return [...prev, newSection]
    })

    return newSection.id
  }

  const handleSaveTimetable = async () => {
    setError('')
    setMessage('')
    const editSlot = timetableSlots[0]
    const weekRanges = getWeekRanges(selectedTeachingWeeks)

    if (
      !selectedTermId
      || !(editSlot?.phong_hoc_id ?? timetableForm.phong_hoc_id)
      || weekRanges.length === 0
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

    if (duplicateClassGroupMessage) {
      setError(duplicateClassGroupMessage)
      alert.showError('Trùng nhóm học phần', duplicateClassGroupMessage)
      return
    }

    if (duplicateClassNameMessage) {
      setError(duplicateClassNameMessage)
      alert.showError('Trùng tên lớp học phần', duplicateClassNameMessage)
      return
    }

    const startPeriod = Number(editSlot?.tiet_bat_dau ?? timetableForm.tiet_bat_dau)
    const periodsCount = Number(editSlot?.so_tiet ?? timetableForm.so_tiet)
    const endPeriod = startPeriod + periodsCount - 1
    if (startPeriod <= 5 && endPeriod >= 6) {
      const msg = 'Lịch học không thể kéo dài từ ca Sáng sang ca Chiều (không thể vừa học tiết 5 và tiết 6).'
      setError(msg)
      alert.showError('Lỗi ca học', msg)
      return
    }
    if (startPeriod <= 10 && endPeriod >= 11) {
      const msg = 'Lịch học không thể kéo dài từ ca Chiều sang ca Tối (không thể vừa học tiết 10 và tiết 11).'
      setError(msg)
      alert.showError('Lỗi ca học', msg)
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

      const payloadBase = {
        hoc_ky_id: Number(selectedTermId),
        lop_hoc_phan_id: classSectionId,
        phong_hoc_id: Number(editSlot?.phong_hoc_id ?? timetableForm.phong_hoc_id),
        thu: Number(editSlot?.thu ?? timetableForm.thu),
        tiet_bat_dau: Number(editSlot?.tiet_bat_dau ?? timetableForm.tiet_bat_dau),
        so_tiet: Number(editSlot?.so_tiet ?? timetableForm.so_tiet),
      }

      if (editingItemId) {
        const targetIds = editingItemIds.length > 0 ? editingItemIds : [editingItemId]

        if (targetIds.length === 1 && weekRanges.length === 1) {
          await apiPut(`/training-officer/timetable/${editingItemId}`, {
            ...payloadBase,
            tuan_bat_dau: weekRanges[0].start,
            so_tuan: weekRanges[0].length,
          })
        } else {
          await Promise.all(targetIds.map((id) => apiDelete(`/training-officer/timetable/${id}`)))
          for (const range of weekRanges) {
            await apiPost('/training-officer/timetable', {
              ...payloadBase,
              tuan_bat_dau: range.start,
              so_tuan: range.length,
            })
          }
        }
      } else {
        await apiPost('/training-officer/timetable', {
          ...payloadBase,
          tuan_bat_dau: weekRanges[0].start,
          so_tuan: weekRanges[0].length,
        })
      }

      setTimetableForm((current) => ({
        ...current,
        nam_hoc_id: current.nam_hoc_id,
        hoc_ky: current.hoc_ky,
        giang_duong_id: current.giang_duong_id,
        phong_hoc_id: current.phong_hoc_id,
        so_tuan: current.so_tuan || (selectedWeekConfig ? String(selectedWeekConfig.so_tuan_mac_dinh) : ''),
      }))
      setEditingItemId(null)
      setEditingItemIds([])
      setTimetableSlots([])
      const successMessage = editingItemId ? 'Đã cập nhật lịch học.' : 'Đã lưu thời khóa biểu.'
      setMessage(successMessage)
      alert.showSuccess(editingItemId ? 'Cập nhật thành công' : 'Thêm thành công', successMessage)
      await refreshTimetableOnly()
    } catch (err) {
      const errorMessage = toMessage(err, 'Không lưu được thời khóa biểu.')
      if (editingItemId && isMissingTimetableError(err)) {
        setEditingItemId(null)
        setEditingItemIds([])
        setTimetableSlots([])
        setTimetableForm(emptyTimetableForm)
        setCourseCodeInput('')
        setCourseNameInput('')
        await refreshTimetableOnly()
      }
      setError(errorMessage)
      alert.showError('Không lưu được', errorMessage)
    }
  }

  const makeTimetableSlot = (day: string): TimetableSlot => ({
    id: `${Date.now()}-${Math.random()}`,
    giang_duong_id: '',
    phong_hoc_id: '',
    thu: day,
    tiet_bat_dau: '1',
    so_tiet: '3',
  })

  const toggleTeachingWeek = (week: number) => {
    setSelectedTeachingWeeks((current) => (
      current.includes(week)
        ? current.filter((item) => item !== week)
        : [...current, week].sort((a, b) => a - b)
    ))
  }

  const getWeekRanges = (weeks: number[]) => {
    const sortedWeeks = [...new Set(weeks)].sort((a, b) => a - b)
    const ranges: Array<{ start: number; length: number }> = []

    sortedWeeks.forEach((week) => {
      const currentRange = ranges[ranges.length - 1]
      if (!currentRange || currentRange.start + currentRange.length !== week) {
        ranges.push({ start: week, length: 1 })
        return
      }

      currentRange.length += 1
    })

    return ranges
  }

  const isRoomAvailableForRanges = (
    roomId: number,
    slot: Pick<TimetableSlot, 'thu' | 'tiet_bat_dau' | 'so_tiet'>,
    weekRanges: Array<{ start: number; length: number }>,
    ignoreIds: number[] = [],
  ) => {
    const startPeriod = Number(slot.tiet_bat_dau)
    const periodCount = Number(slot.so_tiet)
    const ignored = new Set(ignoreIds)

    if (!selectedTermId || !slot.thu || !startPeriod || !periodCount || weekRanges.length === 0) {
      return true
    }

    return weekRanges.every((range) => (
      !items.some((item) => (
        !ignored.has(item.id)
        && item.hoc_ky_id === Number(selectedTermId)
        && Number(item.phong_hoc_id) === roomId
        && item.thu === Number(slot.thu)
        && rangesOverlap(startPeriod, startPeriod + periodCount - 1, item.tiet_bat_dau, item.tiet_ket_thuc)
        && rangesOverlap(range.start, range.start + range.length - 1, item.tuan_bat_dau, item.tuan_ket_thuc)
      ))
    ))
  }

  const validateSlotInput = () => {
    setError('')
    setMessage('')
    return true
  }

  const handleToggleTimetableDay = (day: string, checked: boolean) => {
    const sameDay = (slot: TimetableSlot) => slot.thu === day

    if (!checked) {
      setTimetableSlots((current) => current.filter((slot) => !sameDay(slot)))
      return
    }

    if (!validateSlotInput()) return
    setTimetableSlots((current) => [
      ...current.filter((slot) => !sameDay(slot)),
      makeTimetableSlot(day),
    ].sort((first, second) => Number(first.thu) - Number(second.thu)))
  }

  const updateTimetableSlot = (slotId: string, patch: Partial<TimetableSlot>) => {
    const weekRanges = getWeekRanges(selectedTeachingWeeks)

    setTimetableSlots((current) => current.map((slot) => (
      slot.id === slotId
        ? (() => {
          const nextSlot = { ...slot, ...patch }
          const roomId = Number(nextSlot.phong_hoc_id)

          if (roomId && !isRoomAvailableForRanges(roomId, nextSlot, weekRanges, editingItemIds)) {
            return { ...nextSlot, phong_hoc_id: '' }
          }

          return nextSlot
        })()
        : slot
    )))
  }

  useEffect(() => {
    const weekRanges = getWeekRanges(selectedTeachingWeeks)

    if (!selectedTermId || weekRanges.length === 0) {
      return
    }

    setTimetableSlots((current) => current.map((slot) => {
      const roomId = Number(slot.phong_hoc_id)

      if (!roomId || isRoomAvailableForRanges(roomId, slot, weekRanges, editingItemIds)) {
        return slot
      }

      return { ...slot, phong_hoc_id: '' }
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingItemIds, items, selectedTeachingWeeks, selectedTermId])

  const handleSaveTimetableSlots = async () => {
    setError('')
    setMessage('')

    if (
      !selectedTermId
      || !timetableForm.hoc_phan_id
      || !timetableForm.lop_hoc_phan.trim()
      || !timetableForm.nhom_hoc_phan.trim()
      || !timetableForm.giang_vien_id
      || timetableSlots.length === 0
      || selectedTeachingWeeks.length === 0
      || timetableSlots.some((slot) => !slot.phong_hoc_id || !slot.tiet_bat_dau || !slot.so_tiet)
    ) {
      const validationMessage = 'Vui lòng chọn học phần, lớp, giảng viên, ngày học, tuần học và nhập đủ phòng, tiết.'
      setError(validationMessage)
      alert.showError('Thiếu thông tin', validationMessage)
      return
    }

    if (duplicateClassGroupMessage) {
      setError(duplicateClassGroupMessage)
      alert.showError('Trùng nhóm học phần', duplicateClassGroupMessage)
      return
    }

    if (duplicateClassNameMessage) {
      setError(duplicateClassNameMessage)
      alert.showError('Trùng tên lớp học phần', duplicateClassNameMessage)
      return
    }

    if (duplicateExistingGroupMessage) {
      setError(duplicateExistingGroupMessage)
      alert.showError('Nhóm học phần đã tồn tại', duplicateExistingGroupMessage)
      return
    }

    for (const slot of timetableSlots) {
      const start = Number(slot.tiet_bat_dau)
      const count = Number(slot.so_tiet)
      const end = start + count - 1
      if (start <= 5 && end >= 6) {
        const msg = `Buổi học ${Number(slot.thu) === 8 ? 'Chủ Nhật' : `Thứ ${slot.thu}`} không thể kéo dài từ ca Sáng sang ca Chiều (không thể vừa học tiết 5 và tiết 6).`
        setError(msg)
        alert.showError('Lỗi ca học', msg)
        return
      }
      if (start <= 10 && end >= 11) {
        const msg = `Buổi học ${Number(slot.thu) === 8 ? 'Chủ Nhật' : `Thứ ${slot.thu}`} không thể kéo dài từ ca Chiều sang ca Tối (không thể vừa học tiết 10 và tiết 11).`
        setError(msg)
        alert.showError('Lỗi ca học', msg)
        return
      }
    }

    try {
      const classSectionId = await ensureClassSection()
      const weekRanges = getWeekRanges(selectedTeachingWeeks)
      for (const slot of timetableSlots) {
        for (const range of weekRanges) {
          await apiPost('/training-officer/timetable', {
            hoc_ky_id: Number(selectedTermId),
            lop_hoc_phan_id: classSectionId,
            phong_hoc_id: Number(slot.phong_hoc_id),
            thu: Number(slot.thu),
            tiet_bat_dau: Number(slot.tiet_bat_dau),
            so_tiet: Number(slot.so_tiet),
            tuan_bat_dau: range.start,
            so_tuan: range.length,
          })
        }
      }

      setTimetableSlots([])
      setEditingItemId(null)
      setCourseCodeInput('')
      setCourseNameInput('')
      setTimetableForm({
        ...emptyTimetableForm,
        nam_hoc_id: timetableForm.nam_hoc_id,
        hoc_ky: timetableForm.hoc_ky,
      })
      const successMessage = 'Đã lưu các buổi học.'
      setMessage(successMessage)
      alert.showSuccess('Thêm thành công', successMessage)
      await refreshTimetableOnly()
    } catch (err) {
      const errorMessage = toMessage(err, 'Không lưu được các buổi học.')
      setError(errorMessage)
      alert.showError('Không lưu được', errorMessage)
    }
  }

  const handleEditItem = (item: TimetableItem, editItems: TimetableItem[] = [item]) => {
    const classSection = item.lop_hoc_phan
    const lecturer = lecturers.find((candidate) => (
      candidate.id === classSection?.giang_vien_id
      || candidate.ten_giang_vien === classSection?.ten_giang_vien
    ))
    const weeks = editItems.flatMap((editItem) => (
      Array.from(
        { length: editItem.tuan_ket_thuc - editItem.tuan_bat_dau + 1 },
        (_, index) => editItem.tuan_bat_dau + index,
      )
    ))

    setEditingItemId(item.id)
    setEditingItemIds(editItems.map((editItem) => editItem.id))
    setCourseCodeInput(classSection?.ma_hoc_phan ?? '')
    setCourseNameInput(classSection?.ten_hoc_phan ?? '')
    setSelectedTeachingWeeks([...new Set(weeks)].sort((first, second) => first - second))
    setTimetableSlots([{
      id: `edit-${item.id}`,
      giang_duong_id: String(item.phong_hoc?.giang_duong_id ?? ''),
      phong_hoc_id: String(item.phong_hoc_id ?? ''),
      thu: String(item.thu),
      tiet_bat_dau: String(item.tiet_bat_dau),
      so_tiet: String(item.so_tiet),
    }])
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

  const handleDeleteItems = async (deleteItems: TimetableItem[]) => {
    setError('')
    setMessage('')
    try {
      await Promise.all(deleteItems.map((item) => apiDelete(`/training-officer/timetable/${item.id}`)))
      const successMessage = 'Đã xóa lịch học.'
      setMessage(successMessage)
      alert.showSuccess('Xóa thành công', successMessage)
      await refreshTimetableOnly()
    } catch (err) {
      const errorMessage = toMessage(err, 'Không xóa được lịch học.')
      if (isMissingTimetableError(err)) {
        const deleteIds = new Set(deleteItems.map((item) => item.id))
        setItems((current) => current.filter((candidate) => !deleteIds.has(candidate.id)))
        await refreshTimetableOnly()
      }
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

  useEffect(() => {
    setGroupPage(1)
  }, [selectedTermId, groupKeyword, groupPageSize])

  useEffect(() => {
    if (groupPage > totalGroupPages) {
      setGroupPage(totalGroupPages)
    }
  }, [groupPage, totalGroupPages])

  useEffect(() => {
    if (expandedGroupKey && !filteredTimetableGroups.some((group) => group.key === expandedGroupKey)) {
      setExpandedGroupKey(null)
    }
  }, [expandedGroupKey, filteredTimetableGroups])


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
                    applySelectedCourse(selected)
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
                    applySelectedCourse(selected)
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
                      lop_hoc_phan: selectedClass ? normalizeClassSectionCode(selectedClass.lop_hoc_phan) : current.lop_hoc_phan,
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
                  onChange={(event) => setTimetableForm((current) => ({ ...current, lop_hoc_phan: normalizeClassSectionCode(event.target.value) }))}
                  placeholder=""
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
                  {filteredLecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.user_id ? `${lecturer.user_id} - ` : ''}{lecturer.ten_giang_vien}
                    </option>
                  ))}
                </select>
                {selectedCourse?.don_vi && (
                  <span className="to-timetable-field-hint">
                    Đơn vị quản lý: {selectedCourse.don_vi.ma_don_vi} - {selectedCourse.don_vi.ten_don_vi}
                  </span>
                )}
              </label>

              <div className="to-timetable-session-box span-12">
                <div className="to-timetable-session-head">
                  <strong>Các ngày học của học phần</strong>
                  <span>Tick ngày học rồi chỉnh phòng, tiết và tuần riêng cho từng ngày.</span>
                </div>
                <div className="to-timetable-week-picker">
                  <div className="to-timetable-week-picker-head">
                    <strong>Tuần học</strong>
                    <span>Bỏ tick các tuần không học của học phần.</span>
                  </div>
                  {selectedWeekConfig ? (
                    <div className="to-timetable-week-checks">
                      {Array.from({ length: selectedWeekConfig.so_tuan_mac_dinh }, (_, index) => index + 1).map((week) => (
                        <label key={week} className="to-timetable-week-check">
                          <input
                            type="checkbox"
                            checked={selectedTeachingWeeks.includes(week)}
                            onChange={() => toggleTeachingWeek(week)}
                          />
                          <span>Tuần {week}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="to-timetable-empty">Chưa có cấu hình tuần học cho học kỳ này.</div>
                  )}
                </div>
                <div className="to-timetable-day-checks">
                  {[2, 3, 4, 5, 6, 7, 8].map((day) => (
                    <label key={day} className="to-timetable-day-check">
                      <input
                        type="checkbox"
                        checked={timetableSlots.some((slot) => Number(slot.thu) === day)}
                        onChange={(event) => handleToggleTimetableDay(String(day), event.target.checked)}
                      />
                      <span>{day === 8 ? 'Chủ Nhật' : `Thứ ${day}`}</span>
                    </label>
                  ))}
                </div>
                {timetableSlots.length > 0 ? (
                  <div className="to-timetable-session-list">
                    {timetableSlots.map((slot, index) => {
                      const slotWeekRanges = getWeekRanges(selectedTeachingWeeks)
                      const candidateRooms = slot.giang_duong_id
                        ? rooms.filter((room) => String(room.giang_duong_id) === slot.giang_duong_id)
                        : rooms
                      const slotRooms = candidateRooms.filter((room) => (
                        room.id ? isRoomAvailableForRanges(room.id, slot, slotWeekRanges, editingItemIds) : false
                      ))

                      return (
                        <div key={slot.id} className="to-timetable-session-item">
                          <span className="to-timetable-session-index">{index + 1}</span>
                          <strong>{Number(slot.thu) === 8 ? 'CN' : `Thứ ${slot.thu}`}</strong>
                          <label>
                            Giảng đường
                            <select
                              value={slot.giang_duong_id}
                              onChange={(event) => updateTimetableSlot(slot.id, { giang_duong_id: event.target.value, phong_hoc_id: '' })}
                            >
                              <option value="">Tất cả</option>
                              {buildings.map((building) => (
                                <option key={building.id} value={building.id}>{building.ma_giang_duong}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Phòng
                            <select
                              value={slot.phong_hoc_id}
                              onChange={(event) => updateTimetableSlot(slot.id, { phong_hoc_id: event.target.value })}
                            >
                              <option value="">Chọn phòng</option>
                              {slotRooms.length === 0 && (
                                <option value="" disabled>Không có phòng trống</option>
                              )}
                              {slotRooms.map((room) => (
                                <option key={room.id} value={room.id ?? ''}>{room.ma_phong}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Tiết bắt đầu
                            <input
                              type="text"
                              inputMode="numeric"
                              value={slot.tiet_bat_dau}
                              onChange={(event) => updateTimetableSlot(slot.id, { tiet_bat_dau: clampPositiveInteger(event.target.value, 13) })}
                            />
                          </label>
                          <label>
                            Số tiết
                            <input
                              type="text"
                              inputMode="numeric"
                              value={slot.so_tiet}
                              onChange={(event) => updateTimetableSlot(slot.id, { so_tiet: clampPositiveInteger(event.target.value, 13) })}
                            />
                          </label>
                          <button
                            type="button"
                            className="to-timetable-icon-btn danger"
                            onClick={() => setTimetableSlots((current) => current.filter((item) => item.id !== slot.id))}
                          >
                            Xóa
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="to-timetable-empty">Chưa thêm ngày học nào.</div>
                )}
              </div>

              <div className="to-timetable-form-actions span-4">
                {editingItemId ? (
                  <button type="button" className="to-timetable-btn" onClick={() => void handleSaveTimetable()}>
                    Lưu
                  </button>
                ) : (
                  <button type="button" className="to-timetable-btn" onClick={() => void handleSaveTimetableSlots()}>
                    Lưu
                  </button>
                )}
                {editingItemId && (
                  <button type="button" className="to-timetable-btn secondary" onClick={() => { setEditingItemId(null); setEditingItemIds([]); setTimetableSlots([]); setTimetableForm(emptyTimetableForm); setCourseCodeInput(''); setCourseNameInput('') }}>
                    Hủy sửa
                  </button>
                )}
              </div>
            </div>
          </section>


          <section className="to-timetable-panel to-timetable-list-panel">
            <div className="to-timetable-panel-head">
              <h2>Lịch học đã xếp</h2>
              <p>{selectedTermLabel}</p>
            </div>
            <div className="to-timetable-list-toolbar">
              <div className="to-timetable-list-search">
                <span>Tìm nhanh</span>
                <div className="to-timetable-search-box">
                  <MagnifyingGlassIcon />
                  <input
                    value={groupKeyword}
                    onChange={(event) => { setGroupKeyword(event.target.value); setGroupPage(1); }}
                    placeholder="Nhập mã HP, tên học phần, nhóm hoặc giảng viên..."
                  />
                  {groupKeyword && (
                    <button type="button" onClick={() => setGroupKeyword('')}>
                      &times;
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="to-timetable-table-wrap">
              <div className="to-timetable-total">
                Hiển thị <strong>{displayFrom}-{displayTo}</strong> / <strong>{filteredTimetableGroups.length}</strong> nhóm
                <span> (Tổng số: <strong>{timetableGroups.length}</strong> nhóm)</span>
              </div>
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
                  {pagedTimetableGroups.map((group, index) => {
                    const isExpanded = expandedGroupKey === group.key

                    return (
                      <Fragment key={group.key}>
                        <tr className={isExpanded ? 'is-expanded' : undefined}>
                          <td><strong>{displayFrom + index}</strong></td>
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
                                  {mergeTimetableDisplayRows(group.items).map((row) => {
                                    const item = row.firstItem
                                    const weekConfig = weekConfigs.find((config) => config.hoc_ky_id === item.hoc_ky_id)
                                    const disabledWeeks = new Set(weekConfig?.tuan_nghis ?? [])
                                    const maxWeeks = weekConfig?.so_tuan_mac_dinh ?? Math.max(...row.items.map((rowItem) => rowItem.tuan_ket_thuc))

                                    return (
                                      <tr key={row.key}>
                                        <td><strong>{item.thu === 8 ? 'CN' : item.thu}</strong></td>
                                        <td>{item.lop_hoc_phan?.ma_hoc_phan || '-'}</td>
                                        <td>{item.lop_hoc_phan?.nhom_hoc_phan || compactClassGroup(item.lop_hoc_phan?.lop_hoc_phan)}</td>
                                        <td>{item.lop_hoc_phan?.ten_hoc_phan || 'Chưa cập nhật'}</td>
                                        <td className="to-pattern-cell">{digitPattern(item.tiet_bat_dau, item.tiet_ket_thuc, 13)}</td>
                                        <td>{item.phong_hoc?.ma_phong || '-'}</td>
                                        <td className="to-pattern-cell">{digitPatternForItems(row.items, maxWeeks, disabledWeeks)}</td>
                                        <td>
                                          <div className="to-timetable-actions">
                                            <button
                                              type="button"
                                              className="to-timetable-action-icon-btn"
                                              onClick={() => handleEditItem(item, row.items)}
                                              title="Sửa lịch học"
                                              aria-label="Sửa lịch học"
                                            >
                                              <PencilSquareIcon aria-hidden="true" />
                                            </button>
                                            <button
                                              type="button"
                                              className="to-timetable-action-icon-btn danger"
                                              onClick={() => void handleDeleteItems(row.items)}
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
                  {filteredTimetableGroups.length === 0 && (
                    <tr><td colSpan={9} className="to-timetable-empty">Chưa có lịch học.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredTimetableGroups.length > 0 && (
              <div className="to-timetable-list-pagination">
                <div className="to-timetable-pagination-group">
                  <div className="to-timetable-list-page-size-bottom">
                    <span>Số dòng/trang</span>
                    <select value={groupPageSize} onChange={(event) => { setGroupPageSize(event.target.value); setGroupPage(1); }}>
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="500">500</option>
                      <option value="all">Tất cả</option>
                    </select>
                  </div>
                  {groupPageSize !== 'all' && totalGroupPages > 1 && (
                    <Pagination
                      page={groupPage}
                      totalPages={totalGroupPages}
                      onPageChange={setGroupPage}
                      className="to-timetable-pagination-control"
                    />
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </RoleLayout>
  )
}
