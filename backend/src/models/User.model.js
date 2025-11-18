import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'pro', 'advanced'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  twitterAccount: {
    connected: {
      type: Boolean,
      default: false
    },
    userId: String,
    username: String,
    accessToken: String,
    refreshToken: String,
    expiresAt: Date
  },
  preferences: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    aiSettings: {
      tone: {
        type: String,
        enum: ['professional', 'casual', 'friendly', 'authoritative', 'humorous'],
        default: 'professional'
      },
      creativity: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.7
      },
      model: {
        type: String,
        enum: ['gpt-4', 'gpt-3.5-turbo', 'grok', 'claude'],
        default: 'gpt-3.5-turbo'
      }
    }
  },
  usage: {
    tweetsGenerated: {
      type: Number,
      default: 0
    },
    tweetsScheduled: {
      type: Number,
      default: 0
    },
    analyticsChecked: {
      type: Number,
      default: 0
    },
    lastReset: {
      type: Date,
      default: Date.now
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  likedTweets: [{
    id: String,
    content: String,
    author: String,
    category: String,
    sentiment: String,
    importedAt: {
      type: Date,
      default: Date.now
    }
  }],
  contentPreferences: {
    topCategories: [String],
    writingStyle: String,
    preferredTopics: [String],
    sentimentDistribution: {
      positive: Number,
      neutral: Number,
      negative: Number
    },
    lastAnalyzed: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check subscription limits
userSchema.methods.canGenerateTweet = function() {
  const limits = {
    free: 10,
    pro: 100,
    advanced: -1 // unlimited
  };
  
  const limit = limits[this.subscription.tier];
  return limit === -1 || this.usage.tweetsGenerated < limit;
};

// Method to increment usage
userSchema.methods.incrementUsage = async function(type) {
  this.usage[type] = (this.usage[type] || 0) + 1;
  await this.save();
};

// Virtual for full Twitter profile
userSchema.virtual('twitterProfile').get(function() {
  if (!this.twitterAccount.connected) return null;
  return {
    username: this.twitterAccount.username,
    userId: this.twitterAccount.userId
  };
});

// Virtual for likes imported status
userSchema.virtual('likesImported').get(function() {
  return this.likedTweets && this.likedTweets.length > 0;
});

// Virtual for likes count
userSchema.virtual('likesCount').get(function() {
  return this.likedTweets ? this.likedTweets.length : 0;
});

// Virtual for Twitter connected status
userSchema.virtual('twitterConnected').get(function() {
  return this.twitterAccount && this.twitterAccount.connected;
});

userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

export default User;
