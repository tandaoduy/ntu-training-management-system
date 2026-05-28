import type { ReactNode } from 'react'
import RoleLayout from '../RoleLayout'

interface TrainingOfficerLayoutProps {
  children: ReactNode
}

/**
 * Lớp layout dùng chung cho mọi trang của vai trò Chuyên viên đào tạo.
 * Bao gồm header chuẩn NTU (logo, tên trường, chip vai trò, greeting,
 * nút Home / Logout) thông qua RoleLayout.
 */
export default function TrainingOfficerLayout({ children }: TrainingOfficerLayoutProps) {
  return (
    <RoleLayout
      brandSubtitle="Hệ thống Đào tạo"
      roleLabel="CHUYÊN VIÊN"
      roleColor="orange"
      homeRoute="/chuyenvien"
      roleTitle="Chuyên viên đào tạo"
    >
      {children}
    </RoleLayout>
  )
}
