import { Router } from 'express';
import multer from 'multer';
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
import { uploadImage } from './controllers/uploadController.js';
import { services } from './config/services.js';
import { authenticate, requireAdmin } from './middleware/auth.js';
import { proxyRequest, requestJson } from './utils/http.js';

const router = Router();

const adminOnly = [authenticate, requireAdmin];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.UPLOAD_MAX_FILE_SIZE || 5 * 1024 * 1024),
  },
});

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
    matcher: (path) =>
      path.startsWith('/api/products') ||
      path.startsWith('/api/categories') ||
      path.startsWith('/api/wishlists'),
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
  {
    service: 'notification',
    matcher: (path) => path.startsWith('/api/notifications'),
  },
];

const resolveService = (path) => {
  const entry = routeMap.find((item) => item.matcher(path));
  return entry ? services[entry.service] : null;
};

const getFrontendBaseUrl = () => {
  const firstCorsOrigin = String(process.env.CORS_ORIGIN || '').split(',')[0]?.trim();
  return process.env.FRONTEND_URL || firstCorsOrigin || 'http://localhost:5173';
};

const redirectPaymentResult = (res, provider, data, originalQuery = {}) => {
  const redirectUrl = new URL('/payment/result', getFrontendBaseUrl());

  Object.entries(originalQuery).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      redirectUrl.searchParams.set(key, String(value));
    }
  });

  redirectUrl.searchParams.set('provider', provider);
  redirectUrl.searchParams.set('status', data?.is_success ? 'success' : data?.payment?.status || 'failed');

  if (data?.payment?.id) {
    redirectUrl.searchParams.set('payment_id', String(data.payment.id));
  }

  if (data?.payment?.order_id) {
    redirectUrl.searchParams.set('order_id', String(data.payment.order_id));
  }

  return res.redirect(302, redirectUrl.toString());
};

router.get('/api/health/services', getServicesHealth);
router.get('/api/gateway/routes', (req, res) => {
  res.json({
    gateway: 'camstore-api-gateway',
    routes: {
      user: ['/api/auth', '/api/users', '/api/addresses'],
      product: ['/api/products', '/api/categories', '/api/wishlists'],
      cart: ['/api/cart'],
      order: ['/api/orders', '/api/warranties'],
      payment: ['/api/payments'],
      review: ['/api/reviews', '/api/products/:productId/reviews'],
      blog: ['/api/blogs', '/api/newsletter'],
      notification: ['/api/notifications'],
      admin: ['/api/admin/dashboard', '/api/admin/customers', '/api/orders/stats/*', '/api/users/stats/*'],
    },
  });
});

router.get('/payment/vnpay-return', async (req, res, next) => {
  try {
    const data = await requestJson({
      baseUrl: services.payment,
      path: '/api/payments/vnpay/return',
      req,
      query: req.query,
    });

    return redirectPaymentResult(res, 'vnpay', data, req.query);
  } catch (error) {
    return next(error);
  }
});

router.get('/payment/momo-return', async (req, res, next) => {
  try {
    const data = await requestJson({
      baseUrl: services.payment,
      path: '/api/payments/momo/return',
      req,
      query: req.query,
    });

    return redirectPaymentResult(res, 'momo', data, req.query);
  } catch (error) {
    return next(error);
  }
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

router.post('/api/uploads/image', authenticate, upload.single('file'), uploadImage);

router.use('/api', async (req, res, next) => {
  const requestPath = req.originalUrl.split('?')[0];
  const baseUrl = resolveService(requestPath);

  if (!baseUrl) {
    return res.status(404).json({ message: 'Gateway route not found' });
  }

  return proxyRequest(req, res, next, baseUrl);
});

export default router;
