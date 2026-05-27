import { Router } from 'express';
import {
  cancelOrder,
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/orders', authenticate, getOrders);
router.get('/orders/:id', authenticate, getOrderById);
router.post('/orders', authenticate, createOrder);
router.put('/orders/:id/status', authenticate, requireAdmin, updateOrderStatus);
router.delete('/orders/:id', authenticate, cancelOrder);

export default router;
