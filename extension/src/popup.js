// Popup script for Vibex extension v2.0

document.addEventListener('DOMContentLoaded', () => {
  // Check auth status and load stats
  checkAuthStatus();
  loadStats();
  
  // Re-check auth when popup regains focus (user might have just logged in)
  window.addEventListener('focus', () => {
    checkAuthStatus();
  });
  
  // ==========================================
  // MAIN ACTIONS
  // ==========================================
  
  document.getElementById('collectPosts').addEventListener('click', async () => {
    const tab = await getCurrentTab();
    if (!isXPage(tab.url)) {
      setStatus('warning', 'Please navigate to x.com first');
      return;
    }
    
    // Navigate to profile if needed
    if (!tab.url.includes('/status/') && tab.url.split('/').length <= 4) {
      chrome.tabs.sendMessage(tab.id, { action: 'collectPosts' });
      setStatus('success', 'Collecting posts...');
      window.close();
    } else {
      setStatus('warning', 'Go to your profile page to collect posts');
    }
  });
  
  document.getElementById('collectLikes').addEventListener('click', async () => {
    const tab = await getCurrentTab();
    if (!isXPage(tab.url)) {
      setStatus('warning', 'Please navigate to x.com first');
      return;
    }
    
    if (tab.url.includes('/likes')) {
      chrome.tabs.sendMessage(tab.id, { action: 'collectLikes' });
      setStatus('success', 'Collecting likes...');
      window.close();
    } else {
      // Navigate to likes page
      const username = extractUsernameFromUrl(tab.url);
      if (username) {
        chrome.tabs.update(tab.id, { url: `https://x.com/${username}/likes` });
        setStatus('success', 'Navigating to likes page...');
      } else {
        setStatus('warning', 'Go to your profile/likes page first');
      }
    }
  });
  
  document.getElementById('openWriter').addEventListener('click', async () => {
    const tab = await getCurrentTab();
    if (!isXPage(tab.url)) {
      setStatus('warning', 'Please navigate to x.com first');
      return;
    }
    chrome.tabs.sendMessage(tab.id, { action: 'openWriter' });
    window.close();
  });
  
  document.getElementById('exportData').addEventListener('click', async () => {
    const tab = await getCurrentTab();
    if (isXPage(tab.url)) {
      chrome.tabs.sendMessage(tab.id, { action: 'exportData' });
      window.close();
    } else {
      // Export from storage directly
      exportFromStorage();
    }
  });
  
  // ==========================================
  // QUICK ACTIONS
  // ==========================================
  
  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openDashboard' });
  });
  
  document.getElementById('clearData').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all collected data?')) {
      chrome.storage.local.remove(['vibex_posts', 'vibex_likes', 'vibex_posts_updated', 'vibex_likes_updated'], () => {
        loadStats();
        setStatus('success', 'Data cleared successfully');
      });
    }
  });
  
  document.getElementById('openSettings').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://vibex.alanbouo.com/settings' });
  });
  
  document.getElementById('syncBtn').addEventListener('click', async () => {
    const syncBtn = document.getElementById('syncBtn');
    syncBtn.disabled = true;
    syncBtn.textContent = 'Syncing...';
    setStatus('warning', 'Syncing to cloud...');
    
    const data = await getStorageData();
    chrome.runtime.sendMessage({ 
      action: 'syncToBackend', 
      data: { posts: data.posts, likes: data.likes }
    }, (response) => {
      syncBtn.disabled = false;
      syncBtn.textContent = 'Sync to Cloud';
      
      if (response && response.success) {
        setStatus('success', 'Synced successfully!');
      } else {
        const errorMsg = response?.error || 'Unknown error';
        console.error('Sync failed:', errorMsg);
        setStatus('error', `Sync failed: ${errorMsg.substring(0, 50)}`);
      }
    });
  });
  
  // Footer links
  document.getElementById('helpLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/vibex/docs' });
  });
  
  document.getElementById('feedbackLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: 'https://github.com/vibex/feedback' });
  });

  // ==========================================
  // ACCOUNT CONNECTION
  // ==========================================
  
  document.getElementById('connectBtn').addEventListener('click', () => {
    const btn = document.getElementById('connectBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Connecting...';
    setStatus('warning', 'Connecting to Vibex...');
    
    chrome.runtime.sendMessage({ action: 'connectAccount' }, (response) => {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">🔗</span> Connect to Vibex';
      
      if (response.success) {
        showConnectedState(response.user);
        setStatus('success', 'Connected to Vibex!');
      } else if (response.needsLogin) {
        setStatus('warning', response.message);
      } else if (response.error?.includes('timeout')) {
        setStatus('error', 'Backend not responding. Try again later.');
      } else {
        setStatus('error', response.error || 'Connection failed');
      }
    });
  });

  document.getElementById('disconnectBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'disconnectAccount' }, () => {
      showDisconnectedState();
      setStatus('success', 'Disconnected from Vibex');
    });
  });
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isXPage(url) {
  return url && (url.includes('twitter.com') || url.includes('x.com'));
}

function extractUsernameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(p => p);
    if (parts.length > 0 && !['home', 'explore', 'notifications', 'messages', 'search'].includes(parts[0])) {
      return parts[0];
    }
  } catch (e) {}
  return null;
}

async function loadStats() {
  chrome.runtime.sendMessage({ action: 'getStorageStats' }, (response) => {
    if (response && response.success) {
      const { postsCount, likesCount, postsUpdated, likesUpdated } = response.stats;
      
      document.getElementById('postsCount').textContent = postsCount;
      document.getElementById('likesCount').textContent = likesCount;
      
      document.getElementById('postsUpdated').textContent = postsUpdated 
        ? formatDate(postsUpdated) 
        : 'Not collected';
      document.getElementById('likesUpdated').textContent = likesUpdated 
        ? formatDate(likesUpdated) 
        : 'Not collected';
        
      // Update status based on data
      if (postsCount > 0 || likesCount > 0) {
        setStatus('success', `${postsCount + likesCount} items collected`);
      }
    }
  });
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

function setStatus(type, message) {
  const statusBar = document.getElementById('statusBar');
  const statusText = document.getElementById('statusText');
  
  statusBar.className = 'status-bar';
  if (type === 'warning') statusBar.classList.add('warning');
  if (type === 'error') statusBar.classList.add('error');
  
  statusText.textContent = message;
}

async function getStorageData() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['vibex_posts', 'vibex_likes'], (result) => {
      resolve({
        posts: result.vibex_posts || [],
        likes: result.vibex_likes || []
      });
    });
  });
}

async function exportFromStorage() {
  const data = await getStorageData();
  
  const exportData = {
    exportedAt: new Date().toISOString(),
    posts: data.posts,
    likes: data.likes
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: `vibex-export-${new Date().toISOString().split('T')[0]}.json`,
    saveAs: true
  });
}

// ==========================================
// AUTH FUNCTIONS
// ==========================================

function checkAuthStatus() {
  chrome.runtime.sendMessage({ action: 'checkAuth' }, (response) => {
    if (response && response.authenticated) {
      showConnectedState(response.user);
    } else {
      showDisconnectedState();
    }
  });
}

function showConnectedState(user) {
  document.getElementById('accountNotConnected').style.display = 'none';
  document.getElementById('accountConnected').style.display = 'block';
  document.getElementById('userName').textContent = user?.name || 'Connected';
  document.getElementById('userEmail').textContent = user?.email || '';
  document.getElementById('syncBtn').disabled = false;
}

function showDisconnectedState() {
  document.getElementById('accountNotConnected').style.display = 'block';
  document.getElementById('accountConnected').style.display = 'none';
  document.getElementById('syncBtn').disabled = true;
}
