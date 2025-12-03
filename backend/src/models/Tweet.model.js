import mongoose from 'mongoose';

const tweetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Tweet content is required'],
    maxlength: [280, 'Tweet cannot exceed 280 characters']
  },
  mediaUrls: [{
    type: String
  }],
  type: {
    type: String,
    enum: ['tweet', 'thread', 'reply', 'retweet'],
    default: 'tweet'
  },
  threadTweets: [{
    content: String,
    order: Number
  }],
  metadata: {
    hashtags: [String],
    mentions: [String],
    urls: [String]
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiMetadata: {
    prompt: String,
    model: String,
    tone: String,
    creativity: Number,
    generatedAt: Date
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  scheduledFor: {
    type: Date,
    index: true
  },
  publishedAt: Date,
  twitterId: String, // Twitter's ID after posting
  analytics: {
    impressions: {
      type: Number,
      default: 0
    },
    engagements: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    retweets: {
      type: Number,
      default: 0
    },
    replies: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    bookmarks: {
      type: Number,
      default: 0
    },
    profileVisits: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },
  sentiment: {
    score: Number, // -1 to 1
    label: {
      type: String,
      enum: ['positive', 'neutral', 'negative']
    }
  },
  performance: {
    score: Number, // 0 to 100
    predictedEngagement: Number
  }
}, {
  timestamps: true
});

// Indexes for performance
tweetSchema.index({ user: 1, status: 1 });
tweetSchema.index({ user: 1, createdAt: -1 });
tweetSchema.index({ scheduledFor: 1, status: 1 });
tweetSchema.index({ 'analytics.engagementRate': -1 });

// Pre-save middleware to extract metadata
tweetSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Extract hashtags
    const hashtagRegex = /#[\w]+/g;
    this.metadata.hashtags = (this.content.match(hashtagRegex) || []).map(tag => tag.slice(1));
    
    // Extract mentions
    const mentionRegex = /@[\w]+/g;
    this.metadata.mentions = (this.content.match(mentionRegex) || []).map(mention => mention.slice(1));
    
    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    this.metadata.urls = this.content.match(urlRegex) || [];
  }
  next();
});

// Method to calculate engagement rate
tweetSchema.methods.calculateEngagementRate = function() {
  if (this.analytics.impressions === 0) return 0;
  
  this.analytics.engagementRate = (this.analytics.engagements / this.analytics.impressions) * 100;
  return this.analytics.engagementRate;
};

// Static method to get top performing tweets
tweetSchema.statics.getTopPerformers = function(userId, limit = 10) {
  return this.find({
    user: userId,
    status: 'published'
  })
  .sort({ 'analytics.engagementRate': -1 })
  .limit(limit);
};

// Static method to get scheduled tweets
tweetSchema.statics.getScheduledTweets = function(timeWindow = 60) {
  const now = new Date();
  const future = new Date(now.getTime() + timeWindow * 60000);
  
  return this.find({
    status: 'scheduled',
    scheduledFor: { $gte: now, $lte: future }
  }).populate('user', 'email name');
};

const Tweet = mongoose.model('Tweet', tweetSchema);

export default Tweet;
