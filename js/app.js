/**
 * Gym App v1 — Main Application Logic
 * Mobile-first personal gym tracker
 * All data stored locally in localStorage
 */

import { DEFAULT_DATA } from './data-defaults.js';

// ============================================================
// CONSTANTS
// ============================================================
const STORAGE_KEY = 'gymApp_v1_data';
const SESSION_KEY = 'gymApp_v1_activeSession';

const REST_TARGETS = {
  compound:  { normal: 90, hurry: 60 }, // seconds
  isolation: { normal: 60, hurry: 45 },
};

const TIME_GOALS = {
  '30-45': { min: 30, max: 45 },
  '40-60': { min: 40, max: 60 },
  '60-90': { min: 60, max: 90 },
};

// Starting weights seeded from user's Google Keep history (last logged weight per machine)
// Used as fallback when no previous session data exists for a machine
const SEED_WEIGHTS = {
  chest_press:               40,   // 2/25: 40 ×3×10
  incline_press:             20,   // 2/19: 20 ×3×12
  shoulder_press:            30,   // 2/28: 30 ×3×9
  pec_fly:                   55,   // 2/25: 55 ×3×13
  rear_delt:                 45,   // 2/25: 45 ×3×12
  triceps_pushdown:          90,   // 2/25: 90 ×3×12
  triceps_extension_machine: 40,   // 2/14: 40 ×3×13
  lat_pulldown:              70,   // last logged 75 but note says drop to 70 for form
  seated_row:                75,   // 2/17: 75 ×3×10
  biceps_curl_machine:       25,   // 2/17: 25 ×3×12
  assisted_chin:             70,   // 2/17: 70 lb assist ×3×12 (higher = more assistance = easier)
  seated_leg_press:         180,   // 2/19: 180 ×3×13
  seated_leg_curl:           70,   // 2/19: 70 ×3×13
  leg_extension:             65,   // 2/23: 65 ×3×12
  hip_abduction:            110,   // 2/19: 110 ×3×20
  hip_adduction:            120,   // 2/23: 120 ×3×20
};

// ============================================================
// DATA LAYER
// ============================================================
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* corrupted data, reinitialize */ }
  return null;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(App.data));
}

function loadActiveSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

function saveActiveSession() {
  if (App.session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(App.session));
  }
}

function clearActiveSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ============================================================
// APP STATE
// ============================================================
const App = {
  data: null,          // persistent data (profile, machines, templates, sessions)
  session: null,       // active session (in-progress)
  currentView: 'home',
  previousView: null,
  restTimerInterval: null,
  restStartTime: null,
  restMode: 'normal',
  restMachineType: null,
  progressInterval: null,
  sessionStartTime: null,
  backdateTimeout: null,
  absReminderShown: false,
  absReminderTimeout: null,
  currentMachineId: null,
  currentBlockId: null,
  bikeReturnView: null,  // where to go back after bike log
  absReturnView: null,
  undoStack: [],
  audioCtx: null,
};

// ============================================================
// UTILITIES
// ============================================================
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function formatTime(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${m}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec}s`;
}

function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }

function isoNow() { return new Date().toISOString(); }

// ============================================================
// VIEW SYSTEM
// ============================================================
function showView(viewId, opts = {}) {
  App.previousView = App.currentView;
  App.currentView = viewId;

  $$('.view').forEach(v => v.classList.remove('active'));
  const el = $(`view-${viewId}`);
  if (el) el.classList.add('active');

  // Show/hide session chrome
  const inSession = !!App.session;
  $('progress-bar').classList.toggle('hidden', !inSession);
  $('pill-row').classList.toggle('hidden', !inSession);

  // Scroll to top
  window.scrollTo(0, 0);
}

// ============================================================
// PILL ROW
// ============================================================
function updatePillRow() {
  const row = $('pill-row');
  if (!App.session) { row.classList.add('hidden'); return; }
  row.classList.remove('hidden');

  const s = App.session;
  let html = '';

  // Day type pill
  html += `<span class="pill pill-${s.dayType}">${s.dayType.charAt(0).toUpperCase() + s.dayType.slice(1)}</span>`;

  // Time goal pill
  html += `<span class="pill">${s.timeGoal} min</span>`;

  // Warmup status
  if (s.warmup) {
    const parts = [];
    if (s.warmup.stretchMinutes) parts.push(`Stretch ${s.warmup.stretchMinutes}m`);
    if (s.warmup.bikeLog) parts.push(`Bike ${s.warmup.bikeLog.minutes}m`);
    if (parts.length) {
      html += `<span class="pill">${parts.join(' + ')}</span>`;
    }
  }

  // Sets count
  const setCount = s.sets ? s.sets.length : 0;
  if (setCount > 0) {
    html += `<span class="pill">${setCount} sets</span>`;
  }

  row.innerHTML = html;
}

// ============================================================
// PROGRESS BAR
// ============================================================
function startProgressTracking() {
  App.sessionStartTime = new Date(App.session.startedAt).getTime();
  updateProgressBar();
  App.progressInterval = setInterval(updateProgressBar, 1000);
}

function stopProgressTracking() {
  if (App.progressInterval) {
    clearInterval(App.progressInterval);
    App.progressInterval = null;
  }
}

function updateProgressBar() {
  if (!App.session) return;
  const goal = TIME_GOALS[App.session.timeGoal];
  if (!goal) return;

  const elapsed = (Date.now() - App.sessionStartTime) / 1000 / 60; // minutes
  const pct = Math.min(elapsed / goal.max * 100, 100);

  const fill = $('progress-fill');
  fill.style.width = `${pct}%`;

  // Pace classes
  fill.className = '';
  if (elapsed > goal.max) {
    fill.classList.add('pace-over');
  } else if (elapsed > goal.min) {
    fill.classList.add('pace-on');
  } else {
    fill.classList.add('pace-ahead');
  }

  // Label
  const label = $('progress-pace-label');
  const elapsedStr = `${Math.floor(elapsed)}m`;
  if (elapsed > goal.max) {
    label.textContent = `${elapsedStr} — over time`;
  } else if (elapsed > goal.min) {
    label.textContent = `${elapsedStr} — finishing up`;
  } else {
    label.textContent = elapsedStr;
  }
}

// ============================================================
// TOAST & UNDO
// ============================================================
function showToast(message, undoFn) {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${message}</span>`;

  if (undoFn) {
    const btn = document.createElement('button');
    btn.className = 'toast-undo';
    btn.textContent = 'Undo';
    btn.onclick = (e) => {
      e.stopPropagation();
      undoFn();
      toast.remove();
    };
    toast.appendChild(btn);
  }

  container.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// ============================================================
