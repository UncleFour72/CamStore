import { Router } from 'express';
import {
  addItemToCart,
  clearCart,
  clearCartForUser,
  getCart,
  getCartForUser,
  removeCartItem,
  updateCartItem,
} from '../controllers/cartController.js';
import { authenticate, requireInternal } from '../middleware/auth.js';

const router = Router();

router.get('/cart', authenticate, getCart);
router.post('/cart', authenticate, addItemToCart);
router.put('/cart/items/:itemId', authenticate, updateCartItem);
router.delete('/cart/items/:itemId', authenticate, removeCartItem);
router.delete('/cart', authenticate, clearCart);

router.get('/carts/user/:userId', requireInternal, getCartForUser);
router.delete('/carts/user/:userId', requireInternal, clearCartForUser);

export default router;
