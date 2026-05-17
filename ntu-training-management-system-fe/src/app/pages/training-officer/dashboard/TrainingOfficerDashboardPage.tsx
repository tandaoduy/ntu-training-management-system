import { Link } from 'react-router-dom'
import RoleLayout from '../../../layout/RoleLayout'
import './TrainingOfficerDashboardPage.css'

type IconTone =
  | 'orange'
  | 'amber'
  | 'blue'
  | 'green'
  | 'purple'
  | 'teal'
  | 'cyan'
  | 'indigo'

type DashboardIconProps = {
  code: string
  tone?: IconTone
  className?: string
  variant?: 'square' | 'circle' | 'plain'
}

const toneColors: Record<IconTone, { bg: string; fg: string }> = {
  orange: { bg: '#fffaf0', fg: '#dd6b20' },
  amber: { bg: '#fffff0', fg: '#d69e2e' },
  blue: { bg: '#ebf8ff', fg: '#3182ce' },
  green: { bg: '#f0fff4', fg: '#38a169' },
  purple: { bg: '#faf5ff', fg: '#805ad5' },
  teal: { bg: '#e6fffa', fg: '#319795' },
  cyan: { bg: '#e0f2fe', fg: '#0284c7' },
  indigo: { bg: '#ebf4ff', fg: '#4c51bf' },
}

function DashboardIcon({ code, tone = 'orange', className = '', variant = 'square' }: DashboardIconProps) {
  const colors = toneColors[tone]
  const radius = variant === 'circle' ? 32 : variant === 'plain' ? 0 : 14
  const textSize = code.length > 3 ? 16 : code.length > 2 ? 20 : 24

  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label={code} focusable="false">
      {variant !== 'plain' && <rect width="64" height="64" rx={radius} fill={colors.bg} />}
      <text
        x="32"
        y="34"
        fill={colors.fg}
        fontSize={textSize}
        fontFamily="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontWeight="500"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {code}
      </text>
    </svg>
  )
}

const stats = [
  { icon: 'CT', label: 'Cập nhật CTĐT', value: '5', colorClass: 'orange' },
  { icon: 'TKB', label: 'Xung đột lịch học', value: '2', colorClass: 'amber' },
  { icon: 'DK', label: 'Phiếu đăng ký chờ', value: '18', colorClass: 'blue' },
  { icon: 'DB', label: 'Dữ liệu đã đồng bộ', value: '97%', colorClass: 'green' },
]

const quickAccessLinks = [
  { label: 'Chương trình đào tạo', icon: 'CT', colorClass: 'orange', link: '/chuyenvien/curriculum' },
  { label: 'Thống kê KHHT', icon: 'KHHT', colorClass: 'blue', link: '/chuyenvien/study-plan-statistics' },
  { label: 'Xếp thời khóa biểu', icon: 'TKB', colorClass: 'purple', link: '/chuyenvien/timetable' },
  { label: 'Kiểm tra tốt nghiệp', icon: 'TN', colorClass: 'green', link: '/chuyenvien/graduation' },
  { label: 'Xung đột lịch học', icon: 'XD', colorClass: 'amber', link: '/chuyenvien/conflicts' },
  { label: 'Phiếu đăng ký', icon: 'DK', colorClass: 'teal', link: '/chuyenvien/registrations' },
  { label: 'Đồng bộ dữ liệu', icon: 'DB', colorClass: 'cyan', link: '/chuyenvien/sync' },
  { label: 'Báo cáo học kỳ', icon: 'BC', colorClass: 'indigo', link: '/chuyenvien/reports' },
  { label: 'Cấu hình học kỳ', icon: 'CH', colorClass: 'purple', link: '/chuyenvien/config' },
]

const pendingItems = [
  { id: 'CV-001', title: 'Xác nhận CTĐT ngành CNTT 2025', dept: 'Khoa CNTT', status: 'warning' },
  { id: 'CV-002', title: 'Giải quyết xung đột lịch TKB tuần 20', dept: 'Phòng Đào tạo', status: 'error' },
  { id: 'CV-003', title: 'Kiểm tra yêu cầu tốt nghiệp K2021', dept: 'Khoa Kinh tế', status: 'warning' },
  { id: 'CV-004', title: 'Đồng bộ dữ liệu học phần mới', dept: 'Hệ thống', status: 'info' },
]

