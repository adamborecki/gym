/**
 * Gym App — Session Lifecycle (start, end, resume, summary)
 */

import { $, generateId, isoNow, deepClone, formatDuration } from './utils.js';
import { App, saveData, saveActiveSession, clearActiveSession, loadActiveSession } from './state.js';
import { showView, showToast, showModal, renderHome } from './ui.js';
import { hideRestTimer } from './timer.js';
import {
  enterWorkout, clearBikeForm, stopProgressTracking,
  hideAbsReminder,
} from './workout.js';

// ============================================================
// SESSION FLOW: Day Select → Time Goal → Warmup → Workout
// ============================================================
export function startNewSession() {
  showView('day-select');
}

export function selectDayType(dayType) {
  // Initialize session stub
  App.session = {
    id: generateId(),
    startedAt: isoNow(),
    endedAt: null,
    dayType,
    timeGoal: null,
    templateId: `${dayType}_default`,
    warmup: { stretchMinutes: null, bikeLog: null, durationSec: 0 },
    sets: [],
    bikeLogs: [],
    absLogs: [],
    nextTimeNotes: {},
    _ui: {
      expandedBlock: null,
      absReminder: App.data.profile.preferences.absReminder !== false,
    }
  };
  showView('time-select');
}

export function selectTimeGoal(timeGoal) {
  // Issue #3: skip warmup page — go directly into the workout
  App.session.timeGoal = timeGoal;
  App.restMode = App.data.profile.preferences.restModeDefault || 'normal';
  saveActiveSession();
  enterWorkout();
}

export function handleStartWorkout() {
  const s = App.session;
  s.warmup.stretchDone = $('warmup-stretch').checked;
  s._ui.absReminder = $('warmup-abs').checked;

  const bikeChoice = s._ui.bikeChoice || 'now';

  // Save session start
  saveActiveSession();

  if (bikeChoice === 'now') {
    // Go to bike log, then to workout
    App.bikeReturnView = 'workout';
    clearBikeForm();
    showView('bike-log');
  } else {
    enterWorkout();
  }
}

// ============================================================
// END SESSION
// ============================================================
export function promptEndSession() {
  const s = App.session;
  const setCount = s.sets.length;
  const elapsed = formatDuration(Date.now() - new Date(s.startedAt).getTime());

  if (setCount === 0 && (!s.bikeLogs || s.bikeLogs.length === 0) && !s.warmup.bikeLog && (!s.absLogs || s.absLogs.length === 0)) {
    // Empty session
    showModal('Discard Session?', 'You haven\'t logged anything yet.', [
      { label: 'Cancel', class: 'btn-ghost' },
      { label: 'Discard', class: 'btn-danger', action: discardSession },
    ]);
    return;
  }

  showModal('End Session?', `You've done ${setCount} sets in ${elapsed}.`, [
    { label: 'Cancel', class: 'btn-ghost' },
    { label: 'End Session', class: 'btn-primary', action: endSession },
  ]);
}

function endSession() {
  const s = App.session;
  s.endedAt = isoNow();

  // Calculate warmup duration (approximate: time from session start to first set or 5 min)
  if (s.sets.length > 0) {
    const firstSet = new Date(s.sets[0].loggedAt).getTime();
    s.warmup.durationSec = Math.floor((firstSet - new Date(s.startedAt).getTime()) / 1000);
  }

  // Remove _ui state before saving
  const sessionToSave = deepClone(s);
  delete sessionToSave._ui;

  // Save to history
  App.data.sessions.push(sessionToSave);
  saveData();

  // Cleanup
  stopProgressTracking();
  hideRestTimer();
  hideAbsReminder();
  clearActiveSession();
  $('backdate-overlay').classList.add('hidden');

  // Show summary
  renderSessionSummary(sessionToSave);
  showView('session-summary');
}

function discardSession() {
  stopProgressTracking();
  hideRestTimer();
  hideAbsReminder();
  clearActiveSession();
  App.session = null;
  App.absReminderShown = false;
  $('backdate-overlay').classList.add('hidden');
  showView('home');
  renderHome();
}

// ============================================================
// SESSION SUMMARY
// ============================================================
export function renderSessionSummary(session) {
  const container = $('summary-content');
  const duration = session.endedAt
    ? formatDuration(new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime())
    : '—';

  const totalSets = session.sets.length;
  const machines = [...new Set(session.sets.map(s => s.machineId))];
  const totalBikeMin = (session.warmup.bikeLog?.minutes || 0) +
    (session.bikeLogs || []).reduce((sum, b) => sum + b.minutes, 0);
  const absCount = (session.absLogs || []).length;

  let html = `
    <div class="summary-stat">
      <span class="summary-stat-label">Duration</span>
      <span class="summary-stat-value">${duration}</span>
    </div>
    <div class="summary-stat">
      <span class="summary-stat-label">Day Type</span>
      <span class="summary-stat-value">${session.dayType.charAt(0).toUpperCase() + session.dayType.slice(1)}</span>
    </div>
    <div class="summary-stat">
      <span class="summary-stat-label">Total Sets</span>
      <span class="summary-stat-value">${totalSets}</span>
    </div>
    <div class="summary-stat">
      <span class="summary-stat-label">Machines Used</span>
      <span class="summary-stat-value">${machines.length}</span>
    </div>
  `;

  if (totalBikeMin > 0) {
    html += `
      <div class="summary-stat">
        <span class="summary-stat-label">Bike</span>
        <span class="summary-stat-value">${totalBikeMin} min</span>
      </div>
    `;
  }

  if (absCount > 0) {
    html += `
      <div class="summary-stat">
        <span class="summary-stat-label">Abs Sets</span>
        <span class="summary-stat-value">${absCount}</span>
      </div>
    `;
  }

  // Next time notes
  const notes = session.nextTimeNotes || {};
  const noteEntries = Object.entries(notes);
  if (noteEntries.length > 0) {
    html += '<h3 style="margin-top:16px">Next Time Notes</h3>';
    noteEntries.forEach(([mid, note]) => {
      const machine = App.data.machines[mid];
      const name = machine ? machine.name : mid;
      html += `
        <div class="summary-stat">
          <span class="summary-stat-label">${name}</span>
          <span class="summary-stat-value">${note.replace(/_/g, ' ')}</span>
        </div>
      `;
    });
  }

  container.innerHTML = html;
}

// ============================================================
// RESUME SESSION
// ============================================================
export function checkResumeSession() {
  const saved = loadActiveSession();
  if (!saved || saved.endedAt) return;

  // Show resume prompt
  const elapsed = formatDuration(Date.now() - new Date(saved.startedAt).getTime());
  $('resume-info').textContent = `${saved.dayType.charAt(0).toUpperCase() + saved.dayType.slice(1)} day, started ${elapsed} ago. ${saved.sets.length} sets logged.`;
  $('resume-overlay').classList.remove('hidden');
}

export function resumeSession() {
  const saved = loadActiveSession();
  if (!saved) return;

  App.session = saved;
  App.restMode = App.data.profile.preferences.restModeDefault || 'normal';
  App.absReminderShown = false;

  $('resume-overlay').classList.add('hidden');
  enterWorkout();
}

export function discardSavedSession() {
  clearActiveSession();
  App.session = null;
  $('resume-overlay').classList.add('hidden');
}
