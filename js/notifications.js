/**
 * Alarm & Notification Reminder Engine for Taskly
 * Supports Web Notifications API, Web Audio API synthesised chime, in-app Alarm banner,
 * and Notification History drawer.
 */

import { Storage } from './storage.js';

export const Notifications = {
  checkIntervalId: null,
  audioCtx: null,
  triggeredAlarms: new Set(),

  init(onTaskUpdatedCallback) {
    this.onTaskUpdatedCallback = onTaskUpdatedCallback;
    this.alarmModalOverlay = document.getElementById('alarmModalOverlay');
    this.alarmTitle = document.getElementById('alarmTitle');
    this.alarmTime = document.getElementById('alarmTime');
    this.alarmSnoozeBtn = document.getElementById('alarmSnoozeBtn');
    this.alarmCompleteBtn = document.getElementById('alarmCompleteBtn');
    this.alarmDismissBtn = document.getElementById('alarmDismissBtn');

    // Notification History Modal Elements
    this.notifHistoryOverlay = document.getElementById('notifHistoryOverlay');
    this.notifHistoryCloseBtn = document.getElementById('notifHistoryCloseBtn');
    this.notifHistoryList = document.getElementById('notifHistoryList');
    this.clearNotifHistoryBtn = document.getElementById('clearNotifHistoryBtn');

    this.bindEvents();
    this.startScheduler();
  },

  getHistory() {
    const data = localStorage.getItem('taskly_notifications_history');
    if (!data) return [];
    try { return JSON.parse(data); } catch (e) { return []; }
  },

  addHistory(title, text) {
    const list = this.getHistory();
    list.unshift({
      id: 'notif-' + Date.now(),
      title,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('taskly_notifications_history', JSON.stringify(list.slice(0, 20)));
  },

  clearHistory() {
    localStorage.removeItem('taskly_notifications_history');
    this.renderHistory();
  },

  showHistoryModal() {
    if (!this.notifHistoryOverlay) return;
    this.renderHistory();
    this.notifHistoryOverlay.classList.remove('hidden');
  },

  hideHistoryModal() {
    if (this.notifHistoryOverlay) {
      this.notifHistoryOverlay.classList.add('hidden');
    }
  },

  renderHistory() {
    if (!this.notifHistoryList) return;
    const history = this.getHistory();
    this.notifHistoryList.innerHTML = '';

    if (history.length === 0) {
      this.notifHistoryList.innerHTML = `
        <div style="text-align:center; padding:24px; color:var(--text-muted); font-size:13px;">
          No previous notifications.
        </div>
      `;
      return;
    }

    history.forEach(item => {
      const el = document.createElement('div');
      el.className = 'mini-stat-item';
      el.style.marginBottom = '8px';
      el.innerHTML = `
        <div>
          <strong style="display:block; color:var(--text-primary);">${item.title}</strong>
          <span style="font-size:11px; color:var(--text-muted);">${item.text}</span>
        </div>
        <span style="font-size:10px; font-weight:700; color:var(--primary-purple);">${item.timestamp}</span>
      `;
      this.notifHistoryList.appendChild(el);
    });
  },

  requestPermission() {
    if ('Notification' in window) {
      return Notification.requestPermission().then(permission => {
        return permission === 'granted';
      });
    }
    return Promise.resolve(false);
  },

  isPermissionGranted() {
    return 'Notification' in window && Notification.permission === 'granted';
  },

  startScheduler() {
    if (this.checkIntervalId) clearInterval(this.checkIntervalId);
    this.checkIntervalId = setInterval(() => this.checkScheduledAlarms(), 10000);
    this.checkScheduledAlarms();
  },

  checkScheduledAlarms() {
    const tasks = Storage.getTasks();
    const now = new Date();

    tasks.forEach(task => {
      if (task.status === 'completed') return;
      if (!task.dueDate || !task.dueTime) return;
      if (this.triggeredAlarms.has(task.id)) return;

      const reminderSetting = task.reminderSetting || 'at_event';
      if (reminderSetting === 'none') return;

      const parts = task.dueDate.split('-');
      const timeParts = task.dueTime.split(':');
      const targetDate = new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2]),
        parseInt(timeParts[0]),
        parseInt(timeParts[1]),
        0
      );

      let offsetMinutes = 0;
      if (reminderSetting === '5_min') offsetMinutes = 5;
      else if (reminderSetting === '15_min') offsetMinutes = 15;
      else if (reminderSetting === '1_hour') offsetMinutes = 60;
      else if (reminderSetting === '1_day') offsetMinutes = 1440;

      const reminderTime = new Date(targetDate.getTime() - offsetMinutes * 60000);

      const diffMs = now - reminderTime;
      if (diffMs >= 0 && diffMs <= 300000) {
        this.triggeredAlarms.add(task.id);
        this.triggerAlarm(task);
      }
    });
  },

  triggerAlarm(task) {
    this.playAlarmChime();

    // Store in Notification History
    this.addHistory(`⏰ Reminder: ${task.title}`, `Due at ${task.dueTime} (${task.category || 'Task'})`);

    if (this.isPermissionGranted()) {
      try {
        new Notification(`⏰ Reminder: ${task.title}`, {
          body: `Due at ${task.dueTime} (${task.category || 'Task'}). ${task.notes || ''}`,
          icon: '/favicon.ico',
          requireInteraction: true
        });
      } catch (e) {
        console.log('Browser notification suppressed', e);
      }
    }

    this.showAlarmModal(task);
  },

  playAlarmChime() {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.audioCtx = new AudioContext();
      }
      if (!this.audioCtx) return;

      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      const playBeep = (freq, delay, duration) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + duration);
        }, delay);
      };

      playBeep(880, 0, 0.25);
      playBeep(1046, 250, 0.25);
      playBeep(1318, 500, 0.4);
    } catch (e) {
      console.log('Audio playback prevented', e);
    }
  },

  showAlarmModal(task) {
    if (!this.alarmModalOverlay) return;

    this.activeTask = task;
    if (this.alarmTitle) this.alarmTitle.textContent = task.title;
    if (this.alarmTime) this.alarmTime.textContent = `Due ${task.dueDate} at ${task.dueTime}`;

    this.alarmModalOverlay.classList.remove('hidden');
  },

  hideAlarmModal() {
    if (this.alarmModalOverlay) {
      this.alarmModalOverlay.classList.add('hidden');
    }
    this.activeTask = null;
  },

  bindEvents() {
    if (this.alarmSnoozeBtn) {
      this.alarmSnoozeBtn.addEventListener('click', () => {
        if (this.activeTask) {
          const now = new Date();
          now.setMinutes(now.getMinutes() + 5);
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          Storage.updateTask(this.activeTask.id, { dueTime: `${hh}:${mm}` });
          this.triggeredAlarms.delete(this.activeTask.id);
          if (this.onTaskUpdatedCallback) this.onTaskUpdatedCallback('Snoozed for 5 minutes');
        }
        this.hideAlarmModal();
      });
    }

    if (this.alarmCompleteBtn) {
      this.alarmCompleteBtn.addEventListener('click', () => {
        if (this.activeTask) {
          Storage.updateTask(this.activeTask.id, { status: 'completed' });
          if (this.onTaskUpdatedCallback) this.onTaskUpdatedCallback('Task marked as Completed!');
        }
        this.hideAlarmModal();
      });
    }

    if (this.alarmDismissBtn) {
      this.alarmDismissBtn.addEventListener('click', () => {
        this.hideAlarmModal();
      });
    }

    if (this.notifHistoryCloseBtn) {
      this.notifHistoryCloseBtn.addEventListener('click', () => this.hideHistoryModal());
    }

    if (this.clearNotifHistoryBtn) {
      this.clearNotifHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    if (this.notifHistoryOverlay) {
      this.notifHistoryOverlay.addEventListener('click', (e) => {
        if (e.target === this.notifHistoryOverlay) this.hideHistoryModal();
      });
    }
  }
};
