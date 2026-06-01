import api, { unwrapData } from './api.js';
import { normalizeOrder } from './orderService.js';
import { normalizeCategory, normalizeProduct } from './productService.js';

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

export const getOrderStatusStats = async () => {
  return api.get('/orders/stats/by-status').then(unwrapData);
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

const buildUserMetrics = (customers = []) => {
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((customer) => customer.is_active).length;

  return {
    total_customers: totalCustomers,
    active_customers: activeCustomers,
    inactive_customers: totalCustomers - activeCustomers,
  };
};

export const getCustomers = async (params = {}) => {
  const requestParams = mapPageSize({ role: 'customer', ...params });
  const data = await api.get('/users', { params: requestParams }).then(unwrapData);
  const customers = (data.users || []).map(normalizeCustomer);

  return {
    customers,
    metrics: buildUserMetrics(customers),
    ...normalizePagination(data.pagination, params),
  };
};

export const updateUserStatus = async (id, isActive) => {
  const data = await api.put(`/users/${id}/status`, { is_active: isActive }).then(unwrapData);
  return normalizeCustomer(data.user);
};
