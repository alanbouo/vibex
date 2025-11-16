import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import schedulerService from '../services/scheduler.service.js';
import Tweet from '../models/Tweet.model.js';

/**
 * @desc    Schedule a tweet
 * @route   POST /api/scheduler/schedule
 * @access  Private
 */
export const scheduleTweet = asyncHandler(async (req, res, next) => {
  const { content, scheduledFor, type, threadTweets, mediaUrls } = req.body;

  if (!content || !scheduledFor) {
    return next(new AppError('Content and scheduled time are required', 400));
  }

  const scheduledTime = new Date(scheduledFor);
  if (scheduledTime <= new Date()) {
    return next(new AppError('Scheduled time must be in the future', 400));
  }

  const tweet = await schedulerService.scheduleTweet({
    user: req.user.id,
    content,
    type: type || 'tweet',
    threadTweets,
    mediaUrls: mediaUrls || []
  }, scheduledTime);

  res.status(201).json({
    status: 'success',
    message: 'Tweet scheduled successfully',
    data: {
      tweet
    }
  });
});

/**
 * @desc    Get scheduled tweets
 * @route   GET /api/scheduler/scheduled
 * @access  Private
 */
export const getScheduledTweets = asyncHandler(async (req, res, next) => {
  const { limit = 50 } = req.query;

  const tweets = await schedulerService.getUserScheduledTweets(
    req.user.id,
    parseInt(limit)
  );

  res.status(200).json({
    status: 'success',
    data: {
      tweets,
      count: tweets.length
    }
  });
});

/**
 * @desc    Cancel scheduled tweet
 * @route   DELETE /api/scheduler/scheduled/:id
 * @access  Private
 */
export const cancelScheduledTweet = asyncHandler(async (req, res, next) => {
  const tweet = await Tweet.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!tweet) {
    return next(new AppError('Tweet not found', 404));
  }

  const updatedTweet = await schedulerService.cancelScheduledTweet(req.params.id);

  res.status(200).json({
    status: 'success',
    message: 'Scheduled tweet cancelled',
    data: {
      tweet: updatedTweet
    }
  });
});

/**
 * @desc    Reschedule a tweet
 * @route   PUT /api/scheduler/scheduled/:id
 * @access  Private
 */
export const rescheduleTweet = asyncHandler(async (req, res, next) => {
  const { scheduledFor } = req.body;

  if (!scheduledFor) {
    return next(new AppError('New scheduled time is required', 400));
  }

  const newTime = new Date(scheduledFor);
  if (newTime <= new Date()) {
    return next(new AppError('Scheduled time must be in the future', 400));
  }

  const tweet = await Tweet.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!tweet) {
    return next(new AppError('Tweet not found', 404));
  }

  const updatedTweet = await schedulerService.rescheduleTweet(req.params.id, newTime);

  res.status(200).json({
    status: 'success',
    message: 'Tweet rescheduled successfully',
    data: {
      tweet: updatedTweet
    }
  });
});

/**
 * @desc    Get optimal posting time
 * @route   GET /api/scheduler/optimal-time
 * @access  Private
 */
export const getOptimalTime = asyncHandler(async (req, res, next) => {
  const optimalTime = await schedulerService.getOptimalPostingTime(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      optimalTime,
      timezone: req.user.preferences.timezone
    }
  });
});

/**
 * @desc    Auto-repost top performing tweets
 * @route   POST /api/scheduler/auto-repost
 * @access  Private
 */
export const autoRepost = asyncHandler(async (req, res, next) => {
  const { threshold = 80 } = req.body;

  const reposts = await schedulerService.autoRepostTopTweets(
    req.user.id,
    threshold
  );

  res.status(200).json({
    status: 'success',
    message: `${reposts.length} tweets scheduled for reposting`,
    data: {
      reposts
    }
  });
});
