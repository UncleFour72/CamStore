import { Camera, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import PasswordField from '../components/ui/PasswordField.jsx';
import { assets } from '../data/assets.js';
import { resetPassword } from '../services/authService.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateField(event) {
    setMessage('');
    setError('');
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({ token, password: form.password });
      setMessage('Đặt lại mật khẩu thành công.');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-visual">
        <Link className="auth-logo" to="/">
          <Camera size={28} />
          <span>CAMSTORE</span>
        </Link>

        <img className="auth-visual-image" src={assets.lensDark} alt="Ống kính máy ảnh chuyên nghiệp" />

        <div className="auth-visual-copy">
          <h1>Tạo mật khẩu mới.</h1>
          <p>Chọn mật khẩu mới để bảo vệ tài khoản và tiếp tục mua sắm tại CamStore.</p>
        </div>
      </section>

      <section className="auth-workspace">
        <div className="auth-panel-modern">
          <div className="auth-heading">
            <h1>Đặt lại mật khẩu</h1>
            <p>Liên kết đặt lại chỉ dùng được một lần và sẽ hết hạn sau thời gian quy định.</p>
          </div>

          <form className="auth-form-modern" onSubmit={handleSubmit} autoComplete="off">
            <PasswordField
              aria-label="Mật khẩu mới"
              autoComplete="new-password"
              data-form-type="other"
              data-lpignore="true"
              label="Mật khẩu mới"
              minLength={6}
              name="password"
              onChange={updateField}
              onToggle={() => setShowPassword((value) => !value)}
              placeholder="••••••••"
              required
              showPassword={showPassword}
              value={form.password}
            />

            <PasswordField
              aria-label="Nhập lại mật khẩu"
              autoComplete="new-password"
              data-form-type="other"
              data-lpignore="true"
              label="Nhập lại mật khẩu"
              minLength={6}
              name="confirmPassword"
              onChange={updateField}
              onToggle={() => setShowPassword((value) => !value)}
              placeholder="••••••••"
              required
              showPassword={showPassword}
              value={form.confirmPassword}
            />

            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}

            <Button fullWidth type="submit" disabled={isSubmitting || !token}>
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </Button>
          </form>

          <p className="auth-terms">
            Muốn dùng tài khoản khác? <Link to="/login">Quay lại đăng nhập</Link>
          </p>

          <div className="auth-security">
            <span>
              <ShieldCheck size={16} /> ONE-TIME LINK
            </span>
            <span>
              <LockKeyhole size={16} /> SECURE PASSWORD
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
