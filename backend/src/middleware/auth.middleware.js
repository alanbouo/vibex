import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { AppError } from '../utils/AppError.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return next(new AppError('User not found', 404));
      }

      next();
    } catch (error) {
      return next(new AppError('Not authorized to access this route', 401));
    }
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...tiers) => {
  return (req, res, next) => {
    if (!tiers.includes(req.user.subscription.tier)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

export const checkSubscription = (req, res, next) => {
  const user = req.user;
  
  if (user.subscription.status !== 'active') {
    return next(new AppError('Your subscription is not active', 403));
  }

  if (user.subscription.endDate && new Date() > user.subscription.endDate) {
    return next(new AppError('Your subscription has expired', 403));
  }

  next();
};

export const checkUsageLimit = (limitType) => {
  return async (req, res, next) => {
    const user = req.user;
    
    // Define limits per tier
    const limits = {
      tweetsGenerated: {
        free: 10,
        pro: 100,
        advanced: -1 // unlimited
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

    const limit = limits[limitType][user.subscription.tier];
    
    if (limit !== -1 && user.usage[limitType] >= limit) {
      return next(
        new AppError(`You have reached your ${limitType} limit. Please upgrade your plan.`, 403)
      );
    }

    next();
  };
};
