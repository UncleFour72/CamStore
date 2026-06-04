import api, { unwrapData } from './api.js';
import { normalizePost } from './blogService.js';
import { normalizeOrder } from './orderService.js';
import { normalizeCategory, normalizeProduct } from './productService.js';
import { normalizeReview } from './reviewService.js';
import { normalizeWarranty } from './warrantyService.js';

const normalizePagination = (pagination = {}, params = {}) => {
  const pageSize = pagination.limit || params.limit || params.pageSize || 20;

  return {
    page: pagination.page || Number(params.page) || 1,
    pageSize,
    total: pagination.total || 0,
    totalPages: pagination.total_pages || Math.ceil((pagination.total || 0) / pageSize) || 1,
  };
};

const mapPageSize = (params = {}) => {
  const requestParams = { ...params };

  if (requestParams.pageSize && !requestParams.limit) {
    requestParams.limit = requestParams.pageSize;
  }

  delete requestParams.pageSize;

  return requestParams;
};

export const getCategories = async (params = {}) => {
  const data = await api.get('/categories', { params: { include_inactive: true, ...params } }).then(unwrapData);
  return (data.categories || []).map(normalizeCategory).filter(Boolean);
};

export const createCategory = async (payload) => {
  const data = await api.post('/categories', payload).then(unwrapData);
  return normalizeCategory(data.category);
};

export const updateCategory = async (id, payload) => {
  const data = await api.put(`/categories/${id}`, payload).then(unwrapData);
  return normalizeCategory(data.category);
};

export const getProducts = async (params = {}) => {
  const requestParams = mapPageSize(params);
  requestParams.include_specs = true;

  if (requestParams.status !== 'active') {
    requestParams.include_inactive = true;
  }

  const data = await api.get('/products', { params: requestParams }).then(unwrapData);

  return {
    items: (data.products || []).map(normalizeProduct).filter(Boolean),
    ...normalizePagination(data.pagination, params),
  };
};

export const createProduct = async (payload) => {
  const data = await api.post('/products', payload).then(unwrapData);
  return normalizeProduct(data.product);
};

export const updateProduct = async (id, payload) => {
  const data = await api.put(`/products/${id}`, payload).then(unwrapData);
  return normalizeProduct(data.product);
};

export const deleteProduct = async (id) => {
  const data = await api.delete(`/products/${id}`).then(unwrapData);
  return normalizeProduct(data.product);
};

export const getOrders = async (params = {}) => {
  const requestParams = mapPageSize(params);

  const data = await api.get('/orders', { params: requestParams }).then(unwrapData);

  return {
    items: (data.orders || []).map(normalizeOrder).filter(Boolean),
    ...normalizePagination(data.pagination, params),
  };
};

export const updateOrderStatus = async (id, status, note) => {
  const data = await api.patch(`/orders/${id}/status`, { status, note }).then(unwrapData);
  return normalizeOrder(data.order);
};

