/**
 * Storage Manager for Taskly App
 * Handles per-user isolated task storage, onboarding state, active color palette theme, and settings.
 */

import { Auth } from './auth.js';

const STORAGE_KEYS = {
  TASKS_PREFIX: 'taskly_tasks_',
  ONBOARDING: 'taskly_onboarding_completed',
  THEME: 'taskly_theme',
  COLOR_THEME: 'taskly_color_theme'
};

function getUserStorageKey() {
  const currentUser = Auth.getCurrentUser();
  if (currentUser && currentUser.email) {
    return STORAGE_KEYS.TASKS_PREFIX + currentUser.email;
  }
  return STORAGE_KEYS.TASKS_PREFIX + 'guest';
}

// Sample seed tasks generator (loaded on demand via Profile or for initial testing)
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
      title: 'Call Bethel',
      category: 'School Work',
      priority: 'High',
      status: 'todo',
      dueDate: formatDate(0),
      dueTime: '10:00',
      isShared: false,
      notes: 'Discuss software architecture project.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-102',
      title: 'Make flashcards',
      category: 'School Work',
      priority: 'Medium',
      status: 'todo',
      dueDate: formatDate(0),
      dueTime: '19:00',
      isShared: false,
      notes: 'Prepare Calculus study cards for midterm.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-103',
      title: 'Lay the bed',
      category: 'House Chores',
      priority: 'Low',
      status: 'completed',
      dueDate: formatDate(-1),
      dueTime: '08:00',
      isShared: false,
      notes: 'Morning routine.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-104',
      title: "confirm tope's invitation",
      category: 'Invitation List',
      priority: 'Low',
      status: 'completed',
      dueDate: formatDate(-1),
      dueTime: '12:00',
      isShared: false,
      notes: 'RSVP to party invitation.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'task-105',
      title: 'Track water intake',
      category: 'Health & Wellness',
      priority: 'Medium',
      status: 'inprogress',
      dueDate: formatDate(0),
      dueTime: '21:00',
      isShared: true,
      assignees: ['@Me', '@Mojo', '@Tee'],
      notes: 'Daily 3-liter hydration goal.',
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
      isShared: task.isShared || false,
      assignees: task.assignees || ['@Me'],
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

  getColorTheme() {
    return localStorage.getItem(STORAGE_KEYS.COLOR_THEME) || 'purple';
  },

  setColorTheme(color) {
    localStorage.setItem(STORAGE_KEYS.COLOR_THEME, color);
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
