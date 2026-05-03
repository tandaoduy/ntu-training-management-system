import RoleDashboardTemplate from '../../../layout/RoleDashboardTemplate'

const stats = [
  { label: 'Curriculum updates', value: '5' },
  { label: 'Class schedule conflicts', value: '2' },
  { label: 'Registration tickets', value: '18' },
  { label: 'Student records synced', value: '97%' },
]

const tasks = [
  {
    title: 'Theo dõi kế hoạch học tập',
    note: 'Xem chương trình đào tạo theo ngành và phiên bản đã công bố.',
    link: '/chuyenvien/curriculum',
  },
  {
    title: 'Validate timetable changes',
    note: '2 departments submitted schedule change requests.',
  },
  {
    title: 'Check graduation requirement audit',
    note: 'Run final checks for graduating cohort 2026.',
  },
  {
    title: 'Resolve registration incidents',
    note: 'High-priority enrollment tickets still open.',
  },
]

export default function TrainingOfficerDashboardPage() {
  return (
    <RoleDashboardTemplate
      roleTitle="Training Officer"
      roleCode="training_officer"
      introText="Supervise curriculum flow, scheduling, and student record operations."
      accentClass="orange"
      stats={stats}
      tasks={tasks}
    />
  )
}
