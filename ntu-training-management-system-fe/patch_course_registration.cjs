const fs = require('fs');
const path = require('path');

const scrPath = path.resolve('src/app/pages/student/course-registration/StudentCourseRegistrationPage.tsx');
let scrContent = fs.readFileSync(scrPath, 'utf8');

// Normalize line endings to LF
scrContent = scrContent.replace(/\r\n/g, '\n');

// 1. Declare state variables with local storage pre-populations
const oldScrStates = `  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [periodLabel, setPeriodLabel] = useState('')
  const [message, setMessage] = useState('')
  const [courses, setCourses] = useState<CourseGroup[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [studentTimetable, setStudentTimetable] = useState<TimetableRow[]>([])
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [busyCourse, setBusyCourse] = useState('')
  const [loadingClassTimetableId, setLoadingClassTimetableId] = useState<number | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [changeCourse, setChangeCourse] = useState<CourseGroup | null>(null)
  const [classTimetableDetail, setClassTimetableDetail] = useState<ClassTimetableDetail | null>(null)
  const [studentAcademicInfo, setStudentAcademicInfo] = useState<{ ma_lop?: string | null; ten_nganh_hoc?: string | null } | null>(null)
  const [sysAcademicYear, setSysAcademicYear] = useState(() => readCachedCurrentTerm().year)
  const [sysSemester, setSysSemester] = useState(() => readCachedCurrentTerm().semester)`;

const newScrStates = `  const [registrationOpen, setRegistrationOpen] = useState(() => {
    try {
      const username = authStorage.getUser()?.username || 'current'
      const cached = localStorage.getItem(\`student-course-registration:\${username}\`)
      return cached ? Boolean(JSON.parse(cached).registration_open) : false
    } catch {
      return false
    }
  })
  const [periodLabel, setPeriodLabel] = useState(() => {
    try {
      const username = authStorage.getUser()?.username || 'current'
      const cached = localStorage.getItem(\`student-course-registration:\${username}\`)
      if (cached) {
        const data = JSON.parse(cached)
        return data.registration_period?.term ? \`Năm học: \${data.registration_period.term.nam_hoc} ; Học kỳ: \${data.registration_period.term.hoc_ky}\` : ''
      }
    } catch {}
    return ''
  })
  const [message, setMessage] = useState(() => {
    try {
      const username = authStorage.getUser()?.username || 'current'
      const cached = localStorage.getItem(\`student-course-registration:\${username}\`)
      if (cached) {
        const data = JSON.parse(cached)
        return Boolean(data.registration_open) ? data.message ?? '' : 'Thời gian đăng ký không hợp lệ\\nSinh viên vui lòng xem thông báo của trường hoặc liên hệ với cán bộ quản lý.'
      }
    } catch {}
    return ''
  })
  const [courses, setCourses] = useState<CourseGroup[]>(() => {
    try {
      const username = authStorage.getUser()?.username || 'current'
      const cached = localStorage.getItem(\`student-course-registration:\${username}\`)
      return cached ? JSON.parse(cached).courses ?? [] : []
    } catch {
      return []
    }
  })
  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    try {
      const username = authStorage.getUser()?.username || 'current'
      const cached = localStorage.getItem(\`student-course-registration:\${username}\`)
      return cached ? JSON.parse(cached).registrations ?? [] : []
    } catch {
      return []
    }
  })
  const [studentTimetable, setStudentTimetable] = useState<TimetableRow[]>(() => {
    try {
      const username = authStorage.getUser()?.username || 'current'
      const cached = localStorage.getItem(\`student-course-registration:\${username}\`)
      return cached ? JSON.parse(cached).student_timetable ?? [] : []
    } catch {
      return []
    }
  })
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    try {
      const username = authStorage.getUser()?.username || 'current'
      const cached = localStorage.getItem(\`student-course-registration:\${username}\`)
      if (cached) {
        const data = JSON.parse(cached)
        return Object.fromEntries((data.courses ?? []).map((course) => {
          const registered = data.registrations?.find((item) => item.ma_hoc_phan === course.ma_hoc_phan)
          return [course.ma_hoc_phan, String(registered?.lop_hoc_phan_dang_ky_id ?? '')]
        }))
      }
    } catch {}
    return {}
  })
  const [busyCourse, setBusyCourse] = useState('')
  const [loadingClassTimetableId, setLoadingClassTimetableId] = useState<number | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [changeCourse, setChangeCourse] = useState<CourseGroup | null>(null)
  const [classTimetableDetail, setClassTimetableDetail] = useState<ClassTimetableDetail | null>(null)
  const [studentAcademicInfo, setStudentAcademicInfo] = useState<{ ma_lop?: string | null; ten_nganh_hoc?: string | null } | null>(() => {
    try {
      const username = authStorage.getUser()?.username || 'current'
      const cached = localStorage.getItem(\`student-course-registration:\${username}\`)
      return cached ? JSON.parse(cached).student_academic_info ?? null : null
    } catch {
      return null
    }
  })
  const [sysAcademicYear, setSysAcademicYear] = useState(() => readCachedCurrentTerm().year)
  const [sysSemester, setSysSemester] = useState(() => readCachedCurrentTerm().semester)`;

