import { Camera, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import SocialAuthButtons from '../components/common/SocialAuthButtons.jsx';
import Button from '../components/ui/Button.jsx';
import PasswordField from '../components/ui/PasswordField.jsx';
import TextField from '../components/ui/TextField.jsx';
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

          <form className="auth-form-modern" onSubmit={handleSubmit} autoComplete="off">
            <TextField
              aria-label="Họ và tên"
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              label="Họ và tên"
              name="name"
              onChange={updateField}
              placeholder="Nguyễn Văn A"
              required
              type="text"
              value={form.name}
            />

            <TextField
              aria-label="Email"
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              label="Email"
              name="email"
              onChange={updateField}
              placeholder="name@company.com"
              required
              type="email"
              value={form.email}
            />

            <TextField
              aria-label="Số điện thoại"
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              label="Số điện thoại"
              name="phone"
              onChange={updateField}
              placeholder="0901 234 567"
              type="tel"
              value={form.phone}
            />

            <PasswordField
              aria-label="Mật khẩu"
              autoComplete="new-password"
              data-form-type="other"
              data-lpignore="true"
              label="Mật khẩu"
              minLength={6}
              name="password"
              onChange={updateField}
              onToggle={() => setShowPassword((value) => !value)}
              placeholder="••••••••"
              required
              showPassword={showPassword}
              value={form.password}
            />

            {error && <p className="form-error">{error}</p>}

            <label className="auth-remember">
              <input type="checkbox" />
              <span>Tôi đồng ý nhận thông tin ưu đãi từ CamStore</span>
            </label>

            <Button fullWidth type="submit" disabled={isLoading}>
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
            </Button>
          </form>

          <div className="auth-divider">
            <span>HOẶC ĐĂNG KÝ VỚI</span>
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
