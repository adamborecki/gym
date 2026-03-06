/**
 * Gym App — UI Primitives (views, toasts, modals, home, TTS)
 */

import { $, $$ } from './utils.js';
import { App } from './state.js';

// ============================================================
// VIEW SYSTEM
// ============================================================
export function showView(viewId) {
  App.previousView = App.currentView;
  App.currentView = viewId;

  $$('.view').forEach(v => v.classList.remove('active'));
  const el = $(`view-${viewId}`);
  if (el) el.classList.add('active');

  // Show/hide session chrome
  const inSession = !!App.session;
  $('progress-bar').classList.toggle('hidden', !inSession);
  $('pill-row').classList.toggle('hidden', !inSession);
  $('segment-bar').classList.toggle('hidden', !inSession);

  // Scroll to top
  window.scrollTo(0, 0);
}

// ============================================================
// TOAST & UNDO
// ============================================================
export function showToast(message, undoFn) {
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
export function showModal(title, message, actions) {
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
export function renderHome() {
  const greeting = $('home-greeting');
  const name = App.data.profile.name || '';
  const hour = new Date().getHours();
  let timeGreeting = 'Good evening';
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  greeting.textContent = name ? `${timeGreeting}, ${name}` : timeGreeting;
}

// ============================================================
// TEXT-TO-SPEECH
// ============================================================
export function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}
