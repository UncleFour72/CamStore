import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import CartItem from '../components/common/CartItem.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { useCart } from '../hooks/useCart.js';
import { formatPrice } from '../utils/helpers.js';

export default function CartPage() {
  const { items, itemCount, subtotal, total, isLoading, error } = useCart();

  return (
    <main className="page">
      <section className="container checkout-grid">
        <div className="checkout-left">
          <div className="page-heading compact-heading">
            <span className="eyebrow">Shopping bag</span>
            <h1>Giỏ hàng của bạn</h1>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Sản phẩm ({itemCount})</h2>
              <ShoppingBag size={24} />
            </div>
            {isLoading && items.length === 0 ? (
              <LoadingSpinner label="Đang tải giỏ hàng" />
            ) : error ? (
              <div className="empty-state inline">
                <h2>Không thể tải giỏ hàng</h2>
                <p>{error}</p>
                <Link className="button secondary" to="/login">
                  Đăng nhập lại
                </Link>
              </div>
            ) : items.length > 0 ? (
              <div className="cart-lines">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="empty-state inline">
                <h2>Chưa có sản phẩm nào trong giỏ hàng</h2>
                <p>Hãy chọn một bộ máy hoặc lens để bắt đầu đơn hàng.</p>
                <Link className="button secondary" to="/products">
                  Xem sản phẩm
                </Link>
              </div>
            )}
          </div>
        </div>

        <aside className="summary-card">
          <h2>Tóm tắt đơn hàng</h2>
          <div className="summary-lines">
            <div>
              <span>Tạm tính</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <div>
              <span>Vận chuyển</span>
              <strong className="accent">Miễn phí</strong>
            </div>
          </div>
          <div className="summary-total">
            <span>Tổng cộng</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <Link className="button primary full" to="/checkout">
            Thanh toán <ArrowRight size={19} />
          </Link>
        </aside>
      </section>
    </main>
  );
}
