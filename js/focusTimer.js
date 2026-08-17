/**
 * Focus Timer Module for Taskly (Screen 3)
 * Pomodoro timer countdown with circular progress ring, mode tabs, and task focus binder.
 */

import { Storage } from './storage.js';

export const FocusTimer = {
  mode: 'timer', // 'timer' (25m), 'short' (5m), 'long' (15m)
  durations: {
    timer: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
  },
  timeLeft: 25 * 60,
  isRunning: false,
  timerInterval: null,
  activeTaskId: null,
  onStateChangeCallback: null,

  init(onStateChangeCallback) {
    this.onStateChangeCallback = onStateChangeCallback;
    this.timerDisplay = document.getElementById('timerDisplay');
    this.timerProgressRing = document.getElementById('timerProgressRing');
    this.startPauseBtn = document.getElementById('timerPauseBtn');
    this.stopBtn = document.getElementById('timerStopBtn');
    this.modeTabs = document.querySelectorAll('.timer-mode-btn');
    this.focusingTaskTitle = document.getElementById('focusingTaskTitle');
    this.focusingTaskSelect = document.getElementById('focusingTaskSelect');

    this.bindEvents();
    this.resetTimer();
    this.populateTaskSelector();
  },

  bindEvents() {
    this.modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.getAttribute('data-timer-mode');
        if (!mode) return;

        this.modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        this.mode = mode;
        this.resetTimer();
      });
    });

    if (this.startPauseBtn) {
      this.startPauseBtn.addEventListener('click', () => {
        if (this.isRunning) {
          this.pause();
        } else {
          this.start();
        }
      });
    }

    if (this.stopBtn) {
      this.stopBtn.addEventListener('click', () => {
        this.resetTimer();
      });
    }

    if (this.focusingTaskSelect) {
      this.focusingTaskSelect.addEventListener('change', (e) => {
        const taskId = e.target.value;
        this.setActiveTask(taskId);
      });
    }
  },

  populateTaskSelector() {
    if (!this.focusingTaskSelect) return;
    const tasks = Storage.getTasks().filter(t => t.status !== 'completed');

    this.focusingTaskSelect.innerHTML = '<option value="">Select a task to focus on...</option>';
    tasks.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.title;
      if (t.id === this.activeTaskId) opt.selected = true;
      this.focusingTaskSelect.appendChild(opt);
    });

    if (tasks.length > 0 && !this.activeTaskId) {
      this.setActiveTask(tasks[0].id);
      this.focusingTaskSelect.value = tasks[0].id;
    }
  },

  setActiveTask(taskId) {
    this.activeTaskId = taskId;
    const tasks = Storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task && this.focusingTaskTitle) {
      this.focusingTaskTitle.textContent = task.title;
    } else if (this.focusingTaskTitle) {
      this.focusingTaskTitle.textContent = 'Make Flashcards';
    }
  },

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    if (this.startPauseBtn) this.startPauseBtn.textContent = 'PAUSE';

    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.updateDisplay();
      } else {
        this.pause();
        this.resetTimer();
        alert('🎉 Focus Session Completed! Take a break.');
      }
    }, 1000);
  },

  pause() {
    this.isRunning = false;
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.startPauseBtn) this.startPauseBtn.textContent = 'START';
  },

  resetTimer() {
    this.pause();
    this.timeLeft = this.durations[this.mode] || (25 * 60);
    this.updateDisplay();
  },

  updateDisplay() {
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (this.timerDisplay) {
      this.timerDisplay.textContent = formatted;
    }

    // Update Circular Ring Offset
    if (this.timerProgressRing) {
      const total = this.durations[this.mode] || (25 * 60);
      const strokeDashoffset = 628 * (1 - (this.timeLeft / total));
      this.timerProgressRing.style.strokeDashoffset = strokeDashoffset;
    }
  }
};
