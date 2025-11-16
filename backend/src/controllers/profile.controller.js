import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import twitterService from '../services/twitter.service.js';

/**
 * @desc    Connect Twitter account (OAuth callback handled here)
 * @route   POST /api/profiles/connect-twitter
 * @access  Private
 */
export const connectTwitter = asyncHandler(async (req, res, next) => {
  const { accessToken, refreshToken, userId, username, expiresAt } = req.body;

  if (!accessToken || !userId || !username) {
    return next(new AppError('Missing required Twitter OAuth data', 400));
  }

  req.user.twitterAccount = {
    connected: true,
    userId,
    username,
    accessToken,
    refreshToken,
    expiresAt: expiresAt ? new Date(expiresAt) : null
  };

  await req.user.save();

  res.status(200).json({
    status: 'success',
    message: 'Twitter account connected successfully',
    data: {
      username,
      userId
    }
  });
});

/**
 * @desc    Disconnect Twitter account
 * @route   POST /api/profiles/disconnect-twitter
 * @access  Private
 */
export const disconnectTwitter = asyncHandler(async (req, res, next) => {
  req.user.twitterAccount = {
    connected: false,
    userId: null,
    username: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null
  };

  await req.user.save();

  res.status(200).json({
    status: 'success',
    message: 'Twitter account disconnected successfully'
  });
});

/**
 * @desc    Get Twitter profile insights
 * @route   GET /api/profiles/twitter-insights
 * @access  Private
 */
export const getTwitterInsights = asyncHandler(async (req, res, next) => {
  if (!req.user.twitterAccount.connected) {
    return next(new AppError('Twitter account not connected', 400));
  }

  const accessToken = req.user.twitterAccount.accessToken;
  const userId = req.user.twitterAccount.userId;

  const [profile, engagement, optimalTimes] = await Promise.all([
    twitterService.getUserProfile(accessToken, userId),
    twitterService.analyzeProfileEngagement(accessToken, userId),
    twitterService.getOptimalPostingTimes(accessToken, userId)
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      profile,
      engagement,
      optimalTimes
    }
  });
});

/**
 * @desc    Analyze external profile (Chrome extension feature)
 * @route   POST /api/profiles/analyze
 * @access  Private
 */
export const analyzeProfile = asyncHandler(async (req, res, next) => {
  const { username } = req.body;

  if (!username) {
    return next(new AppError('Username is required', 400));
  }

  // Use app-only authentication for public data
  const searchResults = await twitterService.searchTweets(
    `from:${username}`,
    { maxResults: 100 }
  );

  if (!searchResults.tweets || searchResults.tweets.length === 0) {
    return next(new AppError('Profile not found or no tweets available', 404));
  }

  // Calculate engagement metrics
  let totalLikes = 0;
  let totalRetweets = 0;
  let totalReplies = 0;

  searchResults.tweets.forEach(tweet => {
    const metrics = tweet.public_metrics;
    totalLikes += metrics.like_count || 0;
    totalRetweets += metrics.retweet_count || 0;
    totalReplies += metrics.reply_count || 0;
  });

  const count = searchResults.tweets.length;
  const avgEngagement = (totalLikes + totalRetweets + totalReplies) / count;

  // Find user data
  const userData = searchResults.users?.find(u => 
    u.username.toLowerCase() === username.toLowerCase()
  );

  res.status(200).json({
    status: 'success',
    data: {
      profile: userData,
      analytics: {
        avgLikes: Math.round(totalLikes / count),
        avgRetweets: Math.round(totalRetweets / count),
        avgReplies: Math.round(totalReplies / count),
        avgEngagement: Math.round(avgEngagement),
        totalTweetsAnalyzed: count
      },
      recentTweets: searchResults.tweets.slice(0, 10)
    }
  });
});
