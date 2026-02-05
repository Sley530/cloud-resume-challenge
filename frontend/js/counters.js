// Counters and Interactions JavaScript

// ==========================================
// VIEW COUNTER (Home Page)
// ==========================================
function initViewCounter() {
  const viewCounterEl = document.getElementById('view-counter');
  if (!viewCounterEl) return;

  // Get current count from localStorage
  let views = parseInt(localStorage.getItem('siteViews') || '0');

  // Check if this is a new session
  const lastVisit = sessionStorage.getItem('hasVisited');
  if (!lastVisit) {
    views++;
    localStorage.setItem('siteViews', views.toString());
    sessionStorage.setItem('hasVisited', 'true');
  }

  // Animate the counter
  animateCounter(viewCounterEl, views);
}

// ==========================================
// DOWNLOAD COUNTER (Resume PDF)
// ==========================================
function initDownloadCounter() {
  const downloadCounterEl = document.getElementById('download-counter');
  if (!downloadCounterEl) return;

  const downloads = parseInt(localStorage.getItem('pdfDownloads') || '0');
  downloadCounterEl.textContent = downloads;
}

function incrementDownloadCount() {
  let downloads = parseInt(localStorage.getItem('pdfDownloads') || '0');
  downloads++;
  localStorage.setItem('pdfDownloads', downloads.toString());

  const downloadCounterEl = document.getElementById('download-counter');
  if (downloadCounterEl) {
    animateCounter(downloadCounterEl, downloads);
  }
}

// ==========================================
// BLOG POST INTERACTIONS
// ==========================================
function initBlogInteractions() {
  const interactionBtns = document.querySelectorAll('.interaction-btn');

  interactionBtns.forEach(btn => {
    const postId = btn.dataset.postId;
    const type = btn.dataset.type;
    const countEl = btn.querySelector('.interaction-count');

    // Load saved state
    const key = `blog_${postId}_${type}`;
    const data = JSON.parse(localStorage.getItem(key) || '{"count": 0, "active": false}');

    countEl.textContent = data.count;
    if (data.active) {
      btn.classList.add('active');
    }

    // Click handler
    btn.addEventListener('click', () => {
      const currentData = JSON.parse(localStorage.getItem(key) || '{"count": 0, "active": false}');

      if (currentData.active) {
        // Un-react
        currentData.count = Math.max(0, currentData.count - 1);
        currentData.active = false;
        btn.classList.remove('active');
      } else {
        // React
        currentData.count++;
        currentData.active = true;
        btn.classList.add('active');

        // Add pop animation
        btn.classList.add('pop');
        setTimeout(() => btn.classList.remove('pop'), 300);
      }

      localStorage.setItem(key, JSON.stringify(currentData));
      countEl.textContent = currentData.count;
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
  initDownloadCounter();
  initBlogInteractions();
});
