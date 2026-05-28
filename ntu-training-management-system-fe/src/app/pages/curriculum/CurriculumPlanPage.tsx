import { Fragment, useEffect, useMemo, useRef, useState } from 'react'

import { apiGet } from '../../../api/core/request'
import { useAuth } from '../../../api/query'
import './CurriculumPlanPage.css'

type ViewerMode = 'curriculum' | 'studyplan'

interface CurriculumVersion {
  id: number
  version_no: number
  trang_thai: string
  ghi_chu?: string | null
  chuong_trinh_dao_tao?: {
    ma_ctdt?: string
    ten_ctdt?: string
    tong_tin_chi_yeu_cau?: number
    nganh_dao_tao?: {
      ma_nganh?: string
      ten_nganh?: string
      he_dao_tao?: string | null
      thoi_gian_dao_tao?: number | string | null
    }
  } | null
}

interface CurriculumProgram {
  id: number
  ma_ctdt: string
  ten_ctdt: string
  tong_tin_chi_yeu_cau?: number | null
  nganh_dao_tao?: {
    ma_nganh?: string
    ten_nganh?: string
    he_dao_tao?: string | null
    thoi_gian_dao_tao?: number | string | null
  } | null
  versions?: CurriculumVersion[]
}

interface CurriculumCourse {
  id: number
  ma_hoc_phan: string
  ten_hoc_phan: string
  so_tin_chi: number
  vai_tro: 'bat_buoc' | 'tu_chon'
  hoc_ky_goi_y?: number | null
}

interface CurriculumGroup {
  id: number
  ma_nhom: string
  ten_nhom: string
  min_tin_chi: number
  min_so_mon: number
  bat_buoc_toan_bo: boolean
  tong_tin_chi: number
  items: CurriculumCourse[]
}

interface CurriculumDetail extends CurriculumVersion {
  groups: CurriculumGroup[]
}

interface ApiListResponse<T> {
  data: T
}

interface ProgramDetailResponse {
  data?: {
    program?: CurriculumProgram
    curriculum?: CurriculumDetail | null
  } | null
}

interface CurriculumPlanPageProps {
  mode: ViewerMode
  roleLabel: string
  backLink: string
  title: string
  description: string
  staffEndpointPrefix?: string
  hideToolbar?: boolean
  hideHeading?: boolean
}

const defaultProps: CurriculumPlanPageProps = {
  mode: 'curriculum',
  roleLabel: 'Quản lý',
  backLink: '/',
  title: 'Chương trình đào tạo',
  description: 'Theo dõi chương trình đào tạo và danh mục học phần đã công bố.',
  hideToolbar: false,
  hideHeading: false,
}

function programLabel(program: CurriculumProgram) {
  const major = program.nganh_dao_tao?.ten_nganh || 'Chưa rõ ngành'
  const version = program.versions?.[0]
  const cohort = version?.ghi_chu?.match(/K\d+/i)?.[0]?.toUpperCase()
    ?? (version?.version_no === 1 ? 'K65' : null)

  return `${program.ma_ctdt} - ${major}${cohort ? ` (${cohort})` : ''}`
}

function parentGroupName(name: string) {
  return name
    .replace(/\s*-\s*học phần\s+(bắt buộc|tự chọn)\s*$/i, '')
    .trim()
}

function parentGroupCode(code: string) {
  if (code.startsWith('GDTC_THECHAT')) {
    return 'GDTC_TCQPAN'
  }

  return code.replace(/_(BB|TC)$/i, '')
}

function sectionNumber(code: string) {
  if (code.startsWith('GDTC_XHNVNT')) return 'I.1'
  if (code.startsWith('GDTC_TOANTINTN_CNMT')) return 'I.2'
  if (code.startsWith('GDTC_NGOAINGU')) return 'I.3'
  if (code.startsWith('GDTC_TCQPAN') || code.startsWith('GDTC_THECHAT')) return 'I.4'
  if (code.startsWith('GDCN_COSONGANH')) return 'II.1'
  if (code.startsWith('GDCN_TOTNGHIEP')) return 'II.3'
  if (code.startsWith('GDCN_')) return 'II.2'
  return ''
}