const normalizeCustomer = (customer) => {
  const fullName =
    customer.full_name ||
    [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim() ||
    customer.email;

  return {
    ...customer,
    name: fullName,
    totalSpent: Number(customer.total_spent || 0),
    ordersCount: Number(customer.orders_count || 0),
    tier: customer.tier || 'member',
    registeredAt: customer.created_at
      ? new Intl.DateTimeFormat('vi-VN').format(new Date(customer.created_at))
      : '',
  };
};

export const getCustomers = async (params = {}) => {
  const requestParams = mapPageSize({ role: 'customer', ...params });

  const data = await api.get('/admin/customers', { params: requestParams }).then(unwrapData);

  return {
    customers: (data.customers || []).map(normalizeCustomer),
    metrics: data.metrics || {},
    ...normalizePagination(data.pagination, params),
  };
};

export const updateUserStatus = async (id, isActive) => {
  const data = await api.put(`/users/${id}/status`, { is_active: isActive }).then(unwrapData);
  return normalizeCustomer(data.user);
};

export const getDashboardSummary = async (params = {}) => {
  const data = await api.get('/admin/dashboard', { params }).then(unwrapData);

  return {
    ...data,
    recent_orders: (data.recent_orders || []).map(normalizeOrder).filter(Boolean),
  };
};

export const getOrderStatusStats = async () => {
  return api.get('/orders/stats/by-status').then(unwrapData);
};

export const getWarranties = async (params = {}) => {
  const requestParams = mapPageSize(params);
  const data = await api.get('/warranties', { params: requestParams }).then(unwrapData);

  return {
    items: (data.warranties || []).map(normalizeWarranty),
    ...normalizePagination(data.pagination, params),
  };
};

export const createWarranty = async (payload) => {
  const data = await api.post('/warranties', payload).then(unwrapData);
  return normalizeWarranty(data.warranty);
};

export const updateWarranty = async (id, payload) => {
  const data = await api.put(`/warranties/${id}`, payload).then(unwrapData);
  return normalizeWarranty(data.warranty);
};

export const getAdminBlogs = async (params = {}) => {
  const requestParams = mapPageSize(params);
  const data = await api.get('/blogs/admin', { params: requestParams }).then(unwrapData);

  return {
    items: (data.posts || []).map(normalizePost).filter(Boolean),
    ...normalizePagination(data.pagination, params),
  };
};

export const createBlog = async (payload) => {
  const data = await api.post('/blogs', payload).then(unwrapData);
  return normalizePost(data.post);
};

export const updateBlog = async (id, payload) => {
  const data = await api.put(`/blogs/${id}`, payload).then(unwrapData);
  return normalizePost(data.post);
};

export const deleteBlog = async (id) => {
  await api.delete(`/blogs/${id}`);
  return true;
};

export const toggleBlogPublish = async (id, isPublished) => {
  const data = await api.patch(`/blogs/${id}/publish`, { is_published: isPublished }).then(unwrapData);
  return normalizePost(data.post);
};

export const toggleBlogFeatured = async (id, isFeatured) => {
  const data = await api.patch(`/blogs/${id}/featured`, { is_featured: isFeatured }).then(unwrapData);
  return normalizePost(data.post);
};

export const getAdminReviews = async (params = {}) => {
  const requestParams = mapPageSize(params);
  const data = await api.get('/reviews/admin', { params: requestParams }).then(unwrapData);

  return {
    items: (data.reviews || []).map(normalizeReview).filter(Boolean),
    ...normalizePagination(data.pagination, params),
  };
};

export const setReviewActive = async (id, isActive) => {
  const data = await api.patch(`/reviews/${id}/status`, { is_active: isActive }).then(unwrapData);
  return normalizeReview(data.review);
};

const normalizePayment = (payment) => {
  if (!payment) {
    return null;
  }

  return {
    ...payment,
    id: payment.id,
    orderId: payment.order_id,
    userId: payment.user_id,
    transactionId: payment.transaction_id,
    method: payment.payment_method,
    amount: Number(payment.amount || 0),
    paidAt: payment.paid_at ? new Intl.DateTimeFormat('vi-VN').format(new Date(payment.paid_at)) : '',
    createdAt: payment.created_at ? new Intl.DateTimeFormat('vi-VN').format(new Date(payment.created_at)) : '',
    refunds: payment.refunds || [],
  };
};

export const getPayments = async (params = {}) => {
  const requestParams = mapPageSize(params);
  const data = await api.get('/payments', { params: requestParams }).then(unwrapData);

  return {
    items: (data.payments || []).map(normalizePayment).filter(Boolean),
    ...normalizePagination(data.pagination, params),
  };
};

export const createRefund = async (paymentId, payload) => {
  const data = await api.post(`/payments/${paymentId}/refunds`, payload).then(unwrapData);
  return data.refund;
};

export const confirmBankTransferPayment = async (paymentId, payload = {}) => {
  const data = await api.patch(`/payments/${paymentId}/confirm-bank-transfer`, payload).then(unwrapData);
  return normalizePayment(data.payment);
};

export const updateRefundStatus = async (paymentId, refundId, status) => {
  const data = await api.patch(`/payments/${paymentId}/refunds/${refundId}`, { status }).then(unwrapData);
  return data.refund;
};
