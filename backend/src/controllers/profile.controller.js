import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import twitterService from '../services/twitter.service.js';
import aiService from '../services/ai.service.js';

/**
 * @desc    Connect Twitter account (OAuth callback handled here)
 * @route   POST /api/profiles/connect-twitter
 * @access  Private
 */
export const connectTwitter = asyncHandler(async (req, res, next) => {
  const { accessToken, refreshToken, userId, username, expiresAt } = req.body;

  // For development: allow simplified connection with just username
  if (!username) {
    return next(new AppError('Username is required', 400));
  }

  // If full OAuth data provided (production)
  if (accessToken && userId) {
    req.user.twitterAccount = {
      connected: true,
      userId,
      username,
      accessToken,
      refreshToken,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    };
  } else {
    // Simplified connection for development (no OAuth)
    req.user.twitterAccount = {
      connected: true,
      userId: username, // Use username as userId for dev
      username,
      accessToken: null,
      refreshToken: null,
      expiresAt: null
    };
  }

  await req.user.save();

  res.status(200).json({
    status: 'success',
    message: 'Twitter account connected successfully',
    data: {
      username,
      userId: req.user.twitterAccount.userId
    }
  });
});

/**
 * @desc    Disconnect Twitter account
 * @route   POST /api/profiles/disconnect-twitter
 * @access  Private
 */
export const disconnectTwitter = asyncHandler(async (req, res, next) => {
  req.user.twitterAccount = {
    connected: false,
    userId: null,
    username: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null
  };

  await req.user.save();

  res.status(200).json({
    status: 'success',
    message: 'Twitter account disconnected successfully'
  });
});

/**
 * @desc    Get Twitter profile insights
 * @route   GET /api/profiles/twitter-insights
 * @access  Private
 */
export const getTwitterInsights = asyncHandler(async (req, res, next) => {
  if (!req.user.twitterAccount.connected) {
    return next(new AppError('Twitter account not connected', 400));
  }

  const accessToken = req.user.twitterAccount.accessToken;
  const userId = req.user.twitterAccount.userId;

  // Only fetch profile (1 API call) to conserve quota
  // Free tier: 100 reads/month - we need to be very conservative
  const profile = await twitterService.getUserProfile(accessToken, userId);
  
  // Use static data for engagement and optimal times to save API calls
  const engagement = {
    avgLikes: 0,
    avgRetweets: 0,
    avgReplies: 0,
    avgEngagementRate: 0,
    totalTweets: profile.public_metrics?.tweet_count || 0
  };
  
  // Static optimal times (no API call needed)
  const optimalTimes = await twitterService.getOptimalPostingTimes(accessToken, userId);

  res.status(200).json({
    status: 'success',
    data: {
      profile,
      engagement,
      optimalTimes
    }
  });
});

/**
 * @desc    Analyze external profile (Chrome extension feature)
 * @route   POST /api/profiles/analyze
 * @access  Private
 */
export const analyzeProfile = asyncHandler(async (req, res, next) => {
  const { username } = req.body;

  if (!username) {
    return next(new AppError('Username is required', 400));
  }

  // DISABLED: Search API consumes quota quickly
  // Free tier only has 100 reads/month
  // Re-enable when upgraded to Basic tier ($100/mo)
  return next(new AppError(
    'Profile analysis is temporarily disabled to conserve API quota. This feature requires a paid Twitter API tier.',
    503
  ));

  // Original implementation (disabled):
  // const searchResults = await twitterService.searchTweets(
  //   `from:${username}`,
  //   { maxResults: 100 }
  // );
  // ...
});

/**
 * @desc    Import user's style (tweets + likes) - ONE TIME OPERATION
 * @route   POST /api/profiles/import-style
 * @access  Private
 * @note    Uses 2 Twitter API reads - use sparingly!
 */
export const importStyle = asyncHandler(async (req, res, next) => {
  if (!req.user.twitterAccount?.connected) {
    return next(new AppError('Twitter account not connected', 400));
  }

  const accessToken = req.user.twitterAccount.accessToken;
  const userId = req.user.twitterAccount.userId;

  if (!accessToken) {
    return next(new AppError('Twitter access token not available. Please reconnect your account.', 400));
  }

  // Check if already imported recently (within 7 days)
  const lastImport = req.user.styleProfile?.analyzedAt;
  if (lastImport) {
    const daysSinceImport = (Date.now() - new Date(lastImport).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceImport < 7) {
      return res.status(200).json({
        status: 'success',
        message: 'Style already imported recently. Re-import available in ' + Math.ceil(7 - daysSinceImport) + ' days.',
        data: {
          styleProfile: req.user.styleProfile,
          alreadyImported: true
        }
      });
    }
  }

  // Fetch tweets from Twitter (1 API call)
  // Note: Likes endpoint requires Basic tier ($100/mo), so we skip it on Free tier
  let tweets = [];
  let likes = []; // Empty - Likes API not available on Free tier

  try {
    tweets = await twitterService.getUserTweets(accessToken, userId, { maxResults: 50 });
  } catch (error) {
    console.error('Failed to fetch tweets:', error.message);
    return next(new AppError('Failed to fetch your tweets. ' + error.message, 400));
  }

  if (tweets.length === 0) {
    return next(new AppError('No tweets found. Please post some tweets first, then try again.', 400));
  }

  // Format tweets for storage
  const formattedTweets = tweets.map(t => ({
    id: t.id,
    content: t.text,
    author: `@${req.user.twitterAccount.username}`,
    authorName: req.user.name,
    metrics: t.public_metrics,
    createdAt: t.created_at,
    importedAt: new Date()
  }));

  // Analyze style using AI
  const styleProfile = await aiService.analyzeStyle(
    formattedTweets.map(t => ({ content: t.content })),
    likes.map(l => ({ content: l.content }))
  );

  // Store in user record
  req.user.importedTweets = formattedTweets;
  req.user.importedLikes = likes.map(l => ({
    ...l,
    importedAt: new Date()
  }));
  req.user.styleProfile = styleProfile;
  await req.user.save();

  res.status(200).json({
    status: 'success',
    message: 'Style imported and analyzed successfully!',
    data: {
      tweetsImported: formattedTweets.length,
      likesImported: 0, // Likes API requires Basic tier
      styleProfile,
      apiCallsUsed: 1
    }
  });
});

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
 */
export const generateReplies = asyncHandler(async (req, res, next) => {
  const { tweetContent, count = 3 } = req.body;

  if (!tweetContent) {
    return next(new AppError('Tweet content is required', 400));
  }

  const styleProfile = req.user.styleProfile || null;
  const replies = await aiService.generateReplies(tweetContent, styleProfile, count);

  res.status(200).json({
    status: 'success',
    data: {
      replies,
      usedStyle: !!styleProfile
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
  const { tweetContent, count = 3 } = req.body;

  if (!tweetContent) {
    return next(new AppError('Tweet content is required', 400));
  }

  const styleProfile = req.user.styleProfile || null;
  const quotes = await aiService.generateQuotes(tweetContent, styleProfile, count);

  res.status(200).json({
    status: 'success',
    data: {
      quotes,
      usedStyle: !!styleProfile
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
 * @desc    Import user's liked tweets for content analysis (legacy)
 * @route   POST /api/profiles/import-likes
 * @access  Private
 */
export const importLikes = asyncHandler(async (req, res, next) => {
  // Redirect to new import-style endpoint
  return next(new AppError('This endpoint is deprecated. Use POST /api/profiles/import-style instead.', 410));
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
