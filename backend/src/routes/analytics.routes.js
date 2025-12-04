import express from 'express';
import {
  getAnalyticsSummary,
  getTweetPerformance,
  getGrowthMetrics,
  syncTwitterAnalytics,
  getAudienceInsights,
  getContentPerformance,
  getImportedAnalytics
} from '../controllers/analytics.controller.js';
import { protect, checkUsageLimit } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/summary', getAnalyticsSummary);
router.get('/tweets', getTweetPerformance);
router.get('/growth', getGrowthMetrics);
router.post('/sync', checkUsageLimit('analyticsChecked'), syncTwitterAnalytics);
router.get('/audience', getAudienceInsights);
router.get('/content-performance', getContentPerformance);

// Analytics from imported posts (Chrome extension data)
router.get('/imported', getImportedAnalytics);

export default router;
