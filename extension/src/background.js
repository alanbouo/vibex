// Background service worker for X Enhancer extension

const API_URL = 'http://localhost:5000/api';

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('X Enhancer extension installed');
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeProfile') {
    analyzeProfile(request.username)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === 'getTweetInsights') {
    getTweetInsights(request.tweetId)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Analyze a Twitter profile
async function analyzeProfile(username) {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_URL}/profiles/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Profile analysis error:', error);
    throw error;
  }
}

// Get insights for a specific tweet
async function getTweetInsights(tweetId) {
  // Mock implementation - would use actual API
  return {
    predictedEngagement: 75,
    sentiment: 'positive',
    suggestedHashtags: ['#productivity', '#tech', '#growth']
  };
}

// Get auth token from storage
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      resolve(result.authToken || null);
    });
  });
}

// Save auth token to storage
function saveAuthToken(token) {
  chrome.storage.local.set({ authToken: token });
}

// Clear auth token
function clearAuthToken() {
  chrome.storage.local.remove(['authToken']);
}
