import { Banknote, Building2, LockKeyhole, QrCode, ShieldCheck, ShoppingBasket, Truck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CartItem from '../components/common/CartItem.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ToastNotification from '../components/common/ToastNotification.jsx';
import { useCart } from '../hooks/useCart.js';
import { fetchAddresses } from '../store/slices/addressSlice.js';
import { fetchCart } from '../store/slices/cartSlice.js';
import { checkoutOrder, clearOrderError } from '../store/slices/orderSlice.js';
import { formatPrice } from '../utils/helpers.js';

const paymentMethods = [
  { id: 'bank_transfer', label: 'Chuyển khoản ngân hàng', icon: Building2 },
  { id: 'vnpay', label: 'VNPay / Ngân hàng', icon: Building2 },
  { id: 'momo', label: 'Ví điện tử MoMo', icon: QrCode },
  { id: 'cod', label: 'Thanh toán khi nhận hàng (COD)', icon: Banknote },
];

const emptyShippingForm = {
  full_name: '',
  phone: '',
  address_line: '',
  ward: '',
  district: '',
  city: '',
  note: '',
};

const BUY_NOW_KEY = 'camstore_buy_now_checkout';

const readBuyNowCheckout = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(BUY_NOW_KEY) || 'null');
    return Array.isArray(parsed?.items) && parsed.items.length > 0 ? parsed : null;
  } catch {
    return null;
  }
};

const formatAddress = (address) => {
  return [address?.address_line, address?.ward, address?.district, address?.city].filter(Boolean).join(', ');
};

