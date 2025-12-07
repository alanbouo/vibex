import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, MessageSquare, BarChart2, Chrome, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { analyticsAPI, tweetAPI } from '../services/api';
import { formatNumber } from '../lib/utils';
import { useAuthStore } from '../store/authStore';
import Button from '../components/Button';

const StatCard = ({ title, value, change, icon: Icon, trend }) => (
  <Card>
    <CardContent className="p-3 sm:p-6">
      <div className="flex items-start sm:items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 sm:mt-2">{value}</h3>
          {change && (
            <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑' : '↓'} {change}%
            </p>
          )}
        </div>
        <div className="p-2 sm:p-3 bg-blue-50 rounded-lg flex-shrink-0">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user } = useAuthStore();
  // Check if user has imported data via Chrome extension
  const extensionDataImported = user?.extensionDataImportedAt ? true : false;

  const { data: analyticsData, isError: analyticsError } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsAPI.getSummary({ period: 'daily' }),
    enabled: extensionDataImported,
    retry: 1,
    onError: (error) => {
      console.error('Analytics fetch error:', error);
    }
  });

  const { data: topTweets } = useQuery({
    queryKey: ['top-tweets'],
    queryFn: () => tweetAPI.getTopPerformers(5),
    enabled: false, // Disabled for demo mode - using demo data instead
  });

  // Show onboarding if extension data not imported
  if (!extensionDataImported) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome to Vibex! 👋</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Let's get you started</p>
        </div>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-5 sm:p-8">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-full mb-4">
                <Chrome className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Import Your X Data</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                Use our Chrome extension to import your tweets and style. This helps the AI learn your voice and generate content that sounds like you.
              </p>
              <Link to="/settings">
                <Button size="lg" className="inline-flex items-center w-full sm:w-auto justify-center">
                  Set Up Chrome Extension
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="p-3 bg-blue-100 rounded-lg w-fit mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Content</h3>
              <p className="text-sm text-gray-600">
                Generate engaging tweets, threads, and variations with advanced AI models.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
                <BarChart2 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Deep Analytics</h3>
              <p className="text-sm text-gray-600">
                Track performance, engagement rates, and audience insights in real-time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
              <p className="text-sm text-gray-600">
                Schedule tweets at optimal times and automate your content strategy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Demo data for development mode (simulates production data)
  const demoStats = {
    followers: 12847,
    followersChange: 8.3,
    engagementRate: 4.7,
    engagementRateChange: 12.1,
    tweetsCount: 34,
    tweetsCountChange: 6.2,
    impressions: 287500,
    impressionsChange: 15.8,
  };

  const demoTweets = [
    {
      _id: '1',
      content: 'Just launched our new AI-powered content strategy! 🚀 The results have been incredible - 3x engagement in just 2 weeks. Thread below 👇',
      analytics: { likes: 1247, retweets: 342, replies: 89, bookmarks: 456, engagementRate: 5.8 }
    },
    {
      _id: '2',
      content: 'Hot take: The future of social media marketing is not about posting more, it\'s about posting smarter. Quality > Quantity every single time.',
      analytics: { likes: 892, retweets: 234, replies: 67, bookmarks: 312, engagementRate: 4.9 }
    },
    {
      _id: '3',
      content: 'Sharing my top 5 tools for content creators in 2024:\n\n1. AI writing assistants\n2. Analytics platforms\n3. Scheduling tools\n4. Design software\n5. Community management\n\nWhat would you add?',
      analytics: { likes: 756, retweets: 189, replies: 124, bookmarks: 278, engagementRate: 4.2 }
    },
    {
      _id: '4',
      content: 'The best time to post on X? When your audience is most active. Sounds obvious, but most people ignore their analytics. Data > Guesswork 📊',
      analytics: { likes: 634, retweets: 156, replies: 43, bookmarks: 201, engagementRate: 3.8 }
    },
    {
      _id: '5',
      content: 'Pro tip: Repurpose your best content. That tweet that got 10k impressions? Turn it into a thread, a blog post, a LinkedIn article. Maximize your ROI.',
      analytics: { likes: 521, retweets: 142, replies: 38, bookmarks: 167, engagementRate: 3.5 }
    }
  ];

  const stats = [
    {
      title: 'Total Followers',
      value: formatNumber(analyticsData?.data?.data?.followers || demoStats.followers),
      change: analyticsData?.data?.data?.followersChange || demoStats.followersChange,
      icon: Users,
      trend: 'up',
    },
    {
      title: 'Engagement Rate',
      value: `${(analyticsData?.data?.data?.engagementRate || demoStats.engagementRate).toFixed(1)}%`,
      change: analyticsData?.data?.data?.engagementRateChange || demoStats.engagementRateChange,
      icon: TrendingUp,
      trend: 'up',
    },
    {
      title: 'Tweets This Month',
      value: String(analyticsData?.data?.data?.tweetsCount || demoStats.tweetsCount),
      change: analyticsData?.data?.data?.tweetsCountChange || demoStats.tweetsCountChange,
      icon: MessageSquare,
      trend: 'up',
    },
    {
      title: 'Total Impressions',
      value: formatNumber(analyticsData?.data?.data?.impressions || demoStats.impressions),
      change: analyticsData?.data?.data?.impressionsChange || demoStats.impressionsChange,
      icon: BarChart2,
      trend: 'up',
    },
  ];

  // Check if we have real analytics data
  const hasAnalyticsData = analyticsData?.data?.analytics?.length > 0;
  const showDemoMode = !hasAnalyticsData || analyticsError;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Demo Mode Banner */}
      {showDemoMode && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-3 sm:p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-amber-800">Demo Mode Active</h3>
              <p className="mt-1 text-sm text-amber-700">
                {extensionDataImported 
                  ? "You're viewing demo data because your analytics haven't been synced yet. Go to Settings to sync your X analytics data."
                  : "You're viewing demo data to illustrate the production experience. Import your X data via the Chrome extension to see real analytics."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Overview of your X performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Performing Tweets */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Tweets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {demoTweets.map((tweet) => (
                <div key={tweet._id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 line-clamp-2">{tweet.content}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-500">
                      <span>❤️ {formatNumber(tweet.analytics.likes)}</span>
                      <span>🔁 {formatNumber(tweet.analytics.retweets)}</span>
                      <span>💬 {formatNumber(tweet.analytics.replies)}</span>
                      <span className="hidden sm:inline">🔖 {formatNumber(tweet.analytics.bookmarks)}</span>
                      <span className="font-medium text-blue-600">
                        {tweet.analytics.engagementRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">Generate AI Tweet</h3>
                    <p className="text-sm text-gray-500">Create content with AI</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200">
                    <BarChart2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">View Analytics</h3>
                    <p className="text-sm text-gray-500">Check your performance</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900">Schedule Tweets</h3>
                    <p className="text-sm text-gray-500">Plan your content</p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
              <span className="text-gray-600">AI-generated tweet scheduled for tomorrow at 10:00 AM</span>
              <span className="text-gray-400 ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-600 rounded-full" />
              <span className="text-gray-600">Tweet published: "Hot take: The future of social media..."</span>
              <span className="text-gray-400 ml-auto">5 hours ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-purple-600 rounded-full" />
              <span className="text-gray-600">Analytics synced from X account</span>
              <span className="text-gray-400 ml-auto">1 day ago</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-amber-600 rounded-full" />
              <span className="text-gray-600">Generated 5 tweet variations with AI</span>
              <span className="text-gray-400 ml-auto">2 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
