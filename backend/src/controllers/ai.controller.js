import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import aiService from '../services/ai.service.js';
import logger from '../utils/logger.js';

/**
 * @desc    Generate tweet using AI
 * @route   POST /api/ai/generate-tweet
 * @access  Private
 */
export const generateTweet = asyncHandler(async (req, res, next) => {
  const { prompt, tone, creativity, context } = req.body;

  if (!prompt) {
    return next(new AppError('Prompt is required', 400));
  }

  // Check usage limits
  if (!req.user.canGenerateTweet()) {
    return next(new AppError('You have reached your tweet generation limit', 403));
  }

  const userPreferences = req.user.preferences.aiSettings;

  const result = await aiService.generateTweet({
    prompt,
    tone: tone || userPreferences.tone,
    creativity: creativity !== undefined ? creativity : userPreferences.creativity,
    model: userPreferences.model,
    context
  });

  // Increment usage
  await req.user.incrementUsage('tweetsGenerated');

  logger.info(`AI tweet generated for user: ${req.user.email}`);

  res.status(200).json({
    status: 'success',
    data: {
      tweet: result.content,
      metadata: result.metadata
    }
  });
});

/**
 * @desc    Generate tweet variations
 * @route   POST /api/ai/generate-variations
 * @access  Private
 */
export const generateVariations = asyncHandler(async (req, res, next) => {
  const { tweet, count, tone } = req.body;

  if (!tweet) {
    return next(new AppError('Tweet content is required', 400));
  }

  const variations = await aiService.generateVariations(
    tweet,
    count || 3,
    tone || req.user.preferences.aiSettings.tone
  );

  res.status(200).json({
    status: 'success',
    data: {
      variations
    }
  });
});

/**
 * @desc    Rewrite tweet with different tone
 * @route   POST /api/ai/rewrite-tweet
 * @access  Private
 */
export const rewriteTweet = asyncHandler(async (req, res, next) => {
  const { tweet, targetTone } = req.body;

  if (!tweet || !targetTone) {
    return next(new AppError('Tweet and target tone are required', 400));
  }

  const rewritten = await aiService.rewriteTweet(tweet, targetTone);

  res.status(200).json({
    status: 'success',
    data: {
      rewritten
    }
  });
});

/**
 * @desc    Generate thread
 * @route   POST /api/ai/generate-thread
 * @access  Private
 */
export const generateThread = asyncHandler(async (req, res, next) => {
  const { topic, threadLength, tone } = req.body;

  if (!topic) {
    return next(new AppError('Topic is required', 400));
  }

  const thread = await aiService.generateThread(
    topic,
    threadLength || 5,
    tone || req.user.preferences.aiSettings.tone
  );

  res.status(200).json({
    status: 'success',
    data: {
      thread
    }
  });
});

/**
 * @desc    Generate content ideas
 * @route   POST /api/ai/generate-ideas
 * @access  Private
 */
export const generateIdeas = asyncHandler(async (req, res, next) => {
  const { niche, count } = req.body;

  if (!niche) {
    return next(new AppError('Niche is required', 400));
  }

  const ideas = await aiService.generateIdeas(niche, count || 10);

  res.status(200).json({
    status: 'success',
    data: {
      ideas
    }
  });
});

/**
 * @desc    Analyze sentiment
 * @route   POST /api/ai/analyze-sentiment
 * @access  Private
 */
export const analyzeSentiment = asyncHandler(async (req, res, next) => {
  const { text } = req.body;

  if (!text) {
    return next(new AppError('Text is required', 400));
  }

  const sentiment = await aiService.analyzeSentiment(text);

  res.status(200).json({
    status: 'success',
    data: {
      sentiment
    }
  });
});

/**
 * @desc    Predict engagement
 * @route   POST /api/ai/predict-engagement
 * @access  Private
 */
export const predictEngagement = asyncHandler(async (req, res, next) => {
  const { tweet } = req.body;

  if (!tweet) {
    return next(new AppError('Tweet content is required', 400));
  }

  const score = await aiService.predictEngagement(tweet);

  res.status(200).json({
    status: 'success',
    data: {
      score,
      rating: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'
    }
  });
});
