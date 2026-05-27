import { Router } from 'express';
import {
  getConversionStats,
  getCustomersAggregate,
  getDashboardSummary,
  getOrderCountStats,
  getOrderGrowthStats,
  getOrderStatusStats,
  getRetentionStats,
  getRevenueChartStats,
  getRevenueStats,
  getServicesHealth,
  getUserCountStats,
  getUserOrderStats,
} from './controllers/adminController.js';
import { services } from './config/services.js';
import { authenticate, requireAdmin } from './middleware/auth.js';
import { proxyRequest } from './utils/http.js';

const router = Router();

const adminOnly = [authenticate, requireAdmin];

const routeMap = [
  {
    service: 'review',
    matcher: (path) => /^\/api\/products\/[^/]+\/reviews(?:\/|$)/.test(path) || path.startsWith('/api/reviews'),
  },
  {
    service: 'user',
    matcher: (path) =>
      path.startsWith('/api/auth') || path.startsWith('/api/users') || path.startsWith('/api/addresses'),
  },
  {
    service: 'product',
    matcher: (path) => path.startsWith('/api/products') || path.startsWith('/api/categories'),
  },
  {
    service: 'cart',
    matcher: (path) => path.startsWith('/api/cart'),
  },
  {
    service: 'order',
    matcher: (path) => path.startsWith('/api/orders') || path.startsWith('/api/warranties'),
  },
  {
    service: 'payment',
    matcher: (path) => path.startsWith('/api/payments'),
  },
  {
    service: 'blog',
    matcher: (path) => path.startsWith('/api/blogs') || path.startsWith('/api/newsletter'),
  },
];

const resolveService = (path) => {
  const entry = routeMap.find((item) => item.matcher(path));
  return entry ? services[entry.service] : null;
};

router.get('/api/health/services', getServicesHealth);
router.get('/api/gateway/routes', (req, res) => {
  res.json({
    gateway: 'camstore-api-gateway',
    routes: {
      user: ['/api/auth', '/api/users', '/api/addresses'],
      product: ['/api/products', '/api/categories'],
      cart: ['/api/cart'],
      order: ['/api/orders', '/api/warranties'],
      payment: ['/api/payments'],
      review: ['/api/reviews', '/api/products/:productId/reviews'],
      blog: ['/api/blogs', '/api/newsletter'],
      admin: ['/api/admin/dashboard', '/api/admin/customers', '/api/orders/stats/*', '/api/users/stats/*'],
    },
  });
});

router.get('/api/admin/dashboard', ...adminOnly, getDashboardSummary);
router.get('/api/admin/customers', ...adminOnly, getCustomersAggregate);

router.get('/api/orders/stats/revenue', ...adminOnly, getRevenueStats);
router.get('/api/orders/stats/count', ...adminOnly, getOrderCountStats);
router.get('/api/orders/stats/conversion', ...adminOnly, getConversionStats);
router.get('/api/orders/stats/chart', ...adminOnly, getRevenueChartStats);
router.get('/api/orders/stats/by-status', ...adminOnly, getOrderStatusStats);
router.get('/api/orders/stats/growth', ...adminOnly, getOrderGrowthStats);
router.get('/api/orders/stats/user/:userId', ...adminOnly, getUserOrderStats);
router.get('/api/orders/stats/retention', ...adminOnly, getRetentionStats);
router.get('/api/users/stats/count', ...adminOnly, getUserCountStats);

router.use('/api', async (req, res, next) => {
  const requestPath = req.originalUrl.split('?')[0];
  const baseUrl = resolveService(requestPath);

  if (!baseUrl) {
    return res.status(404).json({ message: 'Gateway route not found' });
  }

  return proxyRequest(req, res, next, baseUrl);
});

export default router;
