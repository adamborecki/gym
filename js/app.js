/**
 * Gym App v1 — Main Entry Point
 * Mobile-first personal gym tracker
 * All data stored locally in localStorage
 */

import { APP_VERSION } from './config.js';
import { $, $$, deepClone } from './utils.js';
import { App, loadData, saveData } from './state.js';
import { showView, showToast, renderHome, speakText } from './ui.js';
import { hideRestTimer, toggleRestMode } from './timer.js';
import {
  enterWorkout, renderWorkout, renderMachineView,
  clearBikeForm, saveBikeLog, saveAbsLog,
  logSet, saveNextTimeNote,
  hideAbsReminder, setupWorkoutGlobals,
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
