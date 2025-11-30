// Content script for Vibex - Runs on Twitter/X pages
// Version 2.0 - Data Collection & AI Writing Assistant

console.log('Vibex extension v2.0 loaded');

// Configuration
const CONFIG = {
  selectors: {
    // Tweet selectors
    tweet: '[data-testid="tweet"]',
    tweetText: '[data-testid="tweetText"]',
    tweetTime: 'time',
    tweetLink: 'a[href*="/status/"]',
    // Engagement selectors
    replyCount: '[data-testid="reply"]',
    retweetCount: '[data-testid="retweet"]',
    likeCount: '[data-testid="like"]',
    viewCount: '[data-testid="views"]',
    // Profile selectors
    profileUsername: '[data-testid="UserName"]',
    profileHeader: '[data-testid="UserProfileHeader_Items"]',
    // Compose selectors
    composeBox: '[data-testid="tweetTextarea_0"]',
    composeButton: '[data-testid="tweetButtonInline"]',
  }
};

// State
let isCollecting = false;
let collectedPosts = [];
let collectedLikes = [];
let writerPanel = null;

// ==========================================
// INITIALIZATION
// ==========================================

function init() {
  console.log('Vibex: Initializing...');
  
  // Detect page type and add appropriate UI
  const pageType = detectPageType();
  
  if (pageType === 'profile' || pageType === 'likes') {
    addCollectorUI();
  }
  
  if (pageType === 'compose' || pageType === 'home') {
    addWriterButton();
  }
  
  // Always add floating action button
  addFloatingButton();
  
  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Observe page changes
  observePageChanges();
}

// ==========================================
// PAGE DETECTION
// ==========================================

function detectPageType() {
  const path = window.location.pathname;
  
  if (path.includes('/likes')) return 'likes';
  if (path.includes('/status/')) return 'tweet';
  if (path === '/compose/tweet') return 'compose';
  if (path === '/home') return 'home';
  if (path.split('/').length === 2 && !['home', 'explore', 'notifications', 'messages', 'search'].includes(path.split('/')[1])) {
    return 'profile';
  }
  return 'other';
}

function extractUsername() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(p => p);
  return parts[0] || null;
}

// ==========================================
// POST SCRAPING
// ==========================================

function scrapeTweets() {
  const tweets = document.querySelectorAll(CONFIG.selectors.tweet);
  const scrapedData = [];
  
  tweets.forEach((tweet, index) => {
    try {
      const data = extractTweetData(tweet);
      // Accept posts with ID (even without text - for media-only posts, retweets, etc.)
      if (data && data.id) {
        scrapedData.push(data);
      }
    } catch (error) {
      console.error('Vibex: Error scraping tweet', index, error);
    }
  });
  
  return scrapedData;
}

function extractTweetData(tweetElement) {
  // Get tweet text (may be empty for media-only posts)
  const textElement = tweetElement.querySelector(CONFIG.selectors.tweetText);
  const text = textElement ? textElement.innerText : '';
  
  // Get tweet link/ID - try multiple selectors
  let tweetUrl = '';
  let tweetId = '';
  
  // Method 1: Direct status link
  const linkElement = tweetElement.querySelector('a[href*="/status/"]');
  if (linkElement) {
    tweetUrl = linkElement.href;
    tweetId = tweetUrl.split('/status/')[1]?.split('?')[0]?.split('/')[0] || '';
  }
  
  // Method 2: From time element's parent link
  if (!tweetId) {
    const timeLink = tweetElement.querySelector('time')?.closest('a');
    if (timeLink && timeLink.href.includes('/status/')) {
      tweetUrl = timeLink.href;
      tweetId = tweetUrl.split('/status/')[1]?.split('?')[0]?.split('/')[0] || '';
    }
  }
  
  // Get timestamp
  const timeElement = tweetElement.querySelector('time');
  const timestamp = timeElement ? timeElement.getAttribute('datetime') : '';
  const displayTime = timeElement ? timeElement.innerText : '';
  
  // Get engagement metrics
  const metrics = extractEngagementMetrics(tweetElement);
  
  // Get author info
  const authorInfo = extractAuthorInfo(tweetElement);
  
  // Detect post type
  const postType = detectPostType(tweetElement);
  
  // Get media info
  const mediaInfo = extractMediaInfo(tweetElement);
  
  return {
    id: tweetId,
    text: text,
    url: tweetUrl,
    timestamp: timestamp,
    displayTime: displayTime,
    type: postType,
    ...mediaInfo,
    ...metrics,
    ...authorInfo,
    scrapedAt: new Date().toISOString()
  };
}

