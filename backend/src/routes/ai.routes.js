import express from 'express';
import {
  generateTweet,
  generateVariations,
  rewriteTweet,
  generateThread,
  generateIdeas,
  analyzeSentiment,
  predictEngagement
} from '../controllers/ai.controller.js';
import { protect, checkUsageLimit } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/ai/generate-tweet:
 *   post:
 *     summary: Generate a tweet using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *               tone:
 *                 type: string
 *               creativity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Tweet generated successfully
 */
router.post('/generate-tweet', aiLimiter, checkUsageLimit('tweetsGenerated'), generateTweet);
router.post('/generate-variations', aiLimiter, generateVariations);
router.post('/rewrite-tweet', aiLimiter, rewriteTweet);
router.post('/generate-thread', aiLimiter, checkUsageLimit('tweetsGenerated'), generateThread);
router.post('/generate-ideas', aiLimiter, generateIdeas);
router.post('/analyze-sentiment', analyzeSentiment);
router.post('/predict-engagement', predictEngagement);

export default router;
