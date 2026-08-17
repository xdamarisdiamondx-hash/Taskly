/**
 * Analytics Dashboard Module for Taskly (Screen 4)
 * Calculates productivity metrics, donut chart stats, and weekly bar graph activity.
 */

import { Storage } from './storage.js';

export const Analytics = {
  init() {
    this.donutTotalText = document.getElementById('analyticsDonutTotal');
    this.statMyTasks = document.getElementById('analyticsMyTasksCount');
    this.statSharedTasks = document.getElementById('analyticsSharedCount');
    this.statUncompleted = document.getElementById('analyticsUncompletedCount');
    this.statCompletionRate = document.getElementById('analyticsRateText');
    this.barContainer = document.getElementById('weeklyBarChartContainer');

    this.render();
  },

  render() {
    const tasks = Storage.getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'inprogress').length;
    const uncompleted = total - completed;
    const sharedCount = tasks.filter(t => t.isShared).length || Math.min(3, total);
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (this.donutTotalText) this.donutTotalText.textContent = total;
    if (this.statMyTasks) this.statMyTasks.textContent = total - sharedCount;
    if (this.statSharedTasks) this.statSharedTasks.textContent = sharedCount;
    if (this.statUncompleted) this.statUncompleted.textContent = uncompleted;
    if (this.statCompletionRate) this.statCompletionRate.textContent = `${rate}%`;

    // Render Weekly Bar Chart
    this.renderWeeklyBarChart(completed, uncompleted);
  },

  renderWeeklyBarChart(completed, uncompleted) {
    if (!this.barContainer) return;

    // Simulate 4 weeks of productivity activity
    const weeksData = [
      { week: 'Week 1', active: 8, inactive: 3 },
      { week: 'Week 2', active: 12, inactive: 4 },
      { week: 'Week 3', active: 6, inactive: 2 },
      { week: 'Week 4', active: Math.max(5, completed), inactive: Math.max(2, uncompleted) }
    ];

    const maxVal = 16;
    this.barContainer.innerHTML = '';

    weeksData.forEach(item => {
      const col = document.createElement('div');
      col.className = 'bar-col';

      const activeHeight = Math.round((item.active / maxVal) * 120);
      const inactiveHeight = Math.round((item.inactive / maxVal) * 120);

      col.innerHTML = `
        <div class="bar-stack">
          <div class="bar-segment active" style="height:${activeHeight}px;" title="${item.active} Active Tasks"></div>
          <div class="bar-segment inactive" style="height:${inactiveHeight}px;" title="${item.inactive} Inactive Tasks"></div>
        </div>
        <span class="bar-label">${item.week}</span>
      `;

      this.barContainer.appendChild(col);
    });
  }
};
