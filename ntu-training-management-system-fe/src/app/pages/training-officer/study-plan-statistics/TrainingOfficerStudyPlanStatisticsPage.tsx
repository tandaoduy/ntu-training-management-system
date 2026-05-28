import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EyeIcon } from '@heroicons/react/24/outline'
import { apiGet } from '@/api/core/request'
import { PAGE_SIZE_OPTIONS, getPageSizeLabel, getPageSizeNumber } from '@/components/pagination'
import RoleLayout from '../../../layout/RoleLayout'
import './TrainingOfficerStudyPlanStatisticsPage.css'

type StudyPlanCourseStat = {
  id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi: number
  so_luong_sinh_vien: number
}

type StudyPlanCourseOption = Omit<StudyPlanCourseStat, 'so_luong_sinh_vien'>

type StudyPlanStatisticsResponse = {
  data: {
    term?: {
      nam_hoc?: string
      hoc_ky?: string
    } | null
    all_courses?: StudyPlanCourseOption[]
    courses: StudyPlanCourseStat[]
  }
}

type CatalogYear = {
  id: number
  nam_hoc: string
}

type CatalogSemester = {
  id: number
  nam_hoc_id: number
  hoc_ky: string
}

type ApiListResponse<T> = {
  data: T
}

type CurrentTermResponse = {
  data: {
    nam_hoc?: string | null
    hoc_ky?: string | null
  } | null
}

type StatisticsParams = {
  hoc_ky_id?: number
  nam_hoc?: string
  hoc_ky?: string
}

