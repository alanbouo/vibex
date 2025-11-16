import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, Heart, Repeat2, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import { analyticsAPI } from '../services/api';
import { formatNumber } from '../lib/utils';

const Analytics = () => {
  const [period, setPeriod] = useState('30');

  const { data: growthData } = useQuery({
    queryKey: ['growth-metrics', period],
    queryFn: () => analyticsAPI.getGrowthMetrics({ days: period }),
  });

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
          <p className="text-gray-500">Chart visualization will appear here</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