// MODAL
// ============================================================
function showModal(title, message, actions) {
  const overlay = $('modal-overlay');
  const body = $('modal-body');
  const actionsEl = $('modal-actions');

  body.innerHTML = `<h3>${title}</h3><p>${message}</p>`;
  actionsEl.innerHTML = '';

  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = `btn ${a.class || 'btn-ghost'}`;
    btn.textContent = a.label;
    btn.onclick = () => {
      overlay.classList.add('hidden');
      if (a.action) a.action();
    };
    actionsEl.appendChild(btn);
  });

  overlay.classList.remove('hidden');
}

// ============================================================
// HOME
// ============================================================
function renderHome() {
  const greeting = $('home-greeting');
  const name = App.data.profile.name || '';
  const hour = new Date().getHours();
  let timeGreeting = 'Good evening';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  greeting.textContent = name ? `${timeGreeting}, ${name}` : timeGreeting;
}

// ============================================================
// SESSION FLOW: Day Select → Time Goal → Warmup → Workout
// ============================================================
function startNewSession() {
  showView('day-select');
}

function selectDayType(dayType) {
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

function selectTimeGoal(timeGoal) {
  // Issue #3: skip warmup page — go directly into the workout
  App.session.timeGoal = timeGoal;
  App.restMode = App.data.profile.preferences.restModeDefault || 'normal';
  saveActiveSession();
  enterWorkout();
}

function handleStartWorkout() {
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

function enterWorkout() {
  startProgressTracking();
  renderWorkout();
  showView('workout');
  updatePillRow();
  saveActiveSession();

  // Schedule abs reminder
  if (App.session._ui.absReminder && !App.absReminderShown) {
    App.absReminderTimeout = setTimeout(() => {
      showAbsReminder();
    }, 10 * 60 * 1000); // 10 minutes into workout
  }
}

// ============================================================
// WORKOUT VIEW
// ============================================================
function renderWorkout() {
  const s = App.session;
  const template = App.data.templates[s.templateId];
  if (!template) return;

  $('workout-title').textContent = template.name;

  const container = $('blocks-container');
  container.innerHTML = '';

  template.blocks.forEach(block => {
    const card = document.createElement('div');
    card.className = 'block-card';
    card.dataset.blockId = block.id;

    // Check if block is completed (all machines have at least 1 set or were skipped)
    const blockSets = getBlockSets(block);
    const isExpanded = s._ui.expandedBlock === block.id;
    const isDone = isBlockComplete(block);

    if (isExpanded) card.classList.add('block-expanded');
    if (isDone) card.classList.add('block-done');

    // Header — "abs" block displays as "Other"
    const displayName = block.id === 'abs' ? 'Other' : block.name;
    const header = document.createElement('div');
    header.className = 'block-header';
    header.innerHTML = `
      <div class="block-header-left">
        ${isDone ? '<span class="block-check">&#10003;</span>' : ''}
        <span>${displayName}</span>
        <span class="pill pill-sm">${blockSets.length} sets</span>
      </div>
      <span class="block-chevron">&#9654;</span>
    `;
    header.onclick = () => toggleBlock(block.id);
    card.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'block-body';

    if (block.id === 'warmup') {
      // Warmup block — bike only
      renderWarmupBlock(body, block);
    } else if (block.id === 'abs') {
      renderAbsBlock(body, block);
    } else {
      renderMachineBlock(body, block);
    }

    card.appendChild(body);
    container.appendChild(card);
  });
}

function renderWarmupBlock(body, block) {
  const s = App.session;
  body.innerHTML = '';

  // --- Stretch section ---
  const stretchSection = document.createElement('div');
  stretchSection.className = 'warmup-section';

  if (s.warmup.stretchMinutes) {
    // Already logged
    stretchSection.innerHTML = `
      <div class="stretch-logged">
        <span>🧘 Stretch: ${s.warmup.stretchMinutes} min</span>
        <button class="btn btn-sm btn-ghost" onclick="window._appClearStretch()">✕</button>
      </div>
    `;
  } else {
    // Inline log form
    const stretchId = 'warmup-stretch-mins';
    stretchSection.innerHTML = `
      <div class="warmup-label">🧘 Stretch</div>
      <div class="stretch-log-row">
        <input type="number" id="${stretchId}" class="input-sm" inputmode="numeric"
               min="1" max="60" placeholder="min">
        <button class="btn btn-sm btn-ghost" onclick="window._appLogStretch()">Log</button>
      </div>
    `;
  }
  body.appendChild(stretchSection);

  // --- Bike section ---
  const bikeSection = document.createElement('div');
  bikeSection.className = 'warmup-section';

  if (s.warmup.bikeLog) {
    const bl = s.warmup.bikeLog;
    bikeSection.innerHTML = `
      <div class="set-row">
        <span class="set-row-detail">🚴 Bike: ${bl.minutes} min${bl.rpe ? ` · RPE ${bl.rpe}` : ''}${bl.maxHR ? ` · HR ${bl.maxHR}` : ''}</span>
      </div>
    `;
  } else {
    const bikeRow = document.createElement('div');
    bikeRow.className = 'machine-row';
    bikeRow.onclick = window._appBikeQuick;
    bikeRow.innerHTML = `
      <span class="machine-row-name">🚴 Log Bike</span>
      <span class="block-chevron">&#9654;</span>
    `;
    bikeSection.appendChild(bikeRow);
  }
  body.appendChild(bikeSection);

  // Additional bike logs
  if (s.bikeLogs && s.bikeLogs.length > 0) {
    s.bikeLogs.forEach((bl, i) => {
      const row = document.createElement('div');
      row.className = 'set-row';
      row.innerHTML = `<span class="set-row-detail">🚴 Bike #${i+2}: ${bl.minutes} min${bl.rpe ? ` · RPE ${bl.rpe}` : ''}</span>`;
      body.appendChild(row);
    });
  }
}

function renderAbsBlock(body, block) {
  const s = App.session;

  // Session-added machines for the Other block
  const otherMachines = s._ui.otherMachines || [];
  otherMachines.forEach(machineId => {
    const machine = App.data.machines[machineId];
    if (!machine) return;
    const setsForMachine = getMachineSets(machineId);
    const row = document.createElement('div');
    row.className = 'machine-row';
    row.onclick = () => openMachine(machineId, block.id);
    row.innerHTML = `
      <div>
        <span class="machine-row-name">${machine.name}</span>
        <span class="machine-row-sets">${setsForMachine.length > 0 ? `${setsForMachine.length} sets` : ''}</span>
      </div>
      <div>
        ${setsForMachine.length > 0 ? '<span class="machine-row-check">&#10003;</span>' : ''}
        <span class="block-chevron">&#9654;</span>
      </div>
    `;
    body.appendChild(row);
  });

  // Logged abs entries
  if (s.absLogs && s.absLogs.length > 0) {
    s.absLogs.forEach(al => {
      const row = document.createElement('div');
      row.className = 'set-row';
      row.innerHTML = `<span class="set-row-detail">Abs: ${al.type}${al.note ? ` — ${al.note}` : ''}</span>`;
      body.appendChild(row);
    });
  }

  // Quick Add Abs row
  const absRow = document.createElement('div');
  absRow.className = 'machine-row';
  absRow.onclick = () => { App.absReturnView = 'workout'; showView('abs-log'); };
  absRow.innerHTML = `
    <span class="machine-row-name">💪 Quick Add Abs</span>
    <span class="block-chevron">&#9654;</span>
  `;
  body.appendChild(absRow);

  // Add Machine row
  const addRow = document.createElement('div');
  addRow.className = 'machine-row';
  addRow.onclick = () => showAddMachineToOtherModal();
  addRow.innerHTML = `
    <span class="machine-row-name">➕ Add Machine</span>
    <span class="block-chevron">&#9654;</span>
  `;
  body.appendChild(addRow);
}

function showAddMachineToOtherModal() {
  // Collect all machine IDs already in this workout's template blocks
  const template = App.data.templates[App.session.templateId];
  const usedIds = new Set();
  template.blocks.forEach(b => {
    (b.suggestions || []).forEach(m => usedIds.add(m));
  });
  // Also exclude already-added other machines
  (App.session._ui.otherMachines || []).forEach(m => usedIds.add(m));

  const available = Object.values(App.data.machines)
    .filter(m => m.type !== 'conditioning' && !usedIds.has(m.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (available.length === 0) {
    showToast('All machines already in workout');
    return;
  }

  const overlay = $('modal-overlay');
  const bodyEl = $('modal-body');
  const actionsEl = $('modal-actions');

  bodyEl.innerHTML = '<h3>Add Machine to Other</h3>';
  const list = document.createElement('div');
  list.style.cssText = 'max-height:50vh; overflow-y:auto; margin-top:12px;';
  available.forEach(machine => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.style.cssText = 'width:100%; text-align:left; margin-bottom:6px;';
    btn.textContent = machine.name;
    btn.onclick = () => {
      if (!App.session._ui.otherMachines) App.session._ui.otherMachines = [];
      App.session._ui.otherMachines.push(machine.id);
      saveActiveSession();
      overlay.classList.add('hidden');
      renderWorkout();
    };
    list.appendChild(btn);
  });
  bodyEl.appendChild(list);

  actionsEl.innerHTML = '';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-ghost';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => overlay.classList.add('hidden');
  actionsEl.appendChild(cancelBtn);

  overlay.classList.remove('hidden');
}

function renderMachineBlock(body, block) {
  if (!block.suggestions || block.suggestions.length === 0) {
    body.innerHTML = '<div class="block-empty">No machines in this block</div>';
    return;
  }

  block.suggestions.forEach(machineId => {
    const machine = App.data.machines[machineId];
    if (!machine) return;

    const setsForMachine = getMachineSets(machineId);
    const row = document.createElement('div');
    row.className = 'machine-row';
    row.onclick = () => openMachine(machineId, block.id);

    const hasCheck = setsForMachine.length > 0;
    row.innerHTML = `
      <div>
        <span class="machine-row-name">${machine.name}</span>
        <span class="machine-row-sets">${setsForMachine.length > 0 ? `${setsForMachine.length} sets` : ''}</span>
      </div>
      <div>
        ${hasCheck ? '<span class="machine-row-check">&#10003;</span>' : ''}
        <span class="block-chevron">&#9654;</span>
      </div>
    `;
    body.appendChild(row);
  });
}

function getBlockSets(block) {
  if (!App.session) return [];
  const ids = [...(block.suggestions || [])];
  // For the Other block, also include session-added machines
  if (block.id === 'abs' && App.session._ui.otherMachines) {
    App.session._ui.otherMachines.forEach(m => ids.push(m));
  }
  return App.session.sets.filter(s => ids.includes(s.machineId));
}

function isBlockComplete(block) {
  if (!block.suggestions || block.suggestions.length === 0) return true;
  if (block.id === 'warmup') return !!(App.session.warmup.bikeLog || App.session.warmup.stretchMinutes);
  if (block.id === 'abs') {
    const hasAbs = App.session.absLogs && App.session.absLogs.length > 0;
    const otherMachines = App.session._ui.otherMachines || [];
    const hasOtherSets = otherMachines.some(mid => getMachineSets(mid).length > 0);
    return hasAbs || hasOtherSets;
  }
  // A block is "complete" if every machine has at least one set
  return block.suggestions.every(mid => getMachineSets(mid).length > 0);
}

function getMachineSets(machineId) {
  if (!App.session) return [];
  return App.session.sets.filter(s => s.machineId === machineId);
}

function toggleBlock(blockId) {
  const s = App.session;
  if (s._ui.expandedBlock === blockId) {
    s._ui.expandedBlock = null;
  } else {
    s._ui.expandedBlock = blockId;
  }
  renderWorkout();
}

// ============================================================
// MACHINE VIEW
// ============================================================
function openMachine(machineId, blockId) {
  App.currentMachineId = machineId;
  App.currentBlockId = blockId;
  renderMachineView(machineId);
  showView('machine');
}

function renderMachineView(machineId) {
  const machine = App.data.machines[machineId];
  if (!machine) return;

  $('machine-name').textContent = machine.name;

  // Hide top rep range pill — it's now shown inline in the set logger (issue #5)
  $('machine-rep-range').classList.add('hidden');

  // Assisted chin inversion note (issue #4)
  let inversionNote = $('machine-inversion-note');
  if (!inversionNote) {
    inversionNote = document.createElement('div');
    inversionNote.id = 'machine-inversion-note';
    inversionNote.className = 'machine-inversion-note hidden';
    $('machine-name').parentElement.insertBefore(inversionNote, $('machine-rep-range').nextSibling);
  }
  if (machineId === 'assisted_chin') {
    inversionNote.textContent = '⚠️ Higher weight = more assistance = easier';
    inversionNote.classList.remove('hidden');
  } else {
    inversionNote.classList.add('hidden');
  }

  // Setup tab
  renderSetupFields(machine);

  // Form tab
  renderFormTab(machine);

  // Mantra tab
  renderMantraTab(machine);

  // Mantra sticky
  renderMantraSticky(machine);

  // Mark familiar button
  const famBtn = $('btn-toggle-familiar');
  famBtn.textContent = machine.familiarity === 'familiar' ? 'Mark as Learning' : 'Mark Familiar';

  // TTS buttons
  const ttsAvailable = ('speechSynthesis' in window) && App.data.profile.preferences.ttsEnabled;
  $('tts-setup-row').classList.toggle('hidden', !ttsAvailable);
  $('tts-form-row').classList.toggle('hidden', !ttsAvailable);

  // Reset active tab to setup
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'setup'));
  $$('.tab-content').forEach(t => t.classList.remove('active'));
  $('tab-content-setup').classList.add('active');

  // Logged sets
  renderLoggedSets(machineId);

  // Set logger
  renderSetLogger(machineId);

  // Check if conditioning (bike) — different UI
  if (machine.type === 'conditioning') {
    $('set-logger').classList.add('hidden');
    $('next-time-suggestion').classList.add('hidden');
    // Redirect to bike log
    App.bikeReturnView = 'machine';
    clearBikeForm();
    showView('bike-log');
    return;
  }
}

function renderSetupFields(machine) {
  const container = $('setup-fields');
  container.innerHTML = '';

  // Show setup tips text above fields (issue #1)
  if (machine.tips?.setup) {
    const notes = document.createElement('div');
    notes.className = 'setup-notes-text';
    notes.textContent = machine.tips.setup;
    container.appendChild(notes);
  }

  if (!machine.setupFields) return;

  machine.setupFields.forEach(field => {
    // Get saved value from machine data
    const savedSetup = App.data.machines[machine.id]._setup || {};
    const value = savedSetup[field.key] || '';

    const group = document.createElement('div');
    group.className = 'form-group';

    const label = document.createElement('label');
    label.textContent = field.label;
    label.setAttribute('for', `setup-${field.key}`);
    group.appendChild(label);

    const input = document.createElement('input');
    input.id = `setup-${field.key}`;
    input.className = 'input-lg';
    input.type = field.type === 'number' ? 'number' : 'text';
    if (field.type === 'number') input.inputMode = 'numeric';
    input.value = value;
    input.placeholder = field.label;

    // Auto-save on change
    input.onchange = () => {
      if (!App.data.machines[machine.id]._setup) {
        App.data.machines[machine.id]._setup = {};
      }
      App.data.machines[machine.id]._setup[field.key] = input.value;
      saveData();
    };

    group.appendChild(input);
    container.appendChild(group);
  });
}

function renderFormTab(machine) {
  const formText = $('form-text');
  formText.textContent = machine.tips?.form || 'No form tips available.';

  // If familiar, collapse by default
  if (machine.familiarity === 'familiar') {
    formText.classList.add('collapsed');
    // Add expand button if not already present
    let expandBtn = formText.parentElement.querySelector('.form-expand-btn');
    if (!expandBtn) {
      expandBtn = document.createElement('button');
      expandBtn.className = 'form-expand-btn';
      expandBtn.textContent = 'Show more';
      expandBtn.onclick = () => {
        formText.classList.toggle('collapsed');
        expandBtn.textContent = formText.classList.contains('collapsed') ? 'Show more' : 'Show less';
      };
      formText.parentElement.appendChild(expandBtn);
    }
  } else {
    formText.classList.remove('collapsed');
    const expandBtn = formText.parentElement.querySelector('.form-expand-btn');
    if (expandBtn) expandBtn.remove();
  }
}

function renderMantraTab(machine) {
  const container = $('mantra-lines');
  const mantra = machine.tips?.mantra || [];
  const phasedCues = machine.tips?.phasedCues || {};

  let html = mantra.map(line => `<div>${line}</div>`).join('');

  // Phased cues
  if (Object.keys(phasedCues).length > 0) {
    html += '<div style="margin-top:12px; border-top: 1px solid var(--border); padding-top:8px;">';
    for (const [phase, cue] of Object.entries(phasedCues)) {
      html += `<div><strong>${phase}:</strong> ${cue}</div>`;
    }
    html += '</div>';
  }

  container.innerHTML = html;
}

function renderMantraSticky(machine) {
  const sticky = $('machine-mantra-sticky');
  const mantra = machine.tips?.mantra || [];
  if (mantra.length > 0) {
    sticky.innerHTML = mantra.map(l => `<span>${l}</span>`).join('');
    sticky.classList.remove('hidden');
  } else {
    sticky.classList.add('hidden');
  }
}

function renderLoggedSets(machineId) {
  const container = $('logged-sets');
  const sets = getMachineSets(machineId);
  container.innerHTML = '';

  sets.forEach(s => {
    const row = document.createElement('div');
    row.className = 'set-row';
    row.innerHTML = `
      <span class="set-row-num">${s.setNumber}</span>
      <span class="set-row-detail">${s.weight} lbs &times; ${s.reps}</span>
      <span class="set-row-rir">RIR ${s.rir}</span>
    `;
    container.appendChild(row);
  });
}

function renderSetLogger(machineId) {
  const machine = App.data.machines[machineId];
  if (!machine || machine.type === 'conditioning') return;

  const sets = getMachineSets(machineId);
  const setNum = sets.length + 1;
  const rirPattern = machine.rirPattern || [2, 1, 1];
  const targetRir = setNum <= rirPattern.length
    ? rirPattern[setNum - 1]
    : rirPattern[rirPattern.length - 1];

  // Check if we've done all typical working sets (3)
  const typicalSets = rirPattern.length;
  if (setNum > typicalSets) {
    // Show next-time suggestion
    showNextTimeSuggestion(machineId);
    $('set-logger').classList.add('hidden');
    return;
  }

  $('set-logger').classList.remove('hidden');
  $('next-time-suggestion').classList.add('hidden');

  $('current-set-label').textContent = `Set ${setNum}`;
  $('target-rir-label').textContent = `Target: RIR ${targetRir}`;

  // Show rep range inline near the reps input (issue #5)
  const repRangePill = $('set-rep-range');
  if (machine.repRange && machine.repRange.max > 0) {
    repRangePill.textContent = `${machine.repRange.min}–${machine.repRange.max}`;
    repRangePill.classList.remove('hidden');
  } else {
    repRangePill.classList.add('hidden');
  }

  // Pre-fill weight from last set or last session
  const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
  if (lastSet) {
    $('set-weight').value = lastSet.weight;
    $('set-reps').value = '';
  } else {
    // Try to get weight from previous session for this machine
    const prevWeight = getLastSessionWeight(machineId);
    $('set-weight').value = prevWeight || '';
    $('set-reps').value = '';
  }

  // Reset RIR chips
  $$('#rir-chips .chip').forEach(c => c.classList.remove('chip-active'));

  // Reset note chips
  $$('#note-chips .chip').forEach(c => c.classList.remove('chip-active'));
  $('set-custom-note').value = '';
}

function getLastSessionWeight(machineId) {
  const sessions = App.data.sessions || [];
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    const set = s.sets?.find(st => st.machineId === machineId);
    if (set) return set.weight;
  }
  // Fall back to seeded starting weights from Google Keep history (issue #4)
  return SEED_WEIGHTS[machineId] ?? null;
}

