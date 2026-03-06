/**
 * Gym App — Settings Page & Data Export
 */

import { STORAGE_KEY, SESSION_KEY } from './config.js';
import { $, deepClone } from './utils.js';
import { App, saveData } from './state.js';
import { showView, showToast, showModal, renderHome } from './ui.js';
import { DEFAULT_DATA } from './data-defaults.js';

// ============================================================
// SETTINGS
// ============================================================
export function renderSettings() {
  const prefs = App.data.profile.preferences;
  $('setting-tts').checked = prefs.ttsEnabled !== false;
  $('setting-abs-reminder').checked = prefs.absReminder !== false;

  // Rest mode
  $('setting-rest-normal').classList.toggle('chip-active', prefs.restModeDefault !== 'hurry');
  $('setting-rest-hurry').classList.toggle('chip-active', prefs.restModeDefault === 'hurry');
}

export function setupSettingsListeners() {
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

  // Data export
  $('btn-export-json').onclick = () => exportJSON();
  $('btn-share-data').onclick = () => shareData();

  // Reset App but Keep Data — press and hold
  let resetPrefsTimer = null;
  const resetPrefsBtn = $('btn-reset-prefs');

  function startResetPrefsTimer() {
    resetPrefsBtn.textContent = 'Hold...';
    resetPrefsTimer = setTimeout(() => {
      showModal('Reset App Settings?', 'This will reset all preferences and machine customizations to defaults. Your workout history will be preserved.', [
        { label: 'Cancel', class: 'btn-ghost' },
        { label: 'Reset (Keep Data)', class: 'btn-warning', action: () => {
          const savedSessions = (App.data.sessions || []).slice();
          App.data = deepClone(DEFAULT_DATA);
          App.data.sessions = savedSessions;
          saveData();
          renderSettings();
          showToast('App reset — workout history preserved');
        }},
      ]);
      resetPrefsBtn.textContent = 'Hold to Reset App (Keep Data)';
    }, 3000);
  }

  function cancelResetPrefsTimer() {
    clearTimeout(resetPrefsTimer);
    resetPrefsBtn.textContent = 'Hold to Reset App (Keep Data)';
  }

  resetPrefsBtn.addEventListener('touchstart',  (e) => { e.preventDefault(); startResetPrefsTimer(); });
  resetPrefsBtn.addEventListener('touchend',    cancelResetPrefsTimer);
  resetPrefsBtn.addEventListener('mousedown',   startResetPrefsTimer);
  resetPrefsBtn.addEventListener('mouseup',     cancelResetPrefsTimer);
  resetPrefsBtn.addEventListener('mouseleave',  cancelResetPrefsTimer);
}

// ============================================================
// DATA EXPORT
// ============================================================
function exportJSON() {
  const json = JSON.stringify(App.data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `gym-data-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('JSON saved');
}

async function shareData() {
  const json = JSON.stringify(App.data, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `gym-data-${date}.json`;
  if (navigator.share) {
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const file = new File([blob], filename, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Gym Data Export', text: filename });
        return;
      }
      // File sharing not supported — share as text
      await navigator.share({ title: 'Gym Data Export', text: json });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return; // User cancelled — no toast
    }
  }
  // Fallback to download
  exportJSON();
}