export default function TrainingOfficerStudyPlanStatisticsPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState<StudyPlanCourseStat[]>([])
  const [catalogCourses, setCatalogCourses] = useState<StudyPlanCourseOption[]>([])
  const [catalogYears, setCatalogYears] = useState<CatalogYear[]>([])
  const [catalogSemesters, setCatalogSemesters] = useState<CatalogSemester[]>([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [searchField, setSearchField] = useState<'code' | 'name'>('code')
  const [searchValue, setSearchValue] = useState('')
  const [pageSize, setPageSize] = useState('20')

  const selectedTermId = useMemo(() => {
    if (!selectedYear || !selectedSemester) {
      return undefined
    }

    return catalogSemesters.find((semester) => (
      semester.hoc_ky === selectedSemester
      && catalogYears.find((year) => year.id === semester.nam_hoc_id)?.nam_hoc === selectedYear
    ))?.id
  }, [catalogSemesters, catalogYears, selectedSemester, selectedYear])

  const statisticsParams = useMemo(() => {
    const params: StatisticsParams = {}

    if (selectedTermId) {
      params.hoc_ky_id = selectedTermId
      return params
    }

    if (selectedYear) {
      params.nam_hoc = selectedYear
    }

    if (selectedSemester) {
      params.hoc_ky = selectedSemester
    }

    return Object.keys(params).length > 0 ? params : undefined
  }, [selectedSemester, selectedTermId, selectedYear])

  useEffect(() => {
    let active = true

    const loadCatalogs = async () => {
      try {
        const [yearsResponse, semestersResponse, currentTermResponse] = await Promise.all([
          apiGet<ApiListResponse<CatalogYear[]>>('/academic-catalog/nam-hocs'),
          apiGet<ApiListResponse<CatalogSemester[]>>('/academic-catalog/hoc-kys'),
          apiGet<CurrentTermResponse>('/academic-catalog/current-term'),
        ])
        if (!active) return

        setCatalogYears(yearsResponse.data)
        setCatalogSemesters(semestersResponse.data)
        setSelectedYear(currentTermResponse.data?.nam_hoc ?? '')
        setSelectedSemester(currentTermResponse.data?.hoc_ky ?? '')
      } catch {
        if (!active) return
        setError('Không tải được danh sách năm học và học kỳ.')
      }
    }

    void loadCatalogs()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadStatistics = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await apiGet<StudyPlanStatisticsResponse>(
          '/training-officer/study-plan-statistics',
          statisticsParams ? { params: statisticsParams } : undefined,
        )
        if (!active) return

        setCatalogCourses(response.data.all_courses ?? [])
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
  }, [statisticsParams])

  const semesterOptions = useMemo(() => {
    if (!selectedYear) {
      return Array.from(new Set(catalogSemesters.map((semester) => semester.hoc_ky)))
    }

    const year = catalogYears.find((item) => item.nam_hoc === selectedYear)
    if (!year) {
      return []
    }

    return Array.from(new Set(
      catalogSemesters
        .filter((semester) => semester.nam_hoc_id === year.id)
        .map((semester) => semester.hoc_ky),
    ))
  }, [catalogSemesters, catalogYears, selectedYear])

  const filteredCourses = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase()
    if (!keyword) {
      return courses
    }

    return courses.filter((course) => (
      searchField === 'name'
        ? course.ten_hoc_phan.toLowerCase().includes(keyword)
        : course.ma_hoc_phan.toLowerCase().includes(keyword)
    ))
  }, [courses, searchField, searchValue])

  const searchOptions = useMemo(() => {
    const values = catalogCourses.map((course) => (
      searchField === 'name' ? course.ten_hoc_phan : course.ma_hoc_phan
    ))

    return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right, 'vi'))
  }, [catalogCourses, searchField])

  const visibleCourses = filteredCourses.slice(0, getPageSizeNumber(pageSize, filteredCourses.length))

  const handleViewDetails = (course: StudyPlanCourseStat) => {
    const queryParams = new URLSearchParams()
    if (selectedTermId) {
      queryParams.set('hoc_ky_id', String(selectedTermId))
    } else {
      if (selectedYear) {
        queryParams.set('nam_hoc', selectedYear)
      }
      if (selectedSemester) {
        queryParams.set('hoc_ky', selectedSemester)
      }
    }

    const query = queryParams.size > 0 ? `?${queryParams.toString()}` : ''
    navigate(`/chuyenvien/study-plan-statistics/${course.id}${query}`)
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
        {error && <div className="sp-stat-alert error">{error}</div>}
        {isLoading && <div className="sp-stat-alert info">Đang tải thống kê...</div>}

        <section className="sp-stat-filter-panel" aria-label="Bộ lọc thống kê KHHT">
          <div className="sp-stat-filter-grid">
            <label>Năm học</label>
            <select
              value={selectedYear}
              onChange={(event) => {
                const nextYear = event.target.value
                const year = catalogYears.find((item) => item.nam_hoc === nextYear)
                const validSemesters = year
                  ? catalogSemesters.filter((semester) => semester.nam_hoc_id === year.id).map((semester) => semester.hoc_ky)
                  : []

                setSelectedYear(nextYear)
                setSelectedSemester((current) => (current && validSemesters.includes(current) ? current : ''))
              }}
            >
              <option value="">---- Tất cả ----</option>
              {catalogYears.map((year) => (
                <option key={year.id} value={year.nam_hoc}>{year.nam_hoc}</option>
              ))}
            </select>

            <label>Học kỳ</label>
            <select value={selectedSemester} onChange={(event) => setSelectedSemester(event.target.value)}>
              <option value="">---- Tất cả ----</option>
              {semesterOptions.map((semester) => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </select>

            <label>Học phần</label>
            <div className="sp-stat-search-controls">
              <select
                value={searchField}
                onChange={(event) => {
                  setSearchField(event.target.value as 'code' | 'name')
                  setSearchValue('')
                }}
              >
                <option value="code">Mã học phần</option>
                <option value="name">Tên học phần</option>
              </select>
              <select value={searchValue} onChange={(event) => setSearchValue(event.target.value)} aria-label="Tìm học phần">
                <option value="">---- Tất cả ----</option>
                {searchOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <label>Số dòng mỗi trang</label>
            <select value={pageSize} onChange={(event) => setPageSize(event.target.value)}>
              {PAGE_SIZE_OPTIONS.map((value) => (
                <option key={value} value={value}>{getPageSizeLabel(value)}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="sp-stat-panel">
          <div className="sp-stat-panel-head">
            <div>
              <h2>Nhu cầu theo học phần</h2>
              <p>Theo dõi số sinh viên đã đưa từng học phần vào KHHT.</p>
            </div>
            <span className="sp-stat-result-count">{filteredCourses.length} học phần</span>
          </div>

          <div className="sp-stat-table-wrap">
            <table className="sp-stat-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã học phần</th>
                  <th>Tên học phần</th>
                  <th>ĐVHT/TC</th>
                  <th>Số SV đăng ký</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleCourses.map((course, index) => (
                  <tr key={course.id}>
                    <td>{index + 1}</td>
                    <td><strong>{course.ma_hoc_phan}</strong></td>
                    <td>{course.ten_hoc_phan}</td>
                    <td>{course.so_tin_chi}</td>
                    <td><span className="sp-stat-count">{course.so_luong_sinh_vien}</span></td>
                    <td>
                      <button
                        type="button"
                        className="sp-stat-row-action"
                        onClick={() => void handleViewDetails(course)}
                        title="Xem chi tiết"
                        aria-label={`Xem chi tiết ${course.ma_hoc_phan}`}
                      >
                        <EyeIcon aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredCourses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="sp-stat-empty">
                      Không có dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </RoleLayout>
  )
}
