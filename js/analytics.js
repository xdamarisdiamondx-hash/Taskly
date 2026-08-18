/**
 * Analytics Dashboard Module for Taskly (Screen 4)
 * Calculates real-time productivity metrics, dynamic SVG donut chart completion ring,
 * and authentic weekly task activity bar chart from user data.
 */

import { Storage } from './storage.js';

export const Analytics = {
  init() {
    this.donutTotalText = document.getElementById('analyticsDonutTotal');
    this.donutCircleFill = document.getElementById('analyticsDonutCircleFill');
    this.statMyTasks = document.getElementById('analyticsMyTasksCount');
    this.statCompletedTasks = document.getElementById('analyticsCompletedCount');
    this.statUncompleted = document.getElementById('analyticsUncompletedCount');
    this.statCompletionRate = document.getElementById('analyticsRateText');
    this.barContainer = document.getElementById('weeklyBarChartContainer');

    this.render();
  },

  render() {
    const tasks = Storage.getTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const uncompleted = total - completed;
    const rateFraction = total > 0 ? (completed / total) : 0;
    const ratePercent = Math.round(rateFraction * 100);

    if (this.donutTotalText) this.donutTotalText.textContent = total;
    if (this.statMyTasks) this.statMyTasks.textContent = total;
    if (this.statCompletedTasks) this.statCompletedTasks.textContent = completed;
    if (this.statUncompleted) this.statUncompleted.textContent = uncompleted;
    if (this.statCompletionRate) this.statCompletionRate.textContent = `${ratePercent}%`;

    // Dynamic Donut SVG Ring: circumference = 2 * pi * 40 = 251.327
    if (this.donutCircleFill) {
      const circumference = 251.327;
      const strokeDashoffset = circumference * (1 - rateFraction);
      this.donutCircleFill.style.strokeDasharray = `${circumference}`;
      this.donutCircleFill.style.strokeDashoffset = `${strokeDashoffset}`;
    }

    // Render Real Weekly Bar Chart from task creation/due timestamps
    this.renderRealWeeklyBarChart(tasks);
  },

  renderRealWeeklyBarChart(tasks) {
    if (!this.barContainer) return;

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    // 4 Weekly Buckets (0-7 days ago, 7-14 days ago, 14-21 days ago, 21-28 days ago)
    const weeksData = [
      { week: 'Week 1', active: 0, inactive: 0 },
      { week: 'Week 2', active: 0, inactive: 0 },
      { week: 'Week 3', active: 0, inactive: 0 },
      { week: 'Week 4', active: 0, inactive: 0 }
    ];

    tasks.forEach(t => {
      const dateStr = t.createdAt || t.dueDate;
      if (!dateStr) return;
      const taskDate = new Date(dateStr);
      const diffDays = Math.floor((now - taskDate) / dayMs);

      let bucketIndex = -1;
      if (diffDays >= 21 && diffDays < 28) bucketIndex = 0;
      else if (diffDays >= 14 && diffDays < 21) bucketIndex = 1;
      else if (diffDays >= 7 && diffDays < 14) bucketIndex = 2;
      else if (diffDays >= 0 && diffDays < 7) bucketIndex = 3;

      if (bucketIndex !== -1) {
        if (t.status === 'completed') {
          weeksData[bucketIndex].active++;
        } else {
          weeksData[bucketIndex].inactive++;
        }
      }
    });

    // Find max height for scaling
    let maxVal = 1;
    weeksData.forEach(w => {
      const sum = w.active + w.inactive;
      if (sum > maxVal) maxVal = sum;
    });

    this.barContainer.innerHTML = '';

    weeksData.forEach(item => {
      const col = document.createElement('div');
      col.className = 'bar-col';

      const totalVal = item.active + item.inactive;
      const activeHeight = totalVal > 0 ? Math.round((item.active / maxVal) * 100) : 0;
      const inactiveHeight = totalVal > 0 ? Math.round((item.inactive / maxVal) * 100) : 0;

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
