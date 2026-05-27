import { Camera, Eye, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assets } from '../data/catalog.js';

export default function RegisterPage() {
  return (
    <main className="auth-screen">
      <section className="auth-visual">
        <Link className="auth-logo" to="/">
          <Camera size={28} />
          <span>CAMSTORE</span>
        </Link>

        <img className="auth-visual-image" src={assets.lensDark} alt="Ống kính máy ảnh chuyên nghiệp" />

        <div className="auth-visual-copy">
          <h1>Ghi lại khoảnh khắc, kiến tạo nghệ thuật.</h1>
          <p>
            Tham gia cộng đồng nhiếp ảnh chuyên nghiệp và sở hữu những thiết bị quang học hàng đầu thế giới ngay hôm nay.
          </p>
        </div>

        <div className="auth-visual-links" aria-label="Danh mục thiết bị">
          <span>Lenses</span>
          <span>Bodies</span>
          <span>Accessories</span>
          <span>Studio Gear</span>
        </div>
      </section>

      <section className="auth-workspace">
        <div className="auth-panel-modern">
          <div className="auth-heading">
            <h1>Tạo tài khoản mới</h1>
            <p>Lưu thông tin mua hàng, theo dõi đơn và nhận ưu đãi dành riêng cho bạn.</p>
          </div>

          <div className="auth-tabs">
            <Link to="/login">Đăng nhập</Link>
            <Link className="active" to="/register">
              Đăng ký
            </Link>
          </div>

          <form className="auth-form-modern">
            <label>
              <span>Họ và tên</span>
              <input type="text" placeholder="Nguyễn Văn A" />
            </label>

            <label>
              <span>Email hoặc Số điện thoại</span>
              <input type="email" placeholder="name@company.com" />
            </label>

            <label>
              <span>Mật khẩu</span>
              <div className="auth-password-field">
                <input type="password" placeholder="••••••••" />
                <button type="button" aria-label="Hiện mật khẩu">
                  <Eye size={20} />
                </button>
              </div>
            </label>

            <label className="auth-remember">
              <input type="checkbox" />
              <span>Tôi đồng ý nhận thông tin ưu đãi từ CamStore</span>
            </label>

            <button className="auth-submit" type="button">
              Đăng ký tài khoản
            </button>
          </form>

          <div className="auth-divider">
            <span>HOẶC ĐĂNG KÝ VỚI</span>
          </div>

          <div className="auth-social-grid">
            <button type="button">
              <span className="google-mark">G</span>
              Google
            </button>
            <button type="button">
              <span className="facebook-mark">f</span>
              Facebook
            </button>
          </div>

          <p className="auth-terms">
            Bằng việc tiếp tục, bạn đồng ý với <Link to="/services/warranty">Điều khoản dịch vụ</Link> và{' '}
            <Link to="/services/warranty">Chính sách bảo mật</Link> của CamStore.
          </p>

          <div className="auth-security">
            <span>
              <ShieldCheck size={16} /> SSL SECURE
            </span>
            <span>
              <LockKeyhole size={16} /> AES-256 AUTH
            </span>
          </div>
        </div>

        <footer className="auth-footer">
          <span>© 2024 CamStore. Đẳng cấp nhiếp ảnh chuyên nghiệp.</span>
          <nav aria-label="Liên kết hỗ trợ">
            <Link to="/profile">Về chúng tôi</Link>
            <Link to="/profile">Liên hệ</Link>
            <Link to="/services/warranty">Hỗ trợ</Link>
          </nav>
        </footer>
      </section>
    </main>
  );
}