const recentActivities = [
  { action: 'Cập nhật CTĐT ngành Kế toán 2025', time: '30 phút trước', icon: 'CT' },
  { action: 'Phê duyệt đăng ký học phần tự chọn', time: '2 giờ trước', icon: 'DK' },
  { action: 'Xuất báo cáo thống kê đăng ký KHHT', time: 'Hôm qua', icon: 'BC' },
  { action: 'Giải quyết xung đột lịch học tuần 18', time: 'Hôm qua', icon: 'TKB' },
]

const quickTasks = [
  {
    icon: 'CT',
    title: 'Theo dõi chương trình đào tạo',
    note: 'Xem CTĐT theo ngành và phiên bản đã công bố.',
    link: '/chuyenvien/curriculum',
  },
  {
    icon: 'KHHT',
    title: 'Thống kê đăng ký KHHT',
    note: 'Xem số lượng sinh viên đăng ký theo từng học phần.',
    link: '/chuyenvien/study-plan-statistics',
  },
  {
    icon: 'TKB',
    title: 'Xếp thời khóa biểu',
    note: 'Quản lý giảng đường, phòng học và xếp lịch không trùng phòng.',
    link: '/chuyenvien/timetable',
  },
  {
    icon: 'TN',
    title: 'Kiểm tra điều kiện tốt nghiệp',
    note: 'Rà soát sinh viên đủ điều kiện tốt nghiệp đợt gần nhất.',
  },
]

const statusLabel: Record<string, string> = {
  warning: 'Đang xử lý',
  error: 'Khẩn cấp',
  info: 'Thông tin',
  success: 'Hoàn thành',
}

export default function TrainingOfficerDashboardPage() {
  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="CHUYÊN VIÊN"
      roleColor="orange"
      homeRoute="/chuyenvien"
      roleTitle="Chuyên viên đào tạo"
    >
      <main className="to-main">
        <div className="to-quick-access-section">
          <h2 className="to-section-title">Truy cập nhanh</h2>
          <div className="to-qa-grid">
            {quickAccessLinks.map((item) => (
              <Link to={item.link} key={item.label} className="to-qa-card">
                <DashboardIcon
                  code={item.icon}
                  tone={item.colorClass as IconTone}
                  className="to-qa-icon"
                />
                <span className="to-qa-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="to-stats">
          {stats.map((item) => (
            <div key={item.label} className="to-stat-card">
              <DashboardIcon
                code={item.icon}
                tone={item.colorClass as IconTone}
                className="to-stat-icon"
              />
              <div className="to-stat-value">{item.value}</div>
              <div className="to-stat-label">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="to-grid">
          <div className="to-panel">
            <div className="to-panel-header">
              <span className="to-panel-title">Việc cần xử lý</span>
              <a href="#" className="to-panel-link">Xem tất cả</a>
            </div>
            <div className="to-panel-body">
              <div className="to-list">
                {pendingItems.map((item) => (
                  <div key={item.id} className="to-list-item">
                    <div className="to-list-content">
                      <span className="to-list-title">{item.title}</span>
                      <span className="to-list-desc">{item.dept}</span>
                    </div>
                    <span className={`to-badge ${item.status}`}>{statusLabel[item.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="to-panel">
            <div className="to-panel-header">
              <span className="to-panel-title">Hoạt động gần đây</span>
            </div>
            <div className="to-panel-body">
              <div className="to-timeline">
                {recentActivities.map((log) => (
                  <div key={`${log.action}-${log.time}`} className="to-timeline-item">
                    <DashboardIcon code={log.icon} className="to-timeline-icon" variant="circle" />
                    <div className="to-timeline-content">
                      <div className="to-timeline-title">{log.action}</div>
                      <div className="to-timeline-time">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="to-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="to-panel-header">
              <span className="to-panel-title">Công việc trọng tâm</span>
            </div>
            <div className="to-panel-body">
              <div className="to-task-grid">
                {quickTasks.map((task) =>
                  task.link ? (
                    <Link to={task.link} key={task.title} className="to-task-card">
                      <DashboardIcon code={task.icon} className="to-task-icon" variant="plain" />
                      <div className="to-task-title">{task.title}</div>
                      <div className="to-task-note">{task.note}</div>
                    </Link>
                  ) : (
                    <div key={task.title} className="to-task-card">
                      <DashboardIcon code={task.icon} className="to-task-icon" variant="plain" />
                      <div className="to-task-title">{task.title}</div>
                      <div className="to-task-note">{task.note}</div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </RoleLayout>
  )
}
