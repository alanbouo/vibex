// Content script for X Enhancer - Runs on Twitter/X pages

console.log('X Enhancer extension loaded');

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
  if (!profileHeader || document.getElementById('x-enhancer-insights')) return;

  const insightsCard = createInsightsCard('profile', username);
  profileHeader.parentElement.insertBefore(insightsCard, profileHeader.nextSibling);

  // Fetch and display insights
  fetchProfileInsights(username);
}

// Add insights card to tweet
function addTweetInsightsCard() {
  const tweetElement = document.querySelector(CONFIG.selectors.tweet);
  if (!tweetElement || document.getElementById('x-enhancer-tweet-insights')) return;

  const insightsCard = createInsightsCard('tweet');
  tweetElement.parentElement.insertBefore(insightsCard, tweetElement.nextSibling);
}

// Create insights card UI
function createInsightsCard(type, username = '') {
  const card = document.createElement('div');
  card.id = type === 'profile' ? 'x-enhancer-insights' : 'x-enhancer-tweet-insights';
  card.className = 'x-enhancer-card';
  
  card.innerHTML = `
    <div class="x-enhancer-header">
      <svg class="x-enhancer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="x-enhancer-title">X Enhancer Insights</span>
    </div>
    <div class="x-enhancer-content" id="x-enhancer-content">
      <div class="x-enhancer-loading">Loading insights...</div>
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
  const content = document.getElementById('x-enhancer-content');
  if (!content) return;

  const analytics = data.data?.analytics || {};

  content.innerHTML = `
    <div class="x-enhancer-stats">
      <div class="x-enhancer-stat">
        <span class="stat-label">Avg Engagement</span>
        <span class="stat-value">${analytics.avgEngagement || 0}</span>
      </div>
      <div class="x-enhancer-stat">
        <span class="stat-label">Avg Likes</span>
        <span class="stat-value">${analytics.avgLikes || 0}</span>
      </div>
      <div class="x-enhancer-stat">
        <span class="stat-label">Avg Retweets</span>
        <span class="stat-value">${analytics.avgRetweets || 0}</span>
      </div>
    </div>
    <div class="x-enhancer-tip">
      💡 This profile shows ${analytics.avgEngagement > 100 ? 'strong' : 'moderate'} engagement
    </div>
  `;
}

// Display error message
function displayError(message) {
  const content = document.getElementById('x-enhancer-content');
  if (!content) return;

  content.innerHTML = `
    <div class="x-enhancer-error">${message}</div>
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
      const oldInsights = document.getElementById('x-enhancer-insights');
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
