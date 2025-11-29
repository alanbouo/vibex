import express from 'express';
import {
  connectTwitter,
  disconnectTwitter,
  getTwitterInsights,
  analyzeProfile,
  importLikes,
  importStyle,
  getStyleProfile,
  generateReplies,
  generateQuotes,
  generateStyledTweet
} from '../controllers/profile.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Twitter connection
router.post('/connect-twitter', connectTwitter);
router.post('/disconnect-twitter', disconnectTwitter);
router.get('/twitter-insights', getTwitterInsights);

// Style import & profile (uses 2 API calls once, then 0)
router.post('/import-style', importStyle);
router.get('/style', getStyleProfile);

// Content generation (0 API calls - uses stored style)
router.post('/generate-replies', generateReplies);
router.post('/generate-quotes', generateQuotes);
router.post('/generate-styled-tweet', generateStyledTweet);

// Legacy/disabled endpoints
router.post('/analyze', analyzeProfile);
router.post('/import-likes', importLikes);

export default router;
