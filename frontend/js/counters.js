// Counters and Interactions JavaScript

// ==========================================
// CONFIGURATION
// ==========================================
const API_URL = "https://us-east1-cloud-resume-challenge-486522.cloudfunctions.net/visitor-counter";

// ==========================================
// SITE VIEW COUNTER (all pages) — backed by Firestore
// ==========================================
async function initViewCounter() {
  const viewCounterEl = document.getElementById('view-counter');
  if (!viewCounterEl) return;

  try {
    const alreadyCounted = sessionStorage.getItem('hasVisited');

    if (!alreadyCounted) {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) { viewCounterEl.textContent = '–'; return; }
      const data = await res.json();
      sessionStorage.setItem('hasVisited', 'true');
      animateCounter(viewCounterEl, data.count);
    } else {
      const res = await fetch(API_URL);
      if (!res.ok) { viewCounterEl.textContent = '–'; return; }
      const data = await res.json();
      animateCounter(viewCounterEl, data.count);
    }
  } catch (err) {
    console.error('Visitor counter error:', err);
    viewCounterEl.textContent = '–';
  }
}

// ==========================================
// BLOG VIEW COUNTER — separate Firestore counter
// ==========================================
async function initBlogViewCounter() {
  const blogCounterEl = document.getElementById('blog-view-counter');
  if (!blogCounterEl) return;

  try {
    const alreadyCounted = sessionStorage.getItem('blogVisited');

    if (!alreadyCounted) {
      const res = await fetch(API_URL + '/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) { blogCounterEl.textContent = '–'; return; }
      const data = await res.json();
      sessionStorage.setItem('blogVisited', 'true');
      animateCounter(blogCounterEl, data.count);
    } else {
      const res = await fetch(API_URL + '/blog');
      if (!res.ok) { blogCounterEl.textContent = '–'; return; }
      const data = await res.json();
      animateCounter(blogCounterEl, data.count);
    }
  } catch (err) {
    console.error('Blog counter error:', err);
    blogCounterEl.textContent = '–';
  }
}

// ==========================================
// DOWNLOAD COUNTER (Resume PDF) — backed by Firestore
// ==========================================
async function initDownloadCounter() {
  const downloadCounterEl = document.getElementById('download-counter');
  if (!downloadCounterEl) return;

  try {
    const res = await fetch(API_URL + '/downloads');
    if (!res.ok) { downloadCounterEl.textContent = '0'; return; }
    const data = await res.json();
    animateCounter(downloadCounterEl, data.count);
  } catch (err) {
    console.error('Download counter error:', err);
    downloadCounterEl.textContent = '0';
  }
}

async function incrementDownloadCount() {
  const downloadCounterEl = document.getElementById('download-counter');
  try {
    const res = await fetch(API_URL + '/downloads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok && downloadCounterEl) {
      const data = await res.json();
      animateCounter(downloadCounterEl, data.count);
    }
  } catch (err) {
    console.error('Download increment error:', err);
  }
}

// ==========================================
// BLOG POST INTERACTIONS — backed by Firestore
// ==========================================
async function initBlogInteractions() {
  const interactionBtns = document.querySelectorAll('.interaction-btn');
  if (interactionBtns.length === 0) return;

  // Load all interaction counts from the server
  let serverCounts = {};
  try {
    const res = await fetch(API_URL + '/interactions');
    if (res.ok) {
      serverCounts = await res.json();
    }
  } catch (err) {
    console.error('Failed to load interactions:', err);
  }

  interactionBtns.forEach(btn => {
    const postId = btn.dataset.postId;
    const type = btn.dataset.type;
    const countEl = btn.querySelector('.interaction-count');
    const key = `${postId}_${type}`;

    // Show the server-side count
    const serverCount = serverCounts[key] || 0;
    countEl.textContent = serverCount;

    // Restore the user's own active state from localStorage
    const userActive = localStorage.getItem(`blog_active_${key}`) === 'true';
    if (userActive) {
      btn.classList.add('active');
    }

    // Click handler
    btn.addEventListener('click', async () => {
      const isActive = btn.classList.contains('active');
      const action = isActive ? 'remove' : 'add';

      // Optimistic UI update
      const currentCount = parseInt(countEl.textContent) || 0;
      const newCount = action === 'add' ? currentCount + 1 : Math.max(0, currentCount - 1);
      countEl.textContent = newCount;

      if (action === 'add') {
        btn.classList.add('active');
        btn.classList.add('pop');
        setTimeout(() => btn.classList.remove('pop'), 300);
        localStorage.setItem(`blog_active_${key}`, 'true');
      } else {
        btn.classList.remove('active');
        localStorage.setItem(`blog_active_${key}`, 'false');
      }

      // Sync with server
      try {
        const res = await fetch(API_URL + '/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId, type, action }),
        });
        if (res.ok) {
          const data = await res.json();
          countEl.textContent = data.count;
        }
      } catch (err) {
        console.error('Interaction sync error:', err);
      }
    });
  });
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function animateCounter(element, targetValue) {
  const duration = 1000;
  const start = parseInt(element.textContent) || 0;
  const increment = (targetValue - start) / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= targetValue) ||
        (increment < 0 && current <= targetValue) ||
        increment === 0) {
      element.textContent = targetValue;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current);
    }
  }, 16);
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initViewCounter();
  initBlogViewCounter();
  initDownloadCounter();
  initBlogInteractions();
});
