import { useEffect, useMemo, useState } from 'react'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { apiDelete, apiGet, apiPost, apiPut } from '@/api/core/request'
import { useAlert } from '@/components/alert'
import './AdminRoomManagementPage.css'

type Building = {
  id: number
  ma_giang_duong: string
  ten_giang_duong: string
}

type Room = {
  id: number
  giang_duong_id: number
  ma_phong: string
  giang_duong?: Building
}

type CatalogResponse = {
  data: {
    giang_duongs: Building[]
    phong_hocs: Room[]
  }
}

type BuildingForm = {
  ma_giang_duong: string
  ten_giang_duong: string
}

type RoomForm = {
  giang_duong_id: string
  ma_phong: string
}

const emptyBuildingForm: BuildingForm = { ma_giang_duong: '', ten_giang_duong: '' }
const emptyRoomForm: RoomForm = { giang_duong_id: '', ma_phong: '' }

const toMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return fallback
}

export default function AdminRoomManagementPage() {
  const { showAlert } = useAlert()
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingBuilding, setIsSavingBuilding] = useState(false)
  const [isSavingRoom, setIsSavingRoom] = useState(false)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [buildingForm, setBuildingForm] = useState<BuildingForm>(emptyBuildingForm)
  const [roomForm, setRoomForm] = useState<RoomForm>(emptyRoomForm)
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null)
  const [buildingFilter, setBuildingFilter] = useState('')

  const filteredRooms = useMemo(() => {
    if (!buildingFilter) return rooms
    return rooms.filter((room) => String(room.giang_duong_id) === buildingFilter)
  }, [buildingFilter, rooms])

  const fetchCatalogs = async () => {
    const response = await apiGet<CatalogResponse>('/admin/timetable-management/catalogs')

    setBuildings(response.data.giang_duongs)
    setRooms(response.data.phong_hocs)
  }

  useEffect(() => {
    let isMounted = true

    const loadCatalogs = async () => {
      setIsLoading(true)

      try {
        const response = await apiGet<CatalogResponse>('/admin/timetable-management/catalogs')

        if (!isMounted) return

        setBuildings(response.data.giang_duongs)
        setRooms(response.data.phong_hocs)
      } catch (error) {
        if (!isMounted) return

        showAlert({
          title: 'Không tải được phòng học',
          message: toMessage(error, 'Vui lòng kiểm tra kết nối backend.'),
          variant: 'error',
        })
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadCatalogs()

    return () => {
      isMounted = false
    }
  }, [showAlert])

  const handleSaveBuilding = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!buildingForm.ma_giang_duong.trim() || !buildingForm.ten_giang_duong.trim()) {
      showAlert({
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập mã và tên giảng đường.',
        variant: 'warning',
      })
      return
    }

    setIsSavingBuilding(true)
    try {
      await apiPost('/admin/timetable-management/buildings', buildingForm)
      setBuildingForm(emptyBuildingForm)
      showAlert({ title: 'Thành công', message: 'Đã thêm giảng đường.', variant: 'success' })
      await fetchCatalogs()
    } catch (error) {
      showAlert({
        title: 'Không lưu được giảng đường',
        message: toMessage(error, 'Vui lòng thử lại.'),
        variant: 'error',
      })
    } finally {
      setIsSavingBuilding(false)
    }
  }

  const handleSaveRoom = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!roomForm.giang_duong_id || !roomForm.ma_phong.trim()) {
      showAlert({
        title: 'Thiếu thông tin',
        message: 'Vui lòng chọn giảng đường và nhập mã phòng.',
        variant: 'warning',
      })
      return
    }

    const payload = {
      giang_duong_id: Number(roomForm.giang_duong_id),
      ma_phong: roomForm.ma_phong.trim(),
    }

    setIsSavingRoom(true)
    try {
      if (editingRoomId) {
        await apiPut(`/admin/timetable-management/rooms/${editingRoomId}`, payload)
      } else {
        await apiPost('/admin/timetable-management/rooms', payload)
      }

      setEditingRoomId(null)
      setRoomForm(emptyRoomForm)
      showAlert({
        title: 'Thành công',
        message: editingRoomId ? 'Đã cập nhật phòng học.' : 'Đã thêm phòng học.',
        variant: 'success',
      })
      await fetchCatalogs()
    } catch (error) {
      showAlert({
        title: 'Không lưu được phòng học',
        message: toMessage(error, 'Vui lòng thử lại.'),
        variant: 'error',
      })
    } finally {
      setIsSavingRoom(false)
    }
  }

  const handleEditRoom = (room: Room) => {
    setEditingRoomId(room.id)
    setRoomForm({
      giang_duong_id: String(room.giang_duong_id),
      ma_phong: room.ma_phong,
    })
  }

  const handleDeleteRoom = async (room: Room) => {
    if (!window.confirm(`Xóa phòng ${room.ma_phong}?`)) return

    try {
      await apiDelete(`/admin/timetable-management/rooms/${room.id}`)
      showAlert({ title: 'Thành công', message: 'Đã xóa phòng học.', variant: 'success' })
      await fetchCatalogs()
    } catch (error) {
      showAlert({
        title: 'Không xóa được phòng học',
        message: toMessage(error, 'Phòng học có thể đang được dùng trong thời khóa biểu.'),
        variant: 'error',
      })
    }
  }

  const handleDeleteBuilding = async (building: Building) => {
    if (!window.confirm(`Xóa giảng đường ${building.ma_giang_duong}?`)) return

    try {
      await apiDelete(`/admin/timetable-management/buildings/${building.id}`)
      showAlert({ title: 'Thành công', message: 'Đã xóa giảng đường.', variant: 'success' })
      await fetchCatalogs()
    } catch (error) {
      showAlert({
        title: 'Không xóa được giảng đường',
        message: toMessage(error, 'Giảng đường có thể đang có phòng học trực thuộc.'),
        variant: 'error',
      })
    }
  }

  return (
    <main className="arm-page">
      <section className="arm-header">
        <div>
          <h1>Quản lí phòng học</h1>
          <p>Quản lí giảng đường và phòng học để dùng khi xếp thời khóa biểu.</p>
        </div>
      </section>

      <div className="arm-grid">
        <section className="arm-panel">
          <div className="arm-panel-head">
            <h2>Giảng đường</h2>
            <p>Tạo khu/nhà trước khi thêm phòng học.</p>
          </div>

          <form className="arm-form" onSubmit={handleSaveBuilding}>
            <label>
              Mã giảng đường
              <input
                value={buildingForm.ma_giang_duong}
                onChange={(event) => setBuildingForm((current) => ({ ...current, ma_giang_duong: event.target.value }))}
              />
            </label>
            <label>
              Tên giảng đường
              <input
                value={buildingForm.ten_giang_duong}
                onChange={(event) => setBuildingForm((current) => ({ ...current, ten_giang_duong: event.target.value }))}
              />
            </label>
            <button type="submit" className="arm-btn" disabled={isSavingBuilding}>
              {isSavingBuilding ? 'Đang lưu...' : 'Thêm giảng đường'}
            </button>
          </form>

          <div className="arm-list">
            {buildings.map((building) => (
              <div className="arm-list-item" key={building.id}>
                <div>
                  <strong>{building.ma_giang_duong}</strong>
                  <span>{building.ten_giang_duong}</span>
                </div>
                <button
                  type="button"
                  className="arm-action-icon-btn danger"
                  onClick={() => void handleDeleteBuilding(building)}
                  title="Xóa giảng đường"
                >
                  <TrashIcon className="w-5 h-5 text-red-600" />
                </button>
              </div>
            ))}
            {!isLoading && buildings.length === 0 && <div className="arm-empty">Chưa có giảng đường.</div>}
          </div>
        </section>

        <section className="arm-panel">
          <div className="arm-panel-head">
            <h2>Phòng học</h2>
            <p>Phòng học thuộc một giảng đường.</p>
          </div>

          <form className="arm-form" onSubmit={handleSaveRoom}>
            <label>
              Giảng đường
              <select
                value={roomForm.giang_duong_id}
                onChange={(event) => setRoomForm((current) => ({ ...current, giang_duong_id: event.target.value }))}
              >
                <option value="">Chọn giảng đường</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.ma_giang_duong} - {building.ten_giang_duong}
                  </option>
                ))}
              </select>
            </label>
            <div className="arm-form-single">
              <label>
                Mã phòng
                <input
                  value={roomForm.ma_phong}
                  onChange={(event) => setRoomForm((current) => ({ ...current, ma_phong: event.target.value }))}
                />
              </label>
            </div>
            <div className="arm-actions">
              <button type="submit" className="arm-btn" disabled={isSavingRoom}>
                {isSavingRoom ? 'Đang lưu...' : editingRoomId ? 'Cập nhật phòng học' : 'Thêm phòng học'}
              </button>
              {editingRoomId && (
                <button
                  type="button"
                  className="arm-btn secondary"
                  onClick={() => {
                    setEditingRoomId(null)
                    setRoomForm(emptyRoomForm)
                  }}
                >
                  Hủy sửa
                </button>
              )}
            </div>
          </form>

          <div className="arm-filter">
            <label>
              Lọc theo giảng đường
              <select value={buildingFilter} onChange={(event) => setBuildingFilter(event.target.value)}>
                <option value="">Tất cả</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>{building.ma_giang_duong}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="arm-table-wrap">
            <table className="arm-table">
              <thead>
                <tr>
                  <th>Mã phòng</th>
                  <th>Giảng đường</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => (
                  <tr key={room.id}>
                    <td>{room.ma_phong}</td>
                    <td>{room.giang_duong?.ten_giang_duong ?? '-'}</td>
                    <td>
                      <div className="arm-row-actions">
                        <button
                          type="button"
                          className="arm-action-icon-btn"
                          onClick={() => handleEditRoom(room)}
                          title="Sửa phòng học"
                        >
                          <PencilSquareIcon className="w-5 h-5 text-blue-600" />
                        </button>
                        <button
                          type="button"
                          className="arm-action-icon-btn danger"
                          onClick={() => void handleDeleteRoom(room)}
                          title="Xóa phòng học"
                        >
                          <TrashIcon className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredRooms.length === 0 && (
                  <tr>
                    <td colSpan={3} className="arm-empty">Chưa có phòng học.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
