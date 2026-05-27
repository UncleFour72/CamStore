import { Router } from 'express';
import {
  createAddress,
  deleteAddress,
  getAddresses,
  getUserById,
  getUsers,
  setDefaultAddress,
  updateAddress,
  updateUserStatus,
} from '../controllers/userController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/users', authenticate, requireAdmin, getUsers);
router.get('/users/:id', authenticate, requireAdmin, getUserById);
router.put('/users/:id/status', authenticate, requireAdmin, updateUserStatus);

router.get('/addresses', authenticate, getAddresses);
router.post('/addresses', authenticate, createAddress);
router.put('/addresses/:id', authenticate, updateAddress);
router.delete('/addresses/:id', authenticate, deleteAddress);
router.put('/addresses/:id/default', authenticate, setDefaultAddress);

export default router;
