import { Router } from 'express';
import {
  cancelOrder,
  checkout,
  createWarranty,
  getOrderById,
  getOrders,
  getWarranties,
  getWarrantyById,
  lookupWarranties,
  retryOrderPayment,
  updateOrderStatus,
  updateWarranty,
} from '../controllers/orderController.js';
import {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
  requireInternalOrAdmin,
} from '../middleware/auth.js';

const router = Router();

router.post('/orders/checkout', authenticate, checkout);
router.get('/orders', authenticate, getOrders);
router.patch('/orders/:id/cancel', authenticate, cancelOrder);
router.post('/orders/:id/payment/retry', authenticate, retryOrderPayment);
router.get('/orders/:idOrNumber', authenticate, getOrderById);
router.patch('/orders/:id/status', optionalAuthenticate, requireInternalOrAdmin, updateOrderStatus);

router.get('/warranties/lookup', lookupWarranties);
router.get('/warranties', authenticate, requireAdmin, getWarranties);
router.get('/warranties/:id', authenticate, getWarrantyById);
router.post('/warranties', authenticate, requireAdmin, createWarranty);
router.put('/warranties/:id', authenticate, requireAdmin, updateWarranty);

export default router;
