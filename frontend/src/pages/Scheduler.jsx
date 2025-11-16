import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import { schedulerAPI } from '../services/api';

const Scheduler = () => {
  const [showNewTweet, setShowNewTweet] = useState(false);
  const [newTweet, setNewTweet] = useState({
    content: '',
    scheduledFor: '',
  });

  const queryClient = useQueryClient();

  const { data: scheduledTweets, isLoading } = useQuery({
    queryKey: ['scheduled-tweets'],
    queryFn: () => schedulerAPI.getScheduledTweets(),
  });

  const { data: optimalTime } = useQuery({
    queryKey: ['optimal-time'],
    queryFn: () => schedulerAPI.getOptimalTime(),
  });

  const scheduleMutation = useMutation({
    mutationFn: (data) => schedulerAPI.scheduleTweet(data),
    onSuccess: () => {
      toast.success('Tweet scheduled successfully!');
      queryClient.invalidateQueries(['scheduled-tweets']);
      setShowNewTweet(false);
      setNewTweet({ content: '', scheduledFor: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to schedule tweet');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => schedulerAPI.cancelScheduledTweet(id),
    onSuccess: () => {
      toast.success('Scheduled tweet cancelled');
      queryClient.invalidateQueries(['scheduled-tweets']);
    },
  });

  const handleSchedule = () => {
    if (!newTweet.content.trim()) {
      toast.error('Please enter tweet content');
      return;
    }

    if (!newTweet.scheduledFor) {
      toast.error('Please select a date and time');
      return;
    }

    scheduleMutation.mutate(newTweet);
  };

  const useOptimalTime = () => {
    if (optimalTime?.data?.data?.optimalTime) {
      const formatted = dayjs(optimalTime.data.data.optimalTime).format('YYYY-MM-DDTHH:mm');
      setNewTweet({ ...newTweet, scheduledFor: formatted });
      toast.success('Optimal time set!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduler</h1>
          <p className="text-gray-600 mt-1">Plan and schedule your tweets</p>
        </div>
        <Button onClick={() => setShowNewTweet(!showNewTweet)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Tweet
        </Button>
      </div>

      {/* Optimal Time Card */}
      {optimalTime?.data?.data && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  🎯 Optimal Posting Time
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Based on your audience's activity
                </p>
                <p className="text-lg font-bold text-blue-600">
                  {dayjs(optimalTime.data.data.optimalTime).format('MMM D, YYYY at h:mm A')}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={useOptimalTime}>
                Use This Time
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Tweet Form */}
      {showNewTweet && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule New Tweet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tweet Content
              </label>
              <textarea
                value={newTweet.content}
                onChange={(e) => setNewTweet({ ...newTweet, content: e.target.value })}
                placeholder="What's on your mind?"
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={280}
              />
              <p className="text-xs text-gray-500 mt-1">
                {newTweet.content.length}/280 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule For
              </label>
              <input
                type="datetime-local"
                value={newTweet.scheduledFor}
                onChange={(e) => setNewTweet({ ...newTweet, scheduledFor: e.target.value })}
                min={dayjs().format('YYYY-MM-DDTHH:mm')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSchedule} loading={scheduleMutation.isPending}>
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Tweet
              </Button>
              <Button variant="outline" onClick={() => setShowNewTweet(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Tweets List */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Tweets</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Loading...</p>
          ) : scheduledTweets?.data?.data?.tweets?.length > 0 ? (
            <div className="space-y-3">
              {scheduledTweets.data.data.tweets.map((tweet) => (
                <div
                  key={tweet._id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 mb-2">{tweet.content}</p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {dayjs(tweet.scheduledFor).format('MMM D, YYYY')}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {dayjs(tweet.scheduledFor).format('h:mm A')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelMutation.mutate(tweet._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Cancel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No scheduled tweets</p>
              <p className="text-sm text-gray-400 mt-1">
                Schedule your first tweet to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Scheduler;
