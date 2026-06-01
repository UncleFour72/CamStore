import api, { unwrapData } from './api.js';

const STATUS_LABELS = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const PAYMENT_METHOD_LABELS = {
  cod: 'COD',
  vnpay: 'VNPay',
  momo: 'MoMo',
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  pos_card: 'Thẻ tại quầy',
};

const PAYMENT_STATUS_LABELS = {
  pending: 'Chờ thanh toán',
  processing: 'Đang chờ cổng thanh toán',
  completed: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
  refunded: 'Đã hoàn tiền',
};

const CANCEL_WINDOW_MINUTES = 60;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isWithinCancelWindow = (createdAt) => {
  const created = new Date(createdAt);

  if (Number.isNaN(created.getTime())) {
    return false;
  }

  return Date.now() - created.getTime() <= CANCEL_WINDOW_MINUTES * 60 * 1000;
};

export const normalizeOrder = (order) => {
  if (!order) {
    return null;
  }

  const payment = order.payment || null;
  const paymentMethod = payment?.payment_method || null;
  const paymentStatus = payment?.status || null;
  const isPaid = paymentStatus === 'completed';
  const paymentStatusLabel =
    paymentMethod === 'cod' && paymentStatus === 'pending'
      ? 'Thanh toán khi nhận hàng'
      : PAYMENT_STATUS_LABELS[paymentStatus] || 'Chưa có thông tin thanh toán';

  const items = (order.items || []).map((item) => ({
    ...item,
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    productImage: item.product_image,
    price: toNumber(item.product_price),
    quantity: toNumber(item.quantity, 1),
    subtotal: toNumber(item.subtotal),
  }));

  return {
    ...order,
    id: String(order.id),
    orderId: order.id,
    orderNumber: order.order_number,
    date: order.created_at ? new Intl.DateTimeFormat('vi-VN').format(new Date(order.created_at)) : '',
    statusLabel: STATUS_LABELS[order.status] || order.status,
    total: toNumber(order.total_amount),
    subtotal: toNumber(order.subtotal),
    shippingFee: toNumber(order.shipping_fee),
    shippingAddress: [
      order.shipping_address,
      order.shipping_ward,
      order.shipping_district,
      order.shipping_city,
    ].filter(Boolean).join(', '),
    customerName: order.shipping_name,
    phoneNumber: order.shipping_phone,
    items,
    payment: payment
      ? {
          id: payment.id,
          method: paymentMethod,
          methodLabel: PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod,
          status: paymentStatus,
          statusLabel: paymentStatusLabel,
          isPaid,
          transactionId: payment.transaction_id,
          paymentUrl: payment.payment_url,
          paidAt: payment.paid_at ? new Intl.DateTimeFormat('vi-VN').format(new Date(payment.paid_at)) : '',
        }
      : null,
    paymentMethod,
    paymentMethodLabel: PAYMENT_METHOD_LABELS[paymentMethod] || 'Chưa xác định',
    paymentStatus,
    paymentStatusLabel,
    paymentUrl: payment?.payment_url || null,
    isPaid,
    canPay: order.status === 'pending' && !['completed', 'refunded'].includes(paymentStatus),
    canCancel: order.status === 'pending' && isWithinCancelWindow(order.created_at),
  };
};

const normalizePagination = (pagination = {}, params = {}) => {
  const pageSize = pagination.limit || params.limit || params.pageSize || 10;

  return {
    page: pagination.page || Number(params.page) || 1,
    pageSize,
    total: pagination.total || 0,
    totalPages: pagination.total_pages || Math.ceil((pagination.total || 0) / pageSize) || 1,
  };
};

const extractPaymentUrl = (payload) => {
  return (
    payload?.payment_url ||
    payload?.paymentUrl ||
    payload?.payment?.payment_url ||
    payload?.payment?.paymentUrl ||
    null
  );
};

export const checkout = async (payload) => {
  const data = await api.post('/orders/checkout', payload).then(unwrapData);

  return {
    order: normalizeOrder(data.order),
    payment: data.payment,
    paymentError: data.payment_error,
    paymentUrl: extractPaymentUrl(data),
  };
};

export const getOrders = async (params = {}) => {
  const requestParams = { ...params };

  if (requestParams.pageSize && !requestParams.limit) {
    requestParams.limit = requestParams.pageSize;
  }

  delete requestParams.pageSize;

  const data = await api.get('/orders', { params: requestParams }).then(unwrapData);

  return {
    items: (data.orders || []).map(normalizeOrder).filter(Boolean),
    ...normalizePagination(data.pagination, params),
  };
};

export const getOrder = async (idOrNumber) => {
  const data = await api.get(`/orders/${idOrNumber}`).then(unwrapData);
  return normalizeOrder(data.order);
};

export const cancelOrder = async (id) => {
  const data = await api.patch(`/orders/${id}/cancel`).then(unwrapData);
  return normalizeOrder(data.order);
};

export const retryPayment = async (id, paymentMethod) => {
  const data = await api.post(`/orders/${id}/payment/retry`, {
    payment_method: paymentMethod,
  }).then(unwrapData);

  return {
    order: normalizeOrder(data.order),
    payment: data.payment,
    paymentUrl: extractPaymentUrl(data),
  };
};

export const updateOrderStatus = async (id, status, note) => {
  const data = await api.patch(`/orders/${id}/status`, { status, note }).then(unwrapData);
  return normalizeOrder(data.order);
};
