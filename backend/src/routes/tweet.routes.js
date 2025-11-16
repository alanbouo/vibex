import express from 'express';
import {
  createTweet,
  getTweets,
  getTweet,
  updateTweet,
  deleteTweet,
  publishTweet,
  getTopPerformers
} from '../controllers/tweet.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/tweets:
 *   post:
 *     summary: Create a draft tweet
 *     tags: [Tweets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *               mediaUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tweet created successfully
 */
router.post('/', createTweet);
router.get('/', getTweets);
router.get('/top-performers', getTopPerformers);
router.get('/:id', getTweet);
router.put('/:id', updateTweet);
router.delete('/:id', deleteTweet);
router.post('/:id/publish', publishTweet);

export default router;
