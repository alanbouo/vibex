// Background service worker for Vibex extension v2.0
// Handles AI generation, data sync, and communication

// Production URLs
const API_URL = 'https://vibex.alanbouo.com/api';
const DASHBOARD_URL = 'https://vibex.alanbouo.com';

// Development URLs (uncomment for local dev)
// const API_URL = 'http://localhost:5000/api';
// const DASHBOARD_URL = 'http://localhost:3000';

// ==========================================
// INSTALLATION & SETUP
// ==========================================

chrome.runtime.onInstalled.addListener(() => {
  console.log('Vibex extension v2.0 installed');
  
  // Create context menu items
  chrome.contextMenus.create({
    id: 'vibex-collect',
    title: 'Collect with Vibex',
    contexts: ['page'],
    documentUrlPatterns: ['https://twitter.com/*', 'https://x.com/*']
  });
  
  chrome.contextMenus.create({
    id: 'vibex-writer',
    title: 'Open AI Writer',
    contexts: ['page'],
    documentUrlPatterns: ['https://twitter.com/*', 'https://x.com/*']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'vibex-collect') {
    chrome.tabs.sendMessage(tab.id, { action: 'collectPosts' });
  } else if (info.menuItemId === 'vibex-writer') {
    chrome.tabs.sendMessage(tab.id, { action: 'openWriter' });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'collect-posts') {
    chrome.tabs.sendMessage(tab.id, { action: 'collectPosts' });
  } else if (command === 'open-writer') {
    chrome.tabs.sendMessage(tab.id, { action: 'openWriter' });
  }
});

// ==========================================
// MESSAGE HANDLING
// ==========================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'analyzeProfile':
      analyzeProfile(request.username)
        .then(response => sendResponse({ success: true, data: response }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'generatePost':
      generatePost(request.data)
        .then(text => sendResponse({ success: true, text }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'dataCollected':
      handleDataCollected(request.type, request.count);
      sendResponse({ success: true });
      break;

    case 'openDashboard':
      chrome.tabs.create({ url: DASHBOARD_URL });
      sendResponse({ success: true });
      break;

    case 'syncToBackend':
      syncDataToBackend(request.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getStorageStats':
      getStorageStats()
        .then(stats => sendResponse({ success: true, stats }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'checkAuth':
      checkAuthStatus()
        .then(status => sendResponse({ success: true, ...status }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'connectAccount':
      connectToVibex()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'disconnectAccount':
      clearAuthToken();
      sendResponse({ success: true });
      break;
  }
});

// Check if user is authenticated
async function checkAuthStatus() {
  const token = await getAuthToken();
  if (!token) {
    return { authenticated: false };
  }
  
  // Verify token is still valid
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { 
        authenticated: true, 
        user: data.data?.user || data.user 
      };
    } else {
      clearAuthToken();
      return { authenticated: false };
    }
  } catch (error) {
    return { authenticated: false, error: error.message };
  }
}

// Connect to Vibex by fetching token from dashboard
async function connectToVibex() {
  // First try to get token from an open dashboard tab
  const token = await fetchTokenFromDashboard();
  
  if (token) {
    // Verify the token works
    const status = await checkAuthStatus();
    if (status.authenticated) {
      return { success: true, user: status.user };
    }
  }
  
  // If no token found, open dashboard for login
  chrome.tabs.create({ url: `${DASHBOARD_URL}/login?extension=true` });
  return { 
    success: false, 
    needsLogin: true,
    message: 'Please log in to Vibex, then click Connect again.'
  };
}

// ==========================================
// AI POST GENERATION
// ==========================================

async function generatePost({ topic, tone, style, samplePosts }) {
  const token = await getAuthToken();
  
  // Try backend API first
  if (token) {
    try {
      const response = await fetch(`${API_URL}/ai/generate-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic, tone, style, samplePosts })
      });

      if (response.ok) {
        const data = await response.json();
        return data.text || data.content;
      }
    } catch (error) {
      console.log('Backend API not available, using local generation');
    }
  }

  // Fallback to local template-based generation
  return generateLocalPost(topic, tone, style, samplePosts);
}

function generateLocalPost(topic, tone, style, samplePosts) {
  // Template-based generation as fallback
  const templates = {
    single: {
      professional: [
        `Here's my take on ${topic}:\n\nThe key insight is that success comes from consistent action, not perfect conditions.\n\nWhat's your experience with this?`,
        `${topic} - a thread 🧵\n\nAfter years of experience, I've learned that the fundamentals matter most.\n\nHere's what works:`,
        `Unpopular opinion about ${topic}:\n\nMost people overcomplicate it.\n\nThe truth? Start simple, iterate fast, learn constantly.`
      ],
      casual: [
        `Been thinking about ${topic} lately...\n\nHonestly? It's simpler than we make it.\n\nJust start. Figure it out as you go. 🚀`,
        `Hot take on ${topic}:\n\nWe're all overthinking this.\n\nThe best approach? Just do the thing. Learn. Repeat.`,
        `${topic} hits different when you stop caring what others think.\n\nDo your thing. Trust the process. 💪`
      ],
      humorous: [
        `Me explaining ${topic} to my friends:\n\n"It's like... you know... the thing..."\n\n*proceeds to make zero sense* 😂`,
        `${topic} be like:\n\nExpectation: 📈\nReality: 📉📈📉📈📉📈\n\nBut we keep going anyway 🤷‍♂️`,
        `Nobody:\nAbsolutely nobody:\nMe at 2am: "What if I revolutionize ${topic}?" 🤔`
      ],
      inspirational: [
        `${topic} taught me something powerful:\n\nEvery setback is a setup for a comeback.\n\nKeep pushing. Your breakthrough is closer than you think. ✨`,
        `The secret to ${topic}?\n\nShow up when you don't feel like it.\nLearn when you think you know enough.\nGrow when you want to stay comfortable.\n\nThat's it. That's the whole game.`,
        `Remember: ${topic} isn't about being perfect.\n\nIt's about being persistent.\n\nYour future self will thank you for not giving up today. 🌟`
      ],
      controversial: [
        `Controversial take on ${topic}:\n\n90% of "experts" are just good at marketing.\n\nThe real ones? They're too busy doing the work to post about it.`,
        `${topic} hot take that'll get me cancelled:\n\nMost advice is useless because it comes from people who got lucky once.\n\nFind what works for YOU.`,
        `Unpopular opinion: ${topic} is broken.\n\nNot because of the concept, but because of how we approach it.\n\nTime for a reset.`
      ]
    },
    thread: {
      professional: `🧵 Thread: Everything I've learned about ${topic}\n\n1/ Let's break this down...\n\nAfter [X] years in this space, here are the patterns that actually matter:\n\n2/ First principle: Start with the fundamentals.\n\nMost people skip this. Don't be most people.\n\n3/ Second: Consistency beats intensity.\n\nSmall daily actions compound into massive results.\n\n4/ Third: Learn from failures fast.\n\nEvery mistake is data. Use it.\n\n5/ The meta-lesson?\n\n${topic} rewards those who show up, adapt, and persist.\n\nThat's it. Now go execute. 🚀`,
      casual: `ok let's talk about ${topic} 🧵\n\n1/ so here's the thing...\n\neveryone overcomplicates this\n\n2/ the actual secret?\n\njust start. seriously. that's it.\n\n3/ but wait there's more\n\nonce you start, keep going even when it sucks\n\n4/ the people who "make it"?\n\nthey just didn't quit\n\n5/ tldr on ${topic}:\n\nstart → keep going → don't quit → profit\n\nyou're welcome 😎`
    },
    hook: {
      professional: `I spent 5 years learning ${topic} the hard way.\n\nHere's what I wish someone told me on day 1:\n\n→ Focus on fundamentals, not hacks\n→ Consistency beats perfection\n→ Learn from every failure\n→ Build systems, not goals\n→ Trust the process\n\nSave this. You'll need it.`,
      casual: `${topic} changed my life.\n\nNot because it's magic.\n\nBut because I finally understood:\n\n• Simple > Complex\n• Done > Perfect  \n• Consistent > Intense\n• Learning > Knowing\n\nThat's the whole game. 🎯`
    },
    story: {
      professional: `2 years ago, I knew nothing about ${topic}.\n\nToday? It's transformed how I work.\n\nHere's the journey:\n\nMonth 1: Complete confusion. Nothing made sense.\n\nMonth 3: First small win. A glimmer of hope.\n\nMonth 6: Patterns emerged. Things clicked.\n\nYear 1: Consistent results. Real confidence.\n\nYear 2: Teaching others. Full circle.\n\nThe lesson? ${topic} isn't about talent.\n\nIt's about not quitting when it gets hard.\n\nYour turn. Start today.`,
      casual: `story time about ${topic} 👇\n\nso there i was, completely clueless...\n\nfast forward 6 months:\n\nstill kinda clueless BUT making progress\n\nthe plot twist?\n\neveryone's figuring it out as they go\n\nthere's no secret playbook\n\njust people who keep showing up\n\nbe one of those people 🙌`
    }
  };

  const styleTemplates = templates[style] || templates.single;
  const toneTemplates = styleTemplates[tone] || styleTemplates.professional;
  
  if (Array.isArray(toneTemplates)) {
    return toneTemplates[Math.floor(Math.random() * toneTemplates.length)];
  }
  
  return toneTemplates;
}

// ==========================================
// PROFILE ANALYSIS
// ==========================================

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
    // Return mock data as fallback
    return {
      data: {
        analytics: {
          avgEngagement: Math.floor(Math.random() * 500),
          avgLikes: Math.floor(Math.random() * 200),
          avgRetweets: Math.floor(Math.random() * 50)
        }
      }
    };
  }
}

// ==========================================
// DATA SYNC
// ==========================================

function handleDataCollected(type, count) {
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Vibex Collection Complete',
    message: `Successfully collected ${count} ${type}!`
  });
}

async function syncDataToBackend(data) {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Not authenticated. Please log in to the Vibex dashboard first.');
  }

  // Use the new import-extension-data endpoint
  const response = await fetch(`${API_URL}/profiles/import-extension-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      posts: data.posts || [],
      likes: data.likes || []
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to sync data');
  }

  const result = await response.json();
  
  // Show success notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Vibex Sync Complete',
    message: `Imported ${result.data?.postsImported || 0} posts and ${result.data?.likesImported || 0} likes!`
  });

  return result;
}

async function getStorageStats() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['vibex_posts', 'vibex_likes', 'vibex_posts_updated', 'vibex_likes_updated'], (result) => {
      resolve({
        postsCount: (result.vibex_posts || []).length,
        likesCount: (result.vibex_likes || []).length,
        postsUpdated: result.vibex_posts_updated || null,
        likesUpdated: result.vibex_likes_updated || null
      });
    });
  });
}

// ==========================================
// AUTH HELPERS
// ==========================================

async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      resolve(result.authToken || null);
    });
  });
}

function saveAuthToken(token) {
  chrome.storage.local.set({ authToken: token });
}

function clearAuthToken() {
  chrome.storage.local.remove(['authToken']);
}

// Try to get token from Vibex dashboard cookies/localStorage
async function fetchTokenFromDashboard() {
  try {
    // Execute script in dashboard tab to get token
    const tabs = await chrome.tabs.query({ url: `${DASHBOARD_URL}/*` });
    
    if (tabs.length > 0) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => localStorage.getItem('token')
      });
      
      if (results[0]?.result) {
        saveAuthToken(results[0].result);
        return results[0].result;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch token from dashboard:', error);
    return null;
  }
}

// ==========================================
// EXPORT FOR POPUP
// ==========================================

// Make functions available to popup
self.vibexAPI = {
  getStorageStats,
  getAuthToken,
  saveAuthToken,
  clearAuthToken
};
