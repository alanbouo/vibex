import express from 'express';
import { TwitterApi } from 'twitter-api-v2';
import { protect } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @desc    Initiate Twitter OAuth flow
 * @route   GET /api/auth/twitter
 * @access  Private
 */
router.get('/twitter', protect, asyncHandler(async (req, res, next) => {
  try {
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    // Generate OAuth 2.0 link
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      process.env.TWITTER_CALLBACK_URL,
      { 
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      }
    );

    // Encode codeVerifier and userId in state parameter
    // Twitter will return this unchanged in the callback
    const stateData = {
      userId: req.user.id,
      codeVerifier,
      originalState: state,
    };
    const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64');
    
    // URL-encode the base64 string to handle special characters
    const urlSafeState = encodeURIComponent(encodedState);

    // Replace state in URL with our encoded state
    const modifiedUrl = url.replace(`state=${state}`, `state=${urlSafeState}`);

    res.status(200).json({
      status: 'success',
      data: {
        authUrl: modifiedUrl,
      }
    });
  } catch (error) {
    logger.error('Twitter OAuth initiation error:', error);
    return next(new AppError('Failed to initiate Twitter authentication', 500));
  }
}));

/**
 * @desc    Handle Twitter OAuth callback
 * @route   GET /api/auth/twitter/callback
 * @access  Public (but validates state)
 */
router.get('/twitter/callback', asyncHandler(async (req, res, next) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return next(new AppError('Invalid OAuth callback parameters', 400));
  }

  try {
    // Decode state to get codeVerifier and userId
    let stateData;
    try {
      const decodedState = Buffer.from(state, 'base64').toString('utf-8');
      stateData = JSON.parse(decodedState);
    } catch (decodeError) {
      logger.error('Failed to decode state parameter:', decodeError);
      return next(new AppError('Invalid state parameter', 400));
    }

    const { codeVerifier, userId } = stateData;

    if (!codeVerifier) {
      return next(new AppError('Code verifier not found in state', 400));
    }

    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    // Exchange code for access token
    const {
      client: loggedClient,
      accessToken,
      refreshToken,
      expiresIn,
    } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: process.env.TWITTER_CALLBACK_URL,
    });

    // Get Twitter user info
    const { data: userObject } = await loggedClient.v2.me();

    logger.info(`Twitter OAuth successful for user: ${userObject.username}`);

    // Redirect back to frontend with tokens
    // Frontend will then call POST /api/profiles/connect-twitter
    const redirectUrl = new URL(`${process.env.FRONTEND_URL}/dashboard/settings`);
    redirectUrl.searchParams.set('twitter_access_token', accessToken);
    redirectUrl.searchParams.set('twitter_refresh_token', refreshToken || '');
    redirectUrl.searchParams.set('twitter_user_id', userObject.id);
    redirectUrl.searchParams.set('twitter_username', userObject.username);
    redirectUrl.searchParams.set('twitter_expires_in', expiresIn.toString());
    redirectUrl.searchParams.set('twitter_connected', 'true');

    res.redirect(redirectUrl.toString());
  } catch (error) {
    logger.error('Twitter OAuth callback error:', error);
    
    // Redirect to frontend with error
    const errorUrl = new URL(`${process.env.FRONTEND_URL}/dashboard/settings`);
    errorUrl.searchParams.set('twitter_error', error.message || 'Authentication failed');
    res.redirect(errorUrl.toString());
  }
}));

/**
 * @desc    Refresh Twitter access token
 * @route   POST /api/auth/twitter/refresh
 * @access  Private
 */
router.post('/twitter/refresh', protect, asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token is required', 400));
  }

  try {
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    const {
      client: refreshedClient,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    } = await client.refreshOAuth2Token(refreshToken);

    res.status(200).json({
      status: 'success',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn,
      }
    });
  } catch (error) {
    logger.error('Twitter token refresh error:', error);
    return next(new AppError('Failed to refresh Twitter token', 500));
  }
}));

export default router;
