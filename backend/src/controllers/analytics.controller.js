import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import Analytics from '../models/Analytics.model.js';
import Tweet from '../models/Tweet.model.js';
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
 * @desc    Sync analytics (from local data only, no Twitter API)
 * @route   POST /api/analytics/sync
 * @access  Private
 * @note    Analytics are now based on local data only - no Twitter API
 */
export const syncTwitterAnalytics = asyncHandler(async (req, res, next) => {
  // Get published tweets from local database
  const publishedTweets = await Tweet.find({
    user: req.user.id,
    status: 'published'
  })
  .sort({ publishedAt: -1 })
  .limit(100);

  // Calculate local analytics
  const totalImpressions = publishedTweets.reduce((sum, tweet) => 
    sum + (tweet.analytics?.impressions || 0), 0
  );

  // Create or update Analytics document for today
  const today = dayjs().startOf('day').toDate();
  await Analytics.findOneAndUpdate(
    {
      user: req.user.id,
      date: today,
      period: 'daily'
    },
    {
      metrics: {
        followers: { count: 0, change: 0 },
        following: { count: 0, change: 0 },
        engagement: {
          rate: 0,
          total: publishedTweets.length,
          likes: 0,
          retweets: 0,
          replies: 0
        },
        tweets: {
          count: publishedTweets.length,
          impressions: totalImpressions,
          published: publishedTweets.length
        }
      }
    },
    { upsert: true, new: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Analytics synced from local data',
    data: {
      tweetsCount: publishedTweets.length,
      note: 'Twitter API analytics removed. Use Chrome extension for data collection.'
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

/**
 * @desc    Get analytics from imported posts (scraped via extension)
 * @route   GET /api/analytics/imported
 * @access  Private
 */
export const getImportedAnalytics = asyncHandler(async (req, res, next) => {
  const { months = 3 } = req.query;
  const monthsNum = parseInt(months) || 3;
  
  const allTweets = req.user.importedTweets || [];
  
  if (allTweets.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        hasData: false,
        message: 'No imported posts yet. Use the Chrome extension to import your tweets.'
      }
    });
  }

  // Filter by date range
  const startDate = dayjs().subtract(monthsNum, 'month').startOf('day');
  const importedTweets = allTweets.filter(tweet => {
    if (!tweet.createdAt) return false;
    return dayjs(tweet.createdAt).isAfter(startDate);
  });

  if (importedTweets.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        hasData: true,
        noDataInPeriod: true,
        message: `No posts found in the last ${monthsNum} month(s). Try selecting a longer period.`,
        totalAllTime: allTweets.length
      }
    });
  }

  // Aggregate metrics
  const totals = importedTweets.reduce((acc, tweet) => {
    const m = tweet.metrics || {};
    acc.impressions += m.impression_count || 0;
    acc.likes += m.like_count || 0;
    acc.retweets += m.retweet_count || 0;
    acc.replies += m.reply_count || 0;
    return acc;
  }, { impressions: 0, likes: 0, retweets: 0, replies: 0 });

  // Count post types
  const postTypes = importedTweets.reduce((acc, tweet) => {
    const type = tweet.type || 'original';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Find top performing posts
  const topPosts = [...importedTweets]
    .sort((a, b) => {
      const engA = (a.metrics?.like_count || 0) + (a.metrics?.retweet_count || 0) + (a.metrics?.reply_count || 0);
      const engB = (b.metrics?.like_count || 0) + (b.metrics?.retweet_count || 0) + (b.metrics?.reply_count || 0);
      return engB - engA;
    })
    .slice(0, 5)
    .map(t => ({
      content: t.content?.slice(0, 100) + (t.content?.length > 100 ? '...' : ''),
      url: t.url,
      metrics: t.metrics,
      createdAt: t.createdAt
    }));

  // Calculate engagement rate
  const totalEngagements = totals.likes + totals.retweets + totals.replies;
  const engagementRate = totals.impressions > 0 
    ? ((totalEngagements / totals.impressions) * 100).toFixed(2)
    : 0;

  // Weekly trend data
  const weeklyTrend = [];
  const weeksToShow = Math.min(monthsNum * 4, 12); // Max 12 weeks
  
  for (let i = weeksToShow - 1; i >= 0; i--) {
    const weekStart = dayjs().subtract(i, 'week').startOf('week');
    const weekEnd = dayjs().subtract(i, 'week').endOf('week');
    
    const weekPosts = importedTweets.filter(tweet => {
      if (!tweet.createdAt) return false;
      const tweetDate = dayjs(tweet.createdAt);
      return tweetDate.isAfter(weekStart) && tweetDate.isBefore(weekEnd);
    });

    const weekMetrics = weekPosts.reduce((acc, tweet) => {
      const m = tweet.metrics || {};
      acc.impressions += m.impression_count || 0;
      acc.likes += m.like_count || 0;
      acc.retweets += m.retweet_count || 0;
      acc.replies += m.reply_count || 0;
      return acc;
    }, { impressions: 0, likes: 0, retweets: 0, replies: 0 });

    const weekEngagements = weekMetrics.likes + weekMetrics.retweets + weekMetrics.replies;
    const weekEngRate = weekMetrics.impressions > 0 
      ? ((weekEngagements / weekMetrics.impressions) * 100).toFixed(2)
      : 0;

    weeklyTrend.push({
      weekLabel: weekStart.format('MMM D'),
      posts: weekPosts.length,
      impressions: weekMetrics.impressions,
      likes: weekMetrics.likes,
      retweets: weekMetrics.retweets,
      replies: weekMetrics.replies,
      engagementRate: parseFloat(weekEngRate)
    });
  }

  // Calculate averages
  const count = importedTweets.length;
  const averages = {
    impressionsPerPost: Math.round(totals.impressions / count),
    likesPerPost: (totals.likes / count).toFixed(1),
    retweetsPerPost: (totals.retweets / count).toFixed(1),
    repliesPerPost: (totals.replies / count).toFixed(1)
  };

  // Calculate trend change (compare first half to second half)
  const midpoint = Math.floor(weeklyTrend.length / 2);
  const firstHalf = weeklyTrend.slice(0, midpoint);
  const secondHalf = weeklyTrend.slice(midpoint);
  
  const avgFirst = firstHalf.reduce((sum, w) => sum + w.engagementRate, 0) / (firstHalf.length || 1);
  const avgSecond = secondHalf.reduce((sum, w) => sum + w.engagementRate, 0) / (secondHalf.length || 1);
  const trendChange = avgFirst > 0 ? (((avgSecond - avgFirst) / avgFirst) * 100).toFixed(0) : 0;

  res.status(200).json({
    status: 'success',
    data: {
      hasData: true,
      period: {
        months: monthsNum,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD')
      },
      summary: {
        totalPosts: count,
        totalImpressions: totals.impressions,
        totalLikes: totals.likes,
        totalRetweets: totals.retweets,
        totalReplies: totals.replies,
        engagementRate: `${engagementRate}%`,
        trendChange: parseInt(trendChange)
      },
      averages,
      postTypes,
      weeklyTrend,
      topPosts,
      lastImported: req.user.extensionDataImportedAt
    }
  });
});
