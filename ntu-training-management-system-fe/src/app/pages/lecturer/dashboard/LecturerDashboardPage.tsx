import RoleDashboardTemplate from '../../../layout/RoleDashboardTemplate'

const stats = [
  { label: 'Classes this week', value: '12' },
  { label: 'Pending grade sheets', value: '4' },
  { label: 'Advising requests', value: '9' },
  { label: 'Attendance submitted', value: '86%' },
]

const tasks = [
  {
    title: 'Approve attendance corrections',
    note: 'Review 6 correction requests submitted by students.',
  },
  {
    title: 'Finish midterm grading',
    note: '3 courses still have draft grade entries.',
  },
  {
    title: 'Upload course material',
    note: 'Week 8 resources are waiting for publication.',
  },
]

export default function LecturerDashboardPage() {
  return (
    <RoleDashboardTemplate
      roleTitle="Lecturer"
      roleCode="lecturer"
      introText="Monitor classes, grading workload, and student interactions from one place."
      accentClass="blue"
      stats={stats}
      tasks={tasks}
    />
  )
}
