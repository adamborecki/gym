/**
 * Gym App — Workout View, Machine View, Set Logging, Progress
 */

import { TIME_GOALS, SEED_WEIGHTS, COUNTUP_SOFT_TARGET_MIN } from './config.js';
import { $, $$, isoNow } from './utils.js';
import { App, saveData, saveActiveSession } from './state.js';
import { showView, showToast, showModal } from './ui.js';
import { startRestTimer, hideRestTimer } from './timer.js';

// ============================================================
// PILL ROW
// ============================================================
export function updatePillRow() {
  const row = $('pill-row');
  if (!App.session) { row.classList.add('hidden'); return; }
  row.classList.remove('hidden');

  const s = App.session;
  let html = '';

  // Day type pill
  html += `<span class="pill pill-${s.dayType}">${s.dayType.charAt(0).toUpperCase() + s.dayType.slice(1)}</span>`;

  // Time goal pill
  if (typeof s.timeGoal === 'string') {
    html += `<span class="pill">${s.timeGoal} min</span>`;
  } else if (s.timeGoal && s.timeGoal.mode === 'countdown') {
    html += `<span class="pill">Leave ${s.timeGoal.endTime}</span>`;
  } else if (s.timeGoal && s.timeGoal.mode === 'countup') {
    html += `<span class="pill">Open</span>`;
  }

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
export function startProgressTracking() {
  App.sessionStartTime = new Date(App.session.startedAt).getTime();
  updateProgressBar();
  App.progressInterval = setInterval(updateProgressBar, 1000);
}

export function stopProgressTracking() {
  if (App.progressInterval) {
    clearInterval(App.progressInterval);
    App.progressInterval = null;
  }
}

function updateProgressBar() {
  if (!App.session) return;
  const tg = App.session.timeGoal;
  if (!tg) return;

  const elapsed = (Date.now() - App.sessionStartTime) / 1000 / 60;
  const cappedElapsed = Math.min(elapsed, 360); // cap at 6h for display
  const fill = $('progress-fill');
  const readout = $('progress-time-readout');

  // Legacy string format (backward compat)
  if (typeof tg === 'string') {
    const goal = TIME_GOALS[tg];
    if (!goal) return;
    const pct = Math.min(elapsed / goal.max * 100, 100);
    fill.style.width = `${pct}%`;
    fill.className = '';
    const elapsedStr = `${Math.floor(cappedElapsed)}m`;
    if (elapsed > goal.max) {
      fill.classList.add('pace-over');
      readout.textContent = `${elapsedStr} — over`;
    } else if (elapsed > goal.min) {
      fill.classList.add('pace-on');
      readout.textContent = `${elapsedStr}`;
    } else {
      fill.classList.add('pace-ahead');
      readout.textContent = elapsedStr;
    }
    return;
  }

  // Count Down mode
  if (tg.mode === 'countdown') {
    const [h, m] = tg.endTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(h, m, 0, 0);
    if (endDate.getTime() < App.sessionStartTime) endDate.setDate(endDate.getDate() + 1);
    const totalMin = (endDate.getTime() - App.sessionStartTime) / 60000;
    const remainingMin = (endDate.getTime() - Date.now()) / 60000;
    const pct = Math.min((elapsed / totalMin) * 100, 100);

    fill.style.width = `${pct}%`;
    fill.className = '';

    if (remainingMin <= 0) {
      const overMin = Math.min(Math.abs(Math.floor(remainingMin)), 999);
      fill.classList.add('pace-over');
      readout.textContent = `+${overMin}m over`;
    } else if (remainingMin <= 10) {
      fill.classList.add('pace-on');
      readout.textContent = `${Math.ceil(remainingMin)}m left`;
    } else {
      fill.classList.add('pace-ahead');
      readout.textContent = `${Math.ceil(remainingMin)}m left`;
    }
    return;
  }

  // Count Up mode
  if (tg.mode === 'countup') {
    const pct = Math.min((cappedElapsed / COUNTUP_SOFT_TARGET_MIN) * 100, 100);
    fill.style.width = `${pct}%`;
    fill.className = 'pace-ahead';
    readout.textContent = `${Math.floor(cappedElapsed)}m`;
    return;
  }
}

// ============================================================
// SEGMENT BAR (block completion)
// ============================================================
export function updateSegmentBar() {
  const bar = $('segment-bar');
  if (!App.session) { bar.classList.add('hidden'); return; }

  const template = App.data.templates[App.session.templateId];
  if (!template || !template.blocks) { bar.classList.add('hidden'); return; }

  bar.classList.remove('hidden');
  bar.innerHTML = '';

  template.blocks.forEach(block => {
    const seg = document.createElement('div');
    seg.className = 'segment-bar-item';
    if (isBlockComplete(block)) seg.classList.add('segment-done');
    bar.appendChild(seg);
  });
}

// ============================================================
// ENTER WORKOUT
// ============================================================
export function enterWorkout() {
  startProgressTracking();
  renderWorkout();
  showView('workout');
  updatePillRow();
  updateSegmentBar();
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
export function renderWorkout() {
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

    // Compute display count for the pill — warmup and abs store data differently
    let setsCount;
    if (block.id === 'warmup') {
      const w = s.warmup;
      setsCount = (w.bikeLog ? 1 : 0) + (w.stretchMinutes ? 1 : 0);
    } else if (block.id === 'abs') {
      setsCount = (s.absLogs || []).length + blockSets.length;
    } else {
      setsCount = blockSets.length;
    }

    // Header — "abs" block displays as "Other"
    const displayName = block.id === 'abs' ? 'Other' : block.name;
    const header = document.createElement('div');
    header.className = 'block-header';
    header.innerHTML = `
      <div class="block-header-left">
        ${isDone ? '<span class="block-check">&#10003;</span>' : ''}
        <span>${displayName}</span>
        <span class="pill pill-sm">${setsCount} sets</span>
      </div>
      <span class="block-chevron">&#9654;</span>
    `;
    header.onclick = () => toggleBlock(block.id);
    card.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'block-body';

    if (block.id === 'warmup') {
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

export function getMachineSets(machineId) {
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

export function renderMachineView(machineId) {
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
    $('btn-log-bike-session').classList.remove('hidden');
  } else {
    $('btn-log-bike-session').classList.add('hidden');
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

    // Select all on tap
    input.addEventListener('focus', e => e.target.select());

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
export function logSet() {
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
  updateSegmentBar();

  // Undo callback — passed to backdate, toast fires only after offset selection (issue #6)
  const undoFn = () => {
    const idx = App.session.sets.indexOf(setData);
    if (idx > -1) {
      App.session.sets.splice(idx, 1);
      saveActiveSession();
      renderLoggedSets(machineId);
      renderSetLogger(machineId);
      updatePillRow();
      updateSegmentBar();
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
// NEXT TIME NOTES
// ============================================================
export function saveNextTimeNote() {
  const machineId = App.currentMachineId;

  if (machineId) {
    const chip = document.querySelector('#next-time-chips .chip-active');
    const custom = $('next-time-custom').value.trim();

    let note = chip ? chip.dataset.next : null;
    if (custom) note = custom;
    if (!note) note = 'again';

    App.session.nextTimeNotes[machineId] = note;
    saveActiveSession();
    showToast('Note saved');
  }

  // Always go back to workout
  renderWorkout();
  showView('workout');
}

// ============================================================
// BIKE LOG
// ============================================================
export function clearBikeForm() {
  $('bike-minutes').value = '';
  $('bike-rpe').value = '';
  $('bike-hr').value = '';
  $('bike-notes').value = '';
}

export function saveBikeLog() {
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
  updateSegmentBar();

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
    updateSegmentBar();
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
export function saveAbsLog() {
  const typeChip = document.querySelector('#abs-type-chips .chip-active');
  const type = typeChip ? typeChip.dataset.absType : 'crunch';
  const note = $('abs-note').value.trim() || null;

  const absLog = { type, note, loggedAt: isoNow() };
  App.session.absLogs.push(absLog);
  saveActiveSession();
  updatePillRow();
  updateSegmentBar();

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
export function showAbsReminder() {
  if (App.absReminderShown) return;
  if (!App.session || !App.session._ui.absReminder) return;

  // Only show if no abs have been logged yet
  if (App.session.absLogs && App.session.absLogs.length > 0) return;

  App.absReminderShown = true;
  $('abs-reminder').classList.remove('hidden');
}

export function hideAbsReminder() {
  $('abs-reminder').classList.add('hidden');
}

// ============================================================
// WINDOW GLOBALS (for inline onclick handlers in rendered HTML)
// ============================================================
export function setupWorkoutGlobals() {
  window._appBikeQuick = () => {
    App.bikeReturnView = 'workout-return';
    clearBikeForm();
    showView('bike-log');
  };

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
    updateSegmentBar();
  };

  window._appClearStretch = () => {
    App.session.warmup.stretchMinutes = null;
    saveActiveSession();
    renderWorkout();
    updatePillRow();
    updateSegmentBar();
  };
}
