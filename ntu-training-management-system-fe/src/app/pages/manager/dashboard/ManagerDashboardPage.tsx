import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AcademicCapIcon, ChartBarSquareIcon, IdentificationIcon } from '@heroicons/react/24/outline'
import RoleLayout from '../../../layout/RoleLayout'
import { apiGet } from '@/api/core/request'
import { useAuth } from '../../../../api/query'
import './ManagerDashboardPage.css'

type AcademicYear = { id: number; nam_hoc: string }
type AcademicTerm = { id: number; nam_hoc_id: number; hoc_ky: string }
type CatalogResponse<T> = { data: T[] }
type CurrentTermResponse = {
  data: {
    nam_hoc_id?: number | null
    hoc_ky?: string | null
  } | null
}

const quickAccessLinks = [
  { label: 'Quản lí điểm', icon: ChartBarSquareIcon, colorClass: 'amber', link: '/quanly/diem', permission: 'manager.grades.view' },
  { label: 'Thông tin sinh viên', icon: IdentificationIcon, colorClass: 'blue', link: '/quanly/thongtinsinhvien', permission: 'manager.student-info.view' },
  { label: 'Theo dõi CTĐT', icon: AcademicCapIcon, colorClass: 'teal', link: '/quanly/curriculum', permission: 'manager.curriculum.view' },
]

export default function ManagerDashboardPage() {
  const { user, me } = useAuth()
  const [trainingSystem, setTrainingSystem] = useState('Đại học và Cao đẳng chính quy')
  const [academicYear, setAcademicYear] = useState('')
  const [semester, setSemester] = useState('')
  const [years, setYears] = useState<AcademicYear[]>([])
  const [terms, setTerms] = useState<AcademicTerm[]>([])
  const enabledLinks = quickAccessLinks.filter((item) => user?.permissions?.includes(item.permission))

  useEffect(() => {
    void me()
  }, [me])

  useEffect(() => {
    let isMounted = true

    Promise.all([
      apiGet<CatalogResponse<AcademicYear>>('/academic-catalog/nam-hocs'),
      apiGet<CurrentTermResponse>('/academic-catalog/current-term'),
    ])
      .then(([yearResponse, currentResponse]) => {
        if (!isMounted) return
        setYears(yearResponse.data ?? [])
        setAcademicYear(String(currentResponse.data?.nam_hoc_id ?? yearResponse.data?.[0]?.id ?? ''))
        setSemester(currentResponse.data?.hoc_ky ?? '')
      })
      .catch(() => {
        if (!isMounted) return
        setYears([])
        setAcademicYear('')
        setSemester('')
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!academicYear) return

    let isMounted = true
    apiGet<CatalogResponse<AcademicTerm>>('/academic-catalog/hoc-kys', {
      params: { nam_hoc_id: Number(academicYear) },
    })
      .then((response) => {
        if (!isMounted) return
        setTerms(response.data ?? [])
        setSemester((current) => current || response.data?.[0]?.hoc_ky || '')
      })
      .catch(() => {
        if (!isMounted) return
        setTerms([])
      })

    return () => {
      isMounted = false
    }
  }, [academicYear])

  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="QUẢN LÝ"
      roleColor="teal"
      homeRoute="/quanly"
      roleTitle="Quản lý"
    >
      <main className="md-main">
        <div className="md-content-container">
          <section className="md-filter-bar" aria-label="Thông tin học kỳ">
            <label>
              <span>Hệ đào tạo</span>
              <select value={trainingSystem} onChange={(event) => setTrainingSystem(event.target.value)}>
                <option value="Đại học và Cao đẳng chính quy">Đại học và Cao đẳng chính quy</option>
                <option value="Vừa học vừa làm">Vừa học vừa làm</option>
                <option value="Đào tạo từ xa">Đào tạo từ xa</option>
              </select>
            </label>
            <label>
              <span>Năm học</span>
              <select value={academicYear} onChange={(event) => { setAcademicYear(event.target.value); setSemester('') }}>
                <option value="">Chọn năm học</option>
                {years.map((year) => <option key={year.id} value={year.id}>{year.nam_hoc}</option>)}
              </select>
            </label>
            <label>
              <span>Học kỳ</span>
              <select value={semester} onChange={(event) => setSemester(event.target.value)}>
                <option value="">Chọn học kỳ</option>
                {terms.map((term) => <option key={term.id} value={term.hoc_ky}>{term.hoc_ky}</option>)}
              </select>
            </label>
            <label>
              <span>Tên đơn vị quản lí</span>
              <input value={user?.tenDonVi ?? ''} readOnly placeholder="Chưa có đơn vị" />
            </label>
          </section>

          <section className="md-quick-access-section">
            <div className="md-qa-grid">
              {enabledLinks.map((item) => {
                const Icon = item.icon

                return (
                  <Link to={item.link} key={item.label} className="md-qa-card">
                    <div className="md-qa-card-inner">
                      <div className={`md-qa-icon ${item.colorClass}`}><Icon aria-hidden="true" /></div>
                      <span className="md-qa-label">{item.label}</span>
                      <span className="md-qa-arrow" aria-hidden="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" x2="19" y1="12" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        </div>
      </main>
    </RoleLayout>
  )
}
