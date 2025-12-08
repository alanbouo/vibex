import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// User API
export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  updatePreferences: (data) => api.put('/users/preferences', data),
  getUsage: () => api.get('/users/usage'),
  deleteAccount: () => api.delete('/users/account'),
};

// Tweet API
export const tweetAPI = {
  createTweet: (data) => api.post('/tweets', data),
  getTweets: (params) => api.get('/tweets', { params }),
  getTweet: (id) => api.get(`/tweets/${id}`),
  updateTweet: (id, data) => api.put(`/tweets/${id}`, data),
  deleteTweet: (id) => api.delete(`/tweets/${id}`),
  publishTweet: (id) => api.post(`/tweets/${id}/publish`),
  getTopPerformers: (limit) => api.get('/tweets/top-performers', { params: { limit } }),
};

// AI API
export const aiAPI = {
  generateTweet: (data) => api.post('/ai/generate-tweet', data),
  generateVariations: (data) => api.post('/ai/generate-variations', data),
  rewriteTweet: (data) => api.post('/ai/rewrite-tweet', data),
  generateThread: (data) => api.post('/ai/generate-thread', data),
  generateIdeas: (data) => api.post('/ai/generate-ideas', data),
  analyzeSentiment: (data) => api.post('/ai/analyze-sentiment', data),
  predictEngagement: (data) => api.post('/ai/predict-engagement', data),
};

// Scheduler API
export const schedulerAPI = {
  scheduleTweet: (data) => api.post('/scheduler/schedule', data),
  getScheduledTweets: () => api.get('/scheduler/scheduled'),
  cancelScheduledTweet: (id) => api.delete(`/scheduler/scheduled/${id}`),
  rescheduleTweet: (id, data) => api.put(`/scheduler/scheduled/${id}`, data),
  getOptimalTime: () => api.get('/scheduler/optimal-time'),
  autoRepost: (data) => api.post('/scheduler/auto-repost', data),
};

// Analytics API
export const analyticsAPI = {
  getSummary: (params) => api.get('/analytics/summary', { params }),
  getTweetPerformance: (params) => api.get('/analytics/tweets', { params }),
  getGrowthMetrics: (params) => api.get('/analytics/growth', { params }),
  syncTwitterAnalytics: () => api.post('/analytics/sync'),
  getAudienceInsights: () => api.get('/analytics/audience'),
  getContentPerformance: () => api.get('/analytics/content-performance'),
  getImportedAnalytics: (months = 3) => api.get('/analytics/imported', { params: { months } }),
};

// Profile API (Extension-based, no Twitter API)
export const profileAPI = {
  // Extension data import
  importExtensionData: (data) => api.post('/profiles/import-extension-data', data),
  
  // Style profile & generation
  getStyleProfile: () => api.get('/profiles/style'),
  generateReplies: (data) => api.post('/profiles/generate-replies', data),
  generateQuotes: (data) => api.post('/profiles/generate-quotes', data),
  generateStyledTweet: (data) => api.post('/profiles/generate-styled-tweet', data),
  refineSuggestion: (data) => api.post('/profiles/refine-suggestion', data),
  
  // Feedback for AI improvement
  submitFeedback: (data) => api.post('/profiles/feedback', data),
  getFeedbackStats: () => api.get('/profiles/feedback/stats'),
};

export default api;