function sectionTitle(code: string, fallback: string) {
  if (code.startsWith('GDTC_XHNVNT')) return 'Xã hội, Nhân văn và Nghệ thuật'
  if (code.startsWith('GDTC_TOANTINTN_CNMT')) return 'Toán, Tin học, Tự nhiên, CN&MT'
  if (code.startsWith('GDTC_NGOAINGU')) return 'Ngoại ngữ'
  if (code.startsWith('GDTC_TCQPAN') || code.startsWith('GDTC_THECHAT')) return 'Thể chất và Quốc phòng - An ninh'
  if (code.startsWith('GDCN_COSONGANH')) return 'Cơ sở ngành'
  if (code === 'GDCN_TOTNGHIEP_CHUNG') return 'Tốt nghiệp'
  if (code.startsWith('GDCN_NGANH')) return 'Ngành'
  return fallback
}

function isSpecializationGroup(code: string) {
  return /_(CNPM|HTTT|TTMMT)$/.test(code)
}

function subsectionCredits(items: CurriculumCourse[], fallback: number) {
  return items.length > 0 ? items.reduce((sum, item) => sum + item.so_tin_chi, 0) : fallback
}

interface ProgramComboboxProps {
  programs: CurriculumProgram[]
  selectedId: number | null
  onSelect: (id: number) => void
  variant?: 'default' | 'compact'
}

