import { Camera, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SocialAuthButtons from '../components/common/SocialAuthButtons.jsx';
import Button from '../components/ui/Button.jsx';
import PasswordField from '../components/ui/PasswordField.jsx';
import TextField from '../components/ui/TextField.jsx';
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
            <TextField
              aria-label="Email"
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              label="Email hoặc số điện thoại"
              name="email"
              onChange={updateField}
              placeholder="name@company.com"
              required
              type="email"
              value={form.email}
            />

            <PasswordField
              aria-label="Mật khẩu"
              autoComplete="new-password"
              data-form-type="other"
              data-lpignore="true"
              label="Mật khẩu"
              name="password"
              onChange={updateField}
              onToggle={() => setShowPassword((value) => !value)}
              placeholder="••••••••"
              required
              showPassword={showPassword}
              value={form.password}
            />

            {error && <p className="form-error">{error}</p>}

            <div className="auth-remember-row">
              <label className="auth-remember">
                <input type="checkbox" />
                <span>Duy trì đăng nhập trong 30 ngày</span>
              </label>
              <Link to="/forgot-password">Quên mật khẩu?</Link>
            </div>

            <Button fullWidth type="submit" disabled={isLoading}>
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập tài khoản'}
            </Button>
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
