import { TwitterApi } from 'twitter-api-v2';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

class TwitterService {
  constructor() {
    this.client = null;
  }

  /**
   * Handle Twitter API errors with proper rate limit detection
   */
  handleTwitterError(error, context) {
    const errorData = error?.data || {};
    const headers = error?.headers || {};
    const code = error?.code || error?.statusCode;

    // Log detailed error info
    logger.error(`Twitter ${context} Error:`, {
      code,
      data: errorData,
      headers: {
        'x-rate-limit-limit': headers['x-rate-limit-limit'],
        'x-rate-limit-remaining': headers['x-rate-limit-remaining'],
        'x-rate-limit-reset': headers['x-rate-limit-reset'],
        'x-user-limit-24hour-remaining': headers['x-user-limit-24hour-remaining'],
      },
      message: error.message,
      stack: error.stack,
    });

    // Check for rate limit errors (429)
    if (code === 429) {
      // Check for monthly usage cap
      if (errorData.detail?.includes('Usage cap exceeded') || errorData.title === 'UsageCapExceeded') {
        const resetDate = headers['x-rate-limit-reset'] 
          ? new Date(parseInt(headers['x-rate-limit-reset']) * 1000).toISOString()
          : 'unknown';
        throw new AppError(
          `Twitter API monthly limit reached. Your API plan's quota has been exhausted. Please upgrade your Twitter API tier or wait until next month.`,
          429
        );
      }

      // Check for 24-hour user limit
      const userDayRemaining = headers['x-user-limit-24hour-remaining'];
      if (userDayRemaining === '0' || userDayRemaining === 0) {
        const resetTimestamp = headers['x-user-limit-24hour-reset'];
        const resetDate = resetTimestamp 
          ? new Date(parseInt(resetTimestamp) * 1000).toLocaleString()
          : 'in 24 hours';
        throw new AppError(
          `Twitter API daily limit reached. The free tier allows only 1 request per day. Limit resets ${resetDate}.`,
          429
        );
      }

      // Generic rate limit
      throw new AppError(
        'Twitter API rate limit exceeded. Please try again later.',
        429
      );
    }

    // Re-throw original error for other cases
    throw new AppError(`Failed to ${context.toLowerCase()}`, 500);
  }

  /**
   * Initialize Twitter client for a user
   */
  getUserClient(accessToken) {
    return new TwitterApi(accessToken);
  }

  /**
   * Get app-only client (for public data)
   */
  getAppClient() {
    return new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
  }

  /**
   * Post a tweet
   */
  async postTweet(accessToken, content, options = {}) {
    try {
      const client = this.getUserClient(accessToken);
      
      const tweetData = {
        text: content,
      };

      if (options.mediaIds && options.mediaIds.length > 0) {
        tweetData.media = { media_ids: options.mediaIds };
      }

      if (options.replyTo) {
        tweetData.reply = { in_reply_to_tweet_id: options.replyTo };
      }

      const result = await client.v2.tweet(tweetData);
      
      return result.data;
    } catch (error) {
      logger.error('Twitter Post Error:', error);
      throw new AppError('Failed to post tweet', 500);
    }
  }

  /**
   * Post a thread
   */
  async postThread(accessToken, tweets) {
    try {
      const client = this.getUserClient(accessToken);
      const results = [];
      let replyToId = null;

      for (const tweet of tweets) {
        const tweetData = {
          text: tweet.content,
        };

        if (replyToId) {
          tweetData.reply = { in_reply_to_tweet_id: replyToId };
        }

        const result = await client.v2.tweet(tweetData);
        results.push(result.data);
        replyToId = result.data.id;
      }

      return results;
    } catch (error) {
      logger.error('Twitter Thread Error:', error);
      throw new AppError('Failed to post thread', 500);
    }
  }

