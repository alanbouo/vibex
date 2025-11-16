import express from 'express';
import {
  updateProfile,
  updatePreferences,
  getUsage,
  deleteAccount
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.put('/profile', updateProfile);
router.put('/preferences', updatePreferences);
router.get('/usage', getUsage);
router.delete('/account', deleteAccount);

export default router;
