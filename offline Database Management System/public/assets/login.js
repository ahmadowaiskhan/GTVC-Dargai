/* ============================================================
   GTVC Dargai — Auth Logic (Login & Sign Up in index.html)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to dashboard
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

  if (tabLoginBtn) {
    tabLoginBtn.addEventListener('click', () => switchTab('login'));
  }
  if (tabSignupBtn) {
    tabSignupBtn.addEventListener('click', () => switchTab('signup'));
  }
  if (toSignupLink) {
    toSignupLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('signup');
    });
  }
  if (toLoginLink) {
    toLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('login');
    });
  }

  // Check URL params for tab=signup or registered=true
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tab') === 'signup') {
    switchTab('signup');
  } else if (urlParams.get('registered') === 'true') {
    switchTab('login');
    const errDiv = document.getElementById('loginError');
    if (errDiv) {
      errDiv.className = 'alert alert-success login-alert';
      errDiv.textContent = 'Account created successfully! Please log in with your credentials.';
      errDiv.classList.remove('hidden');
    }
  }

  // Bind form submits
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
});

function switchTab(tab) {
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

function redirectToDashboard(role) {
  const paths = {
    admin: '/pages/admin/dashboard.html',
    teacher: '/pages/teacher/dashboard.html',
    accounting: '/pages/accounting/dashboard.html'
  };
  window.location.href = paths[role] || '/pages/admin/dashboard.html';
}

async function handleLogin(e) {
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

async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signupBtn');
  const alertDiv = document.getElementById('signupAlert');

  const full_name = document.getElementById('signup_fullname').value.trim();
  const username = document.getElementById('signup_username').value.trim();
  const role = document.getElementById('signup_role').value;
  const email = document.getElementById('signup_email').value.trim();
  const phone = document.getElementById('signup_phone').value.trim();
  const password = document.getElementById('signup_password').value;
  const confirm_password = document.getElementById('signup_confirm_password').value;

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
          switchTab('login');
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

// Check public admission notice and render banner if open
async function checkAdmissionNotice() {
  const container = document.getElementById('admissionNoticeBanner');
  if (!container) return;

  try {
    const res = await fetch('/api/public/admission-notice');
    const data = await res.json();
    if (data && data.admission_open) {
      const deadlineStr = data.admission_deadline ? new Date(data.admission_deadline).toLocaleDateString() : '';
      container.innerHTML = `
        <div style="background: linear-gradient(135deg, #1e3a8a, #047857); color: white; border-radius: 8px; padding: 14px 18px; text-align: left; box-shadow: 0 4px 12px rgba(0,0,0,0.12);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="background:#22c55e; color:white; font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:10px;">🟢 ADMISSIONS OPEN</span>
            ${deadlineStr ? `<span style="font-size:0.8rem; color:rgba(255,255,255,0.9);">📅 Deadline: <b>${deadlineStr}</b></span>` : ''}
          </div>
          <h4 style="margin:0 0 4px; color:white; font-size:1rem; font-weight:700;">${data.admission_title || 'Admissions Open'}</h4>
          <p style="margin:0 0 8px; font-size:0.84rem; color:rgba(255,255,255,0.9); line-height:1.4;">${data.admission_description || ''}</p>
          <div style="display:flex; flex-wrap:wrap; gap:12px; font-size:0.8rem; color:rgba(255,255,255,0.85); border-top:1px solid rgba(255,255,255,0.2); padding-top:6px;">
            ${data.admission_phone ? `<span>📞 ${data.admission_phone}</span>` : ''}
            ${data.admission_email ? `<span>✉️ ${data.admission_email}</span>` : ''}
          </div>
        </div>
      `;
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  } catch (err) {
    // Graceful offline fallback
    container.style.display = 'none';
  }
}

// Call checkAdmissionNotice on load
document.addEventListener('DOMContentLoaded', checkAdmissionNotice);