function showNextTimeSuggestion(machineId) {
  const machine = App.data.machines[machineId];
  const sets = getMachineSets(machineId);

  $('set-logger').classList.add('hidden');
  $('next-time-suggestion').classList.remove('hidden');

  // Check if weight up suggestion should show
  const shouldSuggestWeightUp = checkWeightUpCondition(machine, sets);
  $('weight-up-prompt').classList.toggle('hidden', !shouldSuggestWeightUp);

  // Pre-select "Again" by default so save works without tapping (issue #7)
  $$('#next-time-chips .chip').forEach(c => {
    c.classList.toggle('chip-active', c.dataset.next === 'again');
  });
  $('next-time-custom').value = '';

  // Override with previously saved note if one exists
  if (App.session.nextTimeNotes[machineId]) {
    const saved = App.session.nextTimeNotes[machineId];
    $$('#next-time-chips .chip').forEach(c => {
      c.classList.toggle('chip-active', c.dataset.next === saved);
    });
  }
}

function checkWeightUpCondition(machine, sets) {
  if (!sets || sets.length === 0) return false;
  const rirPattern = machine.rirPattern || [2, 1, 1];

  // Check if user hit top of rep range AND met intended RIR for each set
  return sets.every((s, i) => {
    const targetRir = i < rirPattern.length ? rirPattern[i] : rirPattern[rirPattern.length - 1];
    return s.reps >= machine.repRange.max && s.rir <= targetRir;
  });
}