function detectPostType(tweetElement) {
  // Check if it's a retweet
  const socialContext = tweetElement.querySelector('[data-testid="socialContext"]');
  if (socialContext && socialContext.textContent.includes('reposted')) {
    return 'retweet';
  }
  
  // Check if it's a quote tweet
  const quoteTweet = tweetElement.querySelector('[data-testid="quoteTweet"]');
  if (quoteTweet) {
    return 'quote';
  }
  
  // Check if it's a reply
  const replyContext = tweetElement.querySelector('div[data-testid="tweet"] > div > div > div > span');
  if (replyContext && replyContext.textContent.includes('Replying to')) {
    return 'reply';
  }
  
  return 'original';
}

function extractMediaInfo(tweetElement) {
  const hasImage = tweetElement.querySelector('[data-testid="tweetPhoto"]') !== null;
  const hasVideo = tweetElement.querySelector('[data-testid="videoPlayer"]') !== null;
  const hasCard = tweetElement.querySelector('[data-testid="card.wrapper"]') !== null;
  const hasPoll = tweetElement.querySelector('[data-testid="cardPoll"]') !== null;
  
  const mediaTypes = [];
  if (hasImage) mediaTypes.push('image');
  if (hasVideo) mediaTypes.push('video');
  if (hasCard) mediaTypes.push('card');
  if (hasPoll) mediaTypes.push('poll');
  
  return {
    hasMedia: mediaTypes.length > 0,
    mediaTypes: mediaTypes
  };
}

function extractEngagementMetrics(tweetElement) {
  const getMetricValue = (selector) => {
    const element = tweetElement.querySelector(selector);
    if (!element) return 0;
    const text = element.innerText || element.getAttribute('aria-label') || '';
    const match = text.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
  };
  
  return {
    replies: getMetricValue(CONFIG.selectors.replyCount),
    retweets: getMetricValue(CONFIG.selectors.retweetCount),
    likes: getMetricValue(CONFIG.selectors.likeCount),
    views: getMetricValue(CONFIG.selectors.viewCount)
  };
}

function extractAuthorInfo(tweetElement) {
  const userNameElement = tweetElement.querySelector('[data-testid="User-Name"]');
  if (!userNameElement) return { author: '', handle: '' };
  
  const links = userNameElement.querySelectorAll('a');
  const displayName = links[0]?.innerText || '';
  const handle = links[1]?.innerText || links[0]?.href?.split('/').pop() || '';
  
  return {
    author: displayName,
    handle: handle.replace('@', '')
  };
}

// ==========================================
// AUTO-SCROLL COLLECTION
// ==========================================

async function collectAllPosts(type = 'posts') {
  if (isCollecting) {
    stopCollection();
    return;
  }
  
  isCollecting = true;
  const collection = type === 'likes' ? collectedLikes : collectedPosts;
  const seenIds = new Set(collection.map(p => p.id));
  let noNewPostsCount = 0;
  let lastScrollHeight = 0;
  let stuckCount = 0;
  
  updateCollectorStatus(`Collecting ${type}... (0 collected)`);
  
  while (isCollecting) {
    const tweets = scrapeTweets();
    let newCount = 0;
    
    tweets.forEach(tweet => {
      if (tweet.id && !seenIds.has(tweet.id)) {
        seenIds.add(tweet.id);
        collection.push(tweet);
        newCount++;
      }
    });
    
    if (newCount === 0) {
      noNewPostsCount++;
    } else {
      noNewPostsCount = 0;
    }
    
    // Check if page is still loading new content
    const currentScrollHeight = document.documentElement.scrollHeight;
    const atBottom = (window.innerHeight + window.scrollY) >= currentScrollHeight - 100;
    
    if (currentScrollHeight === lastScrollHeight && atBottom) {
      stuckCount++;
    } else {
      stuckCount = 0;
      lastScrollHeight = currentScrollHeight;
    }
    
    updateCollectorStatus(`Collecting ${type}... (${collection.length} collected)`);
    
    // Stop only if we're truly at the end:
    // - No new posts for 10+ scrolls AND page height hasn't changed for 5+ scrolls
    if (noNewPostsCount >= 10 && stuckCount >= 5) {
      break;
    }
    
    // Scroll down
    window.scrollBy(0, window.innerHeight * 0.8);
    
    // Wait for content to load (longer wait for likes which load slower)
    await sleep(type === 'likes' ? 2000 : 1500);
    
    // Every 50 items, do a longer pause to let X catch up
    if (collection.length % 50 === 0 && collection.length > 0) {
      updateCollectorStatus(`Collecting ${type}... (${collection.length} collected) - pausing...`);
      await sleep(1000);
    }
  }
  
  isCollecting = false;
  updateCollectorStatus(`Done! ${collection.length} ${type} collected`);
  
  // Save to storage
  saveCollectedData(type, collection);
  
  return collection;
}

