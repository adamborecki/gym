/**
 * Gym App — Rest Timer & Audio Alerts
 */

import { REST_TARGETS } from './config.js';
import { $, formatTime } from './utils.js';
import { App } from './state.js';

// ============================================================
// REST TIMER
// ============================================================
export function startRestTimer(machineType, offsetSec = 0) {
  stopRestTimer();

  App.restMachineType = machineType;
  App.restStartTime = Date.now() - (offsetSec * 1000);
  App.restAlerted = false;

  const targets = REST_TARGETS[machineType];
  if (!targets) return;

  const hurryTarget = targets.hurry;
  const normalTarget = targets.normal;

  // Set bar markers
  const maxDisplay = normalTarget * 1.5; // show up to 1.5x normal
  $('rest-bar-hurry-marker').style.left = `${(hurryTarget / maxDisplay) * 100}%`;
  $('rest-bar-rec-marker').style.left = `${(normalTarget / maxDisplay) * 100}%`;

  // Update mode toggle
  $('rest-mode-toggle').textContent = App.restMode === 'hurry' ? 'Switch: Normal' : 'Switch: Hurry';

  // Show timer
  $('rest-timer').classList.remove('hidden');
  document.body.classList.add('rest-timer-visible');
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

    // Alert once when the target is reached. Skip if it's long past (e.g. the
    // phone was locked and we're catching up) or already alerted this rest.
    if (!App.restAlerted) {
      App.restAlerted = true;
      if (remaining > -3) triggerRestAlert();
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

export function stopRestTimer() {
  if (App.restTimerInterval) {
    clearInterval(App.restTimerInterval);
    App.restTimerInterval = null;
  }
  App.restStartTime = null;
}

export function hideRestTimer() {
  stopRestTimer();
  $('rest-timer').classList.add('hidden');
  document.body.classList.remove('rest-timer-visible');
}

export function toggleRestMode() {
  App.restMode = App.restMode === 'hurry' ? 'normal' : 'hurry';
  // Switching to a later target re-arms the alert
  const targets = REST_TARGETS[App.restMachineType];
  if (targets && App.restStartTime) {
    const target = App.restMode === 'hurry' ? targets.hurry : targets.normal;
    App.restAlerted = (Date.now() - App.restStartTime) / 1000 >= target;
  }
  $('rest-mode-toggle').textContent = App.restMode === 'hurry' ? 'Switch: Normal' : 'Switch: Hurry';
  updateRestDisplay();
}

// ============================================================
// REST TIMER AUDIO ALERT — noise swell (issue #12)
// ============================================================
const SWELL_SEC = 1.8;

function getAudioCtx() {
  if (!App.audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    App.audioCtx = new Ctx();
  }
  return App.audioCtx;
}

/** Call from a user gesture (e.g. Set Done) so iOS lets us play audio later. */
export function unlockAudio() {
  try {
    const ctx = getAudioCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  } catch (e) { /* audio not available */ }
}

function triggerRestAlert() {
  $('rest-timer').classList.add('rest-alert');
  setTimeout(() => $('rest-timer').classList.remove('rest-alert'), 3000);
  if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
  playNoiseSwell();
}

/**
 * Soft "whoosh": filtered noise that crescendos then decrescendos while a
 * band-pass filter sweeps up and back down — noticeable without being a beep.
 */
function playNoiseSwell() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const length = Math.floor(ctx.sampleRate * SWELL_SEC);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const t0 = ctx.currentTime;
    const peak = t0 + SWELL_SEC * 0.55;
    const end = t0 + SWELL_SEC;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(300, t0);
    filter.frequency.exponentialRampToValueAtTime(2400, peak);
    filter.frequency.exponentialRampToValueAtTime(400, end);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.9, peak);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(t0);
    source.stop(end);
  } catch (e) {
    // Audio not available, silent fallback
  }
}
