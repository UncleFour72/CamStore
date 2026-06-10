import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  getProfile,
  login,
  loginWithFacebook,
  loginWithGoogle,
  register,
  resetPassword,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', loginWithGoogle);
router.post('/facebook', loginWithFacebook);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