  /**
   * Delete a tweet
   */
  async deleteTweet(accessToken, tweetId) {
    try {
      const client = this.getUserClient(accessToken);
      await client.v2.deleteTweet(tweetId);
      return true;
    } catch (error) {
      logger.error('Twitter Delete Error:', error);
      throw new AppError('Failed to delete tweet', 500);
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken, userId) {
    try {
      const client = this.getUserClient(accessToken);
      
      const user = await client.v2.user(userId, {
        'user.fields': ['created_at', 'description', 'location', 'profile_image_url', 'public_metrics', 'verified']
      });

      return user.data;
    } catch (error) {
      this.handleTwitterError(error, 'Get Profile');
    }
  }

  /**
   * Get user's tweets
   */
  async getUserTweets(accessToken, userId, options = {}) {
    try {
      const client = this.getUserClient(accessToken);
      
      const tweets = await client.v2.userTimeline(userId, {
        max_results: options.maxResults || 10,
        'tweet.fields': ['created_at', 'public_metrics', 'entities'],
        exclude: ['retweets', 'replies']
      });

      return tweets.data.data || [];
    } catch (error) {
      this.handleTwitterError(error, 'Get Tweets');
    }
  }

  /**
   * Get tweet analytics
   */
  async getTweetAnalytics(accessToken, tweetId) {
    try {
      const client = this.getUserClient(accessToken);
      
      const tweet = await client.v2.singleTweet(tweetId, {
        'tweet.fields': ['public_metrics', 'non_public_metrics', 'organic_metrics']
      });

      return tweet.data;
    } catch (error) {
      logger.error('Twitter Analytics Error:', error);
      // Return basic metrics if detailed analytics unavailable
      return null;
    }
  }

  /**
   * Search tweets by query
   */
  async searchTweets(query, options = {}) {
    try {
      const client = this.getAppClient();
      
      const tweets = await client.v2.search(query, {
        max_results: options.maxResults || 10,
        'tweet.fields': ['created_at', 'public_metrics', 'author_id'],
        'user.fields': ['username', 'name', 'profile_image_url'],
        expansions: ['author_id']
      });

      return {
        tweets: tweets.data.data || [],
        users: tweets.includes?.users || []
      };
    } catch (error) {
      logger.error('Twitter Search Error:', error);
      throw new AppError('Failed to search tweets', 500);
    }
  }

  /**
   * Get trending topics
   */
  async getTrendingTopics(woeid = 1) {
    try {
      // Note: Twitter API v2 doesn't have trends endpoint yet
      // This is a placeholder for future implementation
      logger.warn('Trending topics not yet available in Twitter API v2');
      return [];
    } catch (error) {
      logger.error('Twitter Trends Error:', error);
      return [];
    }
  }

  /**
   * Upload media
   */
  async uploadMedia(accessToken, mediaData, mediaType = 'image/png') {
    try {
      const client = this.getUserClient(accessToken);
      
      const mediaId = await client.v1.uploadMedia(mediaData, {
        mimeType: mediaType
      });

      return mediaId;
    } catch (error) {
      logger.error('Twitter Media Upload Error:', error);
      throw new AppError('Failed to upload media', 500);
    }
  }

  /**
   * Get user's liked tweets (for style analysis)
   * Uses 1 API read
   */
  async getUserLikes(accessToken, userId, options = {}) {
    try {
      const client = this.getUserClient(accessToken);
      
      const likes = await client.v2.userLikedTweets(userId, {
        max_results: options.maxResults || 50,
        'tweet.fields': ['created_at', 'public_metrics', 'entities', 'author_id'],
        'user.fields': ['username', 'name'],
        expansions: ['author_id']
      });

      const tweets = likes.data.data || [];
      const users = likes.includes?.users || [];

      // Map author info to tweets
      return tweets.map(tweet => {
        const author = users.find(u => u.id === tweet.author_id);
        return {
          id: tweet.id,
          content: tweet.text,
          author: author ? `@${author.username}` : 'unknown',
          authorName: author?.name || 'Unknown',
          metrics: tweet.public_metrics,
          createdAt: tweet.created_at
        };
      });
    } catch (error) {
      this.handleTwitterError(error, 'Get Likes');
    }
  }

  /**
   * Get optimal posting times based on audience activity
   */
  async getOptimalPostingTimes(accessToken, userId) {
    try {
      // This would analyze follower activity patterns
      // For MVP, return suggested times based on general best practices
      return [
        { hour: 9, score: 85, day: 'weekday' },
        { hour: 12, score: 90, day: 'weekday' },
        { hour: 15, score: 80, day: 'weekday' },
        { hour: 18, score: 95, day: 'weekday' },
        { hour: 21, score: 88, day: 'any' }
      ];
    } catch (error) {
      logger.error('Optimal Times Error:', error);
      return [];
    }
  }

  /**
   * Analyze profile engagement
   */
  async analyzeProfileEngagement(accessToken, userId) {
    try {
      // Get recent tweets
      const tweets = await this.getUserTweets(accessToken, userId, { maxResults: 100 });
      
      if (!tweets || tweets.length === 0) {
        return {
          avgLikes: 0,
          avgRetweets: 0,
          avgReplies: 0,
          avgEngagementRate: 0,
          totalTweets: 0
        };
      }

      let totalLikes = 0;
      let totalRetweets = 0;
      let totalReplies = 0;
      let totalImpressions = 0;

      tweets.forEach(tweet => {
        const metrics = tweet.public_metrics;
        totalLikes += metrics.like_count;
        totalRetweets += metrics.retweet_count;
        totalReplies += metrics.reply_count;
        // Estimate impressions (Twitter doesn't provide this in public metrics)
        totalImpressions += (metrics.like_count + metrics.retweet_count) * 10;
      });

      const count = tweets.length;
      const totalEngagements = totalLikes + totalRetweets + totalReplies;
      
      return {
        avgLikes: Math.round(totalLikes / count),
        avgRetweets: Math.round(totalRetweets / count),
        avgReplies: Math.round(totalReplies / count),
        avgEngagementRate: totalImpressions > 0 
          ? ((totalEngagements / totalImpressions) * 100).toFixed(2)
          : 0,
        totalTweets: count
      };
    } catch (error) {
      // Re-throw rate limit errors with proper message
      if (error instanceof AppError) {
        throw error;
      }
      this.handleTwitterError(error, 'Analyze Profile');
    }
  }
}

export default new TwitterService();
