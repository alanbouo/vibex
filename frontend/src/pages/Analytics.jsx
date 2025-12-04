import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Heart, Repeat2, RefreshCw, MessageSquare, Eye, FileText, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import { analyticsAPI } from '../services/api';
import { formatNumber } from '../lib/utils';

const Analytics = () => {
  const { data: analyticsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['imported-analytics'],
    queryFn: () => analyticsAPI.getImportedAnalytics(),
  });

  const analytics = analyticsData?.data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!analytics?.hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your X performance</p>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data Yet</h3>
              <p className="text-gray-600 mb-4">
                Import your posts using the Chrome extension to see your analytics.
              </p>
              <Button onClick={() => window.location.href = '/settings'}>
                Go to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, averages, postTypes, topPosts } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Data from {summary.totalPosts} imported posts
            {analytics.lastImported && (
              <span className="text-xs text-gray-400 ml-2">
                Last synced: {new Date(analytics.lastImported).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Posts</span>
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold">{formatNumber(summary.totalPosts)}</h3>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Impressions</span>
              <Eye className="w-5 h-5 text-cyan-600" />
            </div>
            <h3 className="text-2xl font-bold">{formatNumber(summary.totalImpressions)}</h3>
            <p className="text-xs text-gray-500 mt-1">~{formatNumber(averages.impressionsPerPost)}/post</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Likes</span>
              <Heart className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold">{formatNumber(summary.totalLikes)}</h3>
            <p className="text-xs text-gray-500 mt-1">~{averages.likesPerPost}/post</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Retweets</span>
              <Repeat2 className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold">{formatNumber(summary.totalRetweets)}</h3>
            <p className="text-xs text-gray-500 mt-1">~{averages.retweetsPerPost}/post</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Engagement</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold">{summary.engagementRate}</h3>
            <p className="text-xs text-gray-500 mt-1">{formatNumber(summary.totalReplies)} replies</p>
          </CardContent>
        </Card>
      </div>

      {/* Post Types Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Post Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(postTypes).map(([type, count]) => {
                const total = summary.totalPosts;
                const percentage = ((count / total) * 100).toFixed(0);
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        type === 'original' ? 'bg-blue-100 text-blue-700' :
                        type === 'reply' ? 'bg-green-100 text-green-700' :
                        type === 'retweet' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-16 text-right">{count} ({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Averages */}
        <Card>
          <CardHeader>
            <CardTitle>Per-Post Averages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-cyan-50 rounded-lg text-center">
                <Eye className="w-5 h-5 text-cyan-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-cyan-700">{formatNumber(averages.impressionsPerPost)}</p>
                <p className="text-xs text-gray-600">Impressions</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <Heart className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-red-700">{averages.likesPerPost}</p>
                <p className="text-xs text-gray-600">Likes</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <Repeat2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-700">{averages.retweetsPerPost}</p>
                <p className="text-xs text-gray-600">Retweets</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <MessageSquare className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-blue-700">{averages.repliesPerPost}</p>
                <p className="text-xs text-gray-600">Replies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
        </CardHeader>
        <CardContent>
          {topPosts.length > 0 ? (
            <div className="space-y-3">
              {topPosts.map((post, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <p className="text-sm text-gray-900 mb-3">{post.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(post.metrics?.impression_count || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-red-500" />
                        {formatNumber(post.metrics?.like_count || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat2 className="w-3 h-3 text-green-500" />
                        {formatNumber(post.metrics?.retweet_count || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-blue-500" />
                        {formatNumber(post.metrics?.reply_count || 0)}
                      </span>
                    </div>
                    {post.url && (
                      <a 
                        href={post.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No posts to display
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
