import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import Tweet from '../models/Tweet.model.js';
import logger from '../utils/logger.js';

/**
 * @desc    Create a draft tweet
 * @route   POST /api/tweets
 * @access  Private
 */
export const createTweet = asyncHandler(async (req, res, next) => {
  const { content, type, threadTweets, mediaUrls, aiGenerated, aiMetadata } = req.body;

  const tweet = await Tweet.create({
    user: req.user.id,
    content,
    type: type || 'tweet',
    threadTweets,
    mediaUrls: mediaUrls || [],
    aiGenerated: aiGenerated || false,
    aiMetadata,
    status: 'draft'
  });

  res.status(201).json({
    status: 'success',
    data: {
      tweet
    }
  });
});

/**
 * @desc    Get user's tweets
 * @route   GET /api/tweets
 * @access  Private
 */
export const getTweets = asyncHandler(async (req, res, next) => {
  const { status, limit = 20, page = 1 } = req.query;

  const query = { user: req.user.id };
  if (status) {
    query.status = status;
  }

  const tweets = await Tweet.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Tweet.countDocuments(query);

  res.status(200).json({
    status: 'success',
    data: {
      tweets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Get single tweet
 * @route   GET /api/tweets/:id
 * @access  Private
 */
export const getTweet = asyncHandler(async (req, res, next) => {
  const tweet = await Tweet.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!tweet) {
    return next(new AppError('Tweet not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tweet
    }
  });
});

/**
 * @desc    Update tweet
 * @route   PUT /api/tweets/:id
 * @access  Private
 */
export const updateTweet = asyncHandler(async (req, res, next) => {
  const tweet = await Tweet.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!tweet) {
    return next(new AppError('Tweet not found', 404));
  }

  if (tweet.status === 'published') {
    return next(new AppError('Cannot edit published tweet', 400));
  }

  const allowedUpdates = ['content', 'mediaUrls', 'type', 'threadTweets'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      tweet[field] = req.body[field];
    }
  });

  await tweet.save();

  res.status(200).json({
    status: 'success',
    data: {
      tweet
    }
  });
});

/**
 * @desc    Delete tweet
 * @route   DELETE /api/tweets/:id
 * @access  Private
 */
export const deleteTweet = asyncHandler(async (req, res, next) => {
  const tweet = await Tweet.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!tweet) {
    return next(new AppError('Tweet not found', 404));
  }

  await tweet.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Tweet deleted successfully'
  });
});

/**
 * @desc    Mark tweet as published (user manually posted to X)
 * @route   POST /api/tweets/:id/publish
 * @access  Private
 * @note    This just marks the tweet as published - user copies content to X manually
 */
export const publishTweet = asyncHandler(async (req, res, next) => {
  const tweet = await Tweet.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!tweet) {
    return next(new AppError('Tweet not found', 404));
  }

  tweet.status = 'published';
  tweet.publishedAt = new Date();
  await tweet.save();

  logger.info(`Tweet marked as published: ${tweet._id}`);

  res.status(200).json({
    status: 'success',
    message: 'Tweet marked as published',
    data: {
      tweet
    }
  });
});

/**
 * @desc    Get top performing tweets
 * @route   GET /api/tweets/top-performers
 * @access  Private
 */
export const getTopPerformers = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const topTweets = await Tweet.getTopPerformers(req.user.id, parseInt(limit));

  res.status(200).json({
    status: 'success',
    data: {
      tweets: topTweets
    }
  });
});
