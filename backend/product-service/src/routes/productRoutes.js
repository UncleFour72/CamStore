import { Router } from 'express';
import {
  createCategory,
  createProduct,
  deleteProduct,
  getCategories,
  getProductByIdOrSlug,
  getProducts,
  updateProduct,
} from '../controllers/productController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/products', getProducts);
router.get('/products/:idOrSlug', getProductByIdOrSlug);
router.get('/categories', getCategories);

// Admin routes
router.post('/products', authenticate, requireAdmin, createProduct);
router.put('/products/:id', authenticate, requireAdmin, updateProduct);
router.delete('/products/:id', authenticate, requireAdmin, deleteProduct);
router.post('/categories', authenticate, requireAdmin, createCategory);

export default router;
