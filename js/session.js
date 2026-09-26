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

// Events that count as "starting to train" — the gap between session start and
// the first of these is treated as stretch/warm-up time (issue #42).
const FIRST_ACTION_TYPES = new Set(['machine_open', 'bike_open', 'stretch_logged', 'set_completed', 'bike_logged']);

/**
 * Minutes between session start and the first real action. If nothing has
 * happened yet, the time elapsed so far. Returns null if under a minute.
 */
export function inferStretchMinutes(session) {
  const events = session.events || [];
  const startEv = events.find(e => e.type === 'session_start');
  const startMs = new Date(startEv ? startEv.at : session.startedAt).getTime();
  const endMs = firstActionMs(session) ?? Date.now();
  const min = Math.round((endMs - startMs) / 60000);
  return min >= 1 ? min : null;
}

function firstActionMs(session) {
  const first = (session.events || []).find(e => FIRST_ACTION_TYPES.has(e.type));
  return first ? new Date(first.at).getTime() : null;
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

  // Stretch time wasn't logged — keep the inferred estimate (issue #42)
  if (!s.warmup.stretchMinutes) {
    s.warmup.inferredStretchMin = inferStretchMinutes(s);
  }

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

  // Show summary (session is over — clear it so the in-session chrome hides)
  App.session = null;
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
export function renderSessionSummary(session, container = $('summary-content')) {
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

  // Stretch: logged, or estimated from time before the first action (issue #42)
  if (session.warmup.stretchMinutes) {
    html += `
      <div class="summary-stat">
        <span class="summary-stat-label">Stretch</span>
        <span class="summary-stat-value">${session.warmup.stretchMinutes} min</span>
      </div>
    `;
  } else if (session.warmup.inferredStretchMin) {
    html += `
      <div class="summary-stat">
        <span class="summary-stat-label">Stretch / warm-up (est.)</span>
        <span class="summary-stat-value">~${session.warmup.inferredStretchMin} min</span>
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

  // Timeline + per-machine timing breakdown from events (issue #17)
  html += renderTimeline(session);

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
  attachTimelineHandlers(container);
}

// ============================================================
// TIMELINE — derived from events (issue #17)
// ============================================================
const MIN_SEGMENT_MS = 15000; // ignore quick peeks at a machine

// Colour slot per workout block (see .tl-s1… in app.css)
const BLOCK_SLOT = { primary: 1, fullbody: 1, secondary: 2, accessories: 3, abs: 4 };

/**
 * Walk the event log into machine segments. machine_open starts a segment;
 * machine_exit / machine_done / the next machine_open / session_end closes it.
 */
export function deriveTimeline(session) {
  const events = session.events || [];
  const startMs = new Date(session.startedAt).getTime();
  const endMs = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();

  const segments = [];
  let cur = null;
  const close = (t) => {
    if (cur && t - cur.start >= MIN_SEGMENT_MS) segments.push({ ...cur, end: t });
    cur = null;
  };
  for (const ev of events) {
    const t = new Date(ev.at).getTime();
    if (ev.type === 'machine_open' && ev.detail?.machineId) {
      close(t);
      cur = { machineId: ev.detail.machineId, blockId: ev.detail.blockId, start: t };
    } else if (ev.type === 'machine_exit' || ev.type === 'machine_done' || ev.type === 'session_end') {
      close(t);
    }
  }
  close(endMs);

  // Warm-up: session start → first action
  const warmupEnd = firstActionMs(session);

  // Per-machine totals, in order of first use
  const machines = [];
  const byId = {};
  segments.forEach(seg => {
    if (!byId[seg.machineId]) {
      byId[seg.machineId] = { machineId: seg.machineId, blockId: seg.blockId, durationMs: 0, firstOpen: seg.start };
      machines.push(byId[seg.machineId]);
    }
    byId[seg.machineId].durationMs += seg.end - seg.start;
  });
  machines.forEach(m => {
    const sets = (session.sets || []).filter(st => st.machineId === m.machineId);
    m.setCount = sets.length;
    // Setup/prep: opening the machine → first set finished
    if (sets.length) {
      const firstSet = new Date(sets[0].loggedAt).getTime();
      if (firstSet > m.firstOpen) m.prepMs = firstSet - m.firstOpen;
    }
  });

  return { startMs, endMs, warmupEnd, segments, machines };
}

function machineSlot(session, machineId, blockId) {
  if (blockId && BLOCK_SLOT[blockId]) return BLOCK_SLOT[blockId];
  const template = App.data.templates[session.templateId];
  const block = template?.blocks.find(b => (b.suggestions || []).includes(machineId) && b.id !== 'warmup');
  return BLOCK_SLOT[block?.id] || 4;
}

function shortDuration(ms) {
  const min = Math.round(ms / 60000);
  return min < 1 ? `${Math.round(ms / 1000)}s` : `${min}m`;
}

function renderTimeline(session) {
  const { startMs, endMs, warmupEnd, segments, machines } = deriveTimeline(session);
  if (segments.length === 0) return '';
  const total = Math.max(endMs - startMs, 1);
  const pct = (t) => Math.min(Math.max((t - startMs) / total * 100, 0), 100);
  const nameOf = (mid) => App.data.machines[mid]?.name || mid;

  let bar = '';
  if (warmupEnd && warmupEnd > startMs) {
    bar += `<div class="tl-seg tl-warmup" style="left:0;width:${pct(warmupEnd)}%"
      data-label="Warm-up · ${shortDuration(warmupEnd - startMs)}"></div>`;
  }
  segments.forEach(seg => {
    bar += `<div class="tl-seg tl-s${machineSlot(session, seg.machineId, seg.blockId)}"
      style="left:${pct(seg.start)}%;width:${pct(seg.end) - pct(seg.start)}%"
      data-label="${nameOf(seg.machineId)} · ${shortDuration(seg.end - seg.start)}"></div>`;
  });
  (session.sets || []).forEach(st => {
    bar += `<div class="tl-tick" style="left:${pct(new Date(st.loggedAt).getTime())}%"></div>`;
  });

  let html = `
    <h3 style="margin-top:16px">Timeline</h3>
    <div class="timeline" role="img" aria-label="Session timeline by machine">${bar}</div>
    <div class="timeline-axis"><span>0m</span><span>${shortDuration(total)}</span></div>
    <div class="timeline-caption">Tap a block for details · ticks = sets</div>
    <h3 style="margin-top:16px">Time per Machine</h3>
  `;
  machines.forEach(m => {
    const prep = m.prepMs ? ` · ${shortDuration(m.prepMs)} prep` : '';
    html += `
      <div class="summary-stat">
        <span class="summary-stat-label"><span class="tl-swatch tl-s${machineSlot(session, m.machineId, m.blockId)}"></span>${nameOf(m.machineId)}</span>
        <span class="summary-stat-value">${formatDuration(m.durationMs)} · ${m.setCount} sets${prep}</span>
      </div>
    `;
  });
  return html;
}

function attachTimelineHandlers(container) {
  const caption = container.querySelector('.timeline-caption');
  if (!caption) return;
  container.querySelectorAll('.tl-seg').forEach(seg => {
    const show = () => {
      container.querySelectorAll('.tl-seg').forEach(s => s.classList.toggle('tl-active', s === seg));
      caption.textContent = seg.dataset.label;
    };
    seg.onclick = show;
    seg.onmouseenter = show;
  });
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
