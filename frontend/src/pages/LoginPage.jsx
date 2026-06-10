import { Camera, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SocialAuthButtons from '../components/common/SocialAuthButtons.jsx';
import { assets } from '../data/assets.js';
import { clearError, loginUser, loginWithFacebook, loginWithGoogle } from '../store/slices/authSlice.js';

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

  const handleSocialLogin = useCallback(
    async (action, payload) => {
      dispatch(clearError());

      try {
        const result = await dispatch(action(payload)).unwrap();
        navigate(result.user?.role === 'admin' ? '/admin' : redirectTo, { replace: true });
      } catch {
        // Redux state already carries the visible error.
      }
    },
    [dispatch, navigate, redirectTo]
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
            <h1>Chào mừng trở lại</h1>
            <p>Vui lòng nhập thông tin để truy cập tài khoản của bạn.</p>
          </div>

          <div className="auth-tabs">
            <Link className="active" to="/login">
              Đăng nhập
            </Link>
            <Link to="/register">Đăng ký</Link>
          </div>

          <form className="auth-form-modern" onSubmit={handleSubmit} autoComplete="off">
            <label>
              <span>Email hoặc số điện thoại</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                aria-label="Email"
                placeholder="name@company.com"
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
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
                  aria-label="Mật khẩu"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  required
                />
                <button
                  type="button"
                  aria-label="Hiện mật khẩu"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>

            {error && <p className="form-error">{error}</p>}

            <div className="auth-remember-row">
              <label className="auth-remember">
                <input type="checkbox" />
                <span>Duy trì đăng nhập trong 30 ngày</span>
              </label>
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </div>

            <button className="auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập tài khoản'}
            </button>
          </form>

          <div className="auth-divider">
            <span>HOẶC TIẾP TỤC VỚI</span>
          </div>

          <SocialAuthButtons
            disabled={isLoading}
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
