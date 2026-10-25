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

function getSessionId() {
  return localStorage.getItem('gtvc_session_id');
}

function setSessionId(id) {
  if (id) localStorage.setItem('gtvc_session_id', id);
  else localStorage.removeItem('gtvc_session_id');
}

function setAuth(token, user, sessionId = null) {
  localStorage.setItem('gtvc_token', token);
  localStorage.setItem('gtvc_user', JSON.stringify(user));
  if (sessionId) setSessionId(sessionId);
}

function clearAuth() {
  localStorage.removeItem('gtvc_token');
  localStorage.removeItem('gtvc_user');
  localStorage.removeItem('gtvc_session_id');
}

async function logout() {
  const sessionId = getSessionId();
  const user = getUser();
  try {
    if (sessionId || user) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || null,
          userId: user?.id || null,
          username: user?.username || ''
        }),
        keepalive: true
      });
    }
  } catch (e) {}
  clearAuth();
  window.location.href = '/index.html';
}

// Periodic heartbeat so timeline has accurate duration even if user closes tab
if (typeof window !== 'undefined') {
  setInterval(() => {
    const sId = getSessionId();
    if (sId) {
      fetch('/api/auth/session-heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sId }),
        keepalive: true
      }).catch(() => {});
    }
  }, 60000); // every 1 min

  // Also send logout on tab/browser close
  window.addEventListener('beforeunload', () => {
    const sId = getSessionId();
    const u = getUser();
    if (sId || u) {
      const payload = JSON.stringify({
        sessionId: sId || null,
        userId: u?.id || null,
        username: u?.username || ''
      });
      navigator.sendBeacon('/api/auth/logout', new Blob([payload], { type: 'application/json' }));
    }
  });
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
  document.body.classList.add('theme-transition');
  const current = getTheme();
  setTheme(current === 'light' ? 'dark' : 'light');
  setTimeout(() => {
    document.body.classList.remove('theme-transition');
  }, 300);
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


// ==================== NAVIGATION CONFIGS (Tree Structure) ====================

const CHEVRON_SVG = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const NAV_CONFIG = {
  admin: {
    title: 'Admin Panel',
    basePath: '/pages/admin/',
    tree: [
      { label: 'Admin Control', href: 'dashboard.html' },
      {
        label: 'Management',
        expanded: true,
        children: [
          { label: 'Sessions & Admissions', href: 'sessions.html' },
          { label: 'Users (Admin, Teacher, Accounts)', href: 'user.html' },
          { label: 'Students',        href: 'manage-students.html' },
          { label: 'Student Details', href: 'student-details.html' },
          { label: 'Courses',         href: 'manage-courses.html' },
          { label: 'Results',         href: 'view-results.html' },
        ]
      },
      {
        label: 'Finance',
        expanded: true,
        children: [
          { label: 'Accounting & Funds', href: 'accounting.html' },
        ]
      },
      {
        label: 'Database History & Storage',
        expanded: true,
        children: [
          { label: 'Storage & Partitions', href: 'storage-manager.html' },
          { label: 'Time Line',    href: 'time-line.html' },
          { label: 'Recycle Bin',  href: 'recycle-bin.html' },
          { label: 'Edit History', href: 'edit-history.html' },
        ]
      }
    ]
  },
  teacher: {
    title: 'Teacher Panel',
    basePath: '/pages/teacher/',
    tree: [
      { label: 'Dashboard', href: 'dashboard.html' },
      {
        label: 'My Work',
        expanded: true,
        children: [
          { label: 'My Students', href: 'my-students.html' },
          { label: 'Results',     href: 'results.html' },
        ]
      },
    ]
  },
  accounting: {
    title: 'Accounting Panel',
    basePath: '/pages/accounting/',
    tree: [
      { label: 'Dashboard', href: 'dashboard.html' },
    ]
  }
};


// ==================== RENDER SHARED LAYOUT ====================

