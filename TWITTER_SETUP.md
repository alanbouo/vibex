# Twitter/X Authentication Setup Guide

This guide will help you set up Twitter/X authentication for Vibex to retrieve user data and post tweets.

## 1. Create a Twitter Developer Account

### Step 1: Apply for Developer Access
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your Twitter/X account
3. Click **"Sign up for Free Account"** or **"Apply"**
4. Complete the application form:
   - **Account name**: Your name or company
   - **Country**: Your location
   - **Use case**: Select "Making a bot" or "Exploring the API"
   - **Description**: Describe Vibex as an AI-powered Twitter growth platform

### Step 2: Create a New App
1. Once approved, click **"+ Create Project"**
2. Enter project details:
   - **Project name**: "Vibex Production"
   - **Use case**: Choose "Making a bot" or "Exploring the API"
   - **Project description**: "AI-powered platform for X (Twitter) growth and analytics"

3. Click **"+ Add App"** to create an app within the project
   - **App name**: "Vibex" (must be unique across Twitter)
   - **Environment**: Production

## 2. Configure OAuth 2.0

### Step 1: Set Up User Authentication
1. In your app dashboard, click **"Set up"** under "User authentication settings"
2. Configure the following:

**App permissions**:
- ✅ Read
- ✅ Write
- ✅ Direct Messages (optional)

**Type of App**:
- Select **"Web App, Automated App or Bot"**

**App info**:
- **Callback URI / Redirect URL**: 
  ```
  https://api.vibex.alanbouo.com/api/auth/twitter/callback
  ```
- **Website URL**: 
  ```
  https://vibex.alanbouo.com
  ```
- **Terms of Service**: (Optional) Your terms URL
- **Privacy Policy**: (Optional) Your privacy policy URL

3. Click **"Save"**

### Step 2: Get Your Credentials
1. Go to the **"Keys and tokens"** tab
2. Copy the following credentials (you'll need these for Coolify):

**API Key and Secret**:
- **API Key** (also called Consumer Key)
- **API Key Secret** (also called Consumer Secret)

**Bearer Token**:
- **Bearer Token** (for read-only access to public data)

**OAuth 2.0 Client ID and Secret**:
- **Client ID**
- **Client Secret**

> ⚠️ **Important**: Save these credentials securely. The API Key Secret and Client Secret are only shown once!

## 3. Add Credentials to Coolify

### Navigate to Your Backend Service
1. Open Coolify dashboard
2. Go to your **Vibex Backend** service
3. Click **"Environment Variables"**

### Add Twitter Environment Variables

Add the following environment variables with your credentials:

```env
# Twitter API Credentials
TWITTER_API_KEY=your-api-key-here
TWITTER_API_SECRET=your-api-secret-here
TWITTER_BEARER_TOKEN=your-bearer-token-here

# Twitter OAuth 2.0
TWITTER_CLIENT_ID=your-client-id-here
TWITTER_CLIENT_SECRET=your-client-secret-here
TWITTER_CALLBACK_URL=https://api.vibex.alanbouo.com/api/auth/twitter/callback
```

### Save and Redeploy
1. Click **"Save"**
2. Click **"Redeploy"** to apply the new environment variables

## 4. Test Twitter Authentication

### From the Frontend

1. **Register/Login** to Vibex at `https://vibex.alanbouo.com`
2. Go to **Settings** or **Profile** page
3. Click **"Connect Twitter Account"**
4. You'll be redirected to Twitter to authorize the app
5. After authorization, you'll be redirected back to Vibex with your Twitter account connected

### API Flow

The authentication flow works as follows:

1. **Initiate OAuth**:
   ```bash
   GET /api/auth/twitter
   Headers: Authorization: Bearer <your-jwt-token>
   ```
   Response includes the Twitter authorization URL

2. **User authorizes** on Twitter's website

3. **Callback**:
   ```
   GET /api/auth/twitter/callback?code=...&state=...
   ```
   Backend exchanges the code for access tokens and redirects to frontend

4. **Frontend stores tokens**:
   ```bash
   POST /api/profiles/connect-twitter
   Body: {
     accessToken: "...",
     refreshToken: "...",
     userId: "...",
     username: "...",
     expiresAt: "..."
   }
   ```

5. **Use Twitter features**:
   - Post tweets
   - Retrieve analytics
   - Schedule posts
   - Get audience insights

## 5. API Rate Limits

Twitter API has rate limits. Here's what you get with different tiers:

### Free Tier
- 1,500 tweets per month
- Read access to public data
- Basic user authentication

### Basic Tier ($100/month)
- 3,000 tweets per month
- 10,000 reads per month
- All Free tier features

### Pro Tier ($5,000/month)
- 300,000 tweets per month
- 1,000,000 reads per month
- Full analytics access

> 💡 **Tip**: Start with the Free tier for testing, then upgrade based on your users' needs.

## 6. Security Best Practices

### Protect Your Credentials
- ✅ Never commit credentials to Git
- ✅ Use Coolify's environment variables
- ✅ Rotate secrets periodically
- ✅ Use different apps for development and production

### Token Management
- Access tokens expire after 2 hours
- Refresh tokens are valid for up to 90 days
- Vibex automatically refreshes tokens when needed
- Store tokens securely (encrypted in MongoDB)

## 7. Troubleshooting

### "401 Unauthorized" Error
- Check that `TWITTER_CLIENT_ID` and `TWITTER_CLIENT_SECRET` are correct
- Verify the callback URL in Twitter Developer Portal matches exactly
- Ensure OAuth 2.0 is enabled in your app settings

### "App suspended" Error
- Review Twitter's [Developer Agreement](https://developer.twitter.com/en/developer-terms/agreement-and-policy)
- Check for any policy violations
- Contact Twitter Developer Support

### Callback URL Mismatch
- The callback URL in Coolify must **exactly match** the one in Twitter Developer Portal
- Use HTTPS in production
- No trailing slash

### Rate Limit Exceeded
- Wait for the rate limit window to reset (typically 15 minutes)
- Implement caching to reduce API calls
- Consider upgrading your Twitter API tier

## 8. Available Twitter Features in Vibex

Once authenticated, users can:

- ✅ **Post Tweets**: Create and publish tweets directly
- ✅ **Schedule Tweets**: Queue tweets for optimal posting times
- ✅ **Thread Management**: Create and post Twitter threads
- ✅ **Analytics**: Track tweet performance and engagement
- ✅ **Profile Insights**: View follower growth and audience demographics
- ✅ **Content Analysis**: Analyze top-performing content
- ✅ **AI-Powered Writing**: Generate tweets with AI assistance
- ✅ **Import Likes**: Analyze liked content for content inspiration

## Need Help?

- [Twitter API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [OAuth 2.0 Guide](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Twitter API Status](https://api.twitterstat.us/)

---

**Next Steps**: After setting up Twitter authentication, configure other integrations like OpenAI for AI-powered content generation.
