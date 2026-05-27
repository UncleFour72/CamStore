import { Router } from 'express';
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostBySlug,
  getBlogPosts,
  subscribeNewsletter,
  updateBlogPost,
} from '../controllers/blogController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/blogs', getBlogPosts);
router.get('/blogs/:slug', getBlogPostBySlug);
router.post('/blogs', authenticate, requireAdmin, createBlogPost);
router.put('/blogs/:id', authenticate, requireAdmin, updateBlogPost);
router.delete('/blogs/:id', authenticate, requireAdmin, deleteBlogPost);
router.post('/newsletter/subscribe', subscribeNewsletter);

export default router;