function ProgramCombobox({ programs, selectedId, onSelect, variant = 'default' }: ProgramComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const selectedProgram = programs.find((program) => program.id === selectedId) ?? null
  const selectedLabel = selectedProgram ? programLabel(selectedProgram) : 'Chọn chương trình đào tạo'

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return programs
    return programs.filter((program) => programLabel(program).toLowerCase().includes(keyword))
  }, [programs, query])

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        setHighlight(0)
        inputRef.current?.focus()
      })
    }
  }, [open])

  const commit = (id: number) => {
    onSelect(id)
    setOpen(false)
    setQuery('')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((prev) => Math.max(prev - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const target = filtered[highlight]
      if (target) commit(target.id)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setQuery('')
    }
  }

  return (
    <div className={`cp-combobox cp-combobox--${variant}`} ref={containerRef}>
      {variant !== 'compact' && (
        <span className="cp-combobox-label">Chương trình đào tạo</span>
      )}

      <button
        type="button"
        className={`cp-combobox-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {variant === 'compact' && (
          <svg
            className="cp-combobox-leading"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        )}
        <span className={`cp-combobox-value${selectedProgram ? '' : ' is-placeholder'}`}>
          {selectedLabel}
        </span>
        <svg
          className="cp-combobox-caret"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="cp-combobox-popover" role="listbox">
          <div className="cp-combobox-search">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setHighlight(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Tìm theo tên hoặc mã CTĐT..."
              autoComplete="off"
            />
          </div>

          <div className="cp-combobox-list">
            {filtered.length === 0 ? (
              <div className="cp-combobox-empty">Không tìm thấy chương trình phù hợp.</div>
            ) : (
              filtered.map((program, index) => {
                const active = program.id === selectedId
                const highlighted = index === highlight
                return (
                  <button
                    type="button"
                    key={program.id}
                    role="option"
                    aria-selected={active}
                    className={`cp-combobox-option${active ? ' is-active' : ''}${highlighted ? ' is-highlight' : ''}`}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => commit(program.id)}
                  >
                    <span className="cp-combobox-option-label">{programLabel(program)}</span>
                    {active && (
                      <svg
                        className="cp-combobox-check"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CurriculumPlanPage(props: Partial<CurriculumPlanPageProps> = {}) {
  const config = { ...defaultProps, ...props }
  const { user, me } = useAuth()
  const endpointPrefix = config.staffEndpointPrefix ?? '/curriculum-programs'
  const [programs, setPrograms] = useState<CurriculumProgram[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null)
  const [curriculum, setCurriculum] = useState<CurriculumDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      void me()
    }
  }, [me, user])

  useEffect(() => {
    let active = true

    const loadPrograms = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (!user?.role) {
          return
        }

        const response = await apiGet<ApiListResponse<CurriculumProgram[]>>(endpointPrefix)

        if (!active) {
          return
        }

        setPrograms(response.data)
        setSelectedProgramId(response.data[0]?.id ?? null)
      } catch {
        if (active) {
          setError('Không tải được danh sách CTĐT.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadPrograms()

    return () => {
      active = false
    }
  }, [endpointPrefix, user?.role])

  useEffect(() => {
    if (!selectedProgramId) {
      return
    }

    let active = true

    const loadDetail = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await apiGet<ProgramDetailResponse>(`${endpointPrefix}/${selectedProgramId}`)

        if (active) {
          setCurriculum(response.data?.curriculum ?? null)
        }
      } catch {
        if (active) {
          setError('Không tải được chi tiết chương trình đào tạo.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadDetail()

    return () => {
      active = false
    }
  }, [endpointPrefix, selectedProgramId])

  const totals = useMemo(() => {
    const groups = curriculum?.groups ?? []
    const requiredCredits = curriculum?.chuong_trinh_dao_tao?.tong_tin_chi_yeu_cau
    const credits = requiredCredits ?? groups.reduce((sum, group) => sum + group.min_tin_chi, 0)
    const courses = groups.reduce((sum, group) => sum + group.items.length, 0)

    return { credits, courses, groups: groups.length }
  }, [curriculum])

  const generalInfo = useMemo(() => {
    const program = curriculum?.chuong_trinh_dao_tao
    const major = program?.nganh_dao_tao
    const duration = major?.thoi_gian_dao_tao ? `${major.thoi_gian_dao_tao} năm` : '4 năm'

    return [
      ['Ngành đào tạo', major?.ten_nganh || 'Chưa cập nhật'],
      ['Mã số ngành đào tạo', major?.ma_nganh || 'Chưa cập nhật'],
      ['Trình độ đào tạo', 'Đại học'],
      ['Hình thức đào tạo', major?.he_dao_tao?.includes('Chính quy') ? 'Chính quy' : major?.he_dao_tao || 'Chính quy'],
      ['Thời gian đào tạo', duration],
      ['Tên văn bằng tốt nghiệp', `Cử nhân ${major?.ten_nganh || program?.ten_ctdt || ''}`.trim()],
      ['Tổng số tín chỉ', `${totals.credits}`],
    ]
  }, [curriculum, totals.credits])

  const curriculumRows = useMemo(() => {
    let index = 0
    const groups = new Map<string, {
      id: string
      ma_nhom: string
      ten_nhom: string
      min_tin_chi: number
      optional_min_tin_chi: number
      requiredItems: CurriculumCourse[]
      optionalItems: CurriculumCourse[]
    }>()

    ;(curriculum?.groups ?? []).forEach((group) => {
      const maNhom = parentGroupCode(group.ma_nhom)
      const tenHienThi = sectionTitle(maNhom, parentGroupName(group.ten_nhom))
      const key = `${maNhom}-${tenHienThi}`.toLowerCase()
      const requiredItems = group.items.filter((item) => item.vai_tro === 'bat_buoc')
      const optionalItems = group.items.filter((item) => item.vai_tro === 'tu_chon')
      const entry = groups.get(key) ?? {
        id: key,
        ma_nhom: maNhom,
        ten_nhom: tenHienThi,
        min_tin_chi: 0,
        optional_min_tin_chi: 0,
        requiredItems: [],
        optionalItems: [],
      }

      entry.min_tin_chi += group.min_tin_chi
      if (optionalItems.length > 0) {
        entry.optional_min_tin_chi += group.min_tin_chi
      }
      entry.requiredItems.push(...requiredItems)
      entry.optionalItems.push(...optionalItems)
      groups.set(key, entry)
    })

    return Array.from(groups.values()).map((group) => ({
      group,
      requiredItems: group.requiredItems.map((item) => ({ ...item, rowNo: ++index })),
      optionalItems: group.optionalItems.map((item) => ({ ...item, rowNo: ++index })),
    }))
  }, [curriculum])

  const generalEducationRows = curriculumRows.filter(({ group }) => group.ma_nhom.startsWith('GDTC_'))
  const professionalRows = curriculumRows.filter(({ group }) => group.ma_nhom.startsWith('GDCN_'))
  const foundationRows = professionalRows.filter(({ group }) => group.ma_nhom.startsWith('GDCN_COSONGANH'))
  const industryRows = professionalRows.filter(({ group }) => (
    group.ma_nhom.startsWith('GDCN_NGANH')
    || group.ma_nhom.startsWith('GDCN_CNPM')
    || group.ma_nhom.startsWith('GDCN_HTTT')
    || group.ma_nhom.startsWith('GDCN_TTMMT')
  ))
  const graduationRows = professionalRows.filter(({ group }) => group.ma_nhom.startsWith('GDCN_TOTNGHIEP'))
  const sumCredits = (rows: typeof curriculumRows) => rows.reduce((sum, row) => sum + row.group.min_tin_chi, 0)
  const sectionCredits = (rows: typeof curriculumRows) => {
    const requiredRows = rows.filter(({ requiredItems }) => requiredItems.length > 0)
    const optionalRows = rows.filter(({ optionalItems }) => optionalItems.length > 0)
    const required = requiredRows.reduce((sum, row) => sum + subsectionCredits(row.requiredItems, 0), 0)
    const optional = optionalRows.reduce((sum, row) => sum + row.group.optional_min_tin_chi, 0)

    return { total: required + optional, required, optional }
  }
  const industryCredits = sectionCredits(industryRows)
  const graduationCredits = sectionCredits(graduationRows)

  const renderCourse = (groupId: string, course: CurriculumCourse & { rowNo: number }) => (
    <tr key={`${groupId}-${course.id}-${course.rowNo}`} className="cp-course-row">
      <td>{course.rowNo}</td>
      <td>{course.ma_hoc_phan}</td>
      <td className="cp-course-name">{course.ten_hoc_phan}</td>
      <td>{course.so_tin_chi}</td>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
        <td key={semester}>{course.hoc_ky_goi_y === semester ? course.so_tin_chi : ''}</td>
      ))}
    </tr>
  )

  const renderSimpleSection = (rows: typeof curriculumRows) => rows.map(({ group, requiredItems, optionalItems }) => (
    <Fragment key={group.id}>
      <tr className="cp-subsection-title-row">
        <td>{sectionNumber(group.ma_nhom)}</td>
        <td colSpan={2}>{sectionTitle(group.ma_nhom, group.ten_nhom)}</td>
        <td>{group.min_tin_chi}</td>
        <td colSpan={8}></td>
      </tr>
      {requiredItems.length > 0 && (
        <tr className="cp-subsection-row">
          <td colSpan={3}>Học phần bắt buộc</td>
          <td>{subsectionCredits(requiredItems, group.min_tin_chi)}</td>
          <td colSpan={8}></td>
        </tr>
      )}
      {requiredItems.map((course) => renderCourse(group.id, course))}
      {optionalItems.length > 0 && (
        <tr className="cp-subsection-row">
          <td colSpan={3}>Học phần tự chọn</td>
          <td>{group.optional_min_tin_chi}</td>
          <td colSpan={8}></td>
        </tr>
      )}
      {optionalItems.map((course) => renderCourse(group.id, course))}
    </Fragment>
  ))

  const renderComplexSection = (
    number: string,
    title: string,
    rows: typeof curriculumRows,
    credits?: { total?: number, required?: number, optional?: number, optionalLabel?: string },
  ) => {
    const requiredRows = rows.filter(({ requiredItems }) => requiredItems.length > 0)
    const optionalRows = rows.filter(({ optionalItems }) => optionalItems.length > 0)
    const requiredCredits = credits?.required ?? requiredRows.reduce((sum, row) => sum + subsectionCredits(row.requiredItems, 0), 0)
    const optionalCredits = credits?.optional ?? optionalRows.reduce((sum, row) => sum + row.group.optional_min_tin_chi, 0)

    return (
      <Fragment key={number}>
        <tr className="cp-subsection-title-row">
          <td>{number}</td>
          <td colSpan={2}>{title}</td>
          <td>{credits?.total ?? (requiredCredits + optionalCredits)}</td>
          <td colSpan={8}></td>
        </tr>
        {requiredRows.length > 0 && (
          <tr className="cp-subsection-row">
            <td colSpan={3}>Học phần bắt buộc</td>
            <td>{requiredCredits}</td>
            <td colSpan={8}></td>
          </tr>
        )}
        {requiredRows.map(({ group, requiredItems }) => (
          <Fragment key={`${group.id}-required`}>
            {isSpecializationGroup(group.ma_nhom) && (
              <tr className="cp-specialization-row">
                <td colSpan={3}>{group.ten_nhom}</td>
                <td></td>
                <td colSpan={8}></td>
              </tr>
            )}
            {requiredItems.map((course) => renderCourse(`${group.id}-required`, course))}
          </Fragment>
        ))}
        {optionalRows.length > 0 && (
          <tr className="cp-subsection-row">
            <td colSpan={3}>{credits?.optionalLabel ?? 'Học phần tự chọn'}</td>
            <td>{optionalCredits}</td>
            <td colSpan={8}></td>
          </tr>
        )}
        {optionalRows.map(({ group, optionalItems }) => (
          <Fragment key={`${group.id}-optional`}>
            {isSpecializationGroup(group.ma_nhom) && (
              <tr className="cp-specialization-row">
                <td colSpan={3}>{group.ten_nhom}</td>
                <td></td>
                <td colSpan={8}></td>
              </tr>
            )}
            {optionalItems.map((course) => renderCourse(`${group.id}-optional`, course))}
          </Fragment>
        ))}
      </Fragment>
    )
  }

  if (!user?.role) {
    return <main className="cp-page"><div className="cp-loading">Đang tải phiên đăng nhập...</div></main>
  }

  return (
    <main className={`cp-page ${config.mode}`}>


      <section className={`cp-header${config.hideHeading ? ' cp-header--compact' : ''}`}>
        {!config.hideHeading && (
          <div>
            <p className="cp-eyebrow">Chương trình đào tạo</p>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </div>
        )}
        <ProgramCombobox
          programs={programs}
          selectedId={selectedProgramId}
          onSelect={(id) => setSelectedProgramId(id)}
          variant={config.hideHeading ? 'compact' : 'default'}
        />
      </section>

      {error && <div className="cp-alert">{error}</div>}

      {curriculum && (
        <>
          <section className="cp-general">
            <h2>Thông tin chung</h2>
            <table>
              <tbody>
                {generalInfo.map(([label, value]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="cp-curriculum-frame">
            <div className="cp-table-wrap">
              <table className="cp-plan-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>TT</th>
                    <th rowSpan={2}>Mã HP</th>
                    <th rowSpan={2}>Tên học phần</th>
                    <th rowSpan={2}>Số tín chỉ</th>
                    <th colSpan={8}>Phân bổ từng học kỳ</th>
                  </tr>
                  <tr>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                      <th key={semester}>{semester}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="cp-total-row">
                    <td colSpan={3}>Tổng số tín chỉ</td>
                    <td>{totals.credits}</td>
                    <td colSpan={8}></td>
                  </tr>
                  <tr className="cp-section-row">
                    <td>I</td>
                    <td colSpan={2}>Giáo dục tổng quát</td>
                    <td>{sumCredits(generalEducationRows)}</td>
                    <td colSpan={8}></td>
                  </tr>
                  {renderSimpleSection(generalEducationRows)}
                  <tr className="cp-section-row">
                    <td>II</td>
                    <td colSpan={2}>Giáo dục chuyên nghiệp</td>
                    <td>{totals.credits - sumCredits(generalEducationRows)}</td>
                    <td colSpan={8}></td>
                  </tr>
                  {renderSimpleSection(foundationRows)}
                  {renderComplexSection('II.2', 'Ngành', industryRows, industryCredits)}
                  {renderComplexSection('II.3', 'Tốt nghiệp', graduationRows, {
                    ...graduationCredits,
                    optionalLabel: 'Đồ án/Khóa luận tốt nghiệp hoặc Học phần thay thế',
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {isLoading && <div className="cp-loading">Đang tải chương trình đào tạo...</div>}
    </main>
  )
}
