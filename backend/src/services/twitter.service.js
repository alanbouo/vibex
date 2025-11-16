import { TwitterApi } from 'twitter-api-v2';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

class TwitterService {
  constructor() {
    this.client = null;
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
      logger.error('Twitter Get Profile Error:', error);
      throw new AppError('Failed to fetch profile', 500);
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
      logger.error('Twitter Get Tweets Error:', error);
      throw new AppError('Failed to fetch tweets', 500);
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
      const client = this.getUserClient(accessToken);
      
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
      logger.error('Profile Analysis Error:', error);
      throw new AppError('Failed to analyze profile', 500);
    }
  }
}

export default new TwitterService();