function stopCollection() {
  isCollecting = false;
  updateCollectorStatus('Collection stopped');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// DATA STORAGE
// ==========================================

function saveCollectedData(type, data) {
  const key = type === 'likes' ? 'vibex_likes' : 'vibex_posts';
  const storageData = {
    [key]: data,
    [`${key}_updated`]: new Date().toISOString()
  };
  
  chrome.storage.local.set(storageData, () => {
    console.log(`Vibex: Saved ${data.length} ${type} to storage`);
    // Notify background script
    chrome.runtime.sendMessage({
      action: 'dataCollected',
      type: type,
      count: data.length
    });
  });
}

function loadCollectedData(type) {
  return new Promise((resolve) => {
    const key = type === 'likes' ? 'vibex_likes' : 'vibex_posts';
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || []);
    });
  });
}

// ==========================================
// UI COMPONENTS
// ==========================================

function addCollectorUI() {
  if (document.getElementById('vibex-collector')) return;
  
  const pageType = detectPageType();
  const isLikesPage = pageType === 'likes';
  
  const collector = document.createElement('div');
  collector.id = 'vibex-collector';
  collector.className = 'vibex-collector';
  collector.innerHTML = `
    <div class="vibex-collector-header">
      <svg class="vibex-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Vibex Collector</span>
      <button class="vibex-close" id="vibex-collector-close">&times;</button>
    </div>
    <div class="vibex-collector-body">
      <p class="vibex-collector-status" id="vibex-status">Ready to collect ${isLikesPage ? 'likes' : 'posts'}</p>
      <div class="vibex-collector-actions">
        <button class="vibex-btn vibex-btn-primary" id="vibex-collect-btn">
          ${isLikesPage ? '❤️ Collect Likes' : '📝 Collect Posts'}
        </button>
        <button class="vibex-btn vibex-btn-secondary" id="vibex-export-btn">
          📥 Export JSON
        </button>
      </div>
      <div class="vibex-collector-stats" id="vibex-stats">
        <span>Posts: <strong id="vibex-posts-count">0</strong></span>
        <span>Likes: <strong id="vibex-likes-count">0</strong></span>
      </div>
    </div>
  `;
  
  document.body.appendChild(collector);
  
  // Event listeners
  document.getElementById('vibex-collect-btn').addEventListener('click', () => {
    collectAllPosts(isLikesPage ? 'likes' : 'posts');
  });
  
  document.getElementById('vibex-export-btn').addEventListener('click', exportData);
  document.getElementById('vibex-collector-close').addEventListener('click', () => {
    collector.style.display = 'none';
  });
  
  // Load existing counts
  updateStorageCounts();
}

function addFloatingButton() {
  if (document.getElementById('vibex-fab')) return;
  
  const fab = document.createElement('div');
  fab.id = 'vibex-fab';
  fab.className = 'vibex-fab';
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  fab.title = 'Vibex Menu';
  
  document.body.appendChild(fab);
  
  fab.addEventListener('click', toggleVibexMenu);
}

