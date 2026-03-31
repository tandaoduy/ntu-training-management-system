import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import campusImage from '../../../assets/hinhhome1.jpg'
import logoImage from '../../../assets/Logo_NTU.png'
import { authApi } from '../../../api/features/auth'
import './ForgotPasswordPage.css'

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: string }).message
    if (message) {
      return message
    }
  }

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response
    if (response?.data?.message) {
      return response.data.message
    }
  }

  return fallback
}

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaId, setCaptchaId] = useState('')
  const [captchaImage, setCaptchaImage] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true)

    try {
      const response = await authApi.forgotPasswordCaptcha()
      setCaptchaId(response.challenge_id)
      setCaptchaImage(response.captcha_image)
      setCaptchaCode('')
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Không tải được mã bảo vệ, vui lòng thử lại'))
    } finally {
      setCaptchaLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCaptcha()
  }, [loadCaptcha])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!captchaId) {
      setError('Mã bảo vệ chưa sẵn sàng, vui lòng tải lại trang')
      return
    }

    if (captchaCode.trim().length < 4) {
      setError('Vui lòng nhập mã bảo vệ hợp lệ')
      return
    }

    setLoading(true)

    try {
      const response = await authApi.forgotPassword({
        identifier: identifier.trim(),
        captcha_id: captchaId,
        captcha_code: captchaCode.trim(),
      })

      setEmail(response.email)
      setSubmitted(true)
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Có lỗi xảy ra, vui lòng thử lại'))
      await loadCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="forgot-page" style={{ backgroundImage: `url(${campusImage})` }}>
      <div className="forgot-card-wrap">
        <article className="forgot-card">
          <div className="forgot-brand">
            <img src={logoImage} alt="NTU logo" className="forgot-logo" />
            <h1>Quên mật khẩu</h1>
            <p>Nhập tên người dùng hoặc email để nhận liên kết đặt lại mật khẩu</p>
          </div>

          {!submitted ? (
            <form className="forgot-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nhập tên người dùng hoặc email"
                  disabled={loading}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <div className="captcha-row">
                  <input
                    id="captchaCode"
                    type="text"
                    value={captchaCode}
                    onChange={(e) => setCaptchaCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã bảo vệ"
                    disabled={loading || captchaLoading}
                    required
                    className="form-input captcha-input"
                  />

                  <div className="captcha-side">
                    {captchaImage ? (
                      <img src={captchaImage} alt="Mã bảo vệ" className="captcha-image" />
                    ) : (
                      <div className="captcha-placeholder">Đang tải...</div>
                    )}
                    <button
                      type="button"
                      className="captcha-refresh"
                      onClick={() => void loadCaptcha()}
                      disabled={captchaLoading || loading}
                      title="Đổi mã bảo vệ"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 4v6h-6"/>
                        <path d="M1 20v-6h6"/>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Đang xử lý...' : 'Gửi liên kết'}
              </button>

              <div className="forgot-footer">
                <Link to="/login" className="forgot-back-link">
                  ← Quay lại trang đăng nhập
                </Link>
              </div>
            </form>
          ) : (
            <div className="success-message">
              <div className="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2>Gửi thành công!</h2>
              <p className="email-info">Liên kết đã được gửi tới: <strong>{email}</strong></p>
              <Link to="/login" className="btn-back">
                Quay lại đăng nhập
              </Link>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
