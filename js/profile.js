/**
 * Profile & Settings Module
 * Displays Logged-In User Profile, Productivity Metrics, Replay Onboarding, and Data Actions.
 */

import { Storage } from './storage.js';
import { Auth } from './auth.js';
import { Notifications } from './notifications.js';

export const ProfileView = {
  init(onActionCallback) {
    this.onActionCallback = onActionCallback;

    this.statTotal = document.getElementById('statTotalTasks');
    this.statCompleted = document.getElementById('statCompletedTasks');
    this.statInProgress = document.getElementById('statInProgressTasks');
    this.statRate = document.getElementById('statCompletionRate');

    this.accountName = document.getElementById('accountName');
    this.accountEmail = document.getElementById('accountEmail');
    this.authActionButton = document.getElementById('authActionButton');

    this.replayOnboardingBtn = document.getElementById('replayOnboardingBtn');
    this.enableNotificationsBtn = document.getElementById('enableNotificationsBtn');
    this.notifStatusText = document.getElementById('notifStatusText');
    this.exportDataBtn = document.getElementById('exportDataBtn');
    this.importDataBtn = document.getElementById('importDataBtn');
    this.importFileInput = document.getElementById('importFileInput');
    this.loadSampleDataBtn = document.getElementById('loadSampleDataBtn');
    this.clearUserDataBtn = document.getElementById('clearUserDataBtn');

    this.bindEvents();
    this.render();
  },

  bindEvents() {
    if (this.authActionButton) {
      this.authActionButton.addEventListener('click', () => {
        const user = Auth.getCurrentUser();
        if (user) {
          Auth.logout();
          if (this.onActionCallback) this.onActionCallback('auth_state_changed', { loggedIn: false });
        } else {
          if (this.onActionCallback) this.onActionCallback('open_auth_modal');
        }
      });
    }

    if (this.replayOnboardingBtn) {
      this.replayOnboardingBtn.addEventListener('click', () => {
        if (this.onActionCallback) this.onActionCallback('replay_onboarding');
      });
    }

    if (this.enableNotificationsBtn) {
      this.enableNotificationsBtn.addEventListener('click', () => {
        Notifications.requestPermission().then(() => {
          this.render();
        });
      });
    }

    if (this.exportDataBtn) {
      this.exportDataBtn.addEventListener('click', () => {
        const tasks = Storage.getTasks();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `taskly_export_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });
    }

    if (this.importDataBtn && this.importFileInput) {
      this.importDataBtn.addEventListener('click', () => {
        this.importFileInput.click();
      });

      this.importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedTasks = JSON.parse(event.target.result);
            if (Array.isArray(importedTasks)) {
              Storage.saveTasks(importedTasks);
              if (this.onActionCallback) this.onActionCallback('data_imported');
            } else {
              alert('Invalid file format. Must be a JSON array of tasks.');
            }
          } catch (err) {
            alert('Error reading JSON file.');
          }
        };
        reader.readAsText(file);
      });
    }

    if (this.loadSampleDataBtn) {
      this.loadSampleDataBtn.addEventListener('click', () => {
        if (confirm('Load sample demo tasks to test the calendar?')) {
          Storage.loadSampleDemoData();
          if (this.onActionCallback) this.onActionCallback('data_imported');
        }
      });
    }

    if (this.clearUserDataBtn) {
      this.clearUserDataBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all your tasks?')) {
          Storage.clearCurrentUserData();
          if (this.onActionCallback) this.onActionCallback('data_reset');
        }
      });
    }
  },

  render() {
    const user = Auth.getCurrentUser();
    if (user) {
      if (this.accountName) this.accountName.textContent = user.name;
      if (this.accountEmail) this.accountEmail.textContent = user.email;
      if (this.authActionButton) this.authActionButton.textContent = 'Log Out';
    } else {
      if (this.accountName) this.accountName.textContent = 'Guest User';
      if (this.accountEmail) this.accountEmail.textContent = 'Sign in to sync & save your tasks across devices';
      if (this.authActionButton) this.authActionButton.textContent = 'Sign In / Register';
    }

    if (this.enableNotificationsBtn && this.notifStatusText) {
      if (Notifications.isPermissionGranted()) {
        this.notifStatusText.textContent = '🔔 Browser notifications & audio alarms active!';
        this.enableNotificationsBtn.textContent = 'Notifications Active';
        this.enableNotificationsBtn.classList.remove('primary');
        this.enableNotificationsBtn.disabled = true;
      } else {
        this.notifStatusText.textContent = 'Enable native desktop alarms for scheduled tasks.';
        this.enableNotificationsBtn.textContent = 'Enable Notifications';
        this.enableNotificationsBtn.classList.add('primary');
        this.enableNotificationsBtn.disabled = false;
      }
    }

    const tasks = Storage.getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'inprogress').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (this.statTotal) this.statTotal.textContent = total;
    if (this.statCompleted) this.statCompleted.textContent = completed;
    if (this.statInProgress) this.statInProgress.textContent = inProgress;
    if (this.statRate) this.statRate.textContent = `${rate}%`;
  }
};