function toggleVibexMenu() {
  let menu = document.getElementById('vibex-menu');
  
  if (menu) {
    menu.remove();
    return;
  }
  
  menu = document.createElement('div');
  menu.id = 'vibex-menu';
  menu.className = 'vibex-menu';
  menu.innerHTML = `
    <button class="vibex-menu-item" id="vibex-menu-collect">
      📝 Collect Posts
    </button>
    <button class="vibex-menu-item" id="vibex-menu-likes">
      ❤️ Collect Likes
    </button>
    <button class="vibex-menu-item" id="vibex-menu-writer">
      ✍️ AI Writer
    </button>
    <button class="vibex-menu-item" id="vibex-menu-export">
      📥 Export Data
    </button>
    <button class="vibex-menu-item" id="vibex-menu-dashboard">
      📊 Dashboard
    </button>
  `;
  
  document.body.appendChild(menu);
  
  // Event listeners
  document.getElementById('vibex-menu-collect').addEventListener('click', () => {
    menu.remove();
    collectAllPosts('posts');
  });
  
  document.getElementById('vibex-menu-likes').addEventListener('click', () => {
    menu.remove();
    // Navigate to likes page if not there
    const username = extractUsername();
    if (username && !window.location.pathname.includes('/likes')) {
      window.location.href = `https://x.com/${username}/likes`;
    } else {
      collectAllPosts('likes');
    }
  });
  
  document.getElementById('vibex-menu-writer').addEventListener('click', () => {
    menu.remove();
    toggleWriterPanel();
  });
  
  document.getElementById('vibex-menu-export').addEventListener('click', () => {
    menu.remove();
    exportData();
  });
  
  document.getElementById('vibex-menu-dashboard').addEventListener('click', () => {
    menu.remove();
    chrome.runtime.sendMessage({ action: 'openDashboard' });
  });
  
  // Close menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && e.target.id !== 'vibex-fab') {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 100);
}

function addWriterButton() {
  // Add writer button near compose box
  const composeBox = document.querySelector(CONFIG.selectors.composeBox);
  if (!composeBox || document.getElementById('vibex-writer-btn')) return;
  
  const btn = document.createElement('button');
  btn.id = 'vibex-writer-btn';
  btn.className = 'vibex-writer-btn';
  btn.innerHTML = '✨ AI';
  btn.title = 'Open Vibex AI Writer';
  btn.addEventListener('click', toggleWriterPanel);
  
  composeBox.parentElement.appendChild(btn);
}

// ==========================================
// AI WRITER PANEL
// ==========================================

