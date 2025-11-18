// Content script for Vibex - Runs on Twitter/X pages

console.log('Vibex extension loaded');

// Configuration
const CONFIG = {
  selectors: {
    profileUsername: '[data-testid="UserName"]',
    tweet: '[data-testid="tweet"]',
    tweetText: '[data-testid="tweetText"]',
    profileHeader: '[data-testid="UserProfileHeader_Items"]',
  }
};

// Initialize extension on page load
function init() {
  // Add insights to profile pages
  if (window.location.pathname.includes('/status/')) {
    enhanceTweetPage();
  } else if (isProfilePage()) {
    enhanceProfilePage();
  }

  // Listen for dynamic content changes
  observePageChanges();
}

// Check if current page is a profile
function isProfilePage() {
  const path = window.location.pathname;
  return path.split('/').length === 2 && !path.includes('home') && !path.includes('explore');
}

// Add insights to profile pages
function enhanceProfilePage() {
  const username = extractUsername();
  if (!username) return;

  // Add insights card to profile
  setTimeout(() => {
    addProfileInsightsCard(username);
  }, 1000);
}

// Add insights to individual tweet pages
function enhanceTweetPage() {
  setTimeout(() => {
    addTweetInsightsCard();
  }, 1000);
}

// Extract username from profile page
function extractUsername() {
  try {
    const path = window.location.pathname;
    return path.split('/')[1];
  } catch (error) {
    return null;
  }
}

// Add insights card to profile
function addProfileInsightsCard(username) {
  const profileHeader = document.querySelector(CONFIG.selectors.profileHeader);
  if (!profileHeader || document.getElementById('vibex-insights')) return;

  const insightsCard = createInsightsCard('profile', username);
  profileHeader.parentElement.insertBefore(insightsCard, profileHeader.nextSibling);

  // Fetch and display insights
  fetchProfileInsights(username);
}

// Add insights card to tweet
function addTweetInsightsCard() {
  const tweetElement = document.querySelector(CONFIG.selectors.tweet);
  if (!tweetElement || document.getElementById('vibex-tweet-insights')) return;

  const insightsCard = createInsightsCard('tweet');
  tweetElement.parentElement.insertBefore(insightsCard, tweetElement.nextSibling);
}

// Create insights card UI
function createInsightsCard(type, username = '') {
  const card = document.createElement('div');
  card.id = type === 'profile' ? 'vibex-insights' : 'vibex-tweet-insights';
  card.className = 'vibex-card';
  
  card.innerHTML = `
    <div class="vibex-header">
      <svg class="vibex-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="vibex-title">Vibex Insights</span>
    </div>
    <div class="vibex-content" id="vibex-content">
      <div class="vibex-loading">Loading insights...</div>
    </div>
  `;

  return card;
}

// Fetch profile insights from background script
function fetchProfileInsights(username) {
  chrome.runtime.sendMessage(
    { action: 'analyzeProfile', username },
    (response) => {
      if (response && response.success) {
        displayProfileInsights(response.data);
      } else {
        displayError('Failed to load insights');
      }
    }
  );
}

// Display profile insights
function displayProfileInsights(data) {
  const content = document.getElementById('vibex-content');
  if (!content) return;

  const analytics = data.data?.analytics || {};

  content.innerHTML = `
    <div class="vibex-stats">
      <div class="vibex-stat">
        <span class="stat-label">Avg Engagement</span>
        <span class="stat-value">${analytics.avgEngagement || 0}</span>
      </div>
      <div class="vibex-stat">
        <span class="stat-label">Avg Likes</span>
        <span class="stat-value">${analytics.avgLikes || 0}</span>
      </div>
      <div class="vibex-stat">
        <span class="stat-label">Avg Retweets</span>
        <span class="stat-value">${analytics.avgRetweets || 0}</span>
      </div>
    </div>
    <div class="vibex-tip">
      💡 This profile shows ${analytics.avgEngagement > 100 ? 'strong' : 'moderate'} engagement
    </div>
  `;
}

// Display error message
function displayError(message) {
  const content = document.getElementById('vibex-content');
  if (!content) return;

  content.innerHTML = `
    <div class="vibex-error">${message}</div>
  `;
}

// Observe page changes for single-page app navigation
function observePageChanges() {
  let lastPath = window.location.pathname;

  setInterval(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      lastPath = currentPath;
      
      // Remove old insights
      const oldInsights = document.getElementById('vibex-insights');
      if (oldInsights) oldInsights.remove();

      // Re-initialize
      setTimeout(init, 500);
    }
  }, 1000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
