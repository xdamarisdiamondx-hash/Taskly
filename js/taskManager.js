/**
 * Task Management Module (FR-07 & FR-09)
 * Handles task CRUD modal, status updates ("To Do", "In Progress", "Completed"), search & filter.
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

    // Elements for My Tasks View
    this.searchInput = document.getElementById('taskSearchInput');
    this.filterBtns = document.querySelectorAll('.filter-btn');
    this.myTasksList = document.getElementById('myTasksList');
    this.createTaskHeaderBtn = document.getElementById('createTaskHeaderBtn');
    this.createTaskFloatingBtn = document.getElementById('createTaskFloatingBtn');

    // Modal Elements
    this.modalOverlay = document.getElementById('taskModalOverlay');
    this.modalTitle = document.getElementById('modalTitle');
    this.taskForm = document.getElementById('taskForm');
    this.modalCloseBtn = document.getElementById('modalCloseBtn');
    this.modalCancelBtn = document.getElementById('modalCancelBtn');

    // Form inputs
    this.inputTitle = document.getElementById('inputTaskTitle');
    this.inputCategory = document.getElementById('inputTaskCategory');
    this.inputPriority = document.getElementById('inputTaskPriority');
    this.inputDueDate = document.getElementById('inputTaskDueDate');
    this.inputDueTime = document.getElementById('inputTaskDueTime');
    this.inputReminder = document.getElementById('inputTaskReminder');
    this.inputNotes = document.getElementById('inputTaskNotes');

    // AI Smart Bar Elements
    this.aiBarInput = document.getElementById('aiBarInput');
    this.aiBarBtn = document.getElementById('aiBarBtn');
    this.aiPreviewBox = document.getElementById('aiPreviewBox');

    this.bindEvents();
    this.renderMyTasksView();
  },

  bindEvents() {
    // Search input
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderMyTasksView();
      });
    }

    // Filter status tabs
    this.filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-filter') || 'all';
        this.renderMyTasksView();
      });
    });

    // Create task trigger buttons
    if (this.createTaskHeaderBtn) {
      this.createTaskHeaderBtn.addEventListener('click', () => this.openCreateModal());
    }
    if (this.createTaskFloatingBtn) {
      this.createTaskFloatingBtn.addEventListener('click', () => this.openCreateModal());
    }

    // Modal close buttons
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

    // Task Form Submit
    if (this.taskForm) {
      this.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // AI Smart Input Bar (FR-08)
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
            notes: `Created via AI Smart Input: "${query}"`
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

      // Recommendation Pills click handler
      document.querySelectorAll('.ai-rec-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          const exampleText = pill.getAttribute('data-example');
          if (exampleText) {
            this.aiBarInput.value = exampleText;
            this.aiBarInput.dispatchEvent(new Event('input'));
            this.aiBarInput.focus();
          }
        });
      });

      this.aiBarInput.addEventListener('input', (e) => {
        const query = e.target.value;
        if (!query.trim() || query.length < 4) {
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
            <button class="pill-btn primary" id="aiQuickAddBtn" style="padding:4px 10px; font-size:11px;">Confirm & Add</button>
          `;
          this.aiPreviewBox.classList.add('active');
          const quickBtn = document.getElementById('aiQuickAddBtn');
          if (quickBtn) {
            quickBtn.addEventListener('click', handleAISubmit);
          }
        }
      });
    }
  },

  openCreateModal(prefillDate = null) {
    this.editingTaskId = null;
    this.modalTitle.textContent = 'Create New Task';
    this.taskForm.reset();

    const todayStr = new Date().toISOString().split('T')[0];
    this.inputDueDate.value = prefillDate || todayStr;
    this.inputDueTime.value = '12:00';
    if (this.inputReminder) this.inputReminder.value = 'at_event';
    this.inputCategory.value = 'Assignment';
    this.inputPriority.value = 'Medium';

    this.modalOverlay.classList.remove('hidden');
    this.inputTitle.focus();
  },

  openEditModal(taskId) {
    const tasks = Storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    this.editingTaskId = taskId;
    this.modalTitle.textContent = 'Edit Task';

    this.inputTitle.value = task.title || '';
    this.inputCategory.value = task.category || 'Assignment';
    this.inputPriority.value = task.priority || 'Medium';
    this.inputDueDate.value = task.dueDate || new Date().toISOString().split('T')[0];
    this.inputDueTime.value = task.dueTime || '12:00';
    if (this.inputReminder) this.inputReminder.value = task.reminderSetting || 'at_event';
    this.inputNotes.value = task.notes || '';

    this.modalOverlay.classList.remove('hidden');
    this.inputTitle.focus();
  },

  closeModal() {
    this.modalOverlay.classList.add('hidden');
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
      notes: this.inputNotes.value.trim()
    };

    if (this.editingTaskId) {
      Storage.updateTask(this.editingTaskId, taskData);
      this.notifyChanged('Task updated successfully');
    } else {
      Storage.addTask(taskData);
      this.notifyChanged('Task created successfully');
    }

    this.closeModal();
  },

  cycleTaskStatus(taskId) {
    const tasks = Storage.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const statusMap = {
      todo: 'inprogress',
      inprogress: 'completed',
      completed: 'todo'
    };

    const nextStatus = statusMap[task.status] || 'inprogress';
    Storage.updateTask(taskId, { status: nextStatus });
    this.notifyChanged(`Task marked as ${nextStatus === 'completed' ? 'Completed' : (nextStatus === 'inprogress' ? 'In Progress' : 'To Do')}`);
  },

  deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
      Storage.deleteTask(taskId);
      this.notifyChanged('Task deleted');
    }
  },

  notifyChanged(msg) {
    this.renderMyTasksView();
    if (this.onTaskChangedCallback) {
      this.onTaskChangedCallback(msg);
    }
  },

  renderMyTasksView() {
    if (!this.myTasksList) return;

    let tasks = Storage.getTasks();

    // Filter by status tab
    if (this.currentFilter !== 'all') {
      tasks = tasks.filter(t => t.status === this.currentFilter);
    }

    // Filter by search query
    if (this.searchQuery) {
      tasks = tasks.filter(t => 
        (t.title && t.title.toLowerCase().includes(this.searchQuery)) ||
        (t.notes && t.notes.toLowerCase().includes(this.searchQuery)) ||
        (t.category && t.category.toLowerCase().includes(this.searchQuery))
      );
    }

    this.myTasksList.innerHTML = '';

    if (tasks.length === 0) {
      this.myTasksList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div>No tasks found matching your filter.</div>
        </div>
      `;
      return;
    }

    tasks.forEach(task => {
      const item = this.createTaskCardElement(task);
      this.myTasksList.appendChild(item);
    });
  },

  createTaskCardElement(task) {
    const el = document.createElement('div');
    el.className = 'task-item';

    const tagClass = `tag-${(task.category || 'personal').toLowerCase()}`;

    el.innerHTML = `
      <div class="task-left">
        <div class="status-checkbox ${task.status}" data-action="toggle-status" data-id="${task.id}">
          ${task.status === 'completed' ? '✓' : (task.status === 'inprogress' ? '•' : '')}
        </div>
        <div class="task-content-details">
          <div class="task-title-text ${task.status === 'completed' ? 'completed' : ''}">${escapeHtml(task.title)}</div>
          <div class="task-meta-info">
            <span class="task-tag ${tagClass}">${task.category || 'Personal'}</span>
            ${task.dueDate ? `<span>📅 ${task.dueDate}</span>` : ''}
            ${task.dueTime ? `<span>🕒 ${task.dueTime}</span>` : ''}
            ${task.priority ? `<span>⚡ ${task.priority}</span>` : ''}
          </div>
          ${task.notes ? `<div style="font-size:12px; color:var(--text-tertiary); margin-top:2px;">${escapeHtml(task.notes)}</div>` : ''}
        </div>
      </div>
      <div class="task-right-actions">
        <span class="task-status-pill ${task.status}" data-action="cycle-status" data-id="${task.id}">
          ${task.status === 'completed' ? 'Completed' : (task.status === 'inprogress' ? 'In Progress' : 'To Do')}
        </span>
        <button class="icon-btn" data-action="edit-task" data-id="${task.id}" title="Edit" style="width:32px; height:32px;">✏️</button>
        <button class="icon-btn" data-action="delete-task" data-id="${task.id}" title="Delete" style="width:32px; height:32px;">🗑️</button>
      </div>
    `;

    el.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      const action = actionEl.getAttribute('data-action');
      const id = actionEl.getAttribute('data-id');

      if (action === 'toggle-status' || action === 'cycle-status') {
        this.cycleTaskStatus(id);
      } else if (action === 'edit-task') {
        this.openEditModal(id);
      } else if (action === 'delete-task') {
        this.deleteTask(id);
      }
    });

    return el;
  }
};

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
