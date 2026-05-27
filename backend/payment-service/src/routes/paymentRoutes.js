import { Router } from 'express';
import {
  createPayment,
  getPaymentById,
  momoCallback,
  vnpayCallback,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/payments', authenticate, createPayment);
router.get('/payments/:id', authenticate, getPaymentById);
router.get('/payments/vnpay/callback', vnpayCallback);
router.post('/payments/momo/callback', momoCallback);

export default router;
