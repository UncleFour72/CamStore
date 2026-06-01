import { Router } from 'express';
import {
  createPost,
  deletePost,
  getFeaturedPosts,
  getNewsletterSubscribers,
  getPostByIdOrSlug,
  getPosts,
  getPostsAdmin,
  setPostFeaturedState,
  setPostPublishState,
  setSubscriberActive,
  subscribeNewsletter,
  unsubscribeNewsletter,
  updatePost,
} from '../controllers/blogController.js';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/blogs/admin', authenticate, requireAdmin, getPostsAdmin);
router.get('/blogs/featured', getFeaturedPosts);
router.get('/blogs', optionalAuthenticate, getPosts);
router.get('/blogs/:idOrSlug', optionalAuthenticate, getPostByIdOrSlug);
router.post('/blogs', authenticate, requireAdmin, createPost);
router.put('/blogs/:id', authenticate, requireAdmin, updatePost);
router.delete('/blogs/:id', authenticate, requireAdmin, deletePost);
router.patch('/blogs/:id/publish', authenticate, requireAdmin, setPostPublishState);
router.patch('/blogs/:id/featured', authenticate, requireAdmin, setPostFeaturedState);

router.post('/newsletter/subscribe', subscribeNewsletter);
router.post('/newsletter/unsubscribe', unsubscribeNewsletter);
router.delete('/newsletter/unsubscribe', unsubscribeNewsletter);
router.get('/newsletter/subscribers', authenticate, requireAdmin, getNewsletterSubscribers);
router.patch('/newsletter/subscribers/:id/status', authenticate, requireAdmin, setSubscriberActive);

export default router;
