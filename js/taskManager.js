/**
 * Task Management Module for Taskly
 * Handles Home Dashboard Task lists, My Tasks Category Groups, Circular Progress Indicators, and Task Modal CRUD.
 */

import { Storage } from './storage.js';
import { AIParser } from './aiParser.js';

export const TaskManager = {
  currentFilter: 'all',
  searchQuery: '',
  editingTaskId: null,
  onTaskChangedCallback: null,

  init(onTaskChangedCallback) {
    this.onTaskChangedCallback = onTaskChangedCallback;

    // Elements
    this.homeTasksList = document.getElementById('homeTasksList');
    this.myTasksCategoriesContainer = document.getElementById('myTasksCategoriesContainer');
    this.searchInput = document.getElementById('taskSearchInput');
    this.fabBtn = document.getElementById('fabCreateTaskBtn');

    // Modal Elements
    this.modalOverlay = document.getElementById('taskModalOverlay');
    this.modalTitle = document.getElementById('modalTitle');
    this.taskForm = document.getElementById('taskForm');
    this.modalCloseBtn = document.getElementById('modalCloseBtn');
    this.modalCancelBtn = document.getElementById('modalCancelBtn');

    // Inputs
    this.inputTitle = document.getElementById('inputTaskTitle');
    this.inputCategory = document.getElementById('inputTaskCategory');
    this.inputPriority = document.getElementById('inputTaskPriority');
    this.inputDueDate = document.getElementById('inputTaskDueDate');
    this.inputDueTime = document.getElementById('inputTaskDueTime');
    this.inputReminder = document.getElementById('inputTaskReminder');
    this.inputNotes = document.getElementById('inputTaskNotes');

    // AI Smart Input Bar Elements
    this.aiBarInput = document.getElementById('aiBarInput');
    this.aiBarBtn = document.getElementById('aiBarBtn');
    this.aiPreviewBox = document.getElementById('aiPreviewBox');

    this.bindEvents();
    this.renderAllViews();
  },

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderAllViews();
      });
    }

    if (this.fabBtn) {
      this.fabBtn.addEventListener('click', () => this.openCreateModal());
    }

    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.modalCancelBtn) {
      this.modalCancelBtn.addEventListener('click', () => this.closeModal());
    }
    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) this.closeModal();
      });
    }

    if (this.taskForm) {
      this.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // AI Smart Input
    if (this.aiBarBtn && this.aiBarInput) {
      const handleAISubmit = () => {
        const query = this.aiBarInput.value;
        if (!query.trim()) return;
        const parsed = AIParser.parse(query);
        if (parsed) {
          Storage.addTask({
            title: parsed.title,
            category: parsed.category,
            priority: parsed.priority,
            dueDate: parsed.dueDate,
            dueTime: parsed.dueTime,
            notes: `Parsed via AI Input: "${query}"`
          });
          this.aiBarInput.value = '';
          if (this.aiPreviewBox) this.aiPreviewBox.classList.remove('active');
          this.notifyChanged('Task created via AI Smart Input!');
        }
      };

      this.aiBarBtn.addEventListener('click', handleAISubmit);
      this.aiBarInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAISubmit();
      });

      document.querySelectorAll('.ai-rec-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const ex = pill.getAttribute('data-example');
          if (ex) {
            this.aiBarInput.value = ex;
            this.aiBarInput.dispatchEvent(new Event('input'));
            this.aiBarInput.focus();
          }
        });
      });

      this.aiBarInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (!query.trim() || query.length < 3) {
          if (this.aiPreviewBox) this.aiPreviewBox.classList.remove('active');
          return;
        }
        const parsed = AIParser.parse(query);
        if (parsed && this.aiPreviewBox) {
          this.aiPreviewBox.innerHTML = `
            <div>
              <strong>Parsed Preview:</strong> ${escapeHtml(parsed.title)} 
              <span style="opacity:0.8;">[${parsed.category} | ${parsed.dueDate} at ${parsed.dueTime}]</span>
            </div>
            <button class="purple-primary-btn" id="aiQuickAddBtn" style="padding:4px 12px; font-size:11px; width:auto;">Confirm & Add</button>
          `;
          this.aiPreviewBox.classList.add('active');
          const quickBtn = document.getElementById('aiQuickAddBtn');
          if (quickBtn) quickBtn.addEventListener('click', handleAISubmit);
        }
      });
    }
  },

  openCreateModal(prefillDate = null) {
    this.editingTaskId = null;
    if (this.modalTitle) this.modalTitle.textContent = 'Create New Task';
    if (this.taskForm) this.taskForm.reset();

    const todayStr = new Date().toISOString().split('T')[0];
    if (this.inputDueDate) this.inputDueDate.value = prefillDate || todayStr;
    if (this.inputDueTime) this.inputDueTime.value = '10:00';
    if (this.inputCategory) this.inputCategory.value = 'School Work';
    if (this.inputPriority) this.inputPriority.value = 'Medium';
    if (this.inputReminder) this.inputReminder.value = 'at_event';

    if (this.modalOverlay) this.modalOverlay.classList.remove('hidden');
    if (this.inputTitle) this.inputTitle.focus();
  },

  openEditModal(taskId) {
    const tasks = Storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    this.editingTaskId = taskId;
    if (this.modalTitle) this.modalTitle.textContent = 'Edit Task';

    if (this.inputTitle) this.inputTitle.value = task.title || '';
    if (this.inputCategory) this.inputCategory.value = task.category || 'School Work';
    if (this.inputPriority) this.inputPriority.value = task.priority || 'Medium';
    if (this.inputDueDate) this.inputDueDate.value = task.dueDate || new Date().toISOString().split('T')[0];
    if (this.inputDueTime) this.inputDueTime.value = task.dueTime || '10:00';
    if (this.inputReminder) this.inputReminder.value = task.reminderSetting || 'at_event';
    if (this.inputNotes) this.inputNotes.value = task.notes || '';

    if (this.modalOverlay) this.modalOverlay.classList.remove('hidden');
  },

  closeModal() {
    if (this.modalOverlay) this.modalOverlay.classList.add('hidden');
    this.editingTaskId = null;
  },

  handleFormSubmit() {
    const title = this.inputTitle.value.trim();
    if (!title) return;

    const taskData = {
      title,
      category: this.inputCategory.value,
      priority: this.inputPriority.value,
      dueDate: this.inputDueDate.value,
      dueTime: this.inputDueTime.value,
      reminderSetting: this.inputReminder ? this.inputReminder.value : 'at_event',
      notes: this.inputNotes ? this.inputNotes.value.trim() : ''
    };

    if (this.editingTaskId) {
      Storage.updateTask(this.editingTaskId, taskData);
      this.notifyChanged('Task updated!');
    } else {
      Storage.addTask(taskData);
      this.notifyChanged('Task created!');
    }

    this.closeModal();
  },

  toggleTaskStatus(taskId) {
    const tasks = Storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    Storage.updateTask(taskId, { status: nextStatus });
    this.notifyChanged(nextStatus === 'completed' ? 'Task completed! 🎉' : 'Task uncompleted');
  },

  deleteTask(taskId) {
    if (confirm('Delete this task?')) {
      Storage.deleteTask(taskId);
      this.notifyChanged('Task deleted');
    }
  },

  notifyChanged(msg) {
    this.renderAllViews();
    if (this.onTaskChangedCallback) {
      this.onTaskChangedCallback(msg);
    }
  },

  renderAllViews() {
    this.renderHomeDashboard();
    this.renderMyTasksCategorizedView();
  },

  renderHomeDashboard() {
    let tasks = Storage.getTasks();

    if (this.homeTasksList) {
      this.homeTasksList.innerHTML = '';
      if (tasks.length === 0) {
        this.homeTasksList.innerHTML = `
          <div style="text-align:center; padding:24px; color:var(--text-muted); font-size:13px;">
            No tasks yet. Tap + to add one!
          </div>
        `;
      } else {
        tasks.forEach(task => {
          this.homeTasksList.appendChild(this.createTaskCardElement(task));
        });
      }
    }
  },

  createTaskCardElement(task) {
    const el = document.createElement('div');
    el.className = 'task-card-item';

    const isDone = task.status === 'completed';
    const isHighPriority = task.priority === 'High';

    const checkIcon = isDone ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` : '';
    const pencilIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    const warningIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--status-danger)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

    el.innerHTML = `
      <div class="task-card-left">
        <div class="circular-checkbox ${isDone ? 'checked' : ''}" data-action="toggle-status" data-id="${task.id}">
          ${checkIcon}
        </div>
        <div style="min-width:0; flex:1;">
          <div class="task-title ${isDone ? 'completed' : ''}">${escapeHtml(task.title)}</div>
          <div class="task-sub-meta">
            ${task.dueTime ? `<span style="display:flex; align-items:center; gap:2px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> ${task.dueTime}</span>` : ''}
            <span class="task-category-pill">${escapeHtml(task.category || 'Personal')}</span>
          </div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        ${isHighPriority ? `<span title="High Priority">${warningIcon}</span>` : ''}
        <button class="icon-btn-circle" data-action="edit-task" data-id="${task.id}" style="width:32px; height:32px;">${pencilIcon}</button>
      </div>
    `;

    el.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      const action = actionEl.getAttribute('data-action');
      const id = actionEl.getAttribute('data-id');

      if (action === 'toggle-status') this.toggleTaskStatus(id);
      else if (action === 'edit-task') this.openEditModal(id);
    });

    return el;
  },

  renderMyTasksCategorizedView() {
    if (!this.myTasksCategoriesContainer) return;

    let tasks = Storage.getTasks();
    if (this.searchQuery) {
      tasks = tasks.filter(t => t.title.toLowerCase().includes(this.searchQuery));
    }

    // Group tasks by category
    const categoriesMap = {};
    tasks.forEach(task => {
      const cat = task.category || 'School Work';
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push(task);
    });

    // Default categories if empty
    if (Object.keys(categoriesMap).length === 0) {
      categoriesMap['School Work'] = [];
      categoriesMap['House Chores'] = [];
      categoriesMap['Shopping List'] = [];
    }

    this.myTasksCategoriesContainer.innerHTML = '';

    Object.keys(categoriesMap).forEach(catName => {
      const catTasks = categoriesMap[catName];
      const totalCat = catTasks.length;
      const completedCat = catTasks.filter(t => t.status === 'completed').length;
      const percent = totalCat > 0 ? Math.round((completedCat / totalCat) * 100) : 0;
      const strokeDashoffset = 138 * (1 - (percent / 100)); // Circumference 2*pi*22 = 138

      const card = document.createElement('div');
      card.className = 'category-group-card';

      let tasksHtml = '';
      if (catTasks.length === 0) {
        tasksHtml = `<div style="font-size:12px; color:var(--text-muted);">No tasks in ${escapeHtml(catName)}</div>`;
      } else {
        catTasks.forEach(t => {
          const isDone = t.status === 'completed';
          tasksHtml += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 0;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div class="circular-checkbox ${isDone ? 'checked' : ''}" data-action="toggle-status" data-id="${t.id}">
                  ${isDone ? '✓' : ''}
                </div>
                <span class="task-title ${isDone ? 'completed' : ''}" style="font-size:14px;">${escapeHtml(t.title)}</span>
              </div>
              <span style="font-size:11px; color:var(--text-muted);">${t.dueTime || ''}</span>
            </div>
          `;
        });
      }

      card.innerHTML = `
        <div class="category-card-header">
          <div>
            <h3 style="font-size:16px; font-weight:800; color:var(--text-primary);">${escapeHtml(catName)}</h3>
            <span style="font-size:12px; color:var(--text-muted);">${completedCat} of ${totalCat} completed</span>
          </div>

          <div class="progress-circle-wrapper">
            <svg class="progress-circle-svg" viewBox="0 0 54 54">
              <circle class="progress-ring-bg" cx="27" cy="27" r="22" fill="none"/>
              <circle class="progress-ring-fill" cx="27" cy="27" r="22" fill="none"
                      stroke-dasharray="138" stroke-dashoffset="${strokeDashoffset}"/>
            </svg>
            <div class="progress-circle-text">${percent}%</div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
          ${tasksHtml}
        </div>
      `;

      card.addEventListener('click', (e) => {
        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) return;
        const action = actionEl.getAttribute('data-action');
        const id = actionEl.getAttribute('data-id');
        if (action === 'toggle-status') this.toggleTaskStatus(id);
      });

      this.myTasksCategoriesContainer.appendChild(card);
    });
  }
};

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
