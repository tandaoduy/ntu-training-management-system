const fs = require('fs');
const path = require('path');

const sarPath = path.resolve('src/app/pages/student/academic-results/StudentAcademicResultsPage.tsx');
let sarContent = fs.readFileSync(sarPath, 'utf8');

// Normalize line endings to LF
sarContent = sarContent.replace(/\r\n/g, '\n');

const oldFetchBlock = `  useEffect(() => {
    let mounted = true

    const load = async () => {
      const cachedRows = localStorage.getItem('sar-rows')
      if (!cachedRows) {
        setIsLoading(true)
      }
      try {
        const [yearResponse, termResponse, gradeResponse, currentTermResponse] = await Promise.all([
          apiGet<CatalogResponse<AcademicYear>>('/academic-catalog/nam-hocs'),
          apiGet<CatalogResponse<AcademicTerm>>('/academic-catalog/hoc-kys'),
          apiGet<GradesResponse>('/student/grades'),
          apiGet<CurrentAcademicTermResponse>('/academic-catalog/current-term'),
        ])

        if (!mounted) return
        setYears(yearResponse.data)
        setTerms(termResponse.data)
        setRows(gradeResponse.data)
        const freshYear = currentTermResponse.data?.nam_hoc ?? ''
        const freshSem = currentTermResponse.data?.hoc_ky ?? ''
        setSysAcademicYear(freshYear)
        setSysSemester(freshSem)

        try {
          localStorage.setItem('sar-years', JSON.stringify(yearResponse.data))
          localStorage.setItem('sar-terms', JSON.stringify(termResponse.data))
          localStorage.setItem('sar-rows', JSON.stringify(gradeResponse.data))
          localStorage.setItem('student-current-academic-term', JSON.stringify({ year: freshYear, semester: freshSem }))
        } catch (e) {
          console.warn('Failed to save academic results to localStorage:', e)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])`;

const newFetchBlock = `  useEffect(() => {
    let mounted = true

    // 1. Fetch current configured academic term immediately (non-blocking)
    apiGet<CurrentAcademicTermResponse>('/academic-catalog/current-term')
      .then((currentTermResponse) => {
        if (!mounted) return
        const freshYear = currentTermResponse.data?.nam_hoc ?? ''
        const freshSem = currentTermResponse.data?.hoc_ky ?? ''
        setSysAcademicYear(freshYear)
        setSysSemester(freshSem)
        try {
          localStorage.setItem('student-current-academic-term', JSON.stringify({ year: freshYear, semester: freshSem }))
        } catch {}
      })
      .catch((err) => console.error('Failed to load current term:', err))

    // 2. Fetch academic year options (non-blocking)
    apiGet<CatalogResponse<AcademicYear>>('/academic-catalog/nam-hocs')
      .then((yearResponse) => {
        if (!mounted) return
        setYears(yearResponse.data)
        try {
          localStorage.setItem('sar-years', JSON.stringify(yearResponse.data))
        } catch {}
      })
      .catch((err) => console.error('Failed to load years catalog:', err))

    // 3. Fetch academic term options (non-blocking)
    apiGet<CatalogResponse<AcademicTerm>>('/academic-catalog/hoc-kys')
      .then((termResponse) => {
        if (!mounted) return
        setTerms(termResponse.data)
        try {
          localStorage.setItem('sar-terms', JSON.stringify(termResponse.data))
        } catch {}
      })
      .catch((err) => console.error('Failed to load terms catalog:', err))

    // 4. Fetch grade results (non-blocking)
    const loadGrades = async () => {
      const cachedRows = localStorage.getItem('sar-rows')
      if (!cachedRows) {
        setIsLoading(true)
      }
      try {
        const gradeResponse = await apiGet<GradesResponse>('/student/grades')
        if (!mounted) return
        setRows(gradeResponse.data)
        try {
          localStorage.setItem('sar-rows', JSON.stringify(gradeResponse.data))
        } catch {}
      } catch (err) {
        console.error('Failed to load student grades:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    void loadGrades()

    return () => {
      mounted = false
    }
  }, [])`;

if (sarContent.includes(oldFetchBlock)) {
  sarContent = sarContent.replace(oldFetchBlock, newFetchBlock);
  console.log('Successfully split fetches in StudentAcademicResultsPage.tsx.');
} else {
  console.error('Could not find oldFetchBlock in StudentAcademicResultsPage.tsx');
}

fs.writeFileSync(sarPath, sarContent, 'utf8');
