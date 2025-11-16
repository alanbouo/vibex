import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import Tweet from '../models/Tweet.model.js';
import twitterService from '../services/twitter.service.js';
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

  // If published on Twitter, delete from Twitter too
  if (tweet.status === 'published' && tweet.twitterId) {
    const user = req.user;
    if (user.twitterAccount.connected) {
      try {
        await twitterService.deleteTweet(user.twitterAccount.accessToken, tweet.twitterId);
      } catch (error) {
        logger.error('Error deleting tweet from Twitter:', error);
      }
    }
  }

  await tweet.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'Tweet deleted successfully'
  });
});

/**
 * @desc    Publish tweet immediately
 * @route   POST /api/tweets/:id/publish
 * @access  Private
 */
export const publishTweet = asyncHandler(async (req, res, next) => {
  const tweet = await Tweet.findOne({
    _id: req.params.id,
    user: req.user.id
  }).populate('user');

  if (!tweet) {
    return next(new AppError('Tweet not found', 404));
  }

  if (!req.user.twitterAccount.connected) {
    return next(new AppError('Twitter account not connected', 400));
  }

  const accessToken = req.user.twitterAccount.accessToken;

  let result;
  if (tweet.type === 'thread' && tweet.threadTweets.length > 0) {
    result = await twitterService.postThread(accessToken, tweet.threadTweets);
    tweet.twitterId = result[0].id;
  } else {
    result = await twitterService.postTweet(accessToken, tweet.content, {
      mediaIds: tweet.mediaUrls
    });
    tweet.twitterId = result.id;
  }

  tweet.status = 'published';
  tweet.publishedAt = new Date();
  await tweet.save();

  logger.info(`Tweet published: ${tweet._id}`);

  res.status(200).json({
    status: 'success',
    message: 'Tweet published successfully',
    data: {
      tweet,
      twitterData: result
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