// ============================================================
// SET LOGGING
// ============================================================
function logSet() {
  const machineId = App.currentMachineId;
  if (!machineId || !App.session) return;

  const weight = parseFloat($('set-weight').value);
  const reps = parseInt($('set-reps').value);

  if (isNaN(weight) || isNaN(reps) || reps <= 0) {
    showToast('Enter weight and reps');
    return;
  }

  // Get selected RIR
  const rirChip = document.querySelector('#rir-chips .chip-active');
  if (!rirChip) {
    showToast('Select RIR');
    return;
  }
  const rir = parseInt(rirChip.dataset.rir);

  // Collect notes
  const notes = [];
  $$('#note-chips .chip-active').forEach(c => notes.push(c.dataset.note));
  const custom = $('set-custom-note').value.trim();
  if (custom) notes.push(custom);

  const sets = getMachineSets(machineId);
  const setNumber = sets.length + 1;

  const setData = {
    machineId,
    setNumber,
    weight,
    reps,
    rir,
    finishedOffsetSec: 0,
    notes,
    loggedAt: isoNow(),
  };

  App.session.sets.push(setData);

  // Update machine lastUsedAt
  App.data.machines[machineId].lastUsedAt = isoNow();
  saveData();
  saveActiveSession();

  // Re-render
  renderLoggedSets(machineId);
  renderSetLogger(machineId);
  updatePillRow();

  // Undo callback — passed to backdate, toast fires only after offset selection (issue #6)
  const undoFn = () => {
    const idx = App.session.sets.indexOf(setData);
    if (idx > -1) {
      App.session.sets.splice(idx, 1);
      saveActiveSession();
      renderLoggedSets(machineId);
      renderSetLogger(machineId);
      updatePillRow();
      hideRestTimer();
    }
  };

  // Show backdate prompt — toast fires after user picks offset
  showBackdatePrompt(setData, setNumber, undoFn);
}

