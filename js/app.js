/**
 * Gym App v1 — Main Entry Point
 * Mobile-first personal gym tracker
 * All data stored locally in localStorage
 */

import { APP_VERSION, DEFAULT_COUNTDOWN_MIN } from './config.js';
import { $, $$, deepClone, stripMarkdown } from './utils.js';
import { App, loadData, saveData } from './state.js';
import { showView, showToast, renderHome, speakText } from './ui.js';
import { hideRestTimer, toggleRestMode } from './timer.js';
import {
  enterWorkout, renderWorkout, renderMachineView,
  clearBikeForm, saveBikeLog,
  setDone, logSet, saveNextTimeNote, logAnotherSet,
  setupWorkoutGlobals,
} from './workout.js';
import {
  startNewSession, selectDayType, selectTimeGoal,
  handleStartWorkout, promptEndSession,
  resumeSession, discardSavedSession, checkResumeSession,
} from './session.js';
import { renderAnalytics } from './analytics.js';
import { renderSettings, setupSettingsListeners } from './settings.js';
import { DEFAULT_DATA } from './data-defaults.js';

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

  // Time mode select
  $('time-mode-countdown').onclick = (e) => {
    if (e.target.closest('.countdown-config')) return;
    expandCountdownCard();
  };
  $('time-mode-countup').onclick = () => {
    selectTimeGoal({ mode: 'countup' });
  };
  $('btn-start-countdown').onclick = () => {
    const endTime = $('countdown-end-time').value;
    if (!endTime) { showToast('Set a departure time'); return; }
    const durationMin = calcCountdownDuration(endTime);
    if (durationMin <= 0) { showToast('Departure time must be in the future'); return; }
    selectTimeGoal({ mode: 'countdown', endTime, durationMin });
  };
  $('countdown-minus').onclick = (e) => { e.stopPropagation(); adjustCountdownTime(-5); };
  $('countdown-plus').onclick = (e) => { e.stopPropagation(); adjustCountdownTime(5); };
  $('countdown-end-time').oninput = () => updateCountdownDurationDisplay();
  $('countdown-end-time').onclick = (e) => e.stopPropagation();
  $('btn-back-time').onclick = () => {
    $('countdown-config').classList.remove('countdown-config-visible');
    showView('day-select');
  };

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
    } else if (App.bikeReturnView === 'machine') {
      showView('machine');
    } else {
      showView('workout');
    }
  };
  $('btn-save-bike').onclick = saveBikeLog;

  // Log Bike Session button in machine detail view
  $('btn-log-bike-session').onclick = () => {
    App.bikeReturnView = 'machine';
    clearBikeForm();
    showView('bike-log');
  };

  // Workout
  $('btn-quick-bike').onclick = () => {
    App.bikeReturnView = 'workout-return';
    clearBikeForm();
    showView('bike-log');
  };
  $('btn-end-session').onclick = promptEndSession;

  // Machine view
  $('btn-back-machine').onclick = () => {
    hideRestTimer();
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
    if (machine?.tips?.setup) speakText(stripMarkdown(machine.tips.setup));
  };
  $('btn-tts-form').onclick = () => {
    const machine = App.data.machines[App.currentMachineId];
    if (machine?.tips?.form) speakText(stripMarkdown(machine.tips.form));
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

  // Set Done → starts rest timer, then data entry
  $('btn-set-done').onclick = setDone;
  // Save Set → logs the set data
  $('btn-log-set').onclick = logSet;

  // Next time chips
  $$('#next-time-chips .chip').forEach(chip => {
    chip.onclick = () => {
      if (chip.classList.contains('chip-active')) {
        chip.classList.remove('chip-active');
      } else {
        $$('#next-time-chips .chip').forEach(c => c.classList.remove('chip-active'));
        chip.classList.add('chip-active');
      }
    };
  });
  $('btn-save-next-time').onclick = saveNextTimeNote;
  $('btn-another-set').onclick = logAnotherSet;

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
    showView('home');
    renderHome();
  };

  // Resume session
  $('btn-resume-session').onclick = resumeSession;
  $('btn-discard-session').onclick = discardSavedSession;
}

// ============================================================
// COUNTDOWN HELPERS
// ============================================================
function expandCountdownCard() {
  const cfg = $('countdown-config');
  cfg.classList.add('countdown-config-visible');
  const input = $('countdown-end-time');
  if (!input.value) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + DEFAULT_COUNTDOWN_MIN);
    input.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
  updateCountdownDurationDisplay();
}

function calcCountdownDuration(endTimeStr) {
  const [h, m] = endTimeStr.split(':').map(Number);
  const now = new Date();
  const end = new Date();
  end.setHours(h, m, 0, 0);
  if (end <= now) end.setDate(end.getDate() + 1);
  return Math.round((end - now) / 60000);
}

function updateCountdownDurationDisplay() {
  const endTime = $('countdown-end-time').value;
  if (!endTime) return;
  const dur = calcCountdownDuration(endTime);
  $('countdown-duration').textContent = dur > 0 ? `${dur} min session` : 'Time is in the past';
}

function adjustCountdownTime(deltaMin) {
  const input = $('countdown-end-time');
  if (!input.value) { expandCountdownCard(); return; }
  const [h, m] = input.value.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m + deltaMin, 0, 0);
  input.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  updateCountdownDurationDisplay();
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

  // Always refresh machine tips from defaults (tips are static content, not user data)
  Object.entries(DEFAULT_DATA.machines).forEach(([id, def]) => {
    if (App.data.machines[id]) {
      App.data.machines[id].tips = def.tips;
    }
  });

  // Always refresh built-in templates from defaults — templates aren't user-editable,
  // so this lets users pick up structural changes (e.g. issue #36 compound regroup).
  Object.entries(DEFAULT_DATA.templates).forEach(([id, def]) => {
    App.data.templates[id] = deepClone(def);
  });
  saveData();

  // Setup event listeners
  setupEventListeners();
  setupSettingsListeners();
  setupWorkoutGlobals();

  // Version label
  $('app-version').textContent = APP_VERSION;

  // Render home
  renderHome();

  // Check for incomplete session
  checkResumeSession();
}

// Start the app
init();
