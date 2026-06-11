import { Camera, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import TextField from '../components/ui/TextField.jsx';
import { assets } from '../data/assets.js';
import { requestPasswordReset } from '../services/authService.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      await requestPasswordReset({ email });
      setMessage('Hãy kiểm tra Gmail của bạn.');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
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
          <h1>Khôi phục tài khoản CamStore.</h1>
          <p>Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu an toàn.</p>
        </div>
      </section>

      <section className="auth-workspace">
        <div className="auth-panel-modern">
          <div className="auth-heading">
            <h1>Quên mật khẩu?</h1>
            <p>Nhập email tài khoản để nhận liên kết đặt lại mật khẩu an toàn.</p>
          </div>

          {message && (
            <div className="auth-result-card success">
              <Mail size={22} />
              <div>
                <strong>Hãy kiểm tra Gmail của bạn</strong>
                <p>Liên kết đặt lại mật khẩu đã được gửi tới địa chỉ bạn vừa nhập. Nếu chưa thấy, hãy kiểm tra Spam.</p>
              </div>
            </div>
          )}

          <form className="auth-form-modern" onSubmit={handleSubmit} autoComplete="off">
            <TextField
              aria-label="Email tài khoản"
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              label="Email tài khoản"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              required
              type="email"
              value={email}
            />

            {error && <p className="form-error">{error}</p>}

            <Button fullWidth type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi'}
            </Button>
          </form>

          <p className="auth-terms">
            Đã nhớ mật khẩu? <Link to="/login">Quay lại đăng nhập</Link>
          </p>

          <div className="auth-security">
            <span>
              <ShieldCheck size={16} /> RESET TOKEN 30 PHÚT
            </span>
            <span>
              <Mail size={16} /> EMAIL SECURE
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
