import RoleDashboardTemplate from '../../../layout/RoleDashboardTemplate'

const stats = [
  { label: 'Department KPI', value: '91%' },
  { label: 'Open proposals', value: '7' },
  { label: 'Staff leave requests', value: '3' },
  { label: 'Budget usage', value: '64%' },
]

const tasks = [
  {
    title: 'Review semester staffing plan',
    note: 'Confirm teaching load before Friday noon.',
  },
  {
    title: 'Approve procurement request',
    note: 'Lab equipment request is waiting for manager sign-off.',
  },
  {
    title: 'Finalize quality report',
    note: 'Complete self-assessment for accreditation cycle.',
  },
]

export default function ManagerDashboardPage() {
  return (
    <RoleDashboardTemplate
      roleTitle="Manager"
      roleCode="manager"
      introText="Track department performance, approvals, and strategic action items."
      accentClass="teal"
      stats={stats}
      tasks={tasks}
    />
  )
}
