import api, { unwrapData } from './api.js';

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
