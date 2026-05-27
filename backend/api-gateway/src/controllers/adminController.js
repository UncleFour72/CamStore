import { services } from '../config/services.js';
import { fetchAllPages, requestJson } from '../utils/http.js';

const ACTIVE_REVENUE_STATUSES = ['pending', 'confirmed', 'processing', 'shipping', 'delivered'];
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];

const toPositiveInt = (value, fallback = null) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDate = (value, fallback = null) => {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
};

const endOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

const getRangeFromQuery = (query = {}) => {
  if (query.month) {
    const [year, month] = String(query.month).split('-').map((part) => Number.parseInt(part, 10));

    if (Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12) {
      const target = new Date(year, month - 1, 1);
      return { from: startOfMonth(target), to: endOfMonth(target) };
    }
  }

  const now = new Date();

  return {
    from: parseDate(query.from, startOfMonth(now)),
    to: parseDate(query.to, endOfDay(now)),
  };
};

const isWithinRange = (value, range) => {
  const date = parseDate(value);

  if (!date) {
    return false;
  }

  return date >= range.from && date <= range.to;
};

const canCountAsRevenue = (order) => {
  return ACTIVE_REVENUE_STATUSES.includes(order.status);
};

const sumOrderRevenue = (orders) => {
  return orders
    .filter(canCountAsRevenue)
    .reduce((sum, order) => sum + toNumber(order.total_amount), 0);
};

const getOrders = async (req, query = {}) => {
  return fetchAllPages({
    baseUrl: services.order,
    path: '/api/orders',
    dataKey: 'orders',
    req,
    query,
  });
};

const getUsers = async (req, query = {}) => {
  return fetchAllPages({
    baseUrl: services.user,
    path: '/api/users',
    dataKey: 'users',
    req,
    query,
  });
};

const buildRevenueChart = (orders, days = 7) => {
  const today = startOfDay(new Date());
  const points = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);

    const range = {
      from: startOfDay(day),
      to: endOfDay(day),
    };
    const dayOrders = orders.filter((order) => isWithinRange(order.created_at, range));

    points.push({
      date: day.toISOString().slice(0, 10),
      revenue: sumOrderRevenue(dayOrders),
      orders_count: dayOrders.length,
    });
  }

  return points;
};

const buildWeeklyGrowth = (orders, weeks = 8) => {
  const today = startOfDay(new Date());
  const points = [];

  for (let index = weeks - 1; index >= 0; index -= 1) {
    const to = endOfDay(new Date(today));
    to.setDate(today.getDate() - index * 7);
    const from = startOfDay(new Date(to));
    from.setDate(to.getDate() - 6);

    const weekOrders = orders.filter((order) => isWithinRange(order.created_at, { from, to }));

    points.push({
      week_start: from.toISOString().slice(0, 10),
      week_end: to.toISOString().slice(0, 10),
      orders_count: weekOrders.length,
      revenue: sumOrderRevenue(weekOrders),
    });
  }

  return points;
};

const buildOrderAggregatesByUser = (orders) => {
  const map = new Map();

  for (const order of orders) {
    if (!order.user_id || order.status === 'cancelled') {
      continue;
    }

    const key = Number(order.user_id);
    const current =
      map.get(key) || {
        orders_count: 0,
        total_spent: 0,
        last_order_at: null,
      };

    current.orders_count += 1;
    current.total_spent += toNumber(order.total_amount);

    if (!current.last_order_at || new Date(order.created_at) > new Date(current.last_order_at)) {
      current.last_order_at = order.created_at;
    }

    map.set(key, current);
  }

  return map;
};

const resolveCustomerTier = (totalSpent) => {
  if (totalSpent >= 100000000) {
    return 'diamond';
  }

  if (totalSpent >= 50000000) {
    return 'gold';
  }

  if (totalSpent >= 10000000) {
    return 'silver';
  }

  return 'standard';
};

export const getServicesHealth = async (req, res) => {
  const entries = Object.entries(services);
  const results = await Promise.all(
    entries.map(async ([name, baseUrl]) => {
      try {
        const data = await requestJson({
          baseUrl,
          path: '/health',
          timeoutMs: 3000,
        });

        return {
          name,
          base_url: baseUrl,
          status: 'ok',
          detail: data,
        };
      } catch (error) {
        return {
          name,
          base_url: baseUrl,
          status: 'error',
          message: error.message,
        };
      }
    })
  );

  return res.json({
    gateway: 'ok',
    services: results,
  });
};

export const getDashboardSummary = async (req, res, next) => {
  try {
    const range = getRangeFromQuery(req.query);
    const [orders, users] = await Promise.all([getOrders(req), getUsers(req, { role: 'customer' })]);
    const ordersInRange = orders.filter((order) => isWithinRange(order.created_at, range));
    const usersInRange = users.filter((user) => isWithinRange(user.created_at, range));
    const visitors = toNumber(req.query.visitors, 0);
    const orderCount = ordersInRange.length;

    return res.json({
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      metrics: {
        monthly_revenue: sumOrderRevenue(ordersInRange),
        orders_count: orderCount,
        new_customers_count: usersInRange.length,
        conversion_rate: visitors > 0 ? Number(((orderCount / visitors) * 100).toFixed(2)) : null,
        visitors_count: visitors || null,
      },
      revenue_chart: buildRevenueChart(orders, toPositiveInt(req.query.days, 7)),
      recent_orders: orders.slice(0, toPositiveInt(req.query.recent_limit, 5)),
    });
  } catch (error) {
    return next(error);
  }
};

