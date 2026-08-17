/**
 * Taskly Main Application Entry Point
 * Orchestrates 5 bottom navigation screens, theme color palette engine, Focus Timer, and Analytics.
 */

import { Storage } from './storage.js';
import { Auth } from './auth.js';
import { Onboarding } from './onboarding.js';
import { CalendarView } from './calendar.js';
import { TaskManager } from './taskManager.js';
import { FocusTimer } from './focusTimer.js';
import { Analytics } from './analytics.js';
import { ProfileView } from './profile.js';
import { Notifications } from './notifications.js';

class App {
  constructor() {
    this.currentTab = 'viewHome';
  }

  init() {
    this.initTheme();
    this.initNavigation();
    this.initAuthModal();

    // Initialize Components
    CalendarView.init((action, payload) => this.handleCalendarAction(action, payload));
    TaskManager.init((msg) => this.handleTaskChange(msg));
    FocusTimer.init((msg) => this.handleTaskChange(msg));
    Analytics.init();
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

    const activeColor = Storage.getColorTheme();
    document.documentElement.setAttribute('data-color-theme', activeColor);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        Storage.setTheme(next);
        this.showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} theme`);
      });
    }
  }

  initNavigation() {
    const navItems = document.querySelectorAll('.bottom-nav-item');
    const screenViews = document.querySelectorAll('.screen-view');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetViewId = item.getAttribute('data-screen');
        if (!targetViewId) return;

        navItems.forEach(t => t.classList.remove('active'));
        item.classList.add('active');

        screenViews.forEach(view => {
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

    // View All links on Home
    const viewAllTasksLink = document.getElementById('viewAllTasksLink');
    if (viewAllTasksLink) {
      viewAllTasksLink.addEventListener('click', () => {
        const tasksTab = document.querySelector('[data-screen="viewTasks"]');
        if (tasksTab) tasksTab.click();
      });
    }
  }

  initAuthModal() {
    this.authModalOverlay = document.getElementById('authModalOverlay');
    this.authCloseBtn = document.getElementById('authModalCloseBtn');
    this.authTabs = document.querySelectorAll('.auth-tab-btn');
    this.loginForm = document.getElementById('loginForm');
    this.registerForm = document.getElementById('registerForm');
    this.userAvatarBadge = document.getElementById('userAvatarBadge');

    if (this.userAvatarBadge) {
      this.userAvatarBadge.addEventListener('click', () => {
        const profileTab = document.querySelector('[data-screen="viewProfile"]');
        if (profileTab) profileTab.click();
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
    if (this.authModalOverlay) this.authModalOverlay.classList.remove('hidden');
  }

  closeAuthModal() {
    if (this.authModalOverlay) this.authModalOverlay.classList.add('hidden');
  }

  updateUserHeaderBadge() {
    const user = Auth.getCurrentUser();
    const avatarBadge = document.getElementById('userAvatarBadge');
    const headerUserName = document.getElementById('headerUserName');

    if (user) {
      if (avatarBadge) avatarBadge.textContent = user.name.charAt(0).toUpperCase();
      if (headerUserName) headerUserName.textContent = user.name;
    } else {
      if (avatarBadge) avatarBadge.textContent = 'T';
      if (headerUserName) headerUserName.textContent = 'Teefah';
    }
  }

  handleCalendarAction(action, payload) {
    if (action === 'create_for_date') {
      TaskManager.openCreateModal(payload.date);
    } else if (action === 'cycle_status') {
      TaskManager.toggleTaskStatus(payload.id);
    } else if (action === 'edit') {
      TaskManager.openEditModal(payload.id);
    } else if (action === 'delete') {
      TaskManager.deleteTask(payload.id);
    }
  }

  handleTaskChange(msg) {
    this.refreshAllViews();
    if (msg) this.showToast(msg);
  }

  handleProfileAction(action, payload) {
    if (action === 'open_auth_modal') {
      this.openAuthModal();
    } else if (action === 'auth_state_changed') {
      this.updateUserHeaderBadge();
      this.refreshAllViews();
      this.showToast('Logged out');
    } else if (action === 'color_theme_changed') {
      this.showToast(`Switched palette theme`);
    } else if (action === 'data_imported' || action === 'data_reset') {
      this.refreshAllViews();
    }
  }

  refreshAllViews() {
    TaskManager.renderAllViews();
    CalendarView.render();
    FocusTimer.populateTaskSelector();
    Analytics.render();
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
