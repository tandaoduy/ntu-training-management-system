import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import campusImage from '../../../assets/hinhhome1.jpg'
import logoImage from '../../../assets/Logo_NTU.png'
import { useAuth } from '../../../api/query'
import { useAlert } from '@/components/alert'
import './AuthPage.css'

interface LoginFormState {
  username: string
  password: string
}

const defaultForm: LoginFormState = {
  username: '',
  password: '',
}

const resolveDashboardPath = (role: string | null | undefined): string => {
  switch (role) {
    case 'student':
      return '/sinhvien'
    case 'lecturer':
      return '/canbo'
    case 'manager':
      return '/quanly'
    case 'training_officer':
      return '/chuyenvien'
    case 'admin':
      return '/quantri'
    default:
      return '/component-test'
  }
}

// Eye icons
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

export default function AuthPage() {
  const [form, setForm] = useState<LoginFormState>(defaultForm)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login, loading, error } = useAuth()
  const { showAlert } = useAlert()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const user = await login({
      username: form.username.trim(),
      password: form.password,
    })

    if (!user) {
      showAlert({
        variant: 'error',
        title: 'Đăng nhập thất bại',
        message: error?.message ?? 'Tên đăng nhập hoặc mật khẩu chưa đúng.',
      })
      return
    }

    const displayName = user.name?.trim() || user.username

    showAlert({
      variant: 'success',
      title: 'Đăng nhập thành công',
      message: `Xin chào ${displayName}!`,
    })

    navigate(resolveDashboardPath(user.role), {
      replace: true,
      state: { username: user.username },
    })
  }

  return (
    <section
      className="auth-page"
      style={{ backgroundImage: `url(${campusImage})` }}
    >
      <div className="auth-card-wrap">
        <article className="auth-card">
          <div className="auth-brand">
            <img src={logoImage} alt="NTU logo" className="auth-logo" />
            <h1>Hệ thống quản lý đào tạo</h1>
            <p className="auth-school-name">Trường Đại học Nha Trang</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Username – icon + placeholder bên trong */}
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                id="username"
                type="text"
                autoComplete="username"
                className="auth-input"
                placeholder="Tên đăng nhập"
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
                }
                required
              />
            </div>

            {/* Password – icon + placeholder + eye toggle */}
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="auth-input"
                placeholder="Mật khẩu"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                required
              />
              {form.password.length > 0 && (
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              )}
            </div>

            <div className="auth-forgot-password">
              <Link to="/login/forgot-password">Quên mật khẩu?</Link>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </article>
      </div>
    </section>
  )
}
