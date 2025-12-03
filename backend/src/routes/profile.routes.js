import express from 'express';
import {
  importExtensionData,
  getStyleProfile,
  generateReplies,
  generateQuotes,
  generateStyledTweet
} from '../controllers/profile.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Style profile (generated from extension data)
router.get('/style', getStyleProfile);

// Extension data import (0 API calls - uses scraped data from Chrome extension)
router.post('/import-extension-data', importExtensionData);

// Content generation (0 API calls - uses stored style)
router.post('/generate-replies', generateReplies);
router.post('/generate-quotes', generateQuotes);
router.post('/generate-styled-tweet', generateStyledTweet);

export default router;
