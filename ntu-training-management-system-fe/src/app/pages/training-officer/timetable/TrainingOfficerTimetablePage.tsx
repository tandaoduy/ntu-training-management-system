import { useEffect, useMemo, useState } from 'react'
import { apiDelete, apiGet, apiPost, apiPut } from '@/api/core/request'
import { clampPositiveInteger } from '@/utils/numberInput'
import RoleLayout from '../../../layout/RoleLayout'
import './TrainingOfficerTimetablePage.css'

type AcademicYear = { id: number; nam_hoc: string }
type Semester = { id: number; nam_hoc_id: number; hoc_ky: string }
type ApiListResponse<T> = { data: T }

type Building = {
  id: number
  ma_giang_duong: string
  ten_giang_duong: string
  mo_ta?: string | null
}

type Room = {
  id: number
  giang_duong_id: number
  ma_phong: string
  suc_chua: number
  giang_duong?: Building
}

type ClassSection = {
  id: number
  lop_hoc_phan: string
  ten_hoc_phan?: string | null
  ten_giang_vien?: string | null
  si_so: number
  ma_khoi?: string | null
  ten_khoi?: string | null
}

type TimetableItem = {
  id: number
  lop_hoc_phan_id: number
  phong_hoc_id: number
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

type CatalogResponse = {
  data: {
    giang_duongs: Building[]
    phong_hocs: Room[]
    lop_hoc_phans: ClassSection[]
  }
}

type TimetableForm = {
  hoc_ky_id: string
  lop_hoc_phan_id: string
  giang_duong_id: string
  phong_hoc_id: string
  thu: string
  tiet_bat_dau: string
  so_tiet: string
  tuan_bat_dau: string
  so_tuan: string
}

const emptyTimetableForm: TimetableForm = {
  hoc_ky_id: '',
  lop_hoc_phan_id: '',
  giang_duong_id: '',
  phong_hoc_id: '',
  thu: '2',
  tiet_bat_dau: '1',
  so_tiet: '3',
  tuan_bat_dau: '1',
  so_tuan: '19',
}

const toMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return fallback
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN')
}

const classOptionLabel = (item: ClassSection) => {
  const course = item.ten_hoc_phan?.trim() || 'Chưa cập nhật môn học'
  const lecturer = item.ten_giang_vien?.trim() || 'Chưa cập nhật giảng viên'

  return `${item.lop_hoc_phan} - ${course} - ${lecturer} - sĩ số ${item.si_so}`
}

