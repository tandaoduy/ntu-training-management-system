import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../api/query'
import logoImage from '../../assets/Logo_NTU.png'
import './RoleDashboardTemplate.css'

interface StatCard {
  label: string
  value: string
}

interface QuickTask {
  title: string
  note: string
}

interface RoleDashboardTemplateProps {
  roleTitle: string
  roleCode: string
  introText: string
  accentClass: 'blue' | 'teal' | 'orange' | 'red'
  stats: StatCard[]
  tasks: QuickTask[]
}

export default function RoleDashboardTemplate({
  roleTitle,
  roleCode,
  introText,
  accentClass,
  stats,
  tasks,
}: RoleDashboardTemplateProps) {
  const navigate = useNavigate()
  const { user, logout, me } = useAuth()

  useEffect(() => {
    if (!user) {
      void me()
    }
  }, [me, user])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const displayName = user?.username ?? roleTitle
  const avatarLetter = displayName.charAt(0).toUpperCase()

  return (
    <div className="rd-root">
      <header className="rd-topbar">
        <div className="rd-brand">
          <img src={logoImage} alt="NTU" className="rd-logo" />
          <div>
            <p className="rd-brand-title">NTU Training Management</p>
            <p className="rd-brand-subtitle">{roleTitle} dashboard template</p>
          </div>
        </div>

        <div className="rd-user-wrap">
          <span className={`rd-role-chip ${accentClass}`}>{roleCode}</span>
          <div className={`rd-avatar ${accentClass}`}>{avatarLetter}</div>
          <span className="rd-username">{displayName}</span>
          <button type="button" className="rd-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="rd-main">
        <section className={`rd-hero ${accentClass}`}>
          <h1>{roleTitle}</h1>
          <p>{introText}</p>
          <p className="rd-hint">This is a mock dashboard for UI and routing tests.</p>
        </section>

        <section className="rd-grid">
          {stats.map((item) => (
            <article key={item.label} className="rd-card">
              <p className="rd-card-label">{item.label}</p>
              <p className="rd-card-value">{item.value}</p>
            </article>
          ))}
        </section>

        <section className="rd-panel">
          <h2>Quick tasks</h2>
          <ul>
            {tasks.map((task) => (
              <li key={task.title}>
                <p className="rd-task-title">{task.title}</p>
                <p className="rd-task-note">{task.note}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
