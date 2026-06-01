import { Check, ChevronLeft, ChevronRight, PackageCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { cancelOrder, fetchOrders, retryOrderPayment } from '../store/slices/orderSlice.js';
import { formatPrice } from '../utils/helpers.js';

const statusFilters = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const pageSize = 8;
const fallbackOrderImage =
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80';

const paymentMethodOptions = [
  { value: 'vnpay', label: 'VNPay / Ngân hàng' },
  { value: 'momo', label: 'Ví MoMo' },
  { value: 'cod', label: 'COD' },
];

export default function OrderHistoryPage() {
  const dispatch = useDispatch();
  const { orders, isLoading, error, pagination } = useSelector((state) => state.order);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [paymentMenuId, setPaymentMenuId] = useState('');
  const [paymentActionId, setPaymentActionId] = useState('');
  const totalPages = Math.max(1, pagination.totalPages || 1);
  const pageButtons = useMemo(() => {
    const visible = Math.min(totalPages, 5);
    const start = Math.max(1, Math.min(page - 2, totalPages - visible + 1));

    return Array.from({ length: visible }, (_, index) => start + index);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    dispatch(fetchOrders({ page, limit: pageSize, status }));
  }, [dispatch, page, status]);

  async function handleCancel(orderId) {
    if (!window.confirm('Hủy đơn hàng đang chờ xác nhận này?')) {
      return;
    }

    try {
      await dispatch(cancelOrder(orderId)).unwrap();
      await dispatch(fetchOrders({ page, limit: pageSize, status })).unwrap();
    } catch {
      // Redux state already carries the visible error.
    }
  }

  const getPaymentDraft = (order) => paymentDrafts[order.id] || order.paymentMethod || 'vnpay';
  const canManagePayment = (order) => order.canPay || (order.status === 'pending' && !order.isPaid);

  function updatePaymentDraft(order, paymentMethod) {
    setPaymentDrafts((current) => ({
      ...current,
      [order.id]: paymentMethod,
    }));
  }

  async function handlePayment(order, mode, nextPaymentMethod = null) {
    const paymentMethod = nextPaymentMethod || getPaymentDraft(order);
    const actionId = `${mode}-${order.id}`;
    setPaymentActionId(actionId);

    try {
      updatePaymentDraft(order, paymentMethod);
      const result = await dispatch(retryOrderPayment({
        id: order.orderId,
        paymentMethod,
      })).unwrap();

      if (mode === 'pay' && result.paymentUrl && paymentMethod !== 'cod') {
        window.location.assign(result.paymentUrl);
        return;
      }

      await dispatch(fetchOrders({ page, limit: pageSize, status })).unwrap();
    } catch {
      // Redux state already carries the visible error.
    } finally {
      setPaymentActionId('');
      setPaymentMenuId('');
    }
  }

  return (
    <main className="page">
      <section className="container">
        <div className="page-heading">
          <span className="eyebrow">Order tracking</span>
          <h1>Lịch sử đơn hàng</h1>
          <p>Theo dõi trạng thái giao hàng và các sản phẩm đã mua tại CamStore.</p>
        </div>

        <div className="filter-tabs order-history-tabs">
          {statusFilters.map((item) => (
            <button
              key={item.value}
              className={status === item.value ? 'active' : ''}
              type="button"
              onClick={() => setStatus(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {isLoading && orders.length === 0 ? (
          <LoadingSpinner label="Đang tải đơn hàng" />
        ) : error ? (
          <div className="empty-state">
            <h2>Không thể tải đơn hàng</h2>
            <p>{error}</p>
          </div>
        ) : orders.length > 0 ? (
          <>
            <div className="order-list">
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  <div className="order-card-head">
                    <div className="order-card-title">
                      <PackageCheck size={28} />
                      <div>
                        <h2>{order.orderNumber}</h2>
                        <p>{order.date}</p>
                      </div>
                    </div>
                    <div className="order-card-badges">
                      <span className="status-pill">{order.statusLabel}</span>
                      <span className={order.isPaid ? 'payment-pill paid' : 'payment-pill'}>
                        {order.paymentMethodLabel}: {order.paymentStatusLabel}
                      </span>
                    </div>
                  </div>

                  <div className="order-item-list">
                    {order.items.map((item) => (
                      <div className="order-item-row" key={item.id}>
                        <img src={item.productImage || fallbackOrderImage} alt={item.productName} />
                        <div>
                          <strong>{item.productName}</strong>
                          <span>
                            {formatPrice(item.price)} x {item.quantity}
                          </span>
                        </div>
                        <b>{formatPrice(item.subtotal)}</b>
                      </div>
                    ))}
                  </div>

                  <div className="order-card-footer">
                    <div>
                      <span>Tổng thanh toán</span>
                      <strong>{formatPrice(order.total)}</strong>
                    </div>
                    <div className="order-card-status">
                      {canManagePayment(order) && (
                        <div className="order-payment-actions">
                          <div className="order-payment-picker">
                            <button
                              className="button order-action-button payment-change-trigger"
                              type="button"
                              disabled={isLoading || Boolean(paymentActionId)}
                              onClick={() => setPaymentMenuId((current) => (current === order.id ? '' : order.id))}
                            >
                              Đổi phương thức thanh toán
                            </button>
                            {paymentMenuId === order.id && (
                              <div className="order-payment-menu">
                                {paymentMethodOptions.map((method) => {
                                  const active = getPaymentDraft(order) === method.value;

                                  return (
                                    <button
                                      key={method.value}
                                      type="button"
                                      className={active ? 'active' : ''}
                                      disabled={isLoading || Boolean(paymentActionId)}
                                      onClick={() => handlePayment(order, 'change', method.value)}
                                    >
                                      <span>{method.label}</span>
                                      {active && <Check size={16} />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <button
                            className="button primary order-action-button payment-pay-button"
                            type="button"
                            disabled={isLoading || Boolean(paymentActionId)}
                            onClick={() => handlePayment(order, 'pay')}
                          >
                            {paymentActionId === `pay-${order.id}` ? 'Đang mở...' : 'Thanh toán'}
                          </button>
                        </div>
                      )}
                      {order.canCancel && (
                        <button
                          className="button order-action-button payment-cancel-button"
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleCancel(order.orderId)}
                        >
                          Hủy bỏ
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {pagination.total > pageSize && (
              <div className="store-pagination">
                <button
                  type="button"
                  aria-label="Trang trước"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft size={20} />
                </button>
                {pageButtons.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === page ? 'active' : ''}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Trang sau"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h2>Chưa có đơn hàng nào</h2>
            <p>Các đơn hàng sau khi checkout sẽ xuất hiện tại đây.</p>
          </div>
        )}
      </section>
    </main>
  );
}
