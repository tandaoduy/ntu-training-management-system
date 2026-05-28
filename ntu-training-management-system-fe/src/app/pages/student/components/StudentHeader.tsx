import { SCHOOL_NAME, SYSTEM_NAME } from '@/app/branding'
import logoImage from '../../../../assets/Logo_NTU.png'
import './StudentHeader.css'

interface StudentHeaderProps {
  displayName: string
  academicYear: string
  semester: string
  overlay?: boolean
  onHomeClick: () => void
  onLogoutClick: () => void
}

export function StudentHeader({
  displayName,
  academicYear,
  semester,
  overlay = false,
  onHomeClick,
  onLogoutClick,
}: StudentHeaderProps) {
  return (
    <header className={`student-shared-header${overlay ? ' student-shared-header-overlay' : ''}`}>
      <div className="student-shared-topbar">
        <button type="button" className="student-shared-brand-group" onClick={onHomeClick} title="Về dashboard sinh viên" aria-label="Về dashboard sinh viên">
          <img src={logoImage} alt="NTU" className="student-shared-brand-logo" />
          <div className="student-shared-brand-text">
            <h1>{SCHOOL_NAME}</h1>
            <span>{SYSTEM_NAME}</span>
          </div>
        </button>
        <span className="student-shared-role-badge">SINH VIÊN</span>
      </div>

      <div className="student-shared-academic-bar">
        <div className="student-shared-academic-left">
          <div className="student-shared-academic-badge">
            <span>Hệ đào tạo:</span>
            <strong>Đại học Chính quy</strong>
          </div>
          <div className="student-shared-academic-badge">
            <span>Năm học:</span>
            <strong>{academicYear}</strong>
          </div>
          <div className="student-shared-academic-badge">
            <span>Học kỳ:</span>
            <strong>{semester}</strong>
          </div>
        </div>
        <div className="student-shared-academic-right">
          <span className="student-shared-greeting">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            Xin chào, {displayName}
          </span>
          <div className="student-shared-academic-divider"></div>
          <button type="button" className="student-shared-home-button" onClick={onHomeClick} title="Trang chủ" aria-label="Trang chủ">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 9-8 9 8" /><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" /></svg>
          </button>
          <button type="button" className="student-shared-logout-button" onClick={onLogoutClick} title="Đăng xuất" aria-label="Đăng xuất">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          </button>
        </div>
      </div>
    </header>
  )
}