const buildAddressPayload = (address, paymentMethod, note) => ({
  shipping_name: address.full_name,
  shipping_phone: address.phone,
  shipping_address: address.address_line,
  shipping_ward: address.ward,
  shipping_district: address.district,
  shipping_city: address.city,
  payment_method: paymentMethod,
  note,
});

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    items,
    itemCount,
    subtotal,
    shipping,
    total,
    isLoading: cartLoading,
    error: cartError,
  } = useCart();
  const { addresses, isLoading: addressLoading, error: addressError } = useSelector((state) => state.address);
  const { user } = useSelector((state) => state.auth);
  const { isLoading: orderLoading, error: orderError } = useSelector((state) => state.order);
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [toast, setToast] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useManualAddress, setUseManualAddress] = useState(false);
  const [shippingForm, setShippingForm] = useState(emptyShippingForm);
  const [buyNowCheckout, setBuyNowCheckout] = useState(null);

  const selectedAddress = useMemo(() => {
    return addresses.find((address) => String(address.id) === String(selectedAddressId)) || null;
  }, [addresses, selectedAddressId]);
  const manualAddressActive = useManualAddress || !selectedAddress;
  const isBuyNowMode = new URLSearchParams(location.search).get('mode') === 'buy-now' && Boolean(buyNowCheckout);
  const checkoutItems = isBuyNowMode ? buyNowCheckout.items : items;
  const checkoutItemCount = checkoutItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const checkoutSubtotal = isBuyNowMode
    ? checkoutItems.reduce((sum, item) => sum + Number(item.subtotal || item.product?.price * item.quantity || 0), 0)
    : subtotal;
  const checkoutShipping = isBuyNowMode ? 0 : shipping;
  const checkoutTotal = checkoutSubtotal + checkoutShipping;
  const checkoutLoading = !isBuyNowMode && cartLoading;

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('mode') === 'buy-now') {
      setBuyNowCheckout(readBuyNowCheckout());
    } else {
      setBuyNowCheckout(null);
    }
  }, [location.search]);

  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddress = addresses.find((address) => address.is_default) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
      setUseManualAddress(false);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    setShippingForm((current) => ({
      ...current,
      full_name: current.full_name || user?.name || user?.full_name || '',
      phone: current.phone || user?.phone || '',
    }));
  }, [user]);

  function updateShippingField(event) {
    dispatch(clearOrderError());
    setShippingForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function validateManualAddress() {
    return ['full_name', 'phone', 'address_line', 'ward', 'district', 'city'].every((field) =>
      String(shippingForm[field] || '').trim()
    );
  }

  async function handleOrderSubmit(event) {
    event.preventDefault();
    setToast('');

    if (checkoutItemCount === 0) {
      setToast('Giỏ hàng đang trống, hãy chọn sản phẩm trước khi checkout.');
      return;
    }

    if (manualAddressActive && !validateManualAddress()) {
      setToast('Vui lòng nhập đầy đủ thông tin giao hàng.');
      return;
    }

    const payload = manualAddressActive
      ? buildAddressPayload(shippingForm, paymentMethod, shippingForm.note)
      : buildAddressPayload(selectedAddress, paymentMethod, shippingForm.note);

    if (isBuyNowMode) {
      payload.items = checkoutItems.map((item) => ({
        product_id: item.productId || item.product?.productId || item.product?.apiId,
        quantity: item.quantity,
        product_name: item.product?.name,
        product_price: item.product?.price || item.price,
        product_image: item.product?.image,
      }));
      payload.checkout_source = 'buy_now';
    }

    try {
      const result = await dispatch(checkoutOrder(payload)).unwrap();

      if (isBuyNowMode) {
        window.localStorage.removeItem(BUY_NOW_KEY);
        setBuyNowCheckout(null);
      } else {
        await dispatch(fetchCart());
      }

      if (result.paymentUrl && paymentMethod !== 'cod') {
        window.location.assign(result.paymentUrl);
        return;
      }

      const orderNumber = result.order?.orderNumber || 'mới';
      const paymentNote =
        result.paymentError && paymentMethod !== 'cod'
          ? ` Đơn thanh toán online chưa tạo được link: ${result.paymentError}.`
          : '';

      setToast(`Đơn hàng ${orderNumber} đã được ghi nhận.${paymentNote}`);
      window.setTimeout(() => navigate('/orders', { replace: true }), 900);
    } catch {
      // Redux state already carries the visible error.
    }
  }

  return (
    <main className="checkout-page">
      <ToastNotification message={toast} onClose={() => setToast('')} />
      <form className="container checkout-grid" onSubmit={handleOrderSubmit}>
        <div className="checkout-left">
          <h1 className="checkout-title">Thanh toán đơn hàng</h1>

          <section className="panel">
            <div className="panel-header">
              <h2>{isBuyNowMode ? 'Sản phẩm mua ngay' : 'Giỏ hàng của bạn'} ({checkoutItemCount})</h2>
              <ShoppingBasket size={25} />
            </div>
            {checkoutLoading && checkoutItems.length === 0 ? (
              <LoadingSpinner label="Đang tải giỏ hàng" />
            ) : checkoutItems.length > 0 ? (
              <div className="cart-lines">
                {checkoutItems.map((item) => (
                  isBuyNowMode ? (
                    <div className="cart-line compact buy-now-line" key={item.id}>
                      <div className="cart-line-image">
                        <img src={item.product.image} alt={item.product.name} />
                      </div>
                      <div className="cart-line-main">
                        <strong className="cart-line-title">{item.product.name}</strong>
                        <p>{item.product.eyebrow}</p>
                        <small>Số lượng: {item.quantity}</small>
                      </div>
                      <strong className="cart-line-price">{formatPrice(item.product.price * item.quantity)}</strong>
                    </div>
                  ) : (
                    <CartItem key={item.id} item={item} compact />
                  )
                ))}
              </div>
            ) : (
              <div className="empty-state inline">
                <h2>Giỏ hàng đang trống</h2>
                <p>Hãy thêm sản phẩm vào giỏ trước khi thanh toán.</p>
                <Link className="button secondary" to="/products">
                  Xem sản phẩm
                </Link>
              </div>
            )}
          </section>

          <section className="panel shipping-panel">
            <div className="section-title-row">
              <Truck size={25} />
              <h2>Thông tin giao hàng</h2>
            </div>

            {addressLoading ? (
              <LoadingSpinner label="Đang tải địa chỉ" />
            ) : addresses.length > 0 ? (
              <div className="checkout-address-list">
                {addresses.map((address) => (
                  <label
                    className={String(selectedAddressId) === String(address.id) && !useManualAddress ? 'checkout-address active' : 'checkout-address'}
                    key={address.id}
                  >
                    <input
                      type="radio"
                      name="saved_address"
                      checked={String(selectedAddressId) === String(address.id) && !useManualAddress}
                      onChange={() => {
                        setSelectedAddressId(address.id);
                        setUseManualAddress(false);
                      }}
                    />
                    <span>
                      <strong>{address.full_name}</strong>
                      <small>{address.phone}</small>
                      <em>{formatAddress(address)}</em>
                    </span>
                  </label>
                ))}
                <button className="button secondary checkout-manual-toggle" type="button" onClick={() => setUseManualAddress((value) => !value)}>
                  {manualAddressActive ? 'Dùng địa chỉ đã lưu' : 'Nhập địa chỉ mới'}
                </button>
              </div>
            ) : (
              <p className="field-note">Bạn chưa có địa chỉ đã lưu, hãy nhập địa chỉ giao hàng cho đơn này.</p>
            )}

            {manualAddressActive && (
              <div className="form-grid">
                <label>
                  <span>Họ và tên</span>
                  <input name="full_name" value={shippingForm.full_name} onChange={updateShippingField} required />
                </label>
                <label>
                  <span>Số điện thoại</span>
                  <input name="phone" value={shippingForm.phone} onChange={updateShippingField} required />
                </label>
                <label className="span-2">
                  <span>Địa chỉ nhận hàng</span>
                  <input
                    placeholder="Số nhà, tên đường"
                    name="address_line"
                    value={shippingForm.address_line}
                    onChange={updateShippingField}
                    required
                  />
                </label>
                <label>
                  <span>Phường/Xã</span>
                  <input name="ward" value={shippingForm.ward} onChange={updateShippingField} required />
                </label>
                <label>
                  <span>Quận/Huyện</span>
                  <input name="district" value={shippingForm.district} onChange={updateShippingField} required />
                </label>
                <label>
                  <span>Tỉnh/Thành phố</span>
                  <input name="city" value={shippingForm.city} onChange={updateShippingField} required />
                </label>
              </div>
            )}

            <div className="form-grid checkout-note-grid">
              <label className="span-2">
                <span>Ghi chú (Tùy chọn)</span>
                <input
                  placeholder="Ví dụ: Giao vào giờ hành chính"
                  name="note"
                  value={shippingForm.note}
                  onChange={updateShippingField}
                />
              </label>
            </div>

            {(addressError || cartError) && <p className="form-error">{addressError || cartError}</p>}
          </section>
        </div>

        <aside className="summary-card checkout-summary">
          <h2>Tóm tắt đơn hàng</h2>
          <div className="summary-lines">
            <div>
              <span>Tạm tính ({checkoutItemCount} sản phẩm)</span>
              <strong>{formatPrice(checkoutSubtotal)}</strong>
            </div>
            <div>
              <span>Phí vận chuyển</span>
              <strong className="accent">{checkoutShipping === 0 ? 'Miễn phí' : formatPrice(checkoutShipping)}</strong>
            </div>
          </div>

          <div className="summary-total">
            <span>Tổng cộng</span>
            <div>
              <strong>{formatPrice(checkoutTotal)}</strong>
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

          {orderError && <p className="form-error">{orderError}</p>}

          <button className="button primary full order-button" type="submit" disabled={orderLoading || checkoutItemCount === 0}>
            {orderLoading ? 'ĐANG ĐẶT HÀNG...' : 'ĐẶT HÀNG NGAY'} <LockKeyhole size={21} />
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
