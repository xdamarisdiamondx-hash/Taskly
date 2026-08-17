/**
 * Profile & Settings Module for Taskly (Screen 5 & 10)
 * Handles User Profile, Color Palette Switcher, Notifications, Dark Mode, and Logout.
 */

import { Storage } from './storage.js';
import { Auth } from './auth.js';
import { Notifications } from './notifications.js';

export const ProfileView = {
  init(onActionCallback) {
    this.onActionCallback = onActionCallback;

    this.profileName = document.getElementById('profileName');
    this.profileEmail = document.getElementById('profileEmail');
    this.profileAvatar = document.getElementById('profileAvatar');
    this.editProfileBtn = document.getElementById('editProfileBtn');
    this.logoutBtn = document.getElementById('logoutBtn');
    this.notifToggle = document.getElementById('pushNotifToggle');
    this.darkModeToggle = document.getElementById('darkModeToggle');
    this.colorSwatches = document.querySelectorAll('.color-swatch-btn');

    this.bindEvents();
    this.render();
  },

  bindEvents() {
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', () => {
        Auth.logout();
        if (this.onActionCallback) this.onActionCallback('auth_state_changed', { loggedIn: false });
      });
    }

    if (this.editProfileBtn) {
      this.editProfileBtn.addEventListener('click', () => {
        const user = Auth.getCurrentUser();
        if (!user) {
          if (this.onActionCallback) this.onActionCallback('open_auth_modal');
        } else {
          alert(`Logged in as ${user.name} (${user.email})`);
        }
      });
    }

    // Color Swatch Palette Picker
    this.colorSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        const colorTheme = swatch.getAttribute('data-color-palette');
        if (!colorTheme) return;

        Storage.setColorTheme(colorTheme);
        document.documentElement.setAttribute('data-color-theme', colorTheme);
        if (this.onActionCallback) this.onActionCallback('color_theme_changed', { colorTheme });
      });
    });

    if (this.notifToggle) {
      this.notifToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          Notifications.requestPermission().then(granted => {
            if (!granted) e.target.checked = false;
          });
        }
      });
    }

    if (this.darkModeToggle) {
      this.darkModeToggle.addEventListener('change', (e) => {
        const nextTheme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', nextTheme);
        Storage.setTheme(nextTheme);
      });
    }
  },

  render() {
    const user = Auth.getCurrentUser();
    if (user) {
      if (this.profileName) this.profileName.textContent = user.name;
      if (this.profileEmail) this.profileEmail.textContent = user.email;
      if (this.profileAvatar) this.profileAvatar.textContent = user.name.charAt(0).toUpperCase();
    } else {
      if (this.profileName) this.profileName.textContent = 'Teefah';
      if (this.profileEmail) this.profileEmail.textContent = 'teefah@gmail.com';
      if (this.profileAvatar) this.profileAvatar.textContent = 'T';
    }

    if (this.notifToggle) {
      this.notifToggle.checked = Notifications.isPermissionGranted();
    }

    if (this.darkModeToggle) {
      this.darkModeToggle.checked = Storage.getTheme() === 'dark';
    }

    // Set active color theme
    const activeColor = Storage.getColorTheme();
    document.documentElement.setAttribute('data-color-theme', activeColor);
  }
};
