/**
 * Calendar Overview & Month-to-Month Planning Module (FR-02, FR-04, FR-05, FR-06)
 */

import { Storage } from './storage.js';

export const CalendarView = {
  currentDate: new Date(),
  selectedDateStr: null,
  onTaskActionCallback: null,

  init(onTaskActionCallback) {
    this.onTaskActionCallback = onTaskActionCallback;
    this.selectedDateStr = this.formatDateStr(this.currentDate);

    this.monthTitleBtn = document.getElementById('monthTitleBtn');
    this.prevMonthBtn = document.getElementById('prevMonthBtn');
    this.nextMonthBtn = document.getElementById('nextMonthBtn');
    this.todayBtn = document.getElementById('todayBtn');
    this.calendarGrid = document.getElementById('calendarGrid');
    this.daySchedulePanel = document.getElementById('daySchedulePanel');
    this.dayScheduleTitle = document.getElementById('dayScheduleTitle');
    this.dayTaskList = document.getElementById('dayTaskList');
    this.addDayTaskBtn = document.getElementById('addDayTaskBtn');

    this.bindEvents();
    this.render();
  },

  bindEvents() {
    if (this.prevMonthBtn) {
      this.prevMonthBtn.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
      });
    }

    if (this.nextMonthBtn) {
      this.nextMonthBtn.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
      });
    }

    if (this.todayBtn) {
      this.todayBtn.addEventListener('click', () => {
        this.currentDate = new Date();
        this.selectedDateStr = this.formatDateStr(this.currentDate);
        this.render();
      });
    }

    if (this.addDayTaskBtn) {
      this.addDayTaskBtn.addEventListener('click', () => {
        if (this.onTaskActionCallback) {
          this.onTaskActionCallback('create_for_date', { date: this.selectedDateStr });
        }
      });
    }
  },

  formatDateStr(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    if (this.monthTitleBtn) {
      this.monthTitleBtn.textContent = `${monthNames[month]} ${year}`;
    }

    const tasks = Storage.getTasks();
    const tasksByDate = {};
    tasks.forEach(t => {
      if (t.dueDate) {
        if (!tasksByDate[t.dueDate]) tasksByDate[t.dueDate] = [];
        tasksByDate[t.dueDate].push(t);
      }
    });

    // Generate Calendar Grid Days
    if (!this.calendarGrid) return;
    this.calendarGrid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = this.formatDateStr(new Date());

    // 1. Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDayNum = totalDaysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, prevDayNum);
      const dateStr = this.formatDateStr(prevDate);
      const cell = this.createDayCell(prevDayNum, dateStr, true, tasksByDate[dateStr], todayStr);
      this.calendarGrid.appendChild(cell);
    }

    // 2. Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = this.formatDateStr(dateObj);
      const cell = this.createDayCell(day, dateStr, false, tasksByDate[dateStr], todayStr);
      this.calendarGrid.appendChild(cell);
    }

    // 3. Next month padding days to fill 35 or 42 grid cells
    const currentGridCount = firstDayIndex + totalDaysInMonth;
    const nextDaysNeeded = (currentGridCount <= 35 ? 35 : 42) - currentGridCount;

    for (let day = 1; day <= nextDaysNeeded; day++) {
      const nextDate = new Date(year, month + 1, day);
      const dateStr = this.formatDateStr(nextDate);
      const cell = this.createDayCell(day, dateStr, true, tasksByDate[dateStr], todayStr);
      this.calendarGrid.appendChild(cell);
    }

    // Render the day schedule panel for the selected date
    this.renderDaySchedule(tasksByDate);
  },

  createDayCell(dayNum, dateStr, isOtherMonth, dayTasks = [], todayStr) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell';
    if (isOtherMonth) cell.classList.add('other-month');
    if (dateStr === todayStr) cell.classList.add('today');
    if (dateStr === this.selectedDateStr) cell.classList.add('selected');

    const topRow = document.createElement('div');
    topRow.className = 'day-number';
    topRow.innerHTML = `<span>${dayNum}</span>`;

    if (dateStr === todayStr) {
      topRow.innerHTML += `<span class="today-badge">TODAY</span>`;
    }

    cell.appendChild(topRow);

    if (dayTasks.length > 0) {
      const dotsContainer = document.createElement('div');
      dotsContainer.className = 'task-dots-container';

      // Render dots up to 3
      dayTasks.slice(0, 3).forEach(t => {
        const dot = document.createElement('span');
        dot.className = `task-dot ${t.status || 'todo'}`;
        dotsContainer.appendChild(dot);
      });

      if (dayTasks.length > 3) {
        const badge = document.createElement('span');
        badge.className = 'task-count-badge';
        badge.textContent = `+${dayTasks.length - 3}`;
        dotsContainer.appendChild(badge);
      }

      cell.appendChild(dotsContainer);
    }

    cell.addEventListener('click', () => {
      this.selectedDateStr = dateStr;
      this.render();
    });

    return cell;
  },

  renderDaySchedule(tasksByDate) {
    if (!this.daySchedulePanel || !this.selectedDateStr) return;

    // Parse date for formatted title e.g. "Schedule for Monday, Oct 26, 2026"
    const parts = this.selectedDateStr.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    const dateFormatted = dateObj.toLocaleDateString('en-US', options);

    if (this.dayScheduleTitle) {
      this.dayScheduleTitle.textContent = `Tasks for ${dateFormatted}`;
    }

    const dayTasks = tasksByDate[this.selectedDateStr] || [];
    this.dayTaskList.innerHTML = '';

    if (dayTasks.length === 0) {
      this.dayTaskList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📌</div>
          <div>No tasks scheduled for this day.</div>
        </div>
      `;
      return;
    }

    dayTasks.forEach(task => {
      const item = this.createTaskItemElement(task);
      this.dayTaskList.appendChild(item);
    });
  },

  createTaskItemElement(task) {
    const el = document.createElement('div');
    el.className = 'task-item';

    const tagClass = `tag-${(task.category || 'personal').toLowerCase()}`;

    el.innerHTML = `
      <div class="task-left">
        <div class="status-checkbox ${task.status}" data-action="toggle-status" data-id="${task.id}" title="Toggle status">
          ${task.status === 'completed' ? '✓' : (task.status === 'inprogress' ? '•' : '')}
        </div>
        <div class="task-content-details">
          <div class="task-title-text ${task.status === 'completed' ? 'completed' : ''}">${escapeHtml(task.title)}</div>
          <div class="task-meta-info">
            <span class="task-tag ${tagClass}">${task.category || 'Personal'}</span>
            ${task.dueTime ? `<span>🕒 ${task.dueTime}</span>` : ''}
            ${task.priority ? `<span>⚡ ${task.priority}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="task-right-actions">
        <span class="task-status-pill ${task.status}" data-action="cycle-status" data-id="${task.id}">
          ${task.status === 'completed' ? 'Completed' : (task.status === 'inprogress' ? 'In Progress' : 'To Do')}
        </span>
        <button class="icon-btn" data-action="edit-task" data-id="${task.id}" title="Edit task" style="width:30px; height:30px;">✏️</button>
        <button class="icon-btn" data-action="delete-task" data-id="${task.id}" title="Delete task" style="width:30px; height:30px;">🗑️</button>
      </div>
    `;

    el.addEventListener('click', (e) => {
      const actionEl = e.target.closest('[data-action]');
      if (!actionEl) return;
      const action = actionEl.getAttribute('data-action');
      const id = actionEl.getAttribute('data-id');

      if (action === 'toggle-status' || action === 'cycle-status') {
        if (this.onTaskActionCallback) {
          this.onTaskActionCallback('cycle_status', { id });
        }
      } else if (action === 'edit-task') {
        if (this.onTaskActionCallback) {
          this.onTaskActionCallback('edit', { id });
        }
      } else if (action === 'delete-task') {
        if (this.onTaskActionCallback) {
          this.onTaskActionCallback('delete', { id });
        }
      }
    });

    return el;
  }
};

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