// 2. Update loadData() block to cache incoming fresh payloads
const oldScrLoad = `  const loadData = async () => {
    const response = await apiGet<ResponsePayload>('/student/course-registration')
    const data = response.data
    const isRegistrationOpen = Boolean(data.registration_open)
    setRegistrationOpen(isRegistrationOpen)
    setMessage(isRegistrationOpen ? data.message ?? '' : 'Thời gian đăng ký không hợp lệ\\nSinh viên vui lòng xem thông báo của trường hoặc liên hệ với cán bộ quản lý.')
    setCourses(data.courses ?? [])
    setRegistrations(data.registrations ?? [])
    setStudentTimetable(data.student_timetable ?? [])
    setStudentAcademicInfo(data.student_academic_info ?? null)
    setPeriodLabel(data.registration_period?.term ? \`Năm học: \${data.registration_period.term.nam_hoc} ; Học kỳ: \${data.registration_period.term.hoc_ky}\` : '')
    setSelectedOptions(Object.fromEntries((data.courses ?? []).map((course) => {
      const registered = data.registrations?.find((item) => item.ma_hoc_phan === course.ma_hoc_phan)
      return [course.ma_hoc_phan, String(registered?.lop_hoc_phan_dang_ky_id ?? '')]
    })))
  }`;

const newScrLoad = `  const loadData = async () => {
    try {
      const response = await apiGet<ResponsePayload>('/student/course-registration')
      const data = response.data
      
      const username = authStorage.getUser()?.username || 'current'
      try {
        localStorage.setItem(\`student-course-registration:\${username}\`, JSON.stringify(data))
      } catch {}

      const isRegistrationOpen = Boolean(data.registration_open)
      setRegistrationOpen(isRegistrationOpen)
      setMessage(isRegistrationOpen ? data.message ?? '' : 'Thời gian đăng ký không hợp lệ\\nSinh viên vui lòng xem thông báo của trường hoặc liên hệ với cán bộ quản lý.')
      setCourses(data.courses ?? [])
      setRegistrations(data.registrations ?? [])
      setStudentTimetable(data.student_timetable ?? [])
      setStudentAcademicInfo(data.student_academic_info ?? null)
      setPeriodLabel(data.registration_period?.term ? \`Năm học: \${data.registration_period.term.nam_hoc} ; Học kỳ: \${data.registration_period.term.hoc_ky}\` : '')
      setSelectedOptions(Object.fromEntries((data.courses ?? []).map((course) => {
        const registered = data.registrations?.find((item) => item.ma_hoc_phan === course.ma_hoc_phan)
        return [course.ma_hoc_phan, String(registered?.lop_hoc_phan_dang_ky_id ?? '')]
      })))
    } catch (err) {
      alert.showError('Không tải được dữ liệu', 'Vui lòng kiểm tra backend.')
    }
  }`;

if (scrContent.includes(oldScrStates.replace(/\r\n/g, '\n'))) {
  scrContent = scrContent.replace(oldScrStates.replace(/\r\n/g, '\n'), newScrStates);
  console.log('Successfully updated SCR states.');
} else {
  console.error('Could not find oldScrStates in StudentCourseRegistrationPage.tsx');
}

if (scrContent.includes(oldScrLoad.replace(/\r\n/g, '\n'))) {
  scrContent = scrContent.replace(oldScrLoad.replace(/\r\n/g, '\n'), newScrLoad);
  console.log('Successfully updated SCR loadData.');
} else {
  console.error('Could not find oldScrLoad in StudentCourseRegistrationPage.tsx');
}

fs.writeFileSync(scrPath, scrContent, 'utf8');
