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
}

export function toggleRestMode() {
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
