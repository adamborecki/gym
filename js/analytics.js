/**
 * Gym App — Analytics (heatmap, weekly charts)
 */

import { $, formatDuration } from './utils.js';
import { App } from './state.js';

// ============================================================
// ANALYTICS
// ============================================================
export function renderAnalytics() {
  renderHeatmap();
  renderWeeklyCharts();
  $('day-summary').classList.add('hidden');
}

function renderHeatmap() {
  const container = $('heatmap');
  container.innerHTML = '';

  const sessions = App.data.sessions || [];
  const now = new Date();

  // Build a map of date => session
  const dateMap = {};
  sessions.forEach(s => {
    const date = s.startedAt.split('T')[0];
    dateMap[date] = s.dayType;
  });

  // Show last ~52 weeks (364 days), organized by weeks
  // Each column is a week, each row is a day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const totalDays = 371; // 53 weeks
  const endDate = new Date(now);
  endDate.setHours(0, 0, 0, 0);

  // Find the start: go back totalDays, then back to the previous Sunday
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - totalDays);
  // Back to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const dayType = dateMap[dateStr] || null;
    const isFuture = current > now;

    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';

    if (isFuture) {
      cell.style.visibility = 'hidden';
    } else if (dayType) {
      cell.classList.add(`hm-${dayType}`);
      cell.title = `${dateStr}: ${dayType}`;
      cell.onclick = () => showDaySummary(dateStr);
    } else {
      cell.classList.add('hm-empty');
    }

    container.appendChild(cell);
    current.setDate(current.getDate() + 1);
  }

  // Legend
  const legend = $('heatmap-legend');
  legend.innerHTML = `
    <div class="legend-item"><div class="legend-swatch" style="background:var(--push-color)"></div>Push</div>
    <div class="legend-item"><div class="legend-swatch" style="background:var(--pull-color)"></div>Pull</div>
    <div class="legend-item"><div class="legend-swatch" style="background:var(--legs-color)"></div>Legs</div>
    <div class="legend-item"><div class="legend-swatch" style="background:var(--bonus-color)"></div>Bonus</div>
  `;
}

function showDaySummary(dateStr) {
  const sessions = App.data.sessions.filter(s => s.startedAt.startsWith(dateStr));
  if (sessions.length === 0) return;

  const container = $('day-summary');
  container.classList.remove('hidden');

  let html = `<h3>${dateStr}</h3>`;
  sessions.forEach(s => {
    const duration = s.endedAt
      ? formatDuration(new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime())
      : '—';
    html += `
      <div class="summary-stat">
        <span class="summary-stat-label">${s.dayType} — ${s.sets.length} sets</span>
        <span class="summary-stat-value">${duration}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderWeeklyCharts() {
  renderBarChart('chart-sets', getWeeklyData('sets'));
  renderBarChart('chart-bike', getWeeklyData('bike'));
}

function getWeeklyData(metric) {
  const sessions = App.data.sessions || [];
  const weeks = {};

  sessions.forEach(s => {
    const date = new Date(s.startedAt);
    // Get week start (Sunday)
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeks[weekKey]) weeks[weekKey] = 0;

    if (metric === 'sets') {
      weeks[weekKey] += s.sets.length;
    } else if (metric === 'bike') {
      weeks[weekKey] += (s.warmup?.bikeLog?.minutes || 0) +
        (s.bikeLogs || []).reduce((sum, b) => sum + b.minutes, 0);
    }
  });

  // Get last 12 weeks
  const now = new Date();
  const result = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() - (i * 7));
    const key = d.toISOString().split('T')[0];
    const month = d.getMonth() + 1;
    const day = d.getDate();
    result.push({
      label: `${month}/${day}`,
      value: weeks[key] || 0,
    });
  }

  return result;
}

function renderBarChart(containerId, data) {
  const container = $(containerId);
  const maxVal = Math.max(...data.map(d => d.value), 1);

  let html = '<div class="chart-bar-container">';
  data.forEach(d => {
    const height = (d.value / maxVal) * 80;
    html += `
      <div class="chart-bar-wrapper">
        <span class="chart-bar-value">${d.value || ''}</span>
        <div class="chart-bar" style="height:${Math.max(height, 2)}px"></div>
        <span class="chart-bar-label">${d.label}</span>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}
