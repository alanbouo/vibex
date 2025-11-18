import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Heart, Repeat2, RefreshCw, MessageSquare, Bookmark, Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import { analyticsAPI } from '../services/api';
import { formatNumber } from '../lib/utils';

const Analytics = () => {
  const [period, setPeriod] = useState('30');
  const [contentFilter, setContentFilter] = useState('all');

  const { data: growthData } = useQuery({
    queryKey: ['growth-metrics', period],
    queryFn: () => analyticsAPI.getGrowthMetrics({ days: period }),
    enabled: false, // Disabled for demo mode
  });

  // Demo growth data for the last 3 months (12 weeks) - with realistic ups and downs
  const demoGrowthData = [
    { date: 'Aug 1', followers: 8200, engagement: 2.1, tweets: 5 },
    { date: 'Aug 8', followers: 8350, engagement: 1.9, tweets: 4 },  // Slow week
    { date: 'Aug 15', followers: 8900, engagement: 2.8, tweets: 8 },  // Good week
    { date: 'Aug 22', followers: 9200, engagement: 2.4, tweets: 6 },
    { date: 'Aug 29', followers: 9800, engagement: 3.2, tweets: 10 }, // Great week
    { date: 'Sep 5', followers: 10100, engagement: 2.9, tweets: 7 }, // Slight dip
    { date: 'Sep 12', followers: 11200, engagement: 4.1, tweets: 12 }, // Viral content
    { date: 'Sep 19', followers: 11600, engagement: 3.5, tweets: 9 },
    { date: 'Sep 26', followers: 12400, engagement: 3.8, tweets: 11 },
    { date: 'Oct 3', followers: 12800, engagement: 3.3, tweets: 8 },  // Quiet week
    { date: 'Oct 10', followers: 14100, engagement: 4.8, tweets: 14 }, // Another viral hit
    { date: 'Oct 17', followers: 15420, engagement: 5.2, tweets: 16 }, // Best week ever
  ];

  // Demo content data
  const demoContent = [
    {
      id: '1',
      content: 'Just launched our new AI-powered content strategy! 🚀 The results have been incredible - 3x engagement in just 2 weeks.',
      date: '2024-11-15',
      type: 'tweet',
      status: 'published',
      metrics: { impressions: 45200, likes: 1247, retweets: 342, replies: 89, bookmarks: 456, engagementRate: 5.8 }
    },
    {
      id: '2',
      content: 'Hot take: The future of social media marketing is not about posting more, it\'s about posting smarter. Quality > Quantity.',
      date: '2024-11-14',
      type: 'tweet',
      status: 'published',
      metrics: { impressions: 38900, likes: 892, retweets: 234, replies: 67, bookmarks: 312, engagementRate: 4.9 }
    },
    {
      id: '3',
      content: 'Sharing my top 5 tools for content creators in 2024: 1. AI assistants 2. Analytics 3. Scheduling 4. Design 5. Community',
      date: '2024-11-13',
      type: 'thread',
      status: 'published',
      metrics: { impressions: 32100, likes: 756, retweets: 189, replies: 124, bookmarks: 278, engagementRate: 4.2 }
    },
    {
      id: '4',
      content: 'The best time to post on X? When your audience is most active. Data > Guesswork 📊',
      date: '2024-11-12',
      type: 'tweet',
      status: 'published',
      metrics: { impressions: 28400, likes: 634, retweets: 156, replies: 43, bookmarks: 201, engagementRate: 3.8 }
    },
    {
      id: '5',
      content: 'Pro tip: Repurpose your best content. That tweet that got 10k impressions? Turn it into a thread, blog post, LinkedIn article.',
      date: '2024-11-11',
      type: 'tweet',
      status: 'published',
      metrics: { impressions: 24700, likes: 521, retweets: 142, replies: 38, bookmarks: 167, engagementRate: 3.5 }
    },
    {
      id: '6',
      content: 'AI-generated tweet about productivity hacks for remote workers. Scheduled for optimal engagement time.',
      date: '2024-11-19',
      type: 'tweet',
      status: 'scheduled',
      metrics: { impressions: 0, likes: 0, retweets: 0, replies: 0, bookmarks: 0, engagementRate: 0 }
    },
    {
      id: '7',
      content: 'Draft: Exploring the intersection of AI and creative work. How automation enhances rather than replaces human creativity.',
      date: '2024-11-18',
      type: 'tweet',
      status: 'draft',
      metrics: { impressions: 0, likes: 0, retweets: 0, replies: 0, bookmarks: 0, engagementRate: 0 }
    },
  ];

  const filteredContent = contentFilter === 'all' 
    ? demoContent 
    : demoContent.filter(item => item.status === contentFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Followers</span>
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold">{formatNumber(15420)}</h3>
            <p className="text-sm text-green-600 mt-1">↑ 12.5%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Likes</span>
              <Heart className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold">{formatNumber(8920)}</h3>
            <p className="text-sm text-green-600 mt-1">↑ 18.3%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Retweets</span>
              <Repeat2 className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold">{formatNumber(3450)}</h3>
            <p className="text-sm text-green-600 mt-1">↑ 22.1%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Engagement</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold">4.2%</h3>
            <p className="text-sm text-green-600 mt-1">↑ 8.7%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Growth Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Followers Growth Chart */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Follower Growth</h3>
                <span className="text-xs text-gray-500">Last 3 months</span>
              </div>
              <div className="relative h-64 px-2">
                <div className="flex items-end justify-between space-x-1 h-full">
                  {demoGrowthData.map((week, index) => {
                    const allFollowers = demoGrowthData.map(w => w.followers);
                    const maxFollowers = Math.max(...allFollowers);
                    const minFollowers = Math.min(...allFollowers);
                    const range = maxFollowers - minFollowers;
                    // Scale from baseline with better visibility
                    const heightPercentage = 30 + ((week.followers - minFollowers) / range) * 70;
                    const heightPx = (heightPercentage / 100) * 240; // 240px = h-60 approximate
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center min-w-[50px]">
                        <div className="flex flex-col items-center w-full">
                          <div className="text-[10px] font-medium text-gray-700 mb-1">
                            {formatNumber(week.followers)}
                          </div>
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-500 relative group"
                            style={{ height: `${heightPx}px` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                {week.tweets} tweets
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-[9px] text-gray-600 mt-2 font-medium">{week.date}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Engagement Rate Chart */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Engagement Rate Trend</h3>
                <span className="text-xs text-green-600">↑ 148% increase</span>
              </div>
              <div className="relative h-48 px-2">
                <div className="flex items-end justify-between space-x-1 h-full">
                  {demoGrowthData.map((week, index) => {
                    const allEngagement = demoGrowthData.map(w => w.engagement);
                    const maxEngagement = Math.max(...allEngagement);
                    const minEngagement = Math.min(...allEngagement);
                    const range = maxEngagement - minEngagement;
                    // Scale from baseline with better visibility
                    const heightPercentage = 30 + ((week.engagement - minEngagement) / range) * 70;
                    const heightPx = (heightPercentage / 100) * 180; // 180px = h-48 approximate
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center min-w-[50px]">
                        <div className="flex flex-col items-center w-full">
                          <div className="text-[10px] font-medium text-gray-700 mb-1">
                            {week.engagement.toFixed(1)}%
                          </div>
                          <div
                            className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500 hover:from-purple-600 hover:to-purple-500"
                            style={{ height: `${heightPx}px` }}
                          />
                        </div>
                        <div className="text-[9px] text-gray-600 mt-2 font-medium">{week.date}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">+7,220</p>
                <p className="text-xs text-gray-600 mt-1">New Followers (3 months)</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">+148%</p>
                <p className="text-xs text-gray-600 mt-1">Engagement Growth</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">110</p>
                <p className="text-xs text-gray-600 mt-1">Total Tweets</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tracking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Content Performance</CardTitle>
            <div className="flex items-center space-x-2">
              <select
                value={contentFilter}
                onChange={(e) => setContentFilter(e.target.value)}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg"
              >
                <option value="all">All Content</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Drafts</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.status === 'published' 
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.type === 'thread'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">{item.date}</span>
                    </div>
                    <p className="text-sm text-gray-900 line-clamp-2">{item.content}</p>
                  </div>
                </div>

                {item.status === 'published' && (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Impressions</p>
                        <p className="text-sm font-semibold text-gray-900">{formatNumber(item.metrics.impressions)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      <div>
                        <p className="text-xs text-gray-500">Likes</p>
                        <p className="text-sm font-semibold text-gray-900">{formatNumber(item.metrics.likes)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Repeat2 className="w-4 h-4 text-green-400" />
                      <div>
                        <p className="text-xs text-gray-500">Retweets</p>
                        <p className="text-sm font-semibold text-gray-900">{formatNumber(item.metrics.retweets)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-500">Replies</p>
                        <p className="text-sm font-semibold text-gray-900">{formatNumber(item.metrics.replies)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Bookmark className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="text-xs text-gray-500">Bookmarks</p>
                        <p className="text-sm font-semibold text-gray-900">{formatNumber(item.metrics.bookmarks)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-500">Eng. Rate</p>
                        <p className="text-sm font-semibold text-purple-600">{item.metrics.engagementRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {item.status === 'scheduled' && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-blue-600">⏰ Scheduled for {item.date} at 10:00 AM</p>
                  </div>
                )}

                {item.status === 'draft' && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">💾 Saved as draft</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredContent.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No content found for this filter</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