function toggleWriterPanel() {
  if (writerPanel) {
    writerPanel.remove();
    writerPanel = null;
    return;
  }
  
  writerPanel = document.createElement('div');
  writerPanel.id = 'vibex-writer';
  writerPanel.className = 'vibex-writer';
  writerPanel.innerHTML = `
    <div class="vibex-writer-header">
      <h3>✨ Vibex AI Writer</h3>
      <button class="vibex-close" id="vibex-writer-close">&times;</button>
    </div>
    <div class="vibex-writer-body">
      <div class="vibex-writer-section">
        <label>What do you want to write about?</label>
        <textarea id="vibex-writer-topic" placeholder="e.g., My thoughts on AI productivity tools..."></textarea>
      </div>
      <div class="vibex-writer-section">
        <label>Tone</label>
        <select id="vibex-writer-tone">
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="humorous">Humorous</option>
          <option value="inspirational">Inspirational</option>
          <option value="controversial">Controversial</option>
        </select>
      </div>
      <div class="vibex-writer-section">
        <label>Style</label>
        <select id="vibex-writer-style">
          <option value="thread">Thread (multiple tweets)</option>
          <option value="single">Single tweet</option>
          <option value="hook">Hook + Value</option>
          <option value="story">Storytelling</option>
        </select>
      </div>
      <div class="vibex-writer-section">
        <label>
          <input type="checkbox" id="vibex-writer-use-style"> 
          Match my writing style (from collected posts)
        </label>
      </div>
      <button class="vibex-btn vibex-btn-primary vibex-btn-full" id="vibex-generate-btn">
        ✨ Generate Post
      </button>
      <div class="vibex-writer-output" id="vibex-writer-output" style="display: none;">
        <label>Generated Post</label>
        <div id="vibex-generated-text"></div>
        <div class="vibex-writer-actions">
          <button class="vibex-btn vibex-btn-secondary" id="vibex-copy-btn">📋 Copy</button>
          <button class="vibex-btn vibex-btn-secondary" id="vibex-insert-btn">📝 Insert</button>
          <button class="vibex-btn vibex-btn-secondary" id="vibex-regenerate-btn">🔄 Regenerate</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(writerPanel);
  
  // Event listeners
  document.getElementById('vibex-writer-close').addEventListener('click', toggleWriterPanel);
  document.getElementById('vibex-generate-btn').addEventListener('click', generatePost);
  document.getElementById('vibex-copy-btn')?.addEventListener('click', copyGeneratedPost);
  document.getElementById('vibex-insert-btn')?.addEventListener('click', insertGeneratedPost);
  document.getElementById('vibex-regenerate-btn')?.addEventListener('click', generatePost);
}

async function generatePost() {
  const topic = document.getElementById('vibex-writer-topic').value;
  const tone = document.getElementById('vibex-writer-tone').value;
  const style = document.getElementById('vibex-writer-style').value;
  const useMyStyle = document.getElementById('vibex-writer-use-style').checked;
  
  if (!topic.trim()) {
    alert('Please enter a topic');
    return;
  }
  
  const generateBtn = document.getElementById('vibex-generate-btn');
  generateBtn.disabled = true;
  generateBtn.textContent = '⏳ Generating...';
  
  try {
    // Get sample posts if using personal style
    let samplePosts = [];
    if (useMyStyle) {
      const posts = await loadCollectedData('posts');
      samplePosts = posts.slice(0, 10).map(p => p.text);
    }
    
    // Send to background script for AI generation
    chrome.runtime.sendMessage({
      action: 'generatePost',
      data: { topic, tone, style, samplePosts }
    }, (response) => {
      generateBtn.disabled = false;
      generateBtn.textContent = '✨ Generate Post';
      
      if (response && response.success) {
        displayGeneratedPost(response.text);
      } else {
        alert('Failed to generate post: ' + (response?.error || 'Unknown error'));
      }
    });
  } catch (error) {
    generateBtn.disabled = false;
    generateBtn.textContent = '✨ Generate Post';
    alert('Error generating post: ' + error.message);
  }
}

function displayGeneratedPost(text) {
  const output = document.getElementById('vibex-writer-output');
  const textDiv = document.getElementById('vibex-generated-text');
  
  output.style.display = 'block';
  textDiv.textContent = text;
  
  // Re-attach event listeners
  document.getElementById('vibex-copy-btn').addEventListener('click', copyGeneratedPost);
  document.getElementById('vibex-insert-btn').addEventListener('click', insertGeneratedPost);
  document.getElementById('vibex-regenerate-btn').addEventListener('click', generatePost);
}

function copyGeneratedPost() {
  const text = document.getElementById('vibex-generated-text').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('vibex-copy-btn');
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy', 2000);
  });
}

function insertGeneratedPost() {
  const text = document.getElementById('vibex-generated-text').textContent;
  const composeBox = document.querySelector(CONFIG.selectors.composeBox);
  
  if (composeBox) {
    composeBox.focus();
    document.execCommand('insertText', false, text);
  } else {
    // Open compose and copy
    copyGeneratedPost();
    alert('Text copied! Open the compose box and paste.');
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function updateCollectorStatus(message) {
  const status = document.getElementById('vibex-status');
  if (status) {
    status.textContent = message;
  }
}

async function updateStorageCounts() {
  const posts = await loadCollectedData('posts');
  const likes = await loadCollectedData('likes');
  
  const postsCount = document.getElementById('vibex-posts-count');
  const likesCount = document.getElementById('vibex-likes-count');
  
  if (postsCount) postsCount.textContent = posts.length;
  if (likesCount) likesCount.textContent = likes.length;
  
  // Update global state
  collectedPosts = posts;
  collectedLikes = likes;
}

async function exportData() {
  const posts = await loadCollectedData('posts');
  const likes = await loadCollectedData('likes');
  
  const data = {
    exportedAt: new Date().toISOString(),
    posts: posts,
    likes: likes
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `vibex-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// ==========================================
// MESSAGE HANDLING
// ==========================================

function handleMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'collectPosts':
      collectAllPosts('posts').then(data => sendResponse({ success: true, count: data.length }));
      return true;
      
    case 'collectLikes':
      collectAllPosts('likes').then(data => sendResponse({ success: true, count: data.length }));
      return true;
      
    case 'getCollectedData':
      Promise.all([loadCollectedData('posts'), loadCollectedData('likes')])
        .then(([posts, likes]) => sendResponse({ posts, likes }));
      return true;
      
    case 'openWriter':
      toggleWriterPanel();
      sendResponse({ success: true });
      break;
      
    case 'stopCollection':
      stopCollection();
      sendResponse({ success: true });
      break;
  }
}

// ==========================================
// PAGE CHANGE OBSERVER
// ==========================================

function observePageChanges() {
  let lastPath = window.location.pathname;

  setInterval(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      lastPath = currentPath;
      
      // Clean up old UI
      ['vibex-collector', 'vibex-menu', 'vibex-writer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
      writerPanel = null;

      // Re-initialize
      setTimeout(init, 500);
    }
  }, 1000);
}

// ==========================================
// INITIALIZATION
// ==========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
