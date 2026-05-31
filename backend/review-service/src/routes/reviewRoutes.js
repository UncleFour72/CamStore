import { Router } from 'express';
import {
  createReview,
  deleteReview,
  getMyReviews,
  getProductReviews,
  getReviewById,
  getReviewsAdmin,
  setReviewActive,
  updateReview,
} from '../controllers/reviewController.js';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/products/:productId/reviews', optionalAuthenticate, getProductReviews);
router.get('/reviews/product/:productId', optionalAuthenticate, getProductReviews);
router.get('/reviews/me', authenticate, getMyReviews);
router.get('/reviews/admin', authenticate, requireAdmin, getReviewsAdmin);
router.get('/reviews/:id', optionalAuthenticate, getReviewById);
router.post('/reviews', authenticate, createReview);
router.put('/reviews/:id', authenticate, updateReview);
router.delete('/reviews/:id', authenticate, deleteReview);
router.patch('/reviews/:id/status', authenticate, requireAdmin, setReviewActive);

export default router;
