import RoleDashboardTemplate from '../../../layout/RoleDashboardTemplate'

const stats = [
  { label: 'Active users', value: '2,486' },
  { label: 'System incidents', value: '1' },
  { label: 'Pending access requests', value: '11' },
  { label: 'Service uptime', value: '99.9%' },
]

const tasks = [
  {
    title: 'Review permission changes',
    note: '8 role updates are pending security approval.',
  },
  {
    title: 'Backup verification',
    note: 'Run restore test for monthly backup snapshot.',
  },
  {
    title: 'Audit authentication logs',
    note: 'Inspect unusual login attempts from weekend window.',
  },
]

export default function AdminDashboardPage() {
  return (
    <RoleDashboardTemplate
      roleTitle="Administrator"
      roleCode="admin"
      introText="Control access, monitor platform health, and enforce system policies."
      accentClass="red"
      stats={stats}
      tasks={tasks}
    />
  )
}
