/**
 * Gym App — Session Lifecycle (start, end, resume, summary)
 */

import { $, generateId, isoNow, deepClone, formatDuration } from './utils.js';
import { App, saveData, saveActiveSession, clearActiveSession, loadActiveSession } from './state.js';
import { showView, showToast, showModal, renderHome } from './ui.js';
import { hideRestTimer } from './timer.js';
import {
  enterWorkout, clearBikeForm, stopProgressTracking,
} from './workout.js';

// ============================================================
// EVENT TRACKING — lightweight timestamps for session analytics
// ============================================================
export function trackEvent(type, detail) {
  if (!App.session) return;
  if (!App.session.events) App.session.events = [];
  App.session.events.push({ type, detail: detail || null, at: isoNow() });
}

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
    events: [],
    nextTimeNotes: {},
    _ui: {
      expandedBlock: null,
    }
  };
  showView('time-select');
}

export function selectTimeGoal(timeGoal) {
  // Issue #3: skip warmup page — go directly into the workout
  App.session.timeGoal = timeGoal;
  App.restMode = App.data.profile.preferences.restModeDefault || 'normal';
  trackEvent('session_start', { dayType: App.session.dayType });
  saveActiveSession();
  enterWorkout();
}

export function handleStartWorkout() {
  const s = App.session;
  s.warmup.stretchDone = $('warmup-stretch').checked;
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

  if (setCount === 0 && (!s.bikeLogs || s.bikeLogs.length === 0) && !s.warmup.bikeLog) {
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
  trackEvent('session_end');

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
  clearActiveSession();

  // Show summary
  renderSessionSummary(sessionToSave);
  showView('session-summary');
}

function discardSession() {
  stopProgressTracking();
  hideRestTimer();
  clearActiveSession();
  App.session = null;
  showView('home');
  renderHome();
}

// ============================================================
// SESSION SUMMARY
// ============================================================
export function renderSessionSummary(session) {
  const container = $('summary-content');
  const durationMs = session.endedAt
    ? new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
    : 0;
  const duration = durationMs ? formatDuration(durationMs) : '—';

  const totalSets = session.sets.length;
  const machines = [...new Set(session.sets.map(s => s.machineId))];
  const totalBikeMin = (session.warmup.bikeLog?.minutes || 0) +
    (session.bikeLogs || []).reduce((sum, b) => sum + b.minutes, 0);

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

  // Setup/prep time (time before first set)
  if (session.warmup.durationSec > 0) {
    html += `
      <div class="summary-stat">
        <span class="summary-stat-label">Setup / Prep</span>
        <span class="summary-stat-value">${formatDuration(session.warmup.durationSec * 1000)}</span>
      </div>
    `;
  }

  // Per-machine timing breakdown from events
  const machineTimings = deriveMachineTimings(session);
  if (machineTimings.length > 0) {
    html += '<h3 style="margin-top:16px">Time per Machine</h3>';
    machineTimings.forEach(({ machineId, durationMs: dur, setCount }) => {
      const machine = App.data.machines[machineId];
      const name = machine ? machine.name : machineId;
      html += `
        <div class="summary-stat">
          <span class="summary-stat-label">${name}</span>
          <span class="summary-stat-value">${formatDuration(dur)} · ${setCount} sets</span>
        </div>
      `;
    });
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
// DERIVE MACHINE TIMINGS from events
// ============================================================
function deriveMachineTimings(session) {
  const events = session.events || [];
  if (events.length === 0) return [];

  // Walk events to compute time spent on each machine.
  // machine_open starts the clock; machine_done or the next machine_open stops it.
  const timings = {}; // machineId → total ms
  let currentMachine = null;
  let currentStart = null;

  for (const ev of events) {
    const t = new Date(ev.at).getTime();

    if (ev.type === 'machine_open') {
      // Close previous machine if still open
      if (currentMachine && currentStart) {
        if (!timings[currentMachine]) timings[currentMachine] = 0;
        timings[currentMachine] += t - currentStart;
      }
      currentMachine = ev.detail?.machineId || null;
      currentStart = t;
    } else if (ev.type === 'machine_done') {
      if (currentMachine && currentStart) {
        if (!timings[currentMachine]) timings[currentMachine] = 0;
        timings[currentMachine] += t - currentStart;
      }
      currentMachine = null;
      currentStart = null;
    } else if (ev.type === 'session_end') {
      // Close any still-open machine
      if (currentMachine && currentStart) {
        if (!timings[currentMachine]) timings[currentMachine] = 0;
        timings[currentMachine] += t - currentStart;
      }
      currentMachine = null;
      currentStart = null;
    }
  }

  // Build result array sorted by first appearance
  const machineOrder = [];
  for (const ev of events) {
    if (ev.type === 'machine_open' && ev.detail?.machineId) {
      if (!machineOrder.includes(ev.detail.machineId)) {
        machineOrder.push(ev.detail.machineId);
      }
    }
  }

  const setsByMachine = {};
  (session.sets || []).forEach(s => {
    setsByMachine[s.machineId] = (setsByMachine[s.machineId] || 0) + 1;
  });

  return machineOrder
    .filter(mid => timings[mid] && timings[mid] > 0)
    .map(mid => ({
      machineId: mid,
      durationMs: timings[mid],
      setCount: setsByMachine[mid] || 0,
    }));
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

  $('resume-overlay').classList.add('hidden');
  enterWorkout();
}

export function discardSavedSession() {
  clearActiveSession();
  App.session = null;
  $('resume-overlay').classList.add('hidden');
}
