import { Camera, Eye, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import SocialAuthButtons from '../components/common/SocialAuthButtons.jsx';
import { assets } from '../data/assets.js';
import { clearError, loginWithFacebook, loginWithGoogle, registerUser } from '../store/slices/authSlice.js';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);

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
      await dispatch(registerUser(form)).unwrap();
      navigate('/', { replace: true });
    } catch {
      // Redux state already carries the visible error.
    }
  }

  const handleSocialLogin = useCallback(
    async (action, payload) => {
      dispatch(clearError());

      try {
        const result = await dispatch(action(payload)).unwrap();
        navigate(result.user?.role === 'admin' ? '/admin' : '/', { replace: true });
      } catch {
        // Redux state already carries the visible error.
      }
    },
    [dispatch, navigate]
  );

  const handleGoogleCredential = useCallback(
    (credential) => handleSocialLogin(loginWithGoogle, credential),
    [handleSocialLogin]
  );

  const handleFacebookAccessToken = useCallback(
    (accessToken) => handleSocialLogin(loginWithFacebook, accessToken),
    [handleSocialLogin]
  );

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

          <form className="auth-form-modern" onSubmit={handleSubmit}>
            <label>
              <span>Họ và tên</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Nguyễn Văn A"
                autoComplete="name"
                required
              />
            </label>

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
              <span>Số điện thoại</span>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="0901 234 567"
                autoComplete="tel"
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
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  aria-label="Hiện mật khẩu"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  <Eye size={20} />
                </button>
              </div>
            </label>

            {error && <p className="form-error">{error}</p>}

            <label className="auth-remember">
              <input type="checkbox" />
              <span>Tôi đồng ý nhận thông tin ưu đãi từ CamStore</span>
            </label>

            <button className="auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
            </button>
          </form>

          <div className="auth-divider">
            <span>HOẶC ĐĂNG KÝ VỚI</span>
          </div>

          <SocialAuthButtons
            disabled={isLoading}
            googleText="signup_with"
            onFacebookAccessToken={handleFacebookAccessToken}
            onGoogleCredential={handleGoogleCredential}
          />

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
