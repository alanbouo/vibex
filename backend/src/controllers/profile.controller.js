import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import aiService from '../services/ai.service.js';

/**
 * @desc    Get user's style profile
 * @route   GET /api/profiles/style
 * @access  Private
 */
export const getStyleProfile = asyncHandler(async (req, res, next) => {
  if (!req.user.styleProfile?.analyzedAt) {
    return res.status(200).json({
      status: 'success',
      data: {
        hasStyle: false,
        message: 'No style profile yet. Import your style first.'
      }
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      hasStyle: true,
      styleProfile: req.user.styleProfile,
      tweetsCount: req.user.importedTweets?.length || 0,
      likesCount: req.user.importedLikes?.length || 0
    }
  });
});

/**
 * @desc    Generate reply suggestions for a tweet
 * @route   POST /api/profiles/generate-replies
 * @access  Private
 * @note    No Twitter API calls - uses stored style profile
 * @note    Supports image upload (base64) for vision-based reply generation
 */
export const generateReplies = asyncHandler(async (req, res, next) => {
  const { tweetContent, count = 3, image } = req.body;

  if (!tweetContent && !image) {
    return next(new AppError('Tweet content or image is required', 400));
  }

  const styleProfile = req.user.styleProfile || null;
  const replies = await aiService.generateReplies(tweetContent, styleProfile, count, image);

  res.status(200).json({
    status: 'success',
    data: {
      replies,
      usedStyle: !!styleProfile,
      usedImage: !!image
    }
  });
});

/**
 * @desc    Generate quote tweet suggestions
 * @route   POST /api/profiles/generate-quotes
 * @access  Private
 * @note    No Twitter API calls - uses stored style profile
 */
export const generateQuotes = asyncHandler(async (req, res, next) => {
  const { tweetContent, count = 3, image } = req.body;

  if (!tweetContent && !image) {
    return next(new AppError('Tweet content or image is required', 400));
  }

  const styleProfile = req.user.styleProfile || null;
  const quotes = await aiService.generateQuotes(tweetContent, styleProfile, count, image);

  res.status(200).json({
    status: 'success',
    data: {
      quotes,
      usedStyle: !!styleProfile,
      usedImage: !!image
    }
  });
});

/**
 * @desc    Generate tweet in user's style
 * @route   POST /api/profiles/generate-styled-tweet
 * @access  Private
 * @note    No Twitter API calls - uses stored style profile
 */
export const generateStyledTweet = asyncHandler(async (req, res, next) => {
  const { prompt } = req.body;

  if (!prompt) {
    return next(new AppError('Prompt is required', 400));
  }

  if (!req.user.styleProfile?.analyzedAt) {
    return next(new AppError('Please import your style first', 400));
  }

  const tweet = await aiService.generateInStyle(prompt, req.user.styleProfile);

  res.status(200).json({
    status: 'success',
    data: {
      tweet,
      styleProfile: {
        tone: req.user.styleProfile.tone,
        topics: req.user.styleProfile.topics
      }
    }
  });
});

/**
 * @desc    Import scraped data from Chrome extension (NO API CALLS!)
 * @route   POST /api/profiles/import-extension-data
 * @access  Private
 * @note    This uses data scraped by the extension, not the Twitter API
 */
export const importExtensionData = asyncHandler(async (req, res, next) => {
  const { posts, likes } = req.body;

  if (!posts && !likes) {
    return next(new AppError('No data provided. Include posts and/or likes arrays.', 400));
  }

  const postsArray = posts || [];
  const likesArray = likes || [];

  if (postsArray.length === 0 && likesArray.length === 0) {
    return next(new AppError('Both posts and likes arrays are empty.', 400));
  }

  // Format posts for storage
  const formattedPosts = postsArray.map(p => ({
    id: p.id,
    content: p.text || '',
    author: p.handle ? `@${p.handle}` : '',
    authorName: p.author || '',
    url: p.url || '',
    type: p.type || 'original',
    hasMedia: p.hasMedia || false,
    mediaTypes: p.mediaTypes || [],
    metrics: {
      reply_count: p.replies || 0,
      retweet_count: p.retweets || 0,
      like_count: p.likes || 0,
      impression_count: p.views || 0
    },
    createdAt: p.timestamp || null,
    scrapedAt: p.scrapedAt || new Date().toISOString(),
    importedAt: new Date()
  }));

  // Format likes for storage
  const formattedLikes = likesArray.map(l => ({
    id: l.id,
    content: l.text || '',
    author: l.handle ? `@${l.handle}` : '',
    authorName: l.author || '',
    url: l.url || '',
    type: l.type || 'original',
    hasMedia: l.hasMedia || false,
    mediaTypes: l.mediaTypes || [],
    metrics: {
      reply_count: l.replies || 0,
      retweet_count: l.retweets || 0,
      like_count: l.likes || 0,
      impression_count: l.views || 0
    },
    createdAt: l.timestamp || null,
    scrapedAt: l.scrapedAt || new Date().toISOString(),
    importedAt: new Date()
  }));

  // Store in user record (merge with existing data, avoid duplicates)
  const existingPostIds = new Set((req.user.importedTweets || []).map(t => t.id));
  const existingLikeIds = new Set((req.user.importedLikes || []).map(l => l.id));

  const newPosts = formattedPosts.filter(p => !existingPostIds.has(p.id));
  const newLikes = formattedLikes.filter(l => !existingLikeIds.has(l.id));

  req.user.importedTweets = [...(req.user.importedTweets || []), ...newPosts];
  req.user.importedLikes = [...(req.user.importedLikes || []), ...newLikes];
  req.user.extensionDataImportedAt = new Date();

  // Analyze style if we have enough data
  let styleProfile = req.user.styleProfile;
  const totalPosts = req.user.importedTweets.length;
  const totalLikes = req.user.importedLikes.length;

  if (totalPosts >= 10 || totalLikes >= 20) {
    try {
      styleProfile = await aiService.analyzeStyle(
        req.user.importedTweets.slice(0, 100).map(t => ({ content: t.content })),
        req.user.importedLikes.slice(0, 100).map(l => ({ content: l.content }))
      );
      req.user.styleProfile = styleProfile;
    } catch (error) {
      console.error('Style analysis failed:', error.message);
      // Continue without style analysis
    }
  }

  await req.user.save();

  res.status(200).json({
    status: 'success',
    message: 'Extension data imported successfully!',
    data: {
      postsImported: newPosts.length,
      likesImported: newLikes.length,
      totalPosts,
      totalLikes,
      styleAnalyzed: !!styleProfile?.analyzedAt,
      apiCallsUsed: 0 // No Twitter API calls!
    }
  });
});
