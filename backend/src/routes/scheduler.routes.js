import express from 'express';
import {
  scheduleTweet,
  getScheduledTweets,
  cancelScheduledTweet,
  rescheduleTweet,
  getOptimalTime,
  autoRepost
} from '../controllers/scheduler.controller.js';
import { protect, checkUsageLimit } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/schedule', checkUsageLimit('tweetsScheduled'), scheduleTweet);
router.get('/scheduled', getScheduledTweets);
router.delete('/scheduled/:id', cancelScheduledTweet);
router.put('/scheduled/:id', rescheduleTweet);
router.get('/optimal-time', getOptimalTime);
router.post('/auto-repost', autoRepost);

export default router;