/**
 * Renders the complete page layout (sidebar + navbar + footer).
 * Call from every page's DOMContentLoaded.
 *
 * @param {string} role - 'admin' | 'teacher' | 'accounting'
 * @param {string} pageTitle - The title shown in the navbar
 * @param {string} activeHref - The filename of the active page (e.g. 'dashboard.html')
 */
function renderLayout(role, pageTitle, activeHref) {
  const user = getUser() || { full_name: 'User', role: role };
  const nav = NAV_CONFIG[role];
  if (!nav) return;

  const currentFile = activeHref || window.location.pathname.split('/').pop();

  // Build tree HTML
  function buildTreeHTML(items, basePath) {
    let html = '';
    items.forEach(item => {
      if (item.children) {
        // This is a folder / collapsible node
        const hasActiveChild = item.children.some(c => c.href === currentFile);
        const isExpanded = item.expanded || hasActiveChild;
        html += `<div class="tree-node${isExpanded ? ' expanded' : ''}">`;
        html += `<div class="tree-node-header" onclick="this.parentElement.classList.toggle('expanded')">`;
        html += `<span class="tree-chevron">${CHEVRON_SVG}</span>`;
        html += `<span class="tree-node-label">${item.label}</span>`;
        html += `</div>`;
        html += `<div class="tree-children">`;
        item.children.forEach(child => {
          if (child.children) {
            // Nested folder (level 2)
            const hasActiveL2 = child.children.some(c2 => c2.href === currentFile);
            const isExpL2 = child.expanded || hasActiveL2;
            html += `<div class="tree-node${isExpL2 ? ' expanded' : ''}">`;
            html += `<div class="tree-node-header" style="padding-left:30px;" onclick="this.parentElement.classList.toggle('expanded')">`;
            html += `<span class="tree-chevron">${CHEVRON_SVG}</span>`;
            html += `<span class="tree-node-label">${child.label}</span>`;
            html += `</div>`;
            html += `<div class="tree-children">`;
            child.children.forEach(leaf => {
              const isActive = currentFile === leaf.href ? ' active' : '';
              html += `<a href="${basePath}${leaf.href}" class="tree-leaf tree-leaf-l2${isActive}">`;
              html += `<span class="tree-node-label">${leaf.label}</span>`;
              html += `</a>`;
            });
            html += `</div></div>`;
          } else {
            // Leaf link
            const isActive = currentFile === child.href ? ' active' : '';
            html += `<a href="${basePath}${child.href}" class="tree-leaf${isActive}">`;
            html += `<span class="tree-node-label">${child.label}</span>`;
            html += `</a>`;
          }
        });
        html += `</div></div>`;
      } else {
        // Top-level leaf (e.g. Dashboard)
        const isActive = currentFile === item.href ? ' active' : '';
        html += `<a href="${basePath}${item.href}" class="tree-leaf${isActive}" style="padding-left:12px;">`;
        html += `<span class="tree-node-label">${item.label}</span>`;
        html += `</a>`;
      }
    });
    return html;
  }

  const treeHTML = buildTreeHTML(nav.tree, nav.basePath);

  // Initials for avatar
  const initials = user.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Sidebar HTML
  const sidebarHTML = `
    <div class="sidebar-header">
      <img src="/assets/logo/GTVC-Logo.png" alt="GTVC" class="sidebar-logo" style="width:48px; height:48px; border-radius:50%; object-fit:cover;">
      <div class="sidebar-title">GTVC Dargai</div>
      <div class="sidebar-subtitle">${nav.title}</div>
    </div>
    <nav class="sidebar-nav">
      <div class="tree-section-title">Explorer</div>
      ${treeHTML}
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

// Redirect user to their respective dashboard
function redirectToDashboard(role) {
  const paths = {
    admin: '/pages/admin/dashboard.html',
    teacher: '/pages/teacher/dashboard.html',
    accounting: '/pages/accounting/dashboard.html'
  };
  window.location.href = paths[role] || '/pages/admin/dashboard.html';
}

// ==================== AUTH & PORTAL PAGE LOGIC (index.html) ====================
function initAuthPortal() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  if (!loginForm && !signupForm) return;

  // If already logged in on login/signup page, redirect to dashboard
  const user = getUser();
  const token = getToken();
  if (user && token) {
    redirectToDashboard(user.role);
    return;
  }

  // Setup tab switcher buttons
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabSignupBtn = document.getElementById('tabSignupBtn');
  const toSignupLink = document.getElementById('toSignupLink');
  const toLoginLink = document.getElementById('toLoginLink');

  if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
  if (tabSignupBtn) tabSignupBtn.addEventListener('click', () => switchAuthTab('signup'));
  if (toSignupLink) {
    toSignupLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchAuthTab('signup');
    });
  }
  if (toLoginLink) {
    toLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchAuthTab('login');
    });
  }

  // Check URL params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tab') === 'signup') {
    switchAuthTab('signup');
  } else if (urlParams.get('registered') === 'true') {
    switchAuthTab('login');
    const errDiv = document.getElementById('loginError');
    if (errDiv) {
      errDiv.className = 'alert alert-success login-alert';
      errDiv.textContent = 'Account created successfully! Please log in with your credentials.';
      errDiv.classList.remove('hidden');
    }
  }

  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
  if (signupForm) signupForm.addEventListener('submit', handleSignupSubmit);
}

function switchAuthTab(tab) {
  const loginSection = document.getElementById('loginSection');
  const signupSection = document.getElementById('signupSection');
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabSignupBtn = document.getElementById('tabSignupBtn');
  const card = document.querySelector('.login-card');

  if (tab === 'signup') {
    if (loginSection) loginSection.classList.add('hidden');
    if (signupSection) signupSection.classList.remove('hidden');
    if (tabLoginBtn) tabLoginBtn.classList.remove('active');
    if (tabSignupBtn) tabSignupBtn.classList.add('active');
    if (card) card.classList.add('login-card-wide');
  } else {
    if (signupSection) signupSection.classList.add('hidden');
    if (loginSection) loginSection.classList.remove('hidden');
    if (tabSignupBtn) tabSignupBtn.classList.remove('active');
    if (tabLoginBtn) tabLoginBtn.classList.add('active');
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errorDiv = document.getElementById('loginError');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (btn) {
    btn.textContent = 'Logging in...';
    btn.disabled = true;
  }
  if (errorDiv) {
    errorDiv.classList.add('hidden');
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok && data.token) {
      setAuth(data.token, data.user, data.sessionId || null);
      redirectToDashboard(data.user.role);
    } else {
      if (errorDiv) {
        errorDiv.textContent = data.message || 'Invalid username or password.';
        errorDiv.classList.remove('hidden');
      }
    }
  } catch (err) {
    if (errorDiv) {
      errorDiv.textContent = 'Cannot connect to server. Make sure the server is running.';
      errorDiv.classList.remove('hidden');
    }
  }

  if (btn) {
    btn.textContent = 'Login';
    btn.disabled = false;
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('signupBtn');
  const alertDiv = document.getElementById('signupAlert');

  const full_name = document.getElementById('signup_fullname')?.value.trim();
  const username = document.getElementById('signup_username')?.value.trim();
  const role = document.getElementById('signup_role')?.value;
  const email = document.getElementById('signup_email')?.value.trim();
  const phone = document.getElementById('signup_phone')?.value.trim();
  const password = document.getElementById('signup_password')?.value;
  const confirm_password = document.getElementById('signup_confirm_password')?.value;

  if (alertDiv) {
    alertDiv.className = 'alert login-alert hidden';
  }

  if (password !== confirm_password) {
    if (alertDiv) {
      alertDiv.className = 'alert alert-danger login-alert';
      alertDiv.textContent = 'Passwords do not match. Please re-enter.';
      alertDiv.classList.remove('hidden');
    }
    return;
  }

  if (password.length < 6) {
    if (alertDiv) {
      alertDiv.className = 'alert alert-danger login-alert';
      alertDiv.textContent = 'Password must be at least 6 characters long.';
      alertDiv.classList.remove('hidden');
    }
    return;
  }

  if (btn) {
    btn.textContent = 'Creating Account...';
    btn.disabled = true;
  }

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name,
        username,
        role,
        email,
        phone,
        password
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      if (alertDiv) {
        alertDiv.className = 'alert alert-success login-alert';
        alertDiv.textContent = 'Registration successful! Logging you in...';
        alertDiv.classList.remove('hidden');
      }

      if (data.token && data.user) {
        setAuth(data.token, data.user, data.sessionId || null);
        setTimeout(() => {
          redirectToDashboard(data.user.role);
        }, 600);
      } else {
        setTimeout(() => {
          switchAuthTab('login');
          const errDiv = document.getElementById('loginError');
          if (errDiv) {
            errDiv.className = 'alert alert-success login-alert';
            errDiv.textContent = 'Account created successfully! Please log in.';
            errDiv.classList.remove('hidden');
          }
        }, 600);
      }
    } else {
      if (alertDiv) {
        alertDiv.className = 'alert alert-danger login-alert';
        alertDiv.textContent = data.message || 'Failed to create account. Please try again.';
        alertDiv.classList.remove('hidden');
      }
      if (btn) {
        btn.textContent = 'Create Account';
        btn.disabled = false;
      }
    }
  } catch (err) {
    if (alertDiv) {
      alertDiv.className = 'alert alert-danger login-alert';
      alertDiv.textContent = 'Cannot connect to server. Make sure the server is running.';
      alertDiv.classList.remove('hidden');
    }
    if (btn) {
      btn.textContent = 'Create Account';
      btn.disabled = false;
    }
  }
}

// ==================== RESULTS MANAGEMENT (view-results.html) ====================
let allResultsData = [];

async function loadResults() {
  try {
    const data = await apiCall('/api/admin/results');
    allResultsData = data || [];
    renderResults(allResultsData);
  } catch (e) {
    const tbody = document.getElementById('resultsTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:32px;">Could not load results.</td></tr>';
    }
  }
}

function renderResults(results) {
  const tbody = document.getElementById('resultsTableBody');
  if (!tbody) return;

  if (!results.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted" style="padding:32px;">No results found.</td></tr>';
    return;
  }

  const gradeBadge = g => {
    const map = { A: 'badge-green', B: 'badge-blue', C: 'badge-yellow', D: 'badge-yellow', F: 'badge-red' };
    return `<span class="badge ${map[g] || 'badge-blue'}">${g}</span>`;
  };

  tbody.innerHTML = results.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.student_name || '—'}</td>
      <td>${r.class_name || '—'}</td>
      <td>${r.subject_name || '—'}</td>
      <td><span class="badge badge-blue">${r.exam_type || '—'}</span></td>
      <td>${r.marks_obtained ?? '—'}</td>
      <td>${r.total_marks ?? '—'}</td>
      <td>${gradeBadge(r.grade || '—')}</td>
    </tr>
  `).join('');
}

function filterResults() {
  const searchInput = document.getElementById('searchResults');
  const examInput = document.getElementById('filterExamType');
  const q = searchInput ? searchInput.value.toLowerCase() : '';
  const exam = examInput ? examInput.value : '';

  const filtered = allResultsData.filter(r => {
    const matchName = (r.student_name || '').toLowerCase().includes(q) ||
                      (r.subject_name || '').toLowerCase().includes(q);
    const matchExam = !exam || r.exam_type === exam;
    return matchName && matchExam;
  });

  renderResults(filtered);
}

// Global page initializer for portal & results
document.addEventListener('DOMContentLoaded', () => {
  initAuthPortal();
  if (document.getElementById('resultsTableBody') && window.location.pathname.includes('view-results.html')) {
    if (requireAuth(['admin'])) {
      renderLayout('admin', 'View Results', 'view-results.html');
      loadResults();
    }
  }
});

