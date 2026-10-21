/* ============================================================
   GTVC Dargai — Frontend Application Logic
   Handles: Auth, Navigation, Theme, Shared Components
   ============================================================ */

// ==================== AUTH HELPERS ====================

function getToken() {
  return localStorage.getItem('gtvc_token');
}

function getUser() {
  const u = localStorage.getItem('gtvc_user');
  return u ? JSON.parse(u) : null;
}

function setAuth(token, user) {
  localStorage.setItem('gtvc_token', token);
  localStorage.setItem('gtvc_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('gtvc_token');
  localStorage.removeItem('gtvc_user');
}

function logout() {
  clearAuth();
  window.location.href = '/index.html';
}

function requireAuth(allowedRoles) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = '/index.html';
    return false;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    alert('Access denied. You do not have permission to view this page.');
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

// Helper for API calls
async function apiCall(url, method = 'GET', body = null) {
  const headers = {
    'Authorization': 'Bearer ' + getToken(),
    'Content-Type': 'application/json'
  };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (res.status === 401) {
    logout();
    return null;
  }
  return res.json();
}

// ==================== THEME MANAGEMENT ====================

function getTheme() {
  return localStorage.getItem('gtvc_theme') || 'light';
}

function setTheme(theme) {
  localStorage.setItem('gtvc_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon();
  updateThemeOptions();
}

function toggleTheme() {
  const current = getTheme();
  setTheme(current === 'light' ? 'dark' : 'light');
}

function updateThemeIcon() {
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  const theme = getTheme();
  btn.textContent = theme === 'dark' ? 'Light' : 'Dark';
  btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

function updateThemeOptions() {
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === getTheme());
  });
}

// Apply theme on page load immediately
(function () {
  document.documentElement.setAttribute('data-theme', getTheme());
})();

// ==================== SETTINGS PANEL ====================

function openSettings() {
  const panel = document.getElementById('settingsPanel');
  const overlay = document.getElementById('settingsOverlay');
  if (panel) panel.classList.add('open');
  if (overlay) overlay.classList.add('active');
}

function closeSettings() {
  const panel = document.getElementById('settingsPanel');
  const overlay = document.getElementById('settingsOverlay');
  if (panel) panel.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}


// ==================== SIDEBAR TOGGLE (Mobile) ====================

