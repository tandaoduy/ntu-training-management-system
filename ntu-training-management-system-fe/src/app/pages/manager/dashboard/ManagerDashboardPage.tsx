import { Link } from 'react-router-dom'
import './ManagerDashboardPage.css'

// ── Placeholder data (thay bằng API thật sau) ────────────────────────
const stats = [
  { icon: '📊', label: 'KPI phòng ban', value: '91%', colorClass: 'teal' },
  { icon: '📋', label: 'Đề xuất chờ duyệt', value: '7', colorClass: 'amber' },
  { icon: '📅', label: 'Yêu cầu nghỉ phép', value: '3', colorClass: 'purple' },
  { icon: '💰', label: 'Ngân sách sử dụng', value: '64%', colorClass: 'green' },
]

const quickAccessLinks = [
  { label: 'Theo dõi CTĐT', icon: '🗺️', colorClass: 'teal', link: '/quanly/curriculum' },
  { label: 'Quản lý giáo viên', icon: '👨‍🏫', colorClass: 'blue', link: '/quanly/staff' },
  { label: 'Duyệt đề xuất', icon: '✓', colorClass: 'green', link: '/quanly/proposals' },
  { label: 'Quản lý phòng ban', icon: '🏢', colorClass: 'cyan', link: '/quanly/department' },
  { label: 'Yêu cầu nghỉ phép', icon: '📅', colorClass: 'orange', link: '/quanly/leaves' },
  { label: 'Báo cáo chất lượng', icon: '📊', colorClass: 'indigo', link: '/quanly/quality' },
  { label: 'Quản lý ngân sách', icon: '💼', colorClass: 'purple', link: '/quanly/budget' },
  { label: 'Thống kê hiệu suất', icon: '📈', colorClass: 'rose', link: '/quanly/performance' },
]

const pendingApprovals = [
  { id: 'APP-001', title: 'Mở 2 lớp Lập trình Python', requester: 'Trần Thị B', status: 'pending' },
  { id: 'APP-002', title: 'Mua thiết bị lab thực hành', requester: 'Nguyễn Văn C', status: 'pending' },
  { id: 'APP-003', title: 'Tuyển thêm 1 giáo viên', requester: 'Lê Văn D', status: 'pending' },
  { id: 'APP-004', title: 'Tổ chức hội thảo khoa học', requester: 'Phạm Thị E', status: 'pending' },
]

const recentActivities = [
  { action: 'Phê duyệt đề xuất mở lớp học', time: '1 giờ trước' },
  { action: 'Cập nhật kế hoạch học kỳ mới', time: '3 giờ trước' },
  { action: 'Xem xét báo cáo chất lượng', time: 'Hôm qua' },
  { action: 'Duyệt yêu cầu nghỉ phép của nhân viên', time: 'Hôm qua' },
]

const departmentMetrics = [
  { metric: 'Tỷ lệ hoàn thành KPI', value: '91%', status: 'success' },
  { metric: 'Độ hài lòng sinh viên', value: '88%', status: 'success' },
  { metric: 'Tỷ lệ chất lượng giáo dục', value: '85%', status: 'warning' },
  { metric: 'Tỷ lệ sắp xếp lực lượng', value: '92%', status: 'success' },
]

const statusLabel: Record<string, string> = {
  success: 'Tốt',
  warning: 'Cảnh báo',
  error: 'Lỗi',
  info: 'Thông tin',
}

export default function ManagerDashboardPage() {
  return (
    <div className="md-root">

      {/* ── MAIN ── */}
      <main className="md-main">
        {/* Quick Access */}
        <div className="md-quick-access-section">
          <h2 className="md-section-title">Quản lý nhanh</h2>
          <div className="md-qa-grid">
            {quickAccessLinks.map((item) => (
              <Link to={item.link} key={item.label} className="md-qa-card">
                <div className={`md-qa-icon ${item.colorClass}`}>
                  {item.icon}
                </div>
                <span className="md-qa-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="md-stats">
          {stats.map((s) => (
            <div key={s.label} className="md-stat-card">
              <div className={`md-stat-icon ${s.colorClass}`}>{s.icon}</div>
              <div className="md-stat-value">{s.value}</div>
              <div className="md-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grid 2 cột */}
        <div className="md-grid">
          {/* Đề xuất chờ duyệt */}
          <div className="md-panel">
            <div className="md-panel-header">
              <span className="md-panel-title">⏳ Đề xuất chờ duyệt</span>
              <a href="#" className="md-panel-link">Xem tất cả</a>
            </div>
            <div className="md-panel-body">
              <div className="md-list">
                {pendingApprovals.map((a) => (
                  <div key={a.id} className="md-list-item">
                    <div className="md-list-content">
                      <span className="md-list-title">{a.title}</span>
                      <span className="md-list-desc">Người đề xuất: {a.requester}</span>
                    </div>
                    <span className="md-badge warning">Chờ duyệt</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hoạt động gần đây */}
          <div className="md-panel">
            <div className="md-panel-header">
              <span className="md-panel-title">📋 Hoạt động gần đây</span>
            </div>
            <div className="md-panel-body">
              <div className="md-timeline">
                {recentActivities.map((log, idx) => (
                  <div key={idx} className="md-timeline-item">
                    <div className="md-timeline-icon">📝</div>
                    <div className="md-timeline-content">
                      <div className="md-timeline-title">{log.action}</div>
                      <div className="md-timeline-time">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chỉ số hiệu suất phòng ban */}
          <div className="md-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="md-panel-header">
              <span className="md-panel-title">📊 Chỉ số hiệu suất phòng ban</span>
            </div>
            <div className="md-panel-body">
              <div className="md-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
                {departmentMetrics.map((d, idx) => (
                  <div key={idx} className="md-list-item">
                    <div className="md-list-content">
                      <span className="md-list-title">{d.metric}</span>
                      <span className="md-list-desc">Giá trị: {d.value}</span>
                    </div>
                    <span className={`md-badge ${d.status}`}>{statusLabel[d.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
