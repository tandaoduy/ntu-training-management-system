import { Link } from 'react-router-dom'
import RoleLayout from '../../../layout/RoleLayout'
import './ManagerDashboardPage.css'

const stats = [
  { icon: '📊', label: 'KPI phòng ban', value: '91%', colorClass: 'teal' },
  { icon: '📋', label: 'Đề xuất chờ duyệt', value: '7', colorClass: 'amber' },
  { icon: '📅', label: 'Yêu cầu nghỉ phép', value: '3', colorClass: 'purple' },
  { icon: '💰', label: 'Ngân sách sử dụng', value: '64%', colorClass: 'green' },
]

const quickAccessLinks = [
  { label: 'Theo dõi CTĐT', icon: '🗺️', colorClass: 'teal', link: '/quanly/curriculum' },
  { label: 'Quản lý giáo viên', icon: '👨‍🏫', colorClass: 'blue', link: '/quanly/staff' },
  { label: 'Duyệt đề xuất', icon: '✅', colorClass: 'green', link: '/quanly/proposals' },
  { label: 'Quản lý phòng ban', icon: '🏢', colorClass: 'cyan', link: '/quanly/department' },
  { label: 'Yêu cầu nghỉ phép', icon: '📅', colorClass: 'orange', link: '/quanly/leaves' },
  { label: 'Báo cáo chất lượng', icon: '📊', colorClass: 'indigo', link: '/quanly/quality' },
  { label: 'Quản lý ngân sách', icon: '💼', colorClass: 'purple', link: '/quanly/budget' },
  { label: 'Thống kê hiệu suất', icon: '📈', colorClass: 'rose', link: '/quanly/performance' },
]

const pendingApprovals = [
  { id: 'APP-001', title: 'Mở 2 lớp Lập trình Python', requester: 'Trần Thị B' },
  { id: 'APP-002', title: 'Mua thiết bị lab thực hành', requester: 'Nguyễn Văn C' },
  { id: 'APP-003', title: 'Tuyển thêm 1 giáo viên', requester: 'Lê Văn D' },
  { id: 'APP-004', title: 'Tổ chức hội thảo khoa học', requester: 'Phạm Thị E' },
]

const recentActivities = [
  { action: 'Phê duyệt đề xuất mở lớp học', time: '1 giờ trước', icon: '✅' },
  { action: 'Cập nhật kế hoạch học kỳ mới', time: '3 giờ trước', icon: '📅' },
  { action: 'Xem xét báo cáo chất lượng', time: 'Hôm qua', icon: '📊' },
  { action: 'Duyệt yêu cầu nghỉ phép nhân viên', time: 'Hôm qua', icon: '📋' },
]

const kpiMetrics = [
  { label: 'Tỷ lệ hoàn thành KPI', value: '91%', percent: 91, warn: false },
  { label: 'Độ hài lòng sinh viên', value: '88%', percent: 88, warn: false },
  { label: 'Chất lượng giáo dục', value: '85%', percent: 85, warn: true },
  { label: 'Tỷ lệ sắp xếp nhân lực', value: '92%', percent: 92, warn: false },
]

export default function ManagerDashboardPage() {
  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="QUẢN LÝ"
      roleColor="teal"
      homeRoute="/quanly"
      roleTitle="Quản lý"
    >
      <main className="md-main">
        {/* Quick Access */}
        <div className="md-quick-access-section">
          <h2 className="md-section-title">Truy cập nhanh</h2>
          <div className="md-qa-grid">
            {quickAccessLinks.map((item) => (
              <Link to={item.link} key={item.label} className="md-qa-card">
                <div className={`md-qa-icon ${item.colorClass}`}>{item.icon}</div>
                <span className="md-qa-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
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
                    <div className="md-timeline-icon">{log.icon}</div>
                    <div className="md-timeline-content">
                      <div className="md-timeline-title">{log.action}</div>
                      <div className="md-timeline-time">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KPI phòng ban – full width */}
          <div className="md-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="md-panel-header">
              <span className="md-panel-title">📊 Chỉ số hiệu suất phòng ban</span>
            </div>
            <div className="md-panel-body">
              <div className="md-kpi-row">
                {kpiMetrics.map((k, idx) => (
                  <div key={idx} className="md-kpi-item">
                    <div className="md-kpi-header">
                      <span className="md-kpi-label">{k.label}</span>
                      <span className="md-kpi-value">{k.value}</span>
                    </div>
                    <div className="md-kpi-bar-bg">
                      <div
                        className={`md-kpi-bar-fill${k.warn ? ' warning' : ''}`}
                        style={{ width: `${k.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </RoleLayout>
  )
}
