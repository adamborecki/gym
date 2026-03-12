/**
 * Gym App — Analytics (heatmap, weekly charts)
 */

import { $, formatDuration, localDateStr } from './utils.js';
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

  // Build a map of local date => dayType
  const dateMap = {};
  sessions.forEach(s => {
    const date = localDateStr(new Date(s.startedAt));
    dateMap[date] = s.dayType;
  });

  // Calculate date range: end at today, start 53 weeks back on a Sunday
  const endDate = new Date(now);
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 371);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // back to Sunday

  // Build weeks array: each week is an array of 7 days (Sun=0 .. Sat=6)
  const weeks = [];
  const current = new Date(startDate);
  let week = [];
  while (current <= endDate) {
    week.push(new Date(current));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    current.setDate(current.getDate() + 1);
  }
  if (week.length) weeks.push(week);

  const numWeeks = weeks.length;
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']; // Sun,Mon,Tue,Wed,Thu,Fri,Sat

  // — Month labels row —
  const monthsRow = document.createElement('div');
  monthsRow.className = 'heatmap-months';
  monthsRow.style.gridTemplateColumns = `24px repeat(${numWeeks}, 1fr)`;
  monthsRow.appendChild(document.createElement('div')); // spacer for day-label column

  let lastMonth = -1;
  weeks.forEach(w => {
    const label = document.createElement('div');
    label.className = 'heatmap-month-label';
    // Use the first day of the week to determine month
    const m = w[0].getMonth();
    if (m !== lastMonth) {
      label.textContent = monthNames[m];
      lastMonth = m;
    }
    monthsRow.appendChild(label);
  });
  container.appendChild(monthsRow);

  // — Grid wrapper (day labels + cell grid) —
  const gridWrapper = document.createElement('div');
  gridWrapper.className = 'heatmap-grid-wrapper';

  // Day labels column
  const daysCol = document.createElement('div');
  daysCol.className = 'heatmap-days';
  dayLabels.forEach(label => {
    const el = document.createElement('div');
    el.className = 'heatmap-day-label';
    el.textContent = label;
    daysCol.appendChild(el);
  });
  gridWrapper.appendChild(daysCol);

  // Cell grid — uses grid-auto-flow: column so cells fill Sun→Sat per week
  const grid = document.createElement('div');
  grid.className = 'heatmap-grid';
  grid.style.gridTemplateColumns = `repeat(${numWeeks}, 1fr)`;

  weeks.forEach(w => {
    // Pad incomplete weeks (first/last) to 7 cells
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';

      if (dayIdx >= w.length) {
        cell.style.visibility = 'hidden';
        grid.appendChild(cell);
        continue;
      }

      const d = w[dayIdx];
      const dateStr = localDateStr(d);
      const dayType = dateMap[dateStr] || null;
      const isFuture = d > now;

      if (isFuture) {
        cell.style.visibility = 'hidden';
      } else if (dayType) {
        cell.classList.add(`hm-${dayType}`);
        cell.title = `${dateStr}: ${dayType}`;
        cell.onclick = () => showDaySummary(dateStr);
      } else {
        cell.classList.add('hm-empty');
      }

      grid.appendChild(cell);
    }
  });

  gridWrapper.appendChild(grid);
  container.appendChild(gridWrapper);

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
  const sessions = (App.data.sessions || []).filter(s => localDateStr(new Date(s.startedAt)) === dateStr);
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
    const weekKey = localDateStr(weekStart);

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
    const key = localDateStr(d);
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
