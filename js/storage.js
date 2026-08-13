/**
 * Storage Manager for Taskly App
 * Handles per-user isolated task storage, onboarding state, and settings.
 * Initial tasks state for new users is completely EMPTY [].
 */

import { Auth } from './auth.js';

const STORAGE_KEYS = {
  TASKS_PREFIX: 'taskly_tasks_',
  ONBOARDING: 'taskly_onboarding_completed',
  THEME: 'taskly_theme'
};

function getUserStorageKey() {
  const currentUser = Auth.getCurrentUser();
  if (currentUser && currentUser.email) {
    return STORAGE_KEYS.TASKS_PREFIX + currentUser.email;
  }
  return STORAGE_KEYS.TASKS_PREFIX + 'guest';
}

// Sample seed tasks generator (only loaded on explicit user request via Profile)
export function getSampleDemoTasks() {
  const today = new Date();
  const formatDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return [
    {
      id: 'task-101',
      title: 'Complete Software Architecture Assignment',
      category: 'Assignment',
      priority: 'High',
      status: 'inprogress',
      dueDate: formatDate(0),
      dueTime: '17:00',
      notes: 'Submit PDF report to student portal.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-102',
      title: 'Midterm Calculus Exam',
      category: 'Exam',
      priority: 'High',
      status: 'todo',
      dueDate: formatDate(3),
      dueTime: '10:00',
      notes: 'Chapters 4 to 8. Bring calculator.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-103',
      title: 'Group Project Brainstorming',
      category: 'Project',
      priority: 'Medium',
      status: 'todo',
      dueDate: formatDate(1),
      dueTime: '14:30',
      notes: 'Discuss wireframes and schema.',
      createdAt: new Date().toISOString()
    }
  ];
}

export const Storage = {
  getTasks() {
    const key = getUserStorageKey();
    const data = localStorage.getItem(key);
    if (!data) {
      // Clean initial state: 0 tasks!
      return [];
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing stored tasks:', e);
      return [];
    }
  },

  saveTasks(tasks) {
    const key = getUserStorageKey();
    localStorage.setItem(key, JSON.stringify(tasks));
  },

  addTask(task) {
    const tasks = this.getTasks();
    const newTask = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      status: 'todo',
      ...task
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    return newTask;
  },

  updateTask(id, updatedFields) {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updatedFields };
      this.saveTasks(tasks);
      return tasks[index];
    }
    return null;
  },

  deleteTask(id) {
    let tasks = this.getTasks();
    tasks = tasks.filter(t => t.id !== id);
    this.saveTasks(tasks);
  },

  isOnboardingCompleted() {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING) === 'true';
  },

  setOnboardingCompleted(val = true) {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, val ? 'true' : 'false');
  },

  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  loadSampleDemoData() {
    const sample = getSampleDemoTasks();
    this.saveTasks(sample);
    return sample;
  },

  clearCurrentUserData() {
    const key = getUserStorageKey();
    localStorage.removeItem(key);
    return [];
  }
};
