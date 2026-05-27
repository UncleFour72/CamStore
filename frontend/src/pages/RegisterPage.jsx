import { Camera, Eye, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { assets } from '../data/catalog.js';
import { clearError, registerUser } from '../store/slices/authSlice.js';

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

  return (
    <main className="auth-screen">
      <section className="auth-visual">
        <Link className="auth-logo" to="/">
          <Camera size={28} />
          <span>CAMSTORE</span>
        </Link>

        <img className="auth-visual-image" src={assets.lensDark} alt="Camera lens" />

        <div className="auth-visual-copy">
          <h1>Tao tai khoan de mua sam nhanh hon.</h1>
          <p>Luu thong tin giao hang, theo doi don va nhan uu dai rieng cua CamStore.</p>
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
            <h1>Tao tai khoan moi</h1>
            <p>Dang ky tai khoan khach hang CamStore.</p>
          </div>

          <div className="auth-tabs">
            <Link to="/login">Dang nhap</Link>
            <Link className="active" to="/register">
              Dang ky
            </Link>
          </div>

          <form className="auth-form-modern" onSubmit={handleSubmit}>
            <label>
              <span>Ho va ten</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Nguyen Van A"
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
              <span>So dien thoai</span>
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
              <span>Mat khau</span>
              <div className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={updateField}
                  placeholder="********"
                  autoComplete="new-password"
                  minLength={6}
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
              <span>Toi dong y nhan thong tin uu dai tu CamStore</span>
            </label>

            <button className="auth-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Dang dang ky...' : 'Dang ky tai khoan'}
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
