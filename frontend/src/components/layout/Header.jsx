import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  PackageCheck,
  Recycle,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '../common/NotificationBell.jsx';
import { storefrontCategories } from '../../data/assets.js';
import { useCart } from '../../hooks/useCart.js';
import { logoutUser } from '../../store/slices/authSlice.js';
import { fetchWishlist } from '../../store/slices/wishlistSlice.js';
import { classNames } from '../../utils/helpers.js';

const navItems = storefrontCategories.map((category) => ({
  label: category.label,
  to: `/products?category=${category.id}`,
  category: category.id,
}));

const serviceItems = [
  {
    label: 'Chính sách bảo hành',
    description: 'Điều kiện, thời hạn và quy trình bảo hành',
    to: '/services/warranty',
    icon: ShieldCheck,
  },
  {
    label: 'Thu cũ đổi mới',
    description: 'Định giá thiết bị cũ và nâng cấp body/lens',
    to: '/services/trade-in',
    icon: Recycle,
  },
  {
    label: 'Vệ sinh lens & máy ảnh',
    description: 'Chăm sóc cảm biến, lens và thân máy',
    to: '/services/cleaning',
    icon: Sparkles,
  },
];

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const { itemCount } = useCart();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { hasLoaded: wishlistLoaded, isLoading: wishlistLoading } = useSelector((state) => state.wishlist);
  const location = useLocation();
  const serviceActive = location.pathname.startsWith('/services');
  const activeCategory = new URLSearchParams(location.search).get('category');
  const userName =
    user?.name || user?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email;

  useEffect(() => {
    if (isAuthenticated && !wishlistLoaded && !wishlistLoading) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated, wishlistLoaded, wishlistLoading]);

  function closeMenus() {
    setIsOpen(false);
    setIsServiceOpen(false);
    setIsAccountOpen(false);
  }

  async function handleLogout() {
    await dispatch(logoutUser());
    closeMenus();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-surface/90 shadow-[0_2px_12px_rgba(15,23,42,0.04)] backdrop-blur">
      <div className="mx-auto flex min-h-20 w-[calc(100%_-_48px)] max-w-container items-center justify-between gap-6 max-[620px]:min-h-[68px] max-[620px]:w-[calc(100%_-_32px)]">
        <Link
          className="text-xl font-extrabold tracking-normal text-ink max-[620px]:text-lg"
          to="/"
          aria-label="CamStore home"
          onClick={closeMenus}
        >
          CamStore
        </Link>

        <nav className="flex items-center justify-center gap-[30px] max-[860px]:hidden" aria-label="Danh mục chính">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={classNames(
                'font-semibold text-muted transition-colors hover:text-primary',
                location.pathname === '/products' && activeCategory === item.category && 'text-primary'
              )}
            >
              {item.label}
            </Link>
          ))}

          <div
            className="service-nav"
            onMouseEnter={() => setIsServiceOpen(true)}
            onMouseLeave={() => setIsServiceOpen(false)}
          >
            <button
              className={classNames(
                'service-trigger flex items-center gap-1 border-0 bg-transparent p-0 font-semibold text-muted transition-colors hover:text-primary',
                serviceActive && 'text-primary'
              )}
              type="button"
              onClick={() => setIsServiceOpen((value) => !value)}
              aria-expanded={isServiceOpen}
            >
              Dịch vụ <ChevronDown size={14} />
            </button>
            {isServiceOpen && (
              <div className="service-dropdown">
                {serviceItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link key={item.to} to={item.to} onClick={closeMenus}>
                      <span>
                        <Icon size={19} />
                      </span>
                      <div>
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <NavLink
            to="/blog"
            className={({ isActive }) =>
              classNames('font-semibold text-muted transition-colors hover:text-primary', isActive && 'text-primary')
            }
          >
            Blog
          </NavLink>
        </nav>

        <div className="flex items-center gap-2.5 max-[620px]:gap-1">
          <Link
            className="cart-button relative inline-flex h-[42px] w-[42px] items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-soft"
            to="/cart"
            aria-label="Giỏ hàng"
          >
            <ShoppingCart size={21} />
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </Link>

          {isAuthenticated && <NotificationBell />}

          {isAuthenticated ? (
            <div className="account-menu">
              <button
                className="account-trigger"
                type="button"
                aria-label="Tài khoản"
                aria-expanded={isAccountOpen}
                onClick={() => setIsAccountOpen((value) => !value)}
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={userName || 'Avatar'} />
                ) : (
                  <User size={19} />
                )}
                <span>{userName || 'Tài khoản'}</span>
                <ChevronDown size={15} />
              </button>
              {isAccountOpen && (
                <div className="account-dropdown">
                  <Link to="/profile" onClick={closeMenus}>
                    <User size={18} />
                    <span>Thông tin tài khoản</span>
                  </Link>
                  <Link to="/wishlist" onClick={closeMenus}>
                    <Heart size={18} />
                    <span>Yêu thích</span>
                  </Link>
                  <Link to="/orders" onClick={closeMenus}>
                    <PackageCheck size={18} />
                    <span>Đơn hàng</span>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" onClick={closeMenus}>
                      <ShieldCheck size={18} />
                      <span>Quản trị</span>
                    </Link>
                  )}
                  <button type="button" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                className="button secondary min-h-[42px] px-4 max-[620px]:hidden"
                to="/login"
                onClick={closeMenus}
              >
                Đăng nhập
              </Link>
              <Link
                className="hidden h-[42px] w-[42px] items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-soft max-[620px]:inline-flex"
                to="/login"
                aria-label="Đăng nhập"
                onClick={closeMenus}
              >
                <User size={19} />
              </Link>
            </>
          )}

          <button
            className="hidden h-[42px] w-[42px] items-center justify-center rounded-full border-0 bg-transparent text-primary transition-colors hover:bg-surface-soft max-[860px]:inline-flex"
            type="button"
            aria-label="Mở menu"
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav className="mx-auto hidden w-[calc(100%_-_48px)] max-w-container gap-2 pb-4 max-[860px]:grid max-[620px]:w-[calc(100%_-_32px)]" aria-label="Menu di động">
          {navItems.map((item) => (
            <Link
              className="flex min-h-11 items-center rounded-[10px] px-3 font-extrabold text-muted hover:bg-white hover:text-primary"
              key={item.label}
              to={item.to}
              onClick={closeMenus}
            >
              {item.label}
            </Link>
          ))}
          <span className="mobile-nav-label">Dịch vụ</span>
          {serviceItems.map((item) => (
            <Link
              className="flex min-h-11 items-center rounded-[10px] px-3 font-extrabold text-muted hover:bg-white hover:text-primary"
              key={item.to}
              to={item.to}
              onClick={closeMenus}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="flex min-h-11 items-center rounded-[10px] px-3 font-extrabold text-muted hover:bg-white hover:text-primary"
            to="/blog"
            onClick={closeMenus}
          >
            Blog
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                className="flex min-h-11 items-center rounded-[10px] px-3 font-extrabold text-muted hover:bg-white hover:text-primary"
                to="/profile"
                onClick={closeMenus}
              >
                Hồ sơ
              </Link>
              <Link
                className="flex min-h-11 items-center rounded-[10px] px-3 font-extrabold text-muted hover:bg-white hover:text-primary"
                to="/wishlist"
                onClick={closeMenus}
              >
                Wishlist
              </Link>
              <Link
                className="flex min-h-11 items-center rounded-[10px] px-3 font-extrabold text-muted hover:bg-white hover:text-primary"
                to="/orders"
                onClick={closeMenus}
              >
                Đơn hàng
              </Link>
              {user?.role === 'admin' && (
                <Link
                  className="flex min-h-11 items-center rounded-[10px] px-3 font-extrabold text-muted hover:bg-white hover:text-primary"
                  to="/admin"
                  onClick={closeMenus}
                >
                  Quản trị
                </Link>
              )}
              <button
                className="flex min-h-11 items-center rounded-[10px] border-0 bg-transparent px-3 text-left font-extrabold text-muted hover:bg-white hover:text-primary"
                type="button"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <Link
              className="flex min-h-11 items-center rounded-[10px] px-3 font-extrabold text-muted hover:bg-white hover:text-primary"
              to="/login"
              onClick={closeMenus}
            >
              Đăng nhập
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