// ============================================================
// BACKDATE PROMPT
// ============================================================
function showBackdatePrompt(setData, setNumber, undoFn) {
  const overlay = $('backdate-overlay');
  const chipsContainer = $('backdate-chips');
  const offsets = App.data.profile.preferences.finishedSetOffsetOptionsSec || [0, 5, 10, 20, 30, 60];

  chipsContainer.innerHTML = '';

  offsets.forEach((offset, i) => {
    const chip = document.createElement('button');
    chip.className = `chip ${i === 0 ? 'chip-active' : ''}`;
    chip.textContent = offset === 0 ? 'Now' : `-${offset}s`;
    chip.onclick = () => {
      setData.finishedOffsetSec = offset;
      saveActiveSession();
      overlay.classList.add('hidden');

      // Start rest timer with offset
      const machine = App.data.machines[setData.machineId];
      if (machine && machine.type !== 'conditioning') {
        startRestTimer(machine.type, offset);
      }

      // Toast fires here — after user picks offset (issue #6)
      showToast(`Set ${setNumber} saved`, undoFn);
    };
    chipsContainer.appendChild(chip);
  });

  overlay.classList.remove('hidden');
  // No auto-dismiss — stays until user taps a chip (issue #5)
}

// ============================================================
// REST TIMER
// ============================================================
function startRestTimer(machineType, offsetSec = 0) {
  stopRestTimer();

  App.restMachineType = machineType;
  App.restStartTime = Date.now() - (offsetSec * 1000);

  const targets = REST_TARGETS[machineType];
  if (!targets) return;

  const hurryTarget = targets.hurry;
  const normalTarget = targets.normal;
  const currentTarget = App.restMode === 'hurry' ? hurryTarget : normalTarget;

  // Set bar markers
  const maxDisplay = normalTarget * 1.5; // show up to 1.5x normal
  $('rest-bar-hurry-marker').style.left = `${(hurryTarget / maxDisplay) * 100}%`;
  $('rest-bar-rec-marker').style.left = `${(normalTarget / maxDisplay) * 100}%`;

  // Update mode toggle
  $('rest-mode-toggle').textContent = App.restMode === 'hurry' ? 'Switch: Normal' : 'Switch: Hurry';

  // Show timer
  $('rest-timer').classList.remove('hidden');
  $('rest-overtime').classList.add('hidden');

  updateRestDisplay();
  App.restTimerInterval = setInterval(updateRestDisplay, 250);
}

