import { useCallback, useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'

import campusImage from '../../../assets/hinhhome1.jpg'
import logoImage from '../../../assets/Logo_NTU.png'
import { authApi } from '../../../api/features/auth'
import './ForgotPasswordPage.css'

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    if (response?.data?.message) {
      return response.data.message
    }
  }

  return fallback
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const verifyToken = useCallback(async () => {
    if (!token || !email) {
      setError('Liên kết không hợp lệ. Vui lòng yêu cầu liên kết mới.')
      setVerifying(false)
      return
    }

    try {
      await authApi.verifyResetToken({ token, email })
      setTokenValid(true)
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Liên kết không hợp lệ hoặc đã hết hạn'))
    } finally {
      setVerifying(false)
    }
  }, [email, token])

  useEffect(() => {
    void verifyToken()
  }, [verifyToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password !== passwordConfirm) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự')
      return
    }

    setLoading(true)

    try {
      await authApi.resetPassword({
        token: token!,
        email: email!,
        password,
        password_confirmation: passwordConfirm,
      })

      setSuccess(true)
      setMessage('Mật khẩu đã được đặt lại thành công!')

      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Có lỗi xảy ra, vui lòng thử lại'))
    } finally {
      setLoading(false)
    }
  }

  /* ── Verifying state ─── */
  if (verifying) {
    return (
      <section className="forgot-page" style={{ backgroundImage: `url(${campusImage})` }}>
        <div className="forgot-card-wrap">
          <article className="forgot-card">
            <div className="forgot-brand">
              <img src={logoImage} alt="NTU logo" className="forgot-logo" />
              <h1>Đang kiểm tra liên kết</h1>
              <p>Vui lòng chờ trong giây lát...</p>
            </div>
            <div className="verifying-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1357c4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          </article>
        </div>
      </section>
    )
  }

  return (
    <section className="forgot-page" style={{ backgroundImage: `url(${campusImage})` }}>
      <div className="forgot-card-wrap">
        <article className="forgot-card">
          <div className="forgot-brand">
            <img src={logoImage} alt="NTU logo" className="forgot-logo" />
            <h1>Tạo mật khẩu mới</h1>
            <p>Nhập mật khẩu mới cho tài khoản của bạn</p>
          </div>

          {!success ? (
            <>
              {/* Token invalid */}
              {!tokenValid && (
                <>
                  <div className="error-message" style={{ marginBottom: '16px' }}>
                    {error}
                  </div>
                  <div className="forgot-footer">
                    <Link to="/login/forgot-password" className="forgot-back-link">
                      ← Yêu cầu liên kết mới
                    </Link>
                  </div>
                </>
              )}

              {/* Token valid – show form */}
              {tokenValid && (
                <form className="forgot-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <div className="pwd-input-wrap">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                        disabled={loading}
                        required
                        className="form-input"
                      />
                      {password.length > 0 && (
                        <button
                          type="button"
                          className="pwd-eye-btn"
                          onClick={() => setShowPassword((v) => !v)}
                          tabIndex={-1}
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="pwd-input-wrap">
                      <input
                        id="passwordConfirm"
                        type={showPasswordConfirm ? 'text' : 'password'}
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        disabled={loading}
                        required
                        className="form-input"
                      />
                      {passwordConfirm.length > 0 && (
                        <button
                          type="button"
                          className="pwd-eye-btn"
                          onClick={() => setShowPasswordConfirm((v) => !v)}
                          tabIndex={-1}
                          aria-label={showPasswordConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showPasswordConfirm ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <button type="submit" disabled={loading} className="btn-submit">
                    {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                  </button>
                </form>
              )}
            </>
          ) : (
            /* Success state */
            <div className="success-message">
              <div className="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2>Đặt lại thành công!</h2>
              <p>{message}</p>
              <p className="redirect-info">Bạn sẽ được chuyển về trang đăng nhập trong 3 giây...</p>
              <Link to="/login" className="btn-back">
                Quay lại đăng nhập ngay
              </Link>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
