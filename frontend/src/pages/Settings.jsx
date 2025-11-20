import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { Twitter, CheckCircle, AlertCircle, Heart, Sparkles } from 'lucide-react';
import { profileAPI } from '../services/api';

const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('twitter');
  const [loading, setLoading] = useState(false);
  const [twitterHandle, setTwitterHandle] = useState('');

  // Handle Twitter OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const twitterConnected = urlParams.get('twitter_connected');
    const twitterError = urlParams.get('twitter_error');
    const accessToken = urlParams.get('twitter_access_token');
    const refreshToken = urlParams.get('twitter_refresh_token');
    const userId = urlParams.get('twitter_user_id');
    const username = urlParams.get('twitter_username');
    const expiresIn = urlParams.get('twitter_expires_in');

    if (twitterConnected === 'true' && accessToken && username) {
      // Calculate expiration date
      const expiresAt = new Date(Date.now() + parseInt(expiresIn) * 1000).toISOString();

      // Save Twitter connection
      profileAPI.connectTwitter({
        accessToken,
        refreshToken,
        userId,
        username,
        expiresAt
      })
        .then(() => {
          updateUser({ 
            twitterConnected: true, 
            twitterAccount: { username, userId } 
          });
          toast.success(`X account @${username} connected successfully!`);
        })
        .catch((error) => {
          toast.error('Failed to save Twitter connection');
          console.error(error);
        })
        .finally(() => {
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else if (twitterError) {
      toast.error(`Twitter connection failed: ${twitterError}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [updateUser]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex space-x-1 border-b border-gray-200">
        {['profile', 'twitter', 'preferences', 'subscription'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                defaultValue={user?.name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                defaultValue={user?.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'twitter' && (
        <Card>
          <CardHeader>
            <CardTitle>X (Twitter) Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {user?.twitterConnected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Connected</p>
                      <p className="text-sm text-green-700">@{user?.twitterAccount?.username}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      try {
                        await profileAPI.disconnectTwitter();
                        updateUser({ twitterConnected: false, twitterAccount: null });
                        toast.success('X account disconnected');
                      } catch (error) {
                        toast.error('Failed to disconnect');
                      }
                    }}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Connect your X account</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Authenticate with X (Twitter) OAuth to enable analytics, AI features, and posting capabilities.
                    </p>
                  </div>
                </div>

                <div>
                  <Button 
                    onClick={async () => {
                      setLoading(true);
                      try {
                        // Get OAuth URL from backend
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/twitter`, {
                          headers: {
                            'Authorization': `Bearer ${useAuthStore.getState().token}`
                          }
                        });
                        const data = await response.json();
                        
                        if (data.status === 'success') {
                          // Redirect to Twitter OAuth
                          // Backend encodes codeVerifier in state parameter
                          window.location.href = data.data.authUrl;
                        } else {
                          toast.error('Failed to initiate Twitter authentication');
                        }
                      } catch (error) {
                        toast.error('Failed to connect X account');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    loading={loading}
                    className="w-full"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Connect with X (Twitter)
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center mt-2">
                    You'll be redirected to X to authorize Vibex. We only request permissions necessary for the features you use.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle>Content Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Likes Import */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Import Your X Likes</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Import your liked tweets so Vibex can analyze your interests and generate content that matches your style and preferences.
              </p>

              {user?.likesImported ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Likes Imported</p>
                        <p className="text-sm text-green-700">{user?.likesCount || 0} tweets analyzed</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        try {
                          setLoading(true);
                          await profileAPI.importLikes();
                          toast.success('Likes refreshed successfully!');
                        } catch (error) {
                          toast.error('Failed to refresh likes');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      loading={loading}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>

                  {/* AI Insights */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">AI Insights from Your Likes</p>
                    </div>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Prefers tech and AI-related content</li>
                      <li>• Engaged with productivity tips and tools</li>
                      <li>• Interested in startup and entrepreneurship topics</li>
                      <li>• Casual and conversational writing style</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-purple-900">Personalized Content Generation</p>
                      <p className="text-sm text-purple-700 mt-1">
                        By importing your likes, our AI will analyze your interests, preferred topics, and writing style to generate content that truly resonates with you.
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={async () => {
                      if (!user?.twitterConnected) {
                        toast.error('Please connect your X account first');
                        setActiveTab('twitter');
                        return;
                      }
                      try {
                        setLoading(true);
                        await profileAPI.importLikes();
                        updateUser({ likesImported: true, likesCount: 127 });
                        toast.success('Likes imported successfully! AI is analyzing your preferences...');
                      } catch (error) {
                        toast.error(error.response?.data?.message || 'Failed to import likes');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    loading={loading}
                    disabled={!user?.twitterConnected}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Import My Likes
                  </Button>

                  {!user?.twitterConnected && (
                    <p className="text-xs text-amber-600">
                      ⚠️ Connect your X account first to import likes
                    </p>
                  )}

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 font-medium">⚠️ Development Mode</p>
                    <p className="text-xs text-amber-700 mt-1">
                      In production, this feature will use Twitter OAuth to securely access your liked tweets. 
                      The AI will analyze content themes, writing styles, and topics you engage with to personalize content generation.
                      Currently, demo data is used to illustrate the feature.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'subscription' && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold capitalize">{user?.subscription?.tier} Plan</h3>
                <p className="text-sm text-gray-600">Current plan status</p>
              </div>
              <Button>Upgrade Plan</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;
