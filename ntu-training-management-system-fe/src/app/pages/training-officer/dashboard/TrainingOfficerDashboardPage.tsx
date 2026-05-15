import { Link } from 'react-router-dom'
import RoleLayout from '../../../layout/RoleLayout'
import './TrainingOfficerDashboardPage.css'

const stats = [
  { icon: '📚', label: 'Cập nhật CTĐT', value: '5', colorClass: 'orange' },
  { icon: '⚠️', label: 'Xung đột lịch học', value: '2', colorClass: 'amber' },
  { icon: '📋', label: 'Phiếu đăng ký chờ', value: '18', colorClass: 'blue' },
  { icon: '🔄', label: 'Dữ liệu đã đồng bộ', value: '97%', colorClass: 'green' },
]

const quickAccessLinks = [
  { label: 'Chương trình đào tạo', icon: '🗺️', colorClass: 'orange', link: '/chuyenvien/curriculum' },
  { label: 'Thống kê KHHT', icon: '📊', colorClass: 'blue', link: '/chuyenvien/study-plan-statistics' },
  { label: 'Kiểm tra tốt nghiệp', icon: '🎓', colorClass: 'green', link: '/chuyenvien/graduation' },
  { label: 'Xung đột lịch học', icon: '⚠️', colorClass: 'amber', link: '/chuyenvien/conflicts' },
  { label: 'Phiếu đăng ký', icon: '📋', colorClass: 'teal', link: '/chuyenvien/registrations' },
  { label: 'Đồng bộ dữ liệu', icon: '🔄', colorClass: 'cyan', link: '/chuyenvien/sync' },
  { label: 'Báo cáo học kỳ', icon: '📈', colorClass: 'indigo', link: '/chuyenvien/reports' },
  { label: 'Cấu hình học kỳ', icon: '⚙️', colorClass: 'purple', link: '/chuyenvien/config' },
]

const pendingItems = [
  { id: 'CV-001', title: 'Xác nhận CTĐT ngành CNTT 2025', dept: 'Khoa CNTT', status: 'warning' },
  { id: 'CV-002', title: 'Giải quyết xung đột lịch TKB Tuần 20', dept: 'P. Đào tạo', status: 'error' },
  { id: 'CV-003', title: 'Kiểm tra yêu cầu tốt nghiệp K2021', dept: 'Khoa Kinh tế', status: 'warning' },
  { id: 'CV-004', title: 'Đồng bộ dữ liệu học phần mới', dept: 'System', status: 'info' },
]

const recentActivities = [
  { action: 'Cập nhật CTĐT ngành Kế toán 2025', time: '30 phút trước', icon: '📚' },
  { action: 'Phê duyệt đăng ký học phần tự chọn', time: '2 giờ trước', icon: '✅' },
  { action: 'Xuất báo cáo thống kê đăng ký KHHT', time: 'Hôm qua', icon: '📊' },
  { action: 'Giải quyết xung đột lịch học Tuần 18', time: 'Hôm qua', icon: '⚠️' },
]

const quickTasks = [
  {
    icon: '🗺️',
    title: 'Theo dõi chương trình đào tạo',
    note: 'Xem CTĐT theo ngành và phiên bản đã công bố.',
    link: '/chuyenvien/curriculum',
  },
  {
    icon: '📊',
    title: 'Thống kê đăng ký KHHT',
    note: 'Xem số lượng SV đăng ký theo từng học phần và biểu đồ.',
    link: '/chuyenvien/study-plan-statistics',
  },
  {
    icon: '🎓',
    title: 'Kiểm tra điều kiện tốt nghiệp',
    note: 'Rà soát sinh viên đủ điều kiện tốt nghiệp đợt gần nhất.',
  },
  {
    icon: '⚠️',
    title: 'Giải quyết xung đột lịch',
    note: '2 phòng ban đã gửi yêu cầu thay đổi lịch TKB.',
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
        {/* Quick Access */}
        <div className="to-quick-access-section">
          <h2 className="to-section-title">Truy cập nhanh</h2>
          <div className="to-qa-grid">
            {quickAccessLinks.map((item) => (
              <Link to={item.link} key={item.label} className="to-qa-card">
                <div className={`to-qa-icon ${item.colorClass}`}>{item.icon}</div>
                <span className="to-qa-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="to-stats">
          {stats.map((s) => (
            <div key={s.label} className="to-stat-card">
              <div className={`to-stat-icon ${s.colorClass}`}>{s.icon}</div>
              <div className="to-stat-value">{s.value}</div>
              <div className="to-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grid 2 cột */}
        <div className="to-grid">
          {/* Việc cần xử lý */}
          <div className="to-panel">
            <div className="to-panel-header">
              <span className="to-panel-title">⏳ Việc cần xử lý</span>
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

          {/* Hoạt động gần đây */}
          <div className="to-panel">
            <div className="to-panel-header">
              <span className="to-panel-title">📋 Hoạt động gần đây</span>
            </div>
            <div className="to-panel-body">
              <div className="to-timeline">
                {recentActivities.map((log, idx) => (
                  <div key={idx} className="to-timeline-item">
                    <div className="to-timeline-icon">{log.icon}</div>
                    <div className="to-timeline-content">
                      <div className="to-timeline-title">{log.action}</div>
                      <div className="to-timeline-time">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Công việc nhanh – full width */}
          <div className="to-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="to-panel-header">
              <span className="to-panel-title">⚡ Công việc trọng tâm</span>
            </div>
            <div className="to-panel-body">
              <div className="to-task-grid">
                {quickTasks.map((task, idx) =>
                  task.link ? (
                    <Link to={task.link} key={idx} className="to-task-card">
                      <div className="to-task-icon">{task.icon}</div>
                      <div className="to-task-title">{task.title}</div>
                      <div className="to-task-note">{task.note}</div>
                    </Link>
                  ) : (
                    <div key={idx} className="to-task-card">
                      <div className="to-task-icon">{task.icon}</div>
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
