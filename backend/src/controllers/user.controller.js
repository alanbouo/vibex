import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import User from '../models/User.model.js';

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res, next) => {
  const allowedUpdates = ['name', 'avatar'];
  const updates = {};

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * @desc    Update user preferences
 * @route   PUT /api/users/preferences
 * @access  Private
 */
export const updatePreferences = asyncHandler(async (req, res, next) => {
  const { timezone, language, notifications, aiSettings } = req.body;

  const user = await User.findById(req.user.id);

  if (timezone) user.preferences.timezone = timezone;
  if (language) user.preferences.language = language;
  if (notifications) {
    user.preferences.notifications = {
      ...user.preferences.notifications,
      ...notifications
    };
  }
  if (aiSettings) {
    user.preferences.aiSettings = {
      ...user.preferences.aiSettings,
      ...aiSettings
    };
  }

  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      preferences: user.preferences
    }
  });
});

/**
 * @desc    Get user usage stats
 * @route   GET /api/users/usage
 * @access  Private
 */
export const getUsage = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  const limits = {
    tweetsGenerated: {
      free: 10,
      pro: 100,
      advanced: -1
    },
    tweetsScheduled: {
      free: 5,
      pro: 50,
      advanced: -1
    },
    analyticsChecked: {
      free: 20,
      pro: 200,
      advanced: -1
    }
  };

  const tier = user.subscription.tier;
  
  const usageData = {
    current: user.usage,
    limits: {
      tweetsGenerated: limits.tweetsGenerated[tier],
      tweetsScheduled: limits.tweetsScheduled[tier],
      analyticsChecked: limits.analyticsChecked[tier]
    },
    subscription: user.subscription
  };

  res.status(200).json({
    status: 'success',
    data: usageData
  });
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/users/account
 * @access  Private
 */
export const deleteAccount = asyncHandler(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id);

  res.status(200).json({
    status: 'success',
    message: 'Account deleted successfully'
  });
});
