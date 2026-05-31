import { Router } from 'express';
import {
  completeMockPayment,
  createPaymentRecord,
  createRefund,
  getPaymentById,
  getPaymentByOrderId,
  getPayments,
  handleMomoIpn,
  handleMomoReturn,
  handleVnpayIpn,
  handleVnpayReturn,
  retryPaymentRecord,
  updateRefundStatus,
} from '../controllers/paymentController.js';
import {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
  requireInternal,
  requireInternalOrAdmin,
} from '../middleware/auth.js';

const router = Router();

router.get('/payments/vnpay/ipn', handleVnpayIpn);
router.get('/payments/vnpay/return', handleVnpayReturn);
router.post('/payments/momo/ipn', handleMomoIpn);
router.get('/payments/momo/return', handleMomoReturn);
router.post('/payments/momo/return', handleMomoReturn);
router.post('/payments/mock/:id/complete', optionalAuthenticate, completeMockPayment);

router.post('/payments', requireInternal, createPaymentRecord);
router.get('/payments', authenticate, requireAdmin, getPayments);
router.get('/payments/order/:orderId', optionalAuthenticate, requireInternalOrAdmin, getPaymentByOrderId);
router.patch('/payments/order/:orderId/retry', requireInternal, retryPaymentRecord);
router.get('/payments/:id', optionalAuthenticate, requireInternalOrAdmin, getPaymentById);
router.post('/payments/:id/refunds', optionalAuthenticate, requireInternalOrAdmin, createRefund);
router.patch('/payments/:id/refunds/:refundId', authenticate, requireAdmin, updateRefundStatus);

export default router;
