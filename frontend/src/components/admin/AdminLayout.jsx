import {
  Aperture,
  CreditCard,
  FileText,
  LayoutGrid,
  LogOut,
  Search,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tags,
  UsersRound,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from '../common/NotificationBell.jsx';
import { logoutUser } from '../../store/slices/authSlice.js';

const adminNav = [
  { label: 'Tổng quan', to: '/admin', icon: LayoutGrid, end: true },
  { label: 'Đơn hàng', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Sản phẩm', to: '/admin/products', icon: Aperture },
  { label: 'Danh mục', to: '/admin/categories', icon: Tags },
  { label: 'Bảo hành', to: '/admin/warranty', icon: ShieldCheck },
  { label: 'Tin tức', to: '/admin/blog', icon: FileText },
  { label: 'Đánh giá', to: '/admin/reviews', icon: Star },
  { label: 'Thanh toán', to: '/admin/payments', icon: CreditCard },
  { label: 'Khách hàng', to: '/admin/customers', icon: UsersRound },
];

const searchPlaceholders = {
  '/admin/products': 'Tìm kiếm sản phẩm...',
  '/admin/categories': 'Tìm kiếm danh mục...',
  '/admin/warranty': 'Tìm kiếm phiếu bảo hành...',
  '/admin/blog': 'Tìm kiếm bài viết...',
  '/admin/reviews': 'Tìm kiếm đánh giá...',
  '/admin/payments': 'Tìm kiếm thanh toán...',
  '/admin/orders': 'Tìm kiếm mã đơn, khách hàng...',
  '/admin/customers': 'Tìm kiếm khách hàng...',
};

export default function AdminLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const searchPlaceholder = searchPlaceholders[location.pathname] || 'Tìm kiếm hệ thống...';
  const userName =
    user?.name ||
    user?.full_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    'Admin CamStore';
  const avatarUrl =
    user?.avatar_url ||
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80';

  async function handleLogout() {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand-block">
          <span>
            <Aperture size={30} />
          </span>
          <div>
            <strong>CamStore</strong>
            <small>Hệ thống quản trị</small>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Quản trị">
          {adminNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <Icon size={26} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="admin-main-shell">
        <header className="admin-topbar">
          <label>
            <Search size={23} />
            <input placeholder={searchPlaceholder} />
          </label>
          <div className="admin-top-actions">
            <NotificationBell scope="admin" />
            <div className="admin-top-divider" />
            <button
              type="button"
              className="admin-top-profile"
              onClick={handleLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất khỏi trang quản trị"
            >
              <img src={avatarUrl} alt={userName} />
              <strong>{userName}</strong>
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