export default function TrainingOfficerTimetablePage() {
  const [years, setYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [buildings, setBuildings] = useState<Building[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [classes, setClasses] = useState<ClassSection[]>([])
  const [items, setItems] = useState<TimetableItem[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [timetableForm, setTimetableForm] = useState<TimetableForm>(emptyTimetableForm)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)

  const selectedRooms = useMemo(() => (
    timetableForm.giang_duong_id
      ? rooms.filter((room) => String(room.giang_duong_id) === timetableForm.giang_duong_id)
      : rooms
  ), [rooms, timetableForm.giang_duong_id])

  const selectedTerm = semesters.find((semester) => String(semester.id) === timetableForm.hoc_ky_id)
  const selectedTermLabel = selectedTerm
    ? `${years.find((year) => year.id === selectedTerm.nam_hoc_id)?.nam_hoc ?? ''} - Học kỳ ${selectedTerm.hoc_ky}`
    : 'Tất cả học kỳ'

  const loadAll = async () => {
    const [yearsResponse, semestersResponse, catalogsResponse, timetableResponse] = await Promise.all([
      apiGet<ApiListResponse<AcademicYear[]>>('/academic-catalog/nam-hocs'),
      apiGet<ApiListResponse<Semester[]>>('/academic-catalog/hoc-kys'),
      apiGet<CatalogResponse>('/training-officer/timetable/catalogs'),
      apiGet<ApiListResponse<TimetableItem[]>>('/training-officer/timetable'),
    ])

    setYears(yearsResponse.data)
    setSemesters(semestersResponse.data)
    setBuildings(catalogsResponse.data.giang_duongs)
    setRooms(catalogsResponse.data.phong_hocs)
    setClasses(catalogsResponse.data.lop_hoc_phans)
    setItems(timetableResponse.data)

    const firstSemester = semestersResponse.data[0]
    if (firstSemester && !timetableForm.hoc_ky_id) {
      setTimetableForm((current) => ({ ...current, hoc_ky_id: String(firstSemester.id) }))
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
    setBuildings(catalogsResponse.data.giang_duongs)
    setRooms(catalogsResponse.data.phong_hocs)
    setClasses(catalogsResponse.data.lop_hoc_phans)
    setItems(timetableResponse.data)
  }

  const handleSaveTimetable = async () => {
    setError('')
    setMessage('')
    const payload = {
      hoc_ky_id: Number(timetableForm.hoc_ky_id),
      lop_hoc_phan_id: Number(timetableForm.lop_hoc_phan_id),
      phong_hoc_id: Number(timetableForm.phong_hoc_id),
      thu: Number(timetableForm.thu),
      tiet_bat_dau: Number(timetableForm.tiet_bat_dau),
      so_tiet: Number(timetableForm.so_tiet),
      tuan_bat_dau: Number(timetableForm.tuan_bat_dau),
      so_tuan: Number(timetableForm.so_tuan),
    }

    try {
      if (editingItemId) {
        await apiPut(`/training-officer/timetable/${editingItemId}`, payload)
      } else {
        await apiPost('/training-officer/timetable', payload)
      }
      setTimetableForm((current) => ({
        ...emptyTimetableForm,
        hoc_ky_id: current.hoc_ky_id,
        giang_duong_id: current.giang_duong_id,
      }))
      setEditingItemId(null)
      setMessage('Đã lưu thời khóa biểu.')
      await refreshCatalogs()
    } catch (err) {
      setError(toMessage(err, 'Không lưu được thời khóa biểu.'))
    }
  }

  const handleEditItem = (item: TimetableItem) => {
    setEditingItemId(item.id)
    setTimetableForm({
      hoc_ky_id: String(item.hoc_ky_id),
      lop_hoc_phan_id: String(item.lop_hoc_phan_id),
      giang_duong_id: String(item.phong_hoc?.giang_duong_id ?? ''),
      phong_hoc_id: String(item.phong_hoc_id),
      thu: String(item.thu),
      tiet_bat_dau: String(item.tiet_bat_dau),
      so_tiet: String(item.so_tiet),
      tuan_bat_dau: String(item.tuan_bat_dau),
      so_tuan: String(item.so_tuan),
    })
  }

  const handleDeleteItem = async (item: TimetableItem) => {
    setError('')
    setMessage('')
    try {
      await apiDelete(`/training-officer/timetable/${item.id}`)
      setMessage('Đã xóa lịch học.')
      await refreshCatalogs()
    } catch (err) {
      setError(toMessage(err, 'Không xóa được lịch học.'))
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
          <section className="to-timetable-panel">
            <div className="to-timetable-panel-head">
              <h2>Xếp thời khóa biểu</h2>
              <p>13 tiết/ngày, tính lịch theo tuần và chặn trùng phòng.</p>
            </div>

            <div className="to-timetable-form">
              <label>
                Học kỳ
                <select
                  value={timetableForm.hoc_ky_id}
                  onChange={(event) => {
                    setTimetableForm((current) => ({ ...current, hoc_ky_id: event.target.value }))
                  }}
                >
                  <option value="">Chọn học kỳ</option>
                  {semesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {years.find((year) => year.id === semester.nam_hoc_id)?.nam_hoc} - Học kỳ {semester.hoc_ky}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Lớp học phần
                <select value={timetableForm.lop_hoc_phan_id} onChange={(event) => setTimetableForm((current) => ({ ...current, lop_hoc_phan_id: event.target.value }))}>
                  <option value="">Chọn lớp học phần</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>{classOptionLabel(item)}</option>
                  ))}
                </select>
              </label>

              <div className="to-timetable-two">
                <label>
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
                <label>
                  Phòng học
                  <select value={timetableForm.phong_hoc_id} onChange={(event) => setTimetableForm((current) => ({ ...current, phong_hoc_id: event.target.value }))}>
                    <option value="">Chọn phòng</option>
                    {selectedRooms.map((room) => (
                      <option key={room.id} value={room.id}>{room.ma_phong} - {room.suc_chua} chỗ</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="to-timetable-two">
                <label>
                  Thứ
                  <select value={timetableForm.thu} onChange={(event) => setTimetableForm((current) => ({ ...current, thu: event.target.value }))}>
                    {[2, 3, 4, 5, 6, 7, 8].map((day) => (
                      <option key={day} value={day}>{day === 8 ? 'Chủ nhật' : `Thứ ${day}`}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Tiết bắt đầu
                  <input type="text" inputMode="numeric" pattern="[1-9][0-9]*" value={timetableForm.tiet_bat_dau} onChange={(event) => setTimetableForm((current) => ({ ...current, tiet_bat_dau: clampPositiveInteger(event.target.value, 13) }))} />
                </label>
              </div>

              <div className="to-timetable-two">
                <label>
                  Số tiết
                  <input type="text" inputMode="numeric" pattern="[1-9][0-9]*" value={timetableForm.so_tiet} onChange={(event) => setTimetableForm((current) => ({ ...current, so_tiet: clampPositiveInteger(event.target.value, 13) }))} />
                </label>
                <label>
                  Tuần bắt đầu
                  <input type="text" inputMode="numeric" pattern="[1-9][0-9]*" value={timetableForm.tuan_bat_dau} onChange={(event) => setTimetableForm((current) => ({ ...current, tuan_bat_dau: clampPositiveInteger(event.target.value, 52) }))} />
                </label>
              </div>

              <label>
                Số tuần học
                <input type="text" inputMode="numeric" pattern="[1-9][0-9]*" value={timetableForm.so_tuan} onChange={(event) => setTimetableForm((current) => ({ ...current, so_tuan: clampPositiveInteger(event.target.value, 52) }))} />
              </label>

              <button type="button" className="to-timetable-btn" onClick={() => void handleSaveTimetable()}>
                {editingItemId ? 'Cập nhật lịch học' : 'Lưu lịch học'}
              </button>
              {editingItemId && (
                <button type="button" className="to-timetable-btn secondary" onClick={() => { setEditingItemId(null); setTimetableForm(emptyTimetableForm) }}>
                  Hủy sửa
                </button>
              )}
            </div>
          </section>

          <section className="to-timetable-panel">
            <div className="to-timetable-panel-head">
              <h2>Lịch học đã xếp</h2>
              <p>{selectedTermLabel}</p>
            </div>
            <div className="to-timetable-table-wrap">
              <table className="to-timetable-table">
                <thead>
                  <tr>
                    <th>Thứ</th>
                    <th>Tiết</th>
                    <th>Lớp học phần</th>
                    <th>Môn học</th>
                    <th>Giảng viên</th>
                    <th>Phòng</th>
                    <th>Tuần</th>
                    <th>Ngày học</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.thu === 8 ? 'CN' : `Thứ ${item.thu}`}</td>
                      <td>{item.tiet_bat_dau}-{item.tiet_ket_thuc}</td>
                      <td>{item.lop_hoc_phan?.lop_hoc_phan}</td>
                      <td>{item.lop_hoc_phan?.ten_hoc_phan || 'Chưa cập nhật'}</td>
                      <td>{item.lop_hoc_phan?.ten_giang_vien || 'Chưa cập nhật'}</td>
                      <td>{item.phong_hoc?.ma_phong}</td>
                      <td>{item.tuan_bat_dau}-{item.tuan_ket_thuc}</td>
                      <td>{formatDate(item.ngay_bat_dau)} - {formatDate(item.ngay_ket_thuc)}</td>
                      <td>
                        <div className="to-timetable-actions">
                          <button type="button" className="to-timetable-icon-btn" onClick={() => handleEditItem(item)}>Sửa</button>
                          <button type="button" className="to-timetable-icon-btn danger" onClick={() => void handleDeleteItem(item)}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
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
