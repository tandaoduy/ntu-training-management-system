import { Link } from 'react-router-dom'
import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  ChartBarSquareIcon,
  CircleStackIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeModernIcon,
  IdentificationIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '@/api/query'
import './AdminDashboardPage.css'

const quickAccessLinks = [
  { label: 'Đăng ký học phần', icon: PencilSquareIcon, colorClass: 'emerald', link: '/quantri/dangkyhocphan', permission: 'admin.course-registration.manage' },
  { label: 'Quản lý người dùng', icon: UserGroupIcon, colorClass: 'blue', link: '/quantri/taikhoan', permission: 'admin.account.manage' },
  { label: 'Thông tin sinh viên', icon: IdentificationIcon, colorClass: 'indigo', link: '/quantri/thongtinsinhvien', permission: 'admin.student-info.manage' },
  { label: 'Phân quyền hệ thống', icon: ShieldCheckIcon, colorClass: 'purple', link: '/quantri/roles', permission: 'admin.permission.manage' },
  { label: 'Quản lý lớp học', icon: BuildingOffice2Icon, colorClass: 'orange', link: '/quantri/lophoc', permission: 'admin.class.manage' },
  { label: 'Quản lí phòng học', icon: HomeModernIcon, colorClass: 'cyan', link: '/quantri/phonghoc', permission: 'admin.room.manage' },
  { label: 'Chương trình đào tạo', icon: AcademicCapIcon, colorClass: 'teal', link: '/quantri/curriculum', permission: 'admin.curriculum.manage' },
  { label: 'Kế hoạch học tập', icon: ClipboardDocumentListIcon, colorClass: 'amber', link: '/quantri/studyplan', permission: 'admin.study-plan.manage' },
  { label: 'Quản lý điểm', icon: ChartBarSquareIcon, colorClass: 'green', link: '/quantri/nhapdiem', permission: 'admin.grade-entry.lock.manage' },
  { label: 'Cấu hình hệ thống', icon: Cog6ToothIcon, colorClass: 'gray', link: '/quantri/cauhinh', permission: 'admin.config.manage' },
  { label: 'Sao lưu dữ liệu', icon: CircleStackIcon, colorClass: 'red', link: '/quantri/backup', permission: 'admin.backup.manage' },
]

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const enabledLinks = quickAccessLinks.filter((item) => user?.permissions?.includes(item.permission))

  return (
    <main className="ad-main">
      <div className="ad-content-container">
        <section className="ad-quick-access-section">
          <div className="ad-qa-grid">
            {enabledLinks.map((item) => {
              const Icon = item.icon

              return (
                <Link to={item.link} key={item.label} className="ad-qa-card">
                  <div className="ad-qa-card-inner">
                    <div className={`ad-qa-icon ${item.colorClass}`}><Icon aria-hidden="true" /></div>
                    <span className="ad-qa-label">{item.label}</span>
                    <span className="ad-qa-arrow" aria-hidden="true">
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
  )
}
