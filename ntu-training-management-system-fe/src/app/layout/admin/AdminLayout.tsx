import { Outlet } from 'react-router-dom'
import Header from '@/components/header/Header'
import './AdminLayout.css'

export default function AdminLayout() {
  return (
    <div className="ad-root">
      <Header
        roleLabel="QUẢN TRỊ VIÊN"
        roleColor="purple"
        homeRoute="/quantri"
      />

      <div className="ad-main-content">
        <Outlet />
      </div>
    </div>
  )
}
