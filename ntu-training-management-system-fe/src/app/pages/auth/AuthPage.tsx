import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import campusImage from '../../../assets/hinhhome1.jpg'
import logoImage from '../../../assets/Logo_NTU.png'
import { useAuth } from '../../../api/query'
import { useAlert } from '../../../components/alert'
import './AuthPage.css'

interface LoginFormState {
  username: string
  password: string
}

const defaultForm: LoginFormState = {
  username: '',
  password: '',
}

export default function AuthPage() {
  const [form, setForm] = useState<LoginFormState>(defaultForm)
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

    showAlert({
      variant: 'success',
      title: 'Đăng nhập thành công',
      message: `Xin chào ${user.username}!`,
    })

    navigate('/component-test', { replace: true })
  }

  return (
    <section className="auth-page" style={{ backgroundImage: `url(${campusImage})` }}>
      <div className="auth-overlay" />

      <div className="auth-card-wrap">
        <article className="auth-card">
          <div className="auth-brand">
            <img src={logoImage} alt="NTU logo" className="auth-logo" />
            <h1> Trường Đại học Nha Trang</h1>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-label" htmlFor="username">
              Tên đăng nhập
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="auth-input"
              placeholder="Nhập mã người dùng"
              value={form.username}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  username: event.target.value,
                }))
              }
              required
            />

            <label className="auth-label" htmlFor="password">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="auth-input"
              placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              required
            />

            <div className="auth-forgot-password">
              <Link to="/auth/forgot-password">Quên mật khẩu?</Link>
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
