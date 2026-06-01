import {
  Aperture,
  Bell,
  LayoutGrid,
  Search,
  ShoppingCart,
  Tags,
  UsersRound,
} from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const adminNav = [
  { label: 'Tổng quan', to: '/admin', icon: LayoutGrid, end: true },
  { label: 'Đơn hàng', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Sản phẩm', to: '/admin/products', icon: Aperture },
  { label: 'Danh mục', to: '/admin/categories', icon: Tags },
  { label: 'Khách hàng', to: '/admin/customers', icon: UsersRound },
];

const searchPlaceholders = {
  '/admin/products': 'Tìm kiếm sản phẩm...',
  '/admin/categories': 'Tìm kiếm danh mục...',
  '/admin/orders': 'Tìm kiếm mã đơn, khách hàng...',
  '/admin/customers': 'Tìm kiếm hệ thống...',
};

export default function AdminLayout() {
  const location = useLocation();
  const searchPlaceholder =
    searchPlaceholders[location.pathname] || 'Tìm kiếm hệ thống...';

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

        <div className="admin-support-card">
          <p>Hỗ trợ kỹ thuật</p>
          <button type="button">Liên hệ ngay</button>
        </div>

        <div className="admin-profile-mini">
          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
            alt="Admin CamStore"
          />
          <div>
            <strong>Admin CamStore</strong>
            <small>admin@camstore.vn</small>
          </div>
        </div>
      </aside>

      <div className="admin-main-shell">
        <header className="admin-topbar">
          <label>
            <Search size={23} />
            <input placeholder={searchPlaceholder} />
          </label>
          <div className="admin-top-actions">
            <button type="button" aria-label="Thông báo">
              <Bell size={24} />
              <span />
            </button>
            <div className="admin-top-divider" />
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
              alt="Admin CamStore"
            />
            <strong>Admin CamStore</strong>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
