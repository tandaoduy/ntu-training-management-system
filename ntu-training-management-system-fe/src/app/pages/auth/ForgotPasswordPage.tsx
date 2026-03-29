import { Link } from 'react-router-dom'

import campusImage from '../../../assets/hinhhome1.jpg'
import logoImage from '../../../assets/Logo_NTU.png'
import './ForgotPasswordPage.css'

export default function ForgotPasswordPage() {
  return (
    <section className="forgot-page" style={{ backgroundImage: `url(${campusImage})` }}>
      <div className="forgot-overlay" />

      <div className="forgot-card-wrap">
        <article className="forgot-card">
          <div className="forgot-brand">
            <img src={logoImage} alt="NTU logo" className="forgot-logo" />
            <h1>Quên mật khẩu</h1>
            <p>
              Vui lòng liên hệ Phòng Đào tạo hoặc quản trị hệ thống để được hỗ trợ cấp lại mật khẩu.
            </p>
          </div>

          <div className="forgot-content">
            <p>
              Email hỗ trợ: <a href="mailto:daotao@ntu.edu.vn">daotao@ntu.edu.vn</a>
            </p>
            <p>Điện thoại: (0258) 3831149</p>
          </div>

          <Link to="/auth" className="forgot-back-link">
            Quay lại trang đăng nhập
          </Link>
        </article>
      </div>
    </section>
  )
}
