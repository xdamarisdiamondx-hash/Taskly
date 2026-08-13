/**
 * Alarm & Notification Reminder Engine for Taskly
 * Supports Web Notifications API, Web Audio API synthesised chime, and in-app Alarm banner.
 */

import { Storage } from './storage.js';

export const Notifications = {
  checkIntervalId: null,
  audioCtx: null,
  triggeredAlarms: new Set(), // Track task IDs triggered in current session

  init(onTaskUpdatedCallback) {
    this.onTaskUpdatedCallback = onTaskUpdatedCallback;
    this.alarmModalOverlay = document.getElementById('alarmModalOverlay');
    this.alarmTitle = document.getElementById('alarmTitle');
    this.alarmTime = document.getElementById('alarmTime');
    this.alarmSnoozeBtn = document.getElementById('alarmSnoozeBtn');
    this.alarmCompleteBtn = document.getElementById('alarmCompleteBtn');
    this.alarmDismissBtn = document.getElementById('alarmDismissBtn');

    this.bindEvents();
    this.startScheduler();
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
    // Check every 10 seconds
    this.checkIntervalId = setInterval(() => this.checkScheduledAlarms(), 10000);
    // Immediate check
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

      // Calculate scheduled target date & time
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

      // Offset based on reminder setting
      let offsetMinutes = 0;
      if (reminderSetting === '5_min') offsetMinutes = 5;
      else if (reminderSetting === '15_min') offsetMinutes = 15;
      else if (reminderSetting === '1_hour') offsetMinutes = 60;
      else if (reminderSetting === '1_day') offsetMinutes = 1440;

      const reminderTime = new Date(targetDate.getTime() - offsetMinutes * 60000);

      // Trigger if current time is past or equal to reminderTime (within a 5-minute window)
      const diffMs = now - reminderTime;
      if (diffMs >= 0 && diffMs <= 300000) {
        this.triggeredAlarms.add(task.id);
        this.triggerAlarm(task);
      }
    });
  },

  triggerAlarm(task) {
    // 1. Play Synthesized Alarm Chime Sound using Web Audio API
    this.playAlarmChime();

    // 2. Trigger Browser Native Notification
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

    // 3. Open In-App Alarm Dialog
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
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Play 3 pleasant melody beeps
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

      playBeep(880, 0, 0.25);   // A5
      playBeep(1046, 250, 0.25); // C6
      playBeep(1318, 500, 0.4);  // E6
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
          // Snooze: push target due time 5 minutes ahead
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
  }
};
