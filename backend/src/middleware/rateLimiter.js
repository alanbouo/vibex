import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many AI requests, please slow down.',
  handler: (req, res) => {
    throw new AppError('Rate limit exceeded for AI requests', 429);
  },
});

export const createTierBasedLimiter = (limits) => {
  return (req, res, next) => {
    const tier = req.user?.subscription?.tier || 'free';
    const limit = limits[tier] || limits.free;
    
    const limiter = rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: limit,
      message: `You have exceeded your hourly limit of ${limit} requests. Please upgrade your plan.`,
      keyGenerator: (req) => req.user?.id || req.ip,
    });
    
    return limiter(req, res, next);
  };
};
