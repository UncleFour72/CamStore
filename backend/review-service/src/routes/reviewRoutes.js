import { Router } from 'express';
import {
  createReview,
  deleteReview,
  getProductReviews,
  updateReview,
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/products/:productId/reviews', getProductReviews);
router.post('/reviews', authenticate, createReview);
router.put('/reviews/:id', authenticate, updateReview);
router.delete('/reviews/:id', authenticate, deleteReview);

export default router;
