// Popup script for X Enhancer extension

document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  setupEventListeners();
});

// Load user data from storage
function loadUserData() {
  chrome.storage.local.get(['user', 'usage'], (result) => {
    if (result.user) {
      document.getElementById('currentPlan').textContent = 
        result.user.subscription?.tier || 'Free';
    }

    if (result.usage) {
      document.getElementById('usageToday').textContent = 
        `${result.usage.tweetsGenerated || 0}/10`;
    }
  });
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
  });

  document.getElementById('generateTweet').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/ai-writer' });
  });

  document.getElementById('viewAnalytics').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000/analytics' });
  });
}
