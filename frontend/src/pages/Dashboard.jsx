import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, MessageSquare, BarChart2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { analyticsAPI, tweetAPI } from '../services/api';
import { formatNumber } from '../lib/utils';

const StatCard = ({ title, value, change, icon: Icon, trend }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
          {change && (
            <p className={`text-sm mt-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑' : '↓'} {change}%
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { data: analyticsData } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsAPI.getSummary({ period: 'daily' }),
  });

  const { data: topTweets } = useQuery({
    queryKey: ['top-tweets'],
    queryFn: () => tweetAPI.getTopPerformers(5),
  });

  const stats = [
    {
      title: 'Total Followers',
      value: formatNumber(15420),
      change: 12.5,
      icon: Users,
      trend: 'up',
    },
    {
      title: 'Engagement Rate',
      value: '4.2%',
      change: 8.3,
      icon: TrendingUp,
      trend: 'up',
    },
    {
      title: 'Tweets This Month',
      value: '48',
      change: -5.2,
      icon: MessageSquare,
      trend: 'down',
    },
    {
      title: 'Total Impressions',
      value: formatNumber(125000),
      change: 18.7,
      icon: BarChart2,
      trend: 'up',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your X performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Tweets */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Tweets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topTweets?.data?.data?.tweets?.slice(0, 5).map((tweet) => (
                <div key={tweet._id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 line-clamp-2">{tweet.content}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>❤️ {formatNumber(tweet.analytics.likes)}</span>
                      <span>🔁 {formatNumber(tweet.analytics.retweets)}</span>
                      <span>💬 {formatNumber(tweet.analytics.replies)}</span>
                      <span className="font-medium text-blue-600">
                        {tweet.analytics.engagementRate.toFixed(1)}% ER
                      </span>
                    </div>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500 text-center py-4">No tweets yet</p>
              )}
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
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <span className="text-gray-600">Tweet scheduled for tomorrow at 10:00 AM</span>
                <span className="text-gray-400 ml-auto">2 hours ago</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
