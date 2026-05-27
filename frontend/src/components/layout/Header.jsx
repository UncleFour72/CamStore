import {
  ChevronDown,
  Menu,
  Recycle,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../../hooks/useCart.js';
import { classNames } from '../../utils/helpers.js';

const navItems = [
  { label: 'Máy ảnh', to: '/products?category=camera', category: 'camera' },
  { label: 'Ống kính', to: '/products?category=lens', category: 'lens' },
  { label: 'Phụ kiện', to: '/products?category=accessory', category: 'accessory' },
];

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
  const [isOpen, setIsOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const { itemCount } = useCart();
  const location = useLocation();
  const serviceActive = location.pathname.startsWith('/services');
  const activeCategory = new URLSearchParams(location.search).get('category');

  function closeMenus() {
    setIsOpen(false);
    setIsServiceOpen(false);
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
          <Link
            className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-soft"
            to="/profile"
            aria-label="Tài khoản"
          >
            <User size={19} />
          </Link>
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
        </nav>
      )}
    </header>
  );
}
