import { Banknote, Building2, LockKeyhole, QrCode, ShieldCheck, ShoppingBasket, Truck } from 'lucide-react';
import { useState } from 'react';
import CartItem from '../components/common/CartItem.jsx';
import ToastNotification from '../components/common/ToastNotification.jsx';
import { useCart } from '../hooks/useCart.js';
import { formatPrice } from '../utils/helpers.js';

const paymentMethods = [
  { id: 'vnpay', label: 'VNPay / Ngân hàng', icon: Building2 },
  { id: 'momo', label: 'Ví điện tử MoMo', icon: QrCode },
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: Banknote },
];

export default function CheckoutPage() {
  const { items, itemCount, subtotal, shipping, total } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [toast, setToast] = useState('');

  function handleOrderSubmit(event) {
    event.preventDefault();
    setToast('Đơn hàng đã được ghi nhận. CamStore sẽ liên hệ xác nhận sớm.');
  }

  return (
    <main className="checkout-page">
      <ToastNotification message={toast} onClose={() => setToast('')} />
      <form className="container checkout-grid" onSubmit={handleOrderSubmit}>
        <div className="checkout-left">
          <h1 className="checkout-title">Thanh toán đơn hàng</h1>

          <section className="panel">
            <div className="panel-header">
              <h2>Giỏ hàng của bạn ({itemCount})</h2>
              <ShoppingBasket size={25} />
            </div>
            <div className="cart-lines">
              {items.map((item) => (
                <CartItem key={item.product.id} item={item} compact />
              ))}
            </div>
          </section>

          <section className="panel shipping-panel">
            <div className="section-title-row">
              <Truck size={25} />
              <h2>Thông tin giao hàng</h2>
            </div>
            <div className="form-grid">
              <label>
                <span>Họ và tên</span>
                <input defaultValue="Nguyễn Văn A" name="fullName" />
              </label>
              <label>
                <span>Số điện thoại</span>
                <input defaultValue="0901 234 567" name="phone" />
              </label>
              <label className="span-2">
                <span>Địa chỉ nhận hàng</span>
                <input placeholder="Số nhà, tên đường, Phường/Xã..." name="address" />
              </label>
              <label>
                <span>Tỉnh / Thành phố</span>
                <select defaultValue="Hồ Chí Minh" name="city">
                  <option>Hồ Chí Minh</option>
                  <option>Hà Nội</option>
                  <option>Đà Nẵng</option>
                </select>
              </label>
              <label>
                <span>Ghi chú (Tùy chọn)</span>
                <input placeholder="Ví dụ: Giao vào giờ hành chính" name="note" />
              </label>
            </div>
          </section>
        </div>

        <aside className="summary-card checkout-summary">
          <h2>Tóm tắt đơn hàng</h2>
          <div className="summary-lines">
            <div>
              <span>Tạm tính ({itemCount} sản phẩm)</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <div>
              <span>Phí vận chuyển</span>
              <strong className="accent">{shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}</strong>
            </div>
          </div>

          <div className="summary-total">
            <span>Tổng cộng</span>
            <div>
              <strong>{formatPrice(total)}</strong>
              <small>(Đã bao gồm VAT)</small>
            </div>
          </div>

          <div className="payment-group">
            <span className="payment-label">Phương thức thanh toán</span>
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const active = paymentMethod === method.id;

              return (
                <label key={method.id} className={active ? 'payment-option active' : 'payment-option'}>
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={active}
                    onChange={() => setPaymentMethod(method.id)}
                  />
                  <Icon size={23} />
                  <span>{method.label}</span>
                </label>
              );
            })}
          </div>

          <button className="button primary full order-button" type="submit">
            ĐẶT HÀNG NGAY <LockKeyhole size={21} />
          </button>
          <p className="secure-note">
            <ShieldCheck size={15} />
            Thanh toán an toàn, bảo mật tuyệt đối 256-bit SSL
          </p>
        </aside>
      </form>
    </main>
  );
}
