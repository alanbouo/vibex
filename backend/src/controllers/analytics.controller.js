import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import Analytics from '../models/Analytics.model.js';
import Tweet from '../models/Tweet.model.js';
import twitterService from '../services/twitter.service.js';
import dayjs from 'dayjs';

/**
 * @desc    Get user analytics summary
 * @route   GET /api/analytics/summary
 * @access  Private
 */
export const getAnalyticsSummary = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, period = 'daily' } = req.query;

  const start = startDate ? new Date(startDate) : dayjs().subtract(30, 'day').toDate();
  const end = endDate ? new Date(endDate) : new Date();

  const analytics = await Analytics.find({
    user: req.user.id,
    date: { $gte: start, $lte: end },
    period
  }).sort({ date: -1 });

  // Calculate aggregated metrics
  const summary = await Analytics.getSummary(req.user.id, start, end);

  res.status(200).json({
    status: 'success',
    data: {
      analytics,
      summary: summary[0] || {}
    }
  });
});

/**
 * @desc    Get tweet performance
 * @route   GET /api/analytics/tweets
 * @access  Private
 */
export const getTweetPerformance = asyncHandler(async (req, res, next) => {
  const { limit = 20, sortBy = 'engagementRate' } = req.query;

  const sortField = `analytics.${sortBy}`;
  
  const tweets = await Tweet.find({
    user: req.user.id,
    status: 'published'
  })
  .sort({ [sortField]: -1 })
  .limit(parseInt(limit));

  res.status(200).json({
    status: 'success',
    data: {
      tweets
    }
  });
});

/**
 * @desc    Get growth metrics
 * @route   GET /api/analytics/growth
 * @access  Private
 */
export const getGrowthMetrics = asyncHandler(async (req, res, next) => {
  const { days = 30 } = req.query;

  const startDate = dayjs().subtract(parseInt(days), 'day').toDate();
  const endDate = new Date();

  const analytics = await Analytics.find({
    user: req.user.id,
    date: { $gte: startDate, $lte: endDate },
    period: 'daily'
  }).sort({ date: 1 });

  // Calculate growth trends
  const growthData = {
    followers: [],
    engagement: [],
    impressions: []
  };

  analytics.forEach(record => {
    growthData.followers.push({
      date: record.date,
      count: record.metrics.followers.count,
      change: record.metrics.followers.change
    });
    growthData.engagement.push({
      date: record.date,
      rate: record.metrics.engagement.rate,
      total: record.metrics.engagement.total
    });
    growthData.impressions.push({
      date: record.date,
      count: record.metrics.tweets.impressions
    });
  });

  res.status(200).json({
    status: 'success',
    data: {
      growthData,
      period: `${days} days`
    }
  });
});

/**
 * @desc    Sync Twitter analytics
 * @route   POST /api/analytics/sync
 * @access  Private
 */
export const syncTwitterAnalytics = asyncHandler(async (req, res, next) => {
  if (!req.user.twitterAccount.connected) {
    return next(new AppError('Twitter account not connected', 400));
  }

  const accessToken = req.user.twitterAccount.accessToken;
  const userId = req.user.twitterAccount.userId;

  // Fetch profile analytics
  const profile = await twitterService.getUserProfile(accessToken, userId);
  const engagement = await twitterService.analyzeProfileEngagement(accessToken, userId);

  // Fetch published tweets and update their analytics
  // Limit to most recent 10 tweets to avoid hitting rate limits
  const publishedTweets = await Tweet.find({
    user: req.user.id,
    status: 'published',
    twitterId: { $exists: true }
  })
  .sort({ publishedAt: -1 })
  .limit(10);

  for (const tweet of publishedTweets) {
    try {
      const twitterAnalytics = await twitterService.getTweetAnalytics(
        accessToken,
        tweet.twitterId
      );

      if (twitterAnalytics && twitterAnalytics.public_metrics) {
        tweet.analytics = {
          ...tweet.analytics,
          impressions: twitterAnalytics.public_metrics.impression_count || 0,
          likes: twitterAnalytics.public_metrics.like_count || 0,
          retweets: twitterAnalytics.public_metrics.retweet_count || 0,
          replies: twitterAnalytics.public_metrics.reply_count || 0,
          engagements: (twitterAnalytics.public_metrics.like_count || 0) +
                      (twitterAnalytics.public_metrics.retweet_count || 0) +
                      (twitterAnalytics.public_metrics.reply_count || 0),
          lastUpdated: new Date()
        };

        tweet.calculateEngagementRate();
        await tweet.save();
      }
    } catch (error) {
      // Skip if analytics unavailable for this tweet
      continue;
    }
  }

  // Increment usage
  await req.user.incrementUsage('analyticsChecked');

  res.status(200).json({
    status: 'success',
    message: 'Analytics synced successfully',
    data: {
      profile: {
        followers: profile.public_metrics.followers_count,
        following: profile.public_metrics.following_count,
        tweets: profile.public_metrics.tweet_count
      },
      engagement
    }
  });
});

/**
 * @desc    Get audience insights
 * @route   GET /api/analytics/audience
 * @access  Private
 */
export const getAudienceInsights = asyncHandler(async (req, res, next) => {
  const latestAnalytics = await Analytics.findOne({
    user: req.user.id
  }).sort({ date: -1 });

  if (!latestAnalytics) {
    return next(new AppError('No analytics data available', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      audience: latestAnalytics.metrics.audience
    }
  });
});

/**
 * @desc    Get best performing content types
 * @route   GET /api/analytics/content-performance
 * @access  Private
 */
export const getContentPerformance = asyncHandler(async (req, res, next) => {
  const tweets = await Tweet.find({
    user: req.user.id,
    status: 'published'
  });

  // Analyze by type
  const typePerformance = {};
  tweets.forEach(tweet => {
    if (!typePerformance[tweet.type]) {
      typePerformance[tweet.type] = {
        count: 0,
        totalEngagement: 0,
        avgEngagement: 0
      };
    }
    typePerformance[tweet.type].count++;
    typePerformance[tweet.type].totalEngagement += tweet.analytics.engagements;
  });

  // Calculate averages
  Object.keys(typePerformance).forEach(type => {
    typePerformance[type].avgEngagement = 
      typePerformance[type].totalEngagement / typePerformance[type].count;
  });

  // Analyze by hashtag
  const hashtagPerformance = {};
  tweets.forEach(tweet => {
    tweet.metadata.hashtags.forEach(tag => {
      if (!hashtagPerformance[tag]) {
        hashtagPerformance[tag] = {
          count: 0,
          totalEngagement: 0,
          avgEngagement: 0
        };
      }
      hashtagPerformance[tag].count++;
      hashtagPerformance[tag].totalEngagement += tweet.analytics.engagements;
    });
  });

  Object.keys(hashtagPerformance).forEach(tag => {
    hashtagPerformance[tag].avgEngagement = 
      hashtagPerformance[tag].totalEngagement / hashtagPerformance[tag].count;
  });

  // Sort by performance
  const topHashtags = Object.entries(hashtagPerformance)
    .sort((a, b) => b[1].avgEngagement - a[1].avgEngagement)
    .slice(0, 10)
    .map(([tag, data]) => ({ tag, ...data }));

  res.status(200).json({
    status: 'success',
    data: {
      byType: typePerformance,
      topHashtags
    }
  });
});
