import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  metrics: {
    followers: {
      count: Number,
      change: Number,
      changePercent: Number
    },
    following: {
      count: Number,
      change: Number
    },
    tweets: {
      count: Number,
      impressions: Number,
      engagements: Number,
      likes: Number,
      retweets: Number,
      replies: Number,
      quotes: Number
    },
    engagement: {
      rate: Number,
      total: Number,
      perTweet: Number
    },
    topTweets: [{
      tweetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tweet'
      },
      impressions: Number,
      engagements: Number,
      engagementRate: Number
    }],
    audience: {
      demographics: {
        countries: [{
          code: String,
          name: String,
          percentage: Number
        }],
        languages: [{
          code: String,
          name: String,
          percentage: Number
        }]
      },
      interests: [{
        category: String,
        percentage: Number
      }],
      activeHours: [{
        hour: Number,
        engagement: Number
      }]
    },
    content: {
      bestPerformingTypes: [{
        type: String,
        avgEngagement: Number,
        count: Number
      }],
      bestHashtags: [{
        hashtag: String,
        impressions: Number,
        engagements: Number
      }],
      mediaPerformance: {
        withMedia: {
          count: Number,
          avgEngagement: Number
        },
        withoutMedia: {
          count: Number,
          avgEngagement: Number
        }
      }
    }
  },
  growth: {
    followerGrowthRate: Number,
    engagementGrowthRate: Number,
    impressionGrowthRate: Number,
    predictedFollowers: Number,
    trendDirection: {
      type: String,
      enum: ['up', 'stable', 'down']
    }
  },
  benchmarks: {
    industryAverage: {
      engagementRate: Number,
      followersGrowth: Number
    },
    yourRank: {
      percentile: Number,
      category: String
    }
  }
}, {
  timestamps: true
});

// Compound indexes
analyticsSchema.index({ user: 1, date: -1 });
analyticsSchema.index({ user: 1, period: 1, date: -1 });

// Static method to get analytics summary
analyticsSchema.statics.getSummary = async function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalImpressions: { $sum: '$metrics.tweets.impressions' },
        totalEngagements: { $sum: '$metrics.tweets.engagements' },
        totalTweets: { $sum: '$metrics.tweets.count' },
        avgEngagementRate: { $avg: '$metrics.engagement.rate' },
        followerChange: { $sum: '$metrics.followers.change' }
      }
    }
  ]);
};

// Method to calculate growth trends
analyticsSchema.methods.calculateGrowthTrend = function() {
  const { followers, engagement, tweets } = this.metrics;
  
  // Simple trend calculation
  if (followers.changePercent > 5) {
    this.growth.trendDirection = 'up';
  } else if (followers.changePercent < -5) {
    this.growth.trendDirection = 'down';
  } else {
    this.growth.trendDirection = 'stable';
  }
  
  return this.growth.trendDirection;
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
