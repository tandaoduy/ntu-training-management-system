import { Link } from 'react-router-dom'
import RoleLayout from '../../../layout/RoleLayout'
import './LecturerDashboardPage.css'

// ── Dữ liệu mẫu (thay bằng API thật sau) ─────────────────────────
const stats = [
  { icon: '📚', label: 'Lớp học trong học kỳ', value: '6', colorClass: 'blue' },
  { icon: '📝', label: 'Bài tập chưa chấm', value: '24', colorClass: 'amber' },
  { icon: '👥', label: 'Yêu cầu tư vấn', value: '8', colorClass: 'purple' },
  { icon: '✅', label: 'Điểm danh hoàn thành', value: '95%', colorClass: 'green' },
]

const quickAccessLinks = [
  { label: 'Lớp học của tôi', icon: '🏫', colorClass: 'blue', link: '/canbo/classes' },
  { label: 'Chấm bài tập', icon: '📝', colorClass: 'amber', link: '/canbo/grading' },
  { label: 'Danh sách sinh viên', icon: '👥', colorClass: 'cyan', link: '/canbo/students' },
  { label: 'Điểm danh', icon: '✅', colorClass: 'green', link: '/canbo/attendance' },
  { label: 'Tài liệu học tập', icon: '📄', colorClass: 'orange', link: '/canbo/materials' },
  { label: 'Kế hoạch học tập', icon: '🗺️', colorClass: 'teal', link: '/canbo/studyplan' },
  { label: 'Tin nhắn sinh viên', icon: '💬', colorClass: 'purple', link: '/canbo/messages' },
  { label: 'Báo cáo tiến độ', icon: '📊', colorClass: 'indigo', link: '/canbo/reports' },
]

const pendingTasks = [
  { id: 'TASK-001', title: 'Chấm bài kiểm tra Tuần 8', dueDate: '08/05/2025', priority: 'high' },
  { id: 'TASK-002', title: 'Gửi bảng điểm học kỳ', dueDate: '15/05/2025', priority: 'high' },
  { id: 'TASK-003', title: 'Trả lời tư vấn học tập', dueDate: '10/05/2025', priority: 'medium' },
  { id: 'TASK-004', title: 'Cập nhật tài liệu bài giảng', dueDate: '12/05/2025', priority: 'low' },
]

const recentActivities = [
  { action: 'Sinh viên Nguyễn Văn A nộp bài tập', time: '2 giờ trước', icon: '📥' },
  { action: 'Cập nhật điểm danh buổi học chiều', time: '4 giờ trước', icon: '✅' },
  { action: 'Phê duyệt yêu cầu tư vấn từ sinh viên', time: 'Hôm qua', icon: '💬' },
  { action: 'Đăng tài liệu bài giảng mới', time: 'Hôm qua', icon: '📄' },
]

const classSummary = [
  { className: 'Lập trình C++', students: '32', avgGrade: '7.8', attendance: '92%' },
  { className: 'Cấu trúc dữ liệu', students: '28', avgGrade: '8.1', attendance: '95%' },
  { className: 'Thuật toán', students: '30', avgGrade: '7.5', attendance: '88%' },
  { className: 'Phát triển Web', students: '26', avgGrade: '8.3', attendance: '96%' },
]

const priorityLabel: Record<string, string> = {
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
}

export default function LecturerDashboardPage() {
  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="GIẢNG VIÊN"
      roleColor="blue"
      homeRoute="/canbo"
      roleTitle="Giảng viên"
    >
      <main className="ld-main">
        {/* ── Quick Access ── */}
        <div className="ld-quick-access-section">
          <h2 className="ld-section-title">Truy cập nhanh</h2>
          <div className="ld-qa-grid">
            {quickAccessLinks.map((item) => (
              <Link to={item.link} key={item.label} className="ld-qa-card">
                <div className={`ld-qa-icon ${item.colorClass}`}>
                  {item.icon}
                </div>
                <span className="ld-qa-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="ld-stats">
          {stats.map((s) => (
            <div key={s.label} className="ld-stat-card">
              <div className={`ld-stat-icon ${s.colorClass}`}>{s.icon}</div>
              <div className="ld-stat-value">{s.value}</div>
              <div className="ld-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Grid 2 cột ── */}
        <div className="ld-grid">
          {/* Công việc cần làm */}
          <div className="ld-panel">
            <div className="ld-panel-header">
              <span className="ld-panel-title">⏳ Công việc cần làm</span>
              <a href="#" className="ld-panel-link">Xem tất cả</a>
            </div>
            <div className="ld-panel-body">
              <div className="ld-list">
                {pendingTasks.map((t) => (
                  <div key={t.id} className="ld-list-item">
                    <div className="ld-list-content">
                      <span className="ld-list-title">{t.title}</span>
                      <span className="ld-list-desc">Hạn: {t.dueDate}</span>
                    </div>
                    <span className={`ld-badge ${t.priority}`}>{priorityLabel[t.priority]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hoạt động gần đây */}
          <div className="ld-panel">
            <div className="ld-panel-header">
              <span className="ld-panel-title">📋 Hoạt động gần đây</span>
            </div>
            <div className="ld-panel-body">
              <div className="ld-timeline">
                {recentActivities.map((log, idx) => (
                  <div key={idx} className="ld-timeline-item">
                    <div className="ld-timeline-icon">{log.icon}</div>
                    <div className="ld-timeline-content">
                      <div className="ld-timeline-title">{log.action}</div>
                      <div className="ld-timeline-time">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tóm tắt lớp học – full width */}
          <div className="ld-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="ld-panel-header">
              <span className="ld-panel-title">📚 Tóm tắt các lớp học</span>
              <a href="/canbo/classes" className="ld-panel-link">Xem tất cả</a>
            </div>
            <div className="ld-panel-body">
              <table className="ld-class-table">
                <thead>
                  <tr>
                    <th>Tên lớp</th>
                    <th>Sinh viên</th>
                    <th>Điểm TB</th>
                    <th>Điểm danh</th>
                  </tr>
                </thead>
                <tbody>
                  {classSummary.map((c, idx) => (
                    <tr key={idx}>
                      <td>{c.className}</td>
                      <td>{c.students}</td>
                      <td>{c.avgGrade}</td>
                      <td>{c.attendance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </RoleLayout>
  )
}
