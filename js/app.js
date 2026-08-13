/**
 * Taskly Main Application Entry Point
 * Orchestrates navigation tabs, theme engine, Auth modal, task state, and notifications.
 */

import { Storage } from './storage.js';
import { Auth } from './auth.js';
import { Onboarding } from './onboarding.js';
import { CalendarView } from './calendar.js';
import { TaskManager } from './taskManager.js';
import { ProfileView } from './profile.js';
import { Notifications } from './notifications.js';

class App {
  constructor() {
    this.currentTab = 'calendar';
  }

  init() {
    this.initTheme();
    this.initNavigation();
    this.initAuthModal();

    // Initialize Components
    CalendarView.init((action, payload) => this.handleCalendarAction(action, payload));
    TaskManager.init((msg) => this.handleTaskChange(msg));
    ProfileView.init((action, payload) => this.handleProfileAction(action, payload));
    Notifications.init((msg) => this.handleTaskChange(msg));

    Onboarding.init(() => {
      this.showToast('Welcome to Taskly!');
    });

    this.updateUserHeaderBadge();
    this.bindGlobalEvents();
  }

  initTheme() {
    const savedTheme = Storage.getTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        Storage.setTheme(next);
        this.updateThemeIcon(next);
        this.showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} theme`);
      });
    }
  }

  updateThemeIcon(theme) {
    const iconSpan = document.getElementById('themeIcon');
    if (iconSpan) {
      iconSpan.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  initNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabViews = document.querySelectorAll('.tab-view');

    navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetViewId = tab.getAttribute('data-view');
        if (!targetViewId) return;

        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        tabViews.forEach(view => {
          if (view.id === targetViewId) {
            view.classList.add('active');
          } else {
            view.classList.remove('active');
          }
        });

        this.currentTab = targetViewId;
        this.refreshAllViews();
      });
    });
  }

  initAuthModal() {
    this.authModalOverlay = document.getElementById('authModalOverlay');
    this.authCloseBtn = document.getElementById('authModalCloseBtn');
    this.authTabs = document.querySelectorAll('.auth-tab-btn');
    this.loginForm = document.getElementById('loginForm');
    this.registerForm = document.getElementById('registerForm');
    this.userBadgeBtn = document.getElementById('userBadgeBtn');

    if (this.userBadgeBtn) {
      this.userBadgeBtn.addEventListener('click', () => {
        const user = Auth.getCurrentUser();
        if (user) {
          // Switch to Profile tab
          const profileTabBtn = document.querySelector('[data-view="viewProfile"]');
          if (profileTabBtn) profileTabBtn.click();
        } else {
          this.openAuthModal();
        }
      });
    }

    if (this.authCloseBtn) {
      this.authCloseBtn.addEventListener('click', () => this.closeAuthModal());
    }

    if (this.authModalOverlay) {
      this.authModalOverlay.addEventListener('click', (e) => {
        if (e.target === this.authModalOverlay) this.closeAuthModal();
      });
    }

    // Auth Tab Switching (Login vs Register)
    this.authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const mode = tab.getAttribute('data-auth-tab');
        if (mode === 'login') {
          this.loginForm.style.display = 'flex';
          this.registerForm.style.display = 'none';
        } else {
          this.loginForm.style.display = 'none';
          this.registerForm.style.display = 'flex';
        }
      });
    });

    // Handle Login Form Submit
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const res = Auth.login(email, password);
        if (res.success) {
          this.closeAuthModal();
          this.updateUserHeaderBadge();
          this.refreshAllViews();
          this.showToast(`Logged in as ${res.user.name}`);
        } else {
          alert(res.message);
        }
      });
    }

    // Handle Register Form Submit
    if (this.registerForm) {
      this.registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        const res = Auth.register(name, email, password);
        if (res.success) {
          this.closeAuthModal();
          this.updateUserHeaderBadge();
          this.refreshAllViews();
          this.showToast(`Account created! Welcome, ${res.user.name}`);
        } else {
          alert(res.message);
        }
      });
    }
  }

  openAuthModal() {
    if (this.authModalOverlay) {
      this.authModalOverlay.classList.remove('hidden');
    }
  }

  closeAuthModal() {
    if (this.authModalOverlay) {
      this.authModalOverlay.classList.add('hidden');
    }
  }

  updateUserHeaderBadge() {
    const user = Auth.getCurrentUser();
    const badgeText = document.getElementById('userBadgeText');
    if (badgeText) {
      if (user) {
        badgeText.textContent = `👤 ${user.name}`;
      } else {
        badgeText.textContent = `👤 Sign In`;
      }
    }
  }

  handleCalendarAction(action, payload) {
    if (action === 'create_for_date') {
      TaskManager.openCreateModal(payload.date);
    } else if (action === 'cycle_status') {
      TaskManager.cycleTaskStatus(payload.id);
    } else if (action === 'edit') {
      TaskManager.openEditModal(payload.id);
    } else if (action === 'delete') {
      TaskManager.deleteTask(payload.id);
    }
  }

  handleTaskChange(msg) {
    this.refreshAllViews();
    if (msg) {
      this.showToast(msg);
    }
  }

  handleProfileAction(action, payload) {
    if (action === 'open_auth_modal') {
      this.openAuthModal();
    } else if (action === 'auth_state_changed') {
      this.updateUserHeaderBadge();
      this.refreshAllViews();
      this.showToast('Logged out');
    } else if (action === 'replay_onboarding') {
      Onboarding.show();
    } else if (action === 'data_imported') {
      this.refreshAllViews();
      this.showToast('Tasks updated!');
    } else if (action === 'data_reset') {
      this.refreshAllViews();
      this.showToast('Tasks cleared');
    }
  }

  refreshAllViews() {
    CalendarView.render();
    TaskManager.renderMyTasksView();
    ProfileView.render();
  }

  showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  bindGlobalEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        TaskManager.openCreateModal();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