function updateRestDisplay() {
  if (!App.restStartTime) return;

  const elapsed = (Date.now() - App.restStartTime) / 1000;
  const targets = REST_TARGETS[App.restMachineType];
  if (!targets) return;

  const currentTarget = App.restMode === 'hurry' ? targets.hurry : targets.normal;
  const remaining = currentTarget - elapsed;

  // Countdown
  const countdown = $('rest-countdown');
  if (remaining > 0) {
    countdown.textContent = formatTime(Math.ceil(remaining));
    countdown.classList.remove('overtime');
    $('rest-overtime').classList.add('hidden');
  } else {
    countdown.textContent = '0:00';
    countdown.classList.add('overtime');

    // Show overtime
    const overtime = $('rest-overtime');
    overtime.classList.remove('hidden');
    overtime.textContent = `+${formatTime(Math.floor(-remaining))}`;

    // Alert on transition to done
    if (remaining > -1 && remaining < 0) {
      triggerRestAlert();
    }
  }

  // Total time
  $('rest-total').textContent = `Total: ${formatTime(Math.floor(elapsed))}`;

  // Bar fill
  const maxDisplay = targets.normal * 1.5;
  const pct = Math.min(elapsed / maxDisplay * 100, 100);
  const fill = $('rest-bar-fill');
  fill.style.width = `${pct}%`;
  fill.classList.toggle('rest-done', remaining <= 0);
}

function stopRestTimer() {
  if (App.restTimerInterval) {
    clearInterval(App.restTimerInterval);
    App.restTimerInterval = null;
  }
  App.restStartTime = null;
}

function hideRestTimer() {
  stopRestTimer();
  $('rest-timer').classList.add('hidden');
}

function toggleRestMode() {
  App.restMode = App.restMode === 'hurry' ? 'normal' : 'hurry';
  $('rest-mode-toggle').textContent = App.restMode === 'hurry' ? 'Switch: Normal' : 'Switch: Hurry';
  updateRestDisplay();
}

// ============================================================
// REST TIMER AUDIO ALERT
// ============================================================
function triggerRestAlert() {
  $('rest-timer').classList.add('rest-alert');
  setTimeout(() => $('rest-timer').classList.remove('rest-alert'), 3000);

  // Try to play audio file first
  tryPlayAudioFile().catch(() => {
    // Fall back to generated noise
    playNoiseAlert();
  });
}

async function tryPlayAudioFile() {
  const audio = new Audio('audio/alarm_swell.wav');
  // Fade in/out with volume
  audio.volume = 0;
  await audio.play();
  // Quick fade in
  let vol = 0;
  const fadeIn = setInterval(() => {
    vol = Math.min(vol + 0.1, 0.8);
    audio.volume = vol;
    if (vol >= 0.8) clearInterval(fadeIn);
  }, 50);
  // Fade out near end
  audio.ontimeupdate = () => {
    if (audio.duration - audio.currentTime < 0.3) {
      audio.volume = Math.max(audio.volume - 0.2, 0);
    }
  };
}