export const getRevenueStats = async (req, res, next) => {
  try {
    const range = getRangeFromQuery(req.query);
    const orders = await getOrders(req);
    const filtered = orders.filter((order) => isWithinRange(order.created_at, range));

    return res.json({
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      revenue: sumOrderRevenue(filtered),
      orders_count: filtered.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getOrderCountStats = async (req, res, next) => {
  try {
    const range = getRangeFromQuery(req.query);
    const orders = await getOrders(req, req.query.status ? { status: req.query.status } : {});
    const filtered = orders.filter((order) => isWithinRange(order.created_at, range));

    return res.json({
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      orders_count: filtered.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserCountStats = async (req, res, next) => {
  try {
    const range = getRangeFromQuery(req.query);
    const users = await getUsers(req, { role: req.query.role || 'customer' });
    const filtered = users.filter((user) => isWithinRange(user.created_at, range));

    return res.json({
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      users_count: filtered.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getConversionStats = async (req, res, next) => {
  try {
    const range = getRangeFromQuery(req.query);
    const visitors = toNumber(req.query.visitors, 0);
    const orders = await getOrders(req);
    const ordersCount = orders.filter((order) => isWithinRange(order.created_at, range)).length;

    return res.json({
      range: {
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      },
      visitors_count: visitors || null,
      orders_count: ordersCount,
      conversion_rate: visitors > 0 ? Number(((ordersCount / visitors) * 100).toFixed(2)) : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const getRevenueChartStats = async (req, res, next) => {
  try {
    const orders = await getOrders(req);
    const days = Math.min(toPositiveInt(req.query.days, 7), 90);

    return res.json({
      days,
      chart: buildRevenueChart(orders, days),
    });
  } catch (error) {
    return next(error);
  }
};

export const getOrderStatusStats = async (req, res, next) => {
  try {
    const orders = await getOrders(req);
    const byStatus = ORDER_STATUSES.reduce((result, status) => {
      result[status] = 0;
      return result;
    }, {});

    for (const order of orders) {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
    }

    return res.json({
      statuses: byStatus,
      total: orders.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const getOrderGrowthStats = async (req, res, next) => {
  try {
    const orders = await getOrders(req);
    const weeks = Math.min(toPositiveInt(req.query.weeks, 8), 52);

    return res.json({
      weeks,
      growth: buildWeeklyGrowth(orders, weeks),
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserOrderStats = async (req, res, next) => {
  try {
    const userId = toPositiveInt(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: 'userId must be a positive integer' });
    }

    const orders = await getOrders(req, { user_id: userId });
    const activeOrders = orders.filter((order) => order.status !== 'cancelled');

    return res.json({
      user_id: userId,
      orders_count: activeOrders.length,
      total_spent: sumOrderRevenue(activeOrders),
      average_order_value:
        activeOrders.length > 0
          ? Math.round(sumOrderRevenue(activeOrders) / activeOrders.length)
          : 0,
      last_order_at: activeOrders[0]?.created_at || null,
    });
  } catch (error) {
    return next(error);
  }
};

export const getRetentionStats = async (req, res, next) => {
  try {
    const orders = await getOrders(req);
    const aggregates = buildOrderAggregatesByUser(orders);
    const customersWithOrders = [...aggregates.values()];
    const repeatCustomers = customersWithOrders.filter((item) => item.orders_count > 1);
    const totalOrders = customersWithOrders.reduce((sum, item) => sum + item.orders_count, 0);
    const totalRevenue = customersWithOrders.reduce((sum, item) => sum + item.total_spent, 0);

    return res.json({
      customers_with_orders: customersWithOrders.length,
      repeat_customers: repeatCustomers.length,
      retention_rate:
        customersWithOrders.length > 0
          ? Number(((repeatCustomers.length / customersWithOrders.length) * 100).toFixed(2))
          : 0,
      average_order_value: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    });
  } catch (error) {
    return next(error);
  }
};

export const getCustomersAggregate = async (req, res, next) => {
  try {
    const userData = await requestJson({
      baseUrl: services.user,
      path: '/api/users',
      req,
      query: {
        ...req.query,
        role: req.query.role || 'customer',
      },
    });
    const [orders, allCustomers] = await Promise.all([
      getOrders(req),
      getUsers(req, { role: req.query.role || 'customer' }),
    ]);
    const aggregates = buildOrderAggregatesByUser(orders);
    const customers = (userData.users || []).map((user) => {
      const orderStats =
        aggregates.get(Number(user.id)) || {
          orders_count: 0,
          total_spent: 0,
          last_order_at: null,
        };

      return {
        ...user,
        orders_count: orderStats.orders_count,
        total_spent: orderStats.total_spent,
        last_order_at: orderStats.last_order_at,
        tier: resolveCustomerTier(orderStats.total_spent),
      };
    });
    const allOrderStats = [...aggregates.values()];
    const repeatCustomers = allOrderStats.filter((item) => item.orders_count > 1);
    const totalOrders = allOrderStats.reduce((sum, item) => sum + item.orders_count, 0);
    const totalSpent = allOrderStats.reduce((sum, item) => sum + item.total_spent, 0);

    return res.json({
      customers,
      pagination: userData.pagination,
      metrics: {
        total_customers: allCustomers.length,
        customers_with_orders: allOrderStats.length,
        repeat_customers: repeatCustomers.length,
        total_spent: totalSpent,
        average_order_value: totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0,
        retention_rate:
          allOrderStats.length > 0
            ? Number(((repeatCustomers.length / allOrderStats.length) * 100).toFixed(2))
            : 0,
      },
    });
  } catch (error) {
    return next(error);
  }
};
