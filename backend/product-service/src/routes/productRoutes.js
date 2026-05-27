import { Router } from 'express';
import {
  addToWishlist,
  createCategory,
  createProduct,
  deleteProduct,
  getCategories,
  getProductByIdOrSlug,
  getProducts,
  getWishlist,
  removeFromWishlist,
  updateCategory,
  updateProduct,
  updateRating,
  updateStock,
} from '../controllers/productController.js';
import {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
  requireInternalOrAdmin,
} from '../middleware/auth.js';
import { validatePositiveId, validateRequiredFields } from '../middleware/validation.js';

const router = Router();

router.get('/products', optionalAuthenticate, getProducts);
router.get('/products/:idOrSlug', optionalAuthenticate, getProductByIdOrSlug);
router.post(
  '/products',
  authenticate,
  requireAdmin,
  validateRequiredFields(['name', 'brand', 'sku', 'price', 'category_id']),
  createProduct
);
router.put('/products/:id', validatePositiveId('id'), authenticate, requireAdmin, updateProduct);
router.delete('/products/:id', validatePositiveId('id'), authenticate, requireAdmin, deleteProduct);
router.patch(
  '/products/:id/stock',
  validatePositiveId('id'),
  optionalAuthenticate,
  requireInternalOrAdmin,
  updateStock
);
router.patch(
  '/products/:id/rating',
  validatePositiveId('id'),
  optionalAuthenticate,
  requireInternalOrAdmin,
  updateRating
);

router.get('/categories', optionalAuthenticate, getCategories);
router.post(
  '/categories',
  authenticate,
  requireAdmin,
  validateRequiredFields(['name']),
  createCategory
);
router.put('/categories/:id', validatePositiveId('id'), authenticate, requireAdmin, updateCategory);

router.get('/wishlists', authenticate, getWishlist);
router.post('/wishlists', authenticate, addToWishlist);
router.delete('/wishlists/:productId', validatePositiveId('productId'), authenticate, removeFromWishlist);

export default router;
