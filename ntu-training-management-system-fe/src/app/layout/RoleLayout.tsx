import Header from '../../components/header/Header'
import './RoleLayout.css'

interface RoleLayoutProps {
  brandTitle?: string
  brandSubtitle?: string
  roleLabel: string
  roleColor?: 'blue' | 'teal' | 'orange' | 'purple' | 'red'
  homeRoute: string
  roleTitle?: string
  headerOverlay?: boolean
  showAcademicInfo?: boolean
  children: React.ReactNode
}

export default function RoleLayout({
  brandTitle,
  brandSubtitle,
  roleLabel,
  roleColor = 'blue',
  homeRoute,
  showAcademicInfo = false,
  children,
}: RoleLayoutProps) {
  return (
    <div className="rl-root">
      <Header
        brandTitle={brandTitle}
        brandSubtitle={brandSubtitle}
        roleLabel={roleLabel}
        roleColor={roleColor}
        homeRoute={homeRoute}
        showAcademicInfo={showAcademicInfo}
      />

      <div className="rl-content">
        {children}
      </div>
    </div>
  )
}
