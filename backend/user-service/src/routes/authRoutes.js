import { Router } from 'express';
import {
  changePassword,
  getProfile,
  login,
  loginWithFacebook,
  loginWithGoogle,
  register,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', loginWithGoogle);
router.post('/facebook', loginWithFacebook);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
