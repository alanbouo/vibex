import express from 'express';
import {
  connectTwitter,
  disconnectTwitter,
  getTwitterInsights,
  analyzeProfile
} from '../controllers/profile.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/connect-twitter', connectTwitter);
router.post('/disconnect-twitter', disconnectTwitter);
router.get('/twitter-insights', getTwitterInsights);
router.post('/analyze', analyzeProfile);

export default router;
