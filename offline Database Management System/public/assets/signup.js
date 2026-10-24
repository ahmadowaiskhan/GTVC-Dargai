/* ============================================================
   GTVC Dargai — Sign Up Page Logic
   signup.js — Handles registration, password validation, and redirect
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to dashboard
  const user = getUser();
  const token = getToken();
  if (user && token) {
    redirectToDashboard(user.role);
    return;
  }

  // Bind submit event
  const form = document.getElementById('signupForm');
  if (form) {
    form.addEventListener('submit', handleSignup);
  }
});

function redirectToDashboard(role) {
  const paths = {
    admin: '/pages/admin/dashboard.html',
    principal: '/pages/admin/dashboard.html',
    teacher: '/pages/teacher/dashboard.html',
    accounting: '/pages/accounting/dashboard.html'
  };
  window.location.href = paths[role] || '/pages/admin/dashboard.html';
}

async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signupBtn');
  const alertDiv = document.getElementById('signupAlert');
  
  const full_name = document.getElementById('full_name').value.trim();
  const username = document.getElementById('username').value.trim();
  const role = document.getElementById('role').value;
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;
  const confirm_password = document.getElementById('confirm_password').value;

  alertDiv.className = 'alert login-alert hidden';

  if (password !== confirm_password) {
    alertDiv.className = 'alert alert-danger login-alert';
    alertDiv.textContent = 'Passwords do not match. Please re-enter.';
    alertDiv.classList.remove('hidden');
    return;
  }

  if (password.length < 6) {
    alertDiv.className = 'alert alert-danger login-alert';
    alertDiv.textContent = 'Password must be at least 6 characters long.';
    alertDiv.classList.remove('hidden');
    return;
  }

  btn.textContent = 'Creating Account...';
  btn.disabled = true;

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
      alertDiv.className = 'alert alert-success login-alert';
      alertDiv.textContent = 'Registration successful! Redirecting...';
      alertDiv.classList.remove('hidden');

      if (data.token && data.user) {
        setAuth(data.token, data.user);
        setTimeout(() => {
          redirectToDashboard(data.user.role);
        }, 800);
      } else {
        setTimeout(() => {
          window.location.href = '/index.html?registered=true';
        }, 800);
      }
    } else {
      alertDiv.className = 'alert alert-danger login-alert';
      alertDiv.textContent = data.message || 'Failed to create account. Please try again.';
      alertDiv.classList.remove('hidden');
      btn.textContent = 'Create Account';
      btn.disabled = false;
    }
  } catch (err) {
    alertDiv.className = 'alert alert-danger login-alert';
    alertDiv.textContent = 'Cannot connect to server. Make sure the server is running.';
    alertDiv.classList.remove('hidden');
    btn.textContent = 'Create Account';
    btn.disabled = false;
  }
}
