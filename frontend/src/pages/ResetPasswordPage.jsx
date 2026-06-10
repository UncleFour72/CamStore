import { Camera, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
            <label>
              <span>Mật khẩu mới</span>
              <div className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={updateField}
                  aria-label="Mật khẩu mới"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  minLength={6}
                  required
                />
                <button type="button" aria-label="Hiện mật khẩu" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </label>

            <label>
              <span>Nhập lại mật khẩu</span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={updateField}
                aria-label="Nhập lại mật khẩu"
                placeholder="••••••••"
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                minLength={6}
                required
              />
            </label>

            {message && <p className="form-success">{message}</p>}
            {error && <p className="form-error">{error}</p>}

            <button className="auth-submit" type="submit" disabled={isSubmitting || !token}>
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
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