function toggleSidebar() {
  const sidebar = document.querySelector('.app-sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}


// ==================== NAVIGATION CONFIGS ====================

const NAV_CONFIG = {
  admin: {
    title: 'Admin Panel',
    basePath: '/pages/admin/',
    links: [
      { label: 'Dashboard',       href: 'dashboard.html' },
      { section: 'Management' },
      { label: 'Manage Users',    href: 'manage-users.html' },
      { label: 'Manage Teachers', href: 'manage-teachers.html' },
      { label: 'Manage Students', href: 'manage-students.html' },
      { section: 'Communication' },
      { label: 'Notices',         href: 'notices.html' },
      { label: 'Reports',         href: 'reports.html' },
    ]
  },
  principal: {
    title: 'Principal Panel',
    basePath: '/pages/principal/',
    links: [
      { label: 'Dashboard',       href: 'dashboard.html' },
      { section: 'View Data' },
      { label: 'View Teachers',   href: 'view-teachers.html' },
      { label: 'View Students',   href: 'view-students.html' },
      { label: 'View Results',    href: 'view-results.html' },
      { section: 'Communication' },
      { label: 'Notices',         href: 'notices.html' },
      { label: 'Reports',         href: 'reports.html' },
    ]
  },
  teacher: {
    title: 'Teacher Panel',
    basePath: '/pages/teacher/',
    links: [
      { label: 'Dashboard',   href: 'dashboard.html' },
      { section: 'My Work' },
      { label: 'My Students', href: 'my-students.html' },
      { label: 'Results',     href: 'results.html' },
      { section: 'Communication' },
      { label: 'Notices',     href: 'notices.html' },
    ]
  },
  accounting: {
    title: 'Accounting Panel',
    basePath: '/pages/accounting/',
    links: [
      { label: 'Dashboard', href: 'dashboard.html' },
    ]
  }
};


// ==================== RENDER SHARED LAYOUT ====================

/**
 * Renders the complete page layout (sidebar + navbar + footer).
 * Call from every page's DOMContentLoaded.
 *
 * @param {string} role - 'admin' | 'principal' | 'teacher' | 'accounting'
 * @param {string} pageTitle - The title shown in the navbar
 * @param {string} activeHref - The filename of the active page (e.g. 'dashboard.html')
 */
function renderLayout(role, pageTitle, activeHref) {
  const user = getUser() || { full_name: 'User', role: role };
  const nav = NAV_CONFIG[role];
  if (!nav) return;

  const currentFile = activeHref || window.location.pathname.split('/').pop();

  // Build sidebar nav links
  let navLinksHTML = '';
  nav.links.forEach(item => {
    if (item.section) {
      navLinksHTML += `<div class="nav-section">${item.section}</div>`;
    } else {
      const isActive = currentFile === item.href ? 'active' : '';
      navLinksHTML += `<a href="${nav.basePath}${item.href}" class="${isActive}">
        ${item.label}
      </a>`;
    }
  });

  // Initials for avatar
  const initials = user.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Sidebar HTML
  const sidebarHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">G</div>
      <div class="sidebar-title">GTVC Dargai</div>
      <div class="sidebar-subtitle">${nav.title}</div>
    </div>
    <nav class="sidebar-nav">
      ${navLinksHTML}
    </nav>
    <div class="sidebar-footer">
      <a href="/index.html" onclick="logout(); return false;" class="btn btn-outline btn-sm" style="width:100%; justify-content:center;">
        Logout
      </a>
    </div>
  `;

  // Navbar HTML
  const navbarHTML = `
    <div class="navbar-left">
      <button class="menu-toggle" onclick="toggleSidebar()" title="Toggle menu">☰</button>
      <div>
        <div class="navbar-title">${pageTitle}</div>
      </div>
    </div>
    <div class="navbar-right">
      <button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">Dark</button>
      <button class="btn btn-outline btn-sm" onclick="openSettings()">Settings</button>
      <div class="user-menu">
        <div class="user-avatar">${initials}</div>
        <div class="user-info">
          <div class="user-name">${user.full_name}</div>
          <div class="user-role">${user.role}</div>
        </div>
      </div>
    </div>
  `;

  // Footer HTML
  const footerHTML = `
    <p>© ${new Date().getFullYear()} GTVC Dargai — Government Technical & Vocational Centre, Malakand</p>
  `;

  // Settings panel HTML
  const settingsHTML = `
    <div class="settings-overlay" id="settingsOverlay" onclick="closeSettings()"></div>
    <div class="settings-panel" id="settingsPanel">
      <div class="settings-header">
        <h3>Settings</h3>
        <button class="modal-close" onclick="closeSettings()">&times;</button>
      </div>
      <div class="settings-body">
        <div class="settings-section">
          <h4>Appearance</h4>
          <div class="theme-options">
            <div class="theme-option" data-theme="light" onclick="setTheme('light')">
              Light
            </div>
            <div class="theme-option" data-theme="dark" onclick="setTheme('dark')">
              Dark
            </div>
          </div>
        </div>
        <div class="settings-section">
          <h4>Account</h4>
          <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:8px;">
            Logged in as <strong>${user.full_name}</strong>
          </p>
          <p style="font-size:0.8rem; color:var(--text-muted);">
            Role: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </p>
        </div>
        <div class="settings-section">
          <h4>System</h4>
          <p style="font-size:0.8rem; color:var(--text-muted);">
            GTVC Dargai DBMS v1.0<br>
            Offline Mode — All data stored locally
          </p>
        </div>
      </div>
    </div>
  `;

  // Inject into the page
  const sidebar = document.querySelector('.app-sidebar');
  const navbar = document.querySelector('.app-navbar');
  const footer = document.querySelector('.app-footer');

  if (sidebar) sidebar.innerHTML = sidebarHTML;
  if (navbar) navbar.innerHTML = navbarHTML;
  if (footer) footer.innerHTML = footerHTML;

  // Add settings panel to body
  document.body.insertAdjacentHTML('beforeend', settingsHTML);

  // Update theme UI
  updateThemeIcon();
  updateThemeOptions();
}


// ==================== UTILITY FUNCTIONS ====================

// Format date for display
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Show a toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type}`;
  toast.style.cssText = 'position:fixed; top:80px; right:24px; z-index:9999; min-width:280px; animation: fadeIn 0.3s ease;';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Confirmation dialog
function confirmAction(message) {
  return confirm(message);
}
