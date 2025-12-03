import cron from 'node-cron';
import Tweet from '../models/Tweet.model.js';
import logger from '../utils/logger.js';

class SchedulerService {
  constructor() {
    this.jobs = new Map();
    this.initCronJobs();
  }

  /**
   * Initialize cron jobs
   */
  initCronJobs() {
    // Check for scheduled tweets every minute (for reminders)
    cron.schedule('* * * * *', async () => {
      await this.processPendingTweets();
    });

    logger.info('Scheduler service initialized');
  }

  /**
   * Process pending scheduled tweets
   * Note: Without Twitter API, this just marks tweets as ready to post
   * Users will need to manually copy and post to X
   */
  async processPendingTweets() {
    try {
      // Find tweets scheduled within the next minute
      const scheduledTweets = await Tweet.getScheduledTweets(1);

      for (const tweet of scheduledTweets) {
        try {
          // Mark as ready (user needs to manually post)
          tweet.status = 'ready';
          tweet.readyAt = new Date();
          await tweet.save();
          logger.info(`Tweet ${tweet._id} is ready to post`);
        } catch (error) {
          logger.error(`Failed to process tweet ${tweet._id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error processing pending tweets:', error);
    }
  }

  /**
   * Schedule a tweet
   */
  async scheduleTweet(tweetData, scheduledTime) {
    try {
      const tweet = await Tweet.create({
        ...tweetData,
        status: 'scheduled',
        scheduledFor: scheduledTime
      });

      logger.info(`Tweet ${tweet._id} scheduled for ${scheduledTime}`);

      return tweet;
    } catch (error) {
      logger.error('Error scheduling tweet:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled tweet
   */
  async cancelScheduledTweet(tweetId) {
    try {
      const tweet = await Tweet.findById(tweetId);

      if (!tweet) {
        throw new Error('Tweet not found');
      }

      if (tweet.status !== 'scheduled') {
        throw new Error('Tweet is not scheduled');
      }

      tweet.status = 'draft';
      tweet.scheduledFor = null;
      await tweet.save();

      logger.info(`Cancelled scheduled tweet ${tweetId}`);

      return tweet;
    } catch (error) {
      logger.error('Error cancelling scheduled tweet:', error);
      throw error;
    }
  }

  /**
   * Reschedule a tweet
   */
  async rescheduleTweet(tweetId, newTime) {
    try {
      const tweet = await Tweet.findById(tweetId);

      if (!tweet) {
        throw new Error('Tweet not found');
      }

      tweet.scheduledFor = newTime;
      tweet.status = 'scheduled';
      await tweet.save();

      logger.info(`Rescheduled tweet ${tweetId} to ${newTime}`);

      return tweet;
    } catch (error) {
      logger.error('Error rescheduling tweet:', error);
      throw error;
    }
  }

  /**
   * Get optimal posting time for user
   */
  async getOptimalPostingTime(userId) {
    try {
      // In production, this would analyze user's audience activity
      // For MVP, return general best practice times
      const now = new Date();
      const currentHour = now.getHours();
      
      const optimalHours = [9, 12, 15, 18, 21];
      
      // Find next optimal hour
      const nextOptimal = optimalHours.find(hour => hour > currentHour) || optimalHours[0];
      
      const optimalTime = new Date(now);
      if (nextOptimal <= currentHour) {
        optimalTime.setDate(optimalTime.getDate() + 1);
      }
      optimalTime.setHours(nextOptimal, 0, 0, 0);

      return optimalTime;
    } catch (error) {
      logger.error('Error calculating optimal posting time:', error);
      throw error;
    }
  }

  /**
   * Get user's scheduled tweets
   */
  async getUserScheduledTweets(userId, limit = 50) {
    try {
      const tweets = await Tweet.find({
        user: userId,
        status: 'scheduled'
      })
      .sort({ scheduledFor: 1 })
      .limit(limit);

      return tweets;
    } catch (error) {
      logger.error('Error fetching scheduled tweets:', error);
      throw error;
    }
  }

  /**
   * Auto-repost high-performing tweets
   */
  async autoRepostTopTweets(userId, threshold = 80) {
    try {
      const topTweets = await Tweet.find({
        user: userId,
        status: 'published',
        'analytics.engagementRate': { $gte: threshold }
      })
      .sort({ 'analytics.engagementRate': -1 })
      .limit(5);

      const repostSchedules = [];

      for (const tweet of topTweets) {
        // Schedule repost for 7 days later
        const repostTime = new Date();
        repostTime.setDate(repostTime.getDate() + 7);

        const repost = await this.scheduleTweet({
          user: userId,
          content: tweet.content,
          mediaUrls: tweet.mediaUrls,
          type: 'retweet',
          metadata: tweet.metadata
        }, repostTime);

        repostSchedules.push(repost);
      }

      return repostSchedules;
    } catch (error) {
      logger.error('Error auto-reposting tweets:', error);
      throw error;
    }
  }
}

export default new SchedulerService();
