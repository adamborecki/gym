/**
 * Gym App — Application State & Persistence
 */

import { STORAGE_KEY, SESSION_KEY } from './config.js';

export const App = {
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

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* corrupted data, reinitialize */ }
  return null;
}

export function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(App.data));
}

export function loadActiveSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

export function saveActiveSession() {
  if (App.session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(App.session));
  }
}

export function clearActiveSession() {
  localStorage.removeItem(SESSION_KEY);
}
