import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({
  path: fileURLToPath(new URL('../../../../.env', import.meta.url)),
});
dotenv.config();

const normalizeBaseUrl = (url) => String(url || '').replace(/\/+$/, '');

export const services = {
  user: normalizeBaseUrl(process.env.USER_SERVICE_URL || 'http://localhost:3001'),
  product: normalizeBaseUrl(process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002'),
  cart: normalizeBaseUrl(process.env.CART_SERVICE_URL || 'http://localhost:3003'),
  order: normalizeBaseUrl(process.env.ORDER_SERVICE_URL || 'http://localhost:3004'),
  payment: normalizeBaseUrl(process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005'),
  review: normalizeBaseUrl(process.env.REVIEW_SERVICE_URL || 'http://localhost:3006'),
  blog: normalizeBaseUrl(process.env.BLOG_SERVICE_URL || 'http://localhost:3007'),
  notification: normalizeBaseUrl(process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3008'),
};

export const gatewayConfig = {
  requestTimeoutMs: Number(process.env.GATEWAY_REQUEST_TIMEOUT_MS || 15000),
  aggregatePageSize: Number(process.env.GATEWAY_AGGREGATE_PAGE_SIZE || 100),
  aggregateMaxPages: Number(process.env.GATEWAY_AGGREGATE_MAX_PAGES || 50),
};