function playNoiseAlert() {
  try {
    if (!App.audioCtx) {
      App.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = App.audioCtx;
    const duration = 0.5;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // White noise
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    // Fade envelope
    const fadeLen = Math.floor(sampleRate * 0.05);
    for (let i = 0; i < fadeLen; i++) {
      const t = i / fadeLen;
      data[i] *= t;
      data[length - 1 - i] *= t;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Low-pass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.value = 0.5;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();
    source.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio not available, silent fallback
  }
}

// ============================================================
// BIKE LOG
// ============================================================
function clearBikeForm() {
  $('bike-minutes').value = '';
  $('bike-rpe').value = '';
  $('bike-hr').value = '';
  $('bike-notes').value = '';
}

function saveBikeLog() {
  const minutes = parseInt($('bike-minutes').value);
  if (isNaN(minutes) || minutes <= 0) {
    showToast('Enter minutes');
    return;
  }

  const rpe = parseInt($('bike-rpe').value) || null;
  const maxHR = parseInt($('bike-hr').value) || null;
  const notes = $('bike-notes').value.trim() || null;

  const bikeLog = { minutes, rpe, maxHR, notes, loggedAt: isoNow() };

  // If this is the warmup bike, save to warmup
  if (!App.session.warmup.bikeLog) {
    App.session.warmup.bikeLog = bikeLog;
  } else {
    // Additional bike session
    App.session.bikeLogs.push(bikeLog);
  }

  saveActiveSession();
  updatePillRow();

  showToast(`Bike ${minutes}m saved`, () => {
    // Undo
    if (App.session.warmup.bikeLog === bikeLog) {
      App.session.warmup.bikeLog = null;
    } else {
      const idx = App.session.bikeLogs.indexOf(bikeLog);
      if (idx > -1) App.session.bikeLogs.splice(idx, 1);
    }
    saveActiveSession();
    updatePillRow();
  });

  // Return to appropriate view
  if (App.bikeReturnView === 'workout') {
    enterWorkout();
  } else {
    renderWorkout();
    showView('workout');
  }
}

// ============================================================
// ABS LOG
// ============================================================
function saveAbsLog() {
  const typeChip = document.querySelector('#abs-type-chips .chip-active');
  const type = typeChip ? typeChip.dataset.absType : 'crunch';
  const note = $('abs-note').value.trim() || null;

  const absLog = { type, note, loggedAt: isoNow() };
  App.session.absLogs.push(absLog);
  saveActiveSession();
  updatePillRow();

  showToast(`Abs (${type}) saved`, () => {
    const idx = App.session.absLogs.indexOf(absLog);
    if (idx > -1) App.session.absLogs.splice(idx, 1);
    saveActiveSession();
  });

  // Reset form
  $('abs-note').value = '';

  // Return
  renderWorkout();
  showView('workout');
}

// ============================================================
// ABS REMINDER
// ============================================================
function showAbsReminder() {
  if (App.absReminderShown) return;
  if (!App.session || !App.session._ui.absReminder) return;

  // Only show if no abs have been logged yet
  if (App.session.absLogs && App.session.absLogs.length > 0) return;

  App.absReminderShown = true;
  $('abs-reminder').classList.remove('hidden');
}

function hideAbsReminder() {
  $('abs-reminder').classList.add('hidden');
}

// ============================================================
// NEXT TIME NOTES
// ============================================================
function saveNextTimeNote() {
  const machineId = App.currentMachineId;
  if (!machineId) return;

  const chip = document.querySelector('#next-time-chips .chip-active');
  const custom = $('next-time-custom').value.trim();

  let note = chip ? chip.dataset.next : null;
  if (custom) note = custom;
  if (!note) note = 'again';

  App.session.nextTimeNotes[machineId] = note;
  saveActiveSession();

  showToast('Note saved');

  // Go back to workout
  renderWorkout();
  showView('workout');
}

// ============================================================
// END SESSION
// ============================================================
function promptEndSession() {
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
function renderSessionSummary(session) {
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
function checkResumeSession() {
  const saved = loadActiveSession();
  if (!saved || saved.endedAt) return;

  // Show resume prompt
  const elapsed = formatDuration(Date.now() - new Date(saved.startedAt).getTime());
  $('resume-info').textContent = `${saved.dayType.charAt(0).toUpperCase() + saved.dayType.slice(1)} day, started ${elapsed} ago. ${saved.sets.length} sets logged.`;
  $('resume-overlay').classList.remove('hidden');
}

function resumeSession() {
  const saved = loadActiveSession();
  if (!saved) return;

  App.session = saved;
  App.restMode = App.data.profile.preferences.restModeDefault || 'normal';
  App.absReminderShown = false;

  $('resume-overlay').classList.add('hidden');
  enterWorkout();
}

function discardSavedSession() {
  clearActiveSession();
  App.session = null;
  $('resume-overlay').classList.add('hidden');
}

// ============================================================
// TEXT-TO-SPEECH
// ============================================================
function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

// ============================================================
// ANALYTICS
// ============================================================
function renderAnalytics() {
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

  const cells = [];
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

// ============================================================
// SETTINGS
// ============================================================
function renderSettings() {
  const prefs = App.data.profile.preferences;
  $('setting-tts').checked = prefs.ttsEnabled !== false;
  $('setting-abs-reminder').checked = prefs.absReminder !== false;

  // Rest mode
  $('setting-rest-normal').classList.toggle('chip-active', prefs.restModeDefault !== 'hurry');
  $('setting-rest-hurry').classList.toggle('chip-active', prefs.restModeDefault === 'hurry');
}

function setupSettingsListeners() {
  $('setting-tts').onchange = (e) => {
    App.data.profile.preferences.ttsEnabled = e.target.checked;
    saveData();
  };

  $('setting-abs-reminder').onchange = (e) => {
    App.data.profile.preferences.absReminder = e.target.checked;
    saveData();
  };

  // Rest mode chips
  $('setting-rest-normal').onclick = () => {
    App.data.profile.preferences.restModeDefault = 'normal';
    saveData();
    renderSettings();
  };
  $('setting-rest-hurry').onclick = () => {
    App.data.profile.preferences.restModeDefault = 'hurry';
    saveData();
    renderSettings();
  };

  // Reset data — press and hold
  let resetTimer = null;
  const resetBtn = $('btn-reset-data');

  resetBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    resetBtn.textContent = 'Hold...';
    resetTimer = setTimeout(() => {
      showModal('Reset All Data?', 'This will delete all sessions, settings, and machine data. This cannot be undone.', [
        { label: 'Cancel', class: 'btn-ghost' },
        { label: 'Reset Everything', class: 'btn-danger', action: () => {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(SESSION_KEY);
          App.data = deepClone(DEFAULT_DATA);
          App.session = null;
          saveData();
          showView('home');
          renderHome();
          showToast('All data reset');
        }},
      ]);
      resetBtn.textContent = 'Hold to Reset All Data';
    }, 3000);
  });

  resetBtn.addEventListener('touchend', () => {
    clearTimeout(resetTimer);
    resetBtn.textContent = 'Hold to Reset All Data';
  });

  // Also support mouse for desktop testing
  resetBtn.addEventListener('mousedown', (e) => {
    resetBtn.textContent = 'Hold...';
    resetTimer = setTimeout(() => {
      showModal('Reset All Data?', 'This will delete all sessions, settings, and machine data. This cannot be undone.', [
        { label: 'Cancel', class: 'btn-ghost' },
        { label: 'Reset Everything', class: 'btn-danger', action: () => {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(SESSION_KEY);
          App.data = deepClone(DEFAULT_DATA);
          App.session = null;
          saveData();
          showView('home');
          renderHome();
          showToast('All data reset');
        }},
      ]);
      resetBtn.textContent = 'Hold to Reset All Data';
    }, 3000);
  });

  resetBtn.addEventListener('mouseup', () => {
    clearTimeout(resetTimer);
    resetBtn.textContent = 'Hold to Reset All Data';
  });
  resetBtn.addEventListener('mouseleave', () => {
    clearTimeout(resetTimer);
    resetBtn.textContent = 'Hold to Reset All Data';
  });
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setupEventListeners() {
  // Home
  $('btn-start-session').onclick = startNewSession;
  $('btn-analytics').onclick = () => { renderAnalytics(); showView('analytics'); };
  $('btn-settings').onclick = () => { renderSettings(); showView('settings'); };

  // Day select
  $$('[data-day]').forEach(btn => {
    btn.onclick = () => selectDayType(btn.dataset.day);
  });
  $('btn-back-day').onclick = () => { App.session = null; showView('home'); };

  // Time select
  $$('[data-time]').forEach(btn => {
    btn.onclick = () => selectTimeGoal(btn.dataset.time);
  });
  $('btn-back-time').onclick = () => showView('day-select');

  // Warmup
  $('btn-back-warmup').onclick = () => showView('time-select');
  $('btn-start-workout').onclick = handleStartWorkout;

  // Warmup bike choice chips
  $$('[data-bike]').forEach(chip => {
    chip.onclick = () => {
      $$('[data-bike]').forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');
      if (App.session) App.session._ui.bikeChoice = chip.dataset.bike;
    };
  });

  // Bike log
  $('btn-back-bike').onclick = () => {
    if (App.bikeReturnView === 'workout') {
      enterWorkout();
    } else {
      showView('workout');
    }
  };
  $('btn-save-bike').onclick = saveBikeLog;

  // Abs log
  $('btn-back-abs').onclick = () => { showView('workout'); };
  $('btn-save-abs').onclick = saveAbsLog;

  // Abs type chips
  $$('#abs-type-chips [data-abs-type]').forEach(chip => {
    chip.onclick = () => {
      $$('#abs-type-chips .chip').forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');
    };
  });

  // Workout
  $('btn-quick-bike').onclick = () => {
    App.bikeReturnView = 'workout-return';
    clearBikeForm();
    showView('bike-log');
  };
  $('btn-quick-abs').onclick = () => {
    App.absReturnView = 'workout';
    showView('abs-log');
  };
  $('btn-end-session').onclick = promptEndSession;

  // Machine view
  $('btn-back-machine').onclick = () => {
    hideRestTimer();
    $('backdate-overlay').classList.add('hidden');
    renderWorkout();
    showView('workout');
  };

  // Machine tabs
  $$('.tab[data-tab]').forEach(tab => {
    tab.onclick = () => {
      $$('.tab').forEach(t => t.classList.remove('active'));
      $$('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      $(`tab-content-${tab.dataset.tab}`).classList.add('active');
    };
  });

  // Familiar toggle
  $('btn-toggle-familiar').onclick = () => {
    const machine = App.data.machines[App.currentMachineId];
    if (!machine) return;
    machine.familiarity = machine.familiarity === 'familiar' ? 'learning' : 'familiar';
    saveData();
    renderMachineView(App.currentMachineId);
  };

  // TTS
  $('btn-tts-setup').onclick = () => {
    const machine = App.data.machines[App.currentMachineId];
    if (machine?.tips?.setup) speakText(machine.tips.setup);
  };
  $('btn-tts-form').onclick = () => {
    const machine = App.data.machines[App.currentMachineId];
    if (machine?.tips?.form) speakText(machine.tips.form);
  };

  // RIR chips
  $$('#rir-chips .chip').forEach(chip => {
    chip.onclick = () => {
      $$('#rir-chips .chip').forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');
    };
  });

  // Note chips (multi-select)
  $$('#note-chips .chip').forEach(chip => {
    chip.onclick = () => {
      chip.classList.toggle('chip-active');
    };
  });

  // Log set
  $('btn-log-set').onclick = logSet;

  // Next time chips
  $$('#next-time-chips .chip').forEach(chip => {
    chip.onclick = () => {
      $$('#next-time-chips .chip').forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');
    };
  });
  $('btn-save-next-time').onclick = saveNextTimeNote;

  // Rest timer
  $('rest-mode-toggle').onclick = toggleRestMode;
  $('btn-dismiss-rest').onclick = hideRestTimer;

  // Analytics
  $('btn-back-analytics').onclick = () => showView('home');

  // Settings
  $('btn-back-settings').onclick = () => showView('home');

  // Session summary
  $('btn-summary-done').onclick = () => {
    App.session = null;
    App.absReminderShown = false;
    showView('home');
    renderHome();
  };

  // Resume session
  $('btn-resume-session').onclick = resumeSession;
  $('btn-discard-session').onclick = discardSavedSession;

  // Abs reminder
  $('btn-abs-remind-go').onclick = () => {
    hideAbsReminder();
    App.absReturnView = 'workout';
    showView('abs-log');
  };
  $('btn-abs-remind-dismiss').onclick = hideAbsReminder;

  // Expose for inline onclick handlers in rendered HTML
  window._appBikeQuick = () => {
    App.bikeReturnView = 'workout-return';
    clearBikeForm();
    showView('bike-log');
  };

  // Inline warmup stretch callbacks (issue #3)
  window._appLogStretch = () => {
    const input = document.getElementById('warmup-stretch-mins');
    const mins = input ? parseInt(input.value) : NaN;
    if (isNaN(mins) || mins <= 0) {
      showToast('Enter stretch minutes');
      return;
    }
    App.session.warmup.stretchMinutes = mins;
    saveActiveSession();
    renderWorkout();
    updatePillRow();
  };
  window._appClearStretch = () => {
    App.session.warmup.stretchMinutes = null;
    saveActiveSession();
    renderWorkout();
    updatePillRow();
  };
}

// ============================================================
// INITIALIZATION
// ============================================================
function init() {
  // Load or initialize data
  App.data = loadData();
  if (!App.data) {
    App.data = deepClone(DEFAULT_DATA);
    saveData();
  }

  // Ensure _setup exists on all machines
  Object.values(App.data.machines).forEach(m => {
    if (!m._setup) m._setup = {};
  });

  // Setup event listeners
  setupEventListeners();
  setupSettingsListeners();

  // Render home
  renderHome();

  // Check for incomplete session
  checkResumeSession();
}

// Start the app
init();
