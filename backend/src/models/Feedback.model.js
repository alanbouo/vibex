import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['reply', 'quote', 'styled_tweet'],
    required: true
  },
  // The input that was provided
  input: {
    text: String,
    hasImage: Boolean
  },
  // The AI-generated output
  output: {
    type: String,
    required: true
  },
  // User's rating: 1 = good, -1 = bad
  rating: {
    type: Number,
    enum: [1, -1],
    required: true
  },
  // Was this suggestion copied/used?
  wasCopied: {
    type: Boolean,
    default: false
  },
  // Optional: user's style profile at the time (for context)
  styleProfileSnapshot: {
    tone: String,
    topics: [String]
  },
  // Model used
  model: {
    type: String,
    default: 'gpt-3.5-turbo'
  }
}, {
  timestamps: true
});

// Index for analytics queries
feedbackSchema.index({ user: 1, type: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1, type: 1 });

// Static method to get feedback stats
feedbackSchema.statics.getStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: userId ? { user: new mongoose.Types.ObjectId(userId) } : {} },
    {
      $group: {
        _id: '$type',
        total: { $sum: 1 },
        positive: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        negative: { $sum: { $cond: [{ $eq: ['$rating', -1] }, 1, 0] } },
        copied: { $sum: { $cond: ['$wasCopied', 1, 0] } }
      }
    }
  ]);
  return stats;
};

// Static method to export training data
feedbackSchema.statics.exportTrainingData = async function(minRating = 1) {
  return this.find({ rating: { $gte: minRating } })
    .select('type input output rating styleProfileSnapshot')
    .lean();
};

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
