import { Camera, Eye, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { assets } from '../data/catalog.js';
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

        <img className="auth-visual-image" src={assets.lensDark} alt="Camera lens" />

        <div className="auth-visual-copy">
          <h1>Ghi lai khoanh khac, kien tao nghe thuat.</h1>
          <p>Dang nhap de quan ly ho so, dia chi giao hang va lich su mua sam tai CamStore.</p>
        </div>

        <div className="auth-visual-links" aria-label="Danh muc thiet bi">
          <span>Lenses</span>
          <span>Bodies</span>
          <span>Accessories</span>
          <span>Studio Gear</span>
        </div>
      </section>

      <section className="auth-workspace">
        <div className="auth-panel-modern">
          <div className="auth-heading">
            <h1>Chao mung tro lai</h1>
            <p>Nhap email va mat khau de truy cap tai khoan cua ban.</p>
          </div>

          <div className="auth-tabs">
            <Link className="active" to="/login">
              Dang nhap
            </Link>
            <Link to="/register">Dang ky</Link>
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
              <span>Mat khau</span>
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
                  aria-label="Hien mat khau"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  <Eye size={20} />
                </button>
              </div>
            </label>

            {error && <p className="form-error">{error}</p>}

            <label className="auth-remember">
              <input type="checkbox" />
              <span>Duy tri dang nhap tren thiet bi nay</span>
            </label>

            <button className="auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Dang dang nhap...' : 'Dang nhap tai khoan'}
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
