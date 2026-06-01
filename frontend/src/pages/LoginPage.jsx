import { Camera, Eye, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { assets } from '../data/assets.js';
import { clearError, loginUser } from '../store/slices/authSlice.js';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/';

  function updateField(event) {
    dispatch(clearError());
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const result = await dispatch(loginUser(form)).unwrap();
      navigate(result.user?.role === 'admin' ? '/admin' : redirectTo, { replace: true });
    } catch {
      // Redux state already carries the visible error.
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-visual">
        <Link className="auth-logo" to="/">
          <Camera size={28} />
          <span>CAMSTORE</span>
        </Link>

        <img className="auth-visual-image" src={assets.lensDark} alt="Ống kính máy ảnh" />

        <div className="auth-visual-copy">
          <h1>Ghi lại khoảnh khắc, kiến tạo nghệ thuật.</h1>
          <p>Đăng nhập để quản lý hồ sơ, địa chỉ giao hàng và lịch sử mua sắm tại CamStore.</p>
        </div>

        <div className="auth-visual-links" aria-label="Danh mục thiết bị">
          <span>Ống kính</span>
          <span>Thân máy</span>
          <span>Phụ kiện</span>
          <span>Thiết bị studio</span>
        </div>
      </section>

      <section className="auth-workspace">
        <div className="auth-panel-modern">
          <div className="auth-heading">
            <h1>Chào mừng trở lại</h1>
            <p>Nhập email và mật khẩu để truy cập tài khoản của bạn.</p>
          </div>

          <div className="auth-tabs">
            <Link className="active" to="/login">
              Đăng nhập
            </Link>
            <Link to="/register">Đăng ký</Link>
          </div>

          <form className="auth-form-modern" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                placeholder="name@company.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              <span>Mật khẩu</span>
              <div className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={updateField}
                  placeholder="********"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  <Eye size={20} />
                </button>
              </div>
            </label>

            {error && <p className="form-error">{error}</p>}

            <label className="auth-remember">
              <input type="checkbox" />
              <span>Duy trì đăng nhập trên thiết bị này</span>
            </label>

            <button className="auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập tài khoản'}
            </button>
          </form>

          <div className="auth-security">
            <span>
              <ShieldCheck size={16} /> SSL SECURE
            </span>
            <span>
              <LockKeyhole size={16} /> JWT AUTH
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
