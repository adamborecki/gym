/**
 * Gym App — Workout View, Machine View, Set Logging, Progress
 */

import { TIME_GOALS, SEED_WEIGHTS, COUNTUP_SOFT_TARGET_MIN } from './config.js';
import { $, $$, isoNow, renderMarkdown } from './utils.js';
import { App, saveData, saveActiveSession } from './state.js';
import { showView, showToast, showModal } from './ui.js';
import { startRestTimer, hideRestTimer, unlockAudio } from './timer.js';
import { trackEvent, inferStretchMinutes } from './session.js';

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
    renderProgressTicks(goal.max);
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
    renderProgressTicks(totalMin);

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
    renderProgressTicks(Math.max(COUNTUP_SOFT_TARGET_MIN, cappedElapsed));
    return;
  }
}

/**
 * Tick marks on the session progress bar at each logged set, so the rhythm of
 * the session is visible at a glance (issue #17). Only rebuilt when the set
 * count or bar scale changes.
 */
let lastTicksKey = '';
function renderProgressTicks(scaleMin) {
  const sets = App.session.sets || [];
  const scale = Math.round(scaleMin);
  const key = `${App.session.id}:${sets.length}:${scale}`;
  if (key === lastTicksKey) return;
  lastTicksKey = key;
  $('progress-ticks').innerHTML = sets.map(st => {
    const min = (new Date(st.loggedAt).getTime() - App.sessionStartTime) / 60000;
    const pct = Math.min(Math.max(min / scale * 100, 0), 100);
    return `<span class="progress-tick" style="left:${pct}%"></span>`;
  }).join('');
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

    // Compute display count for the pill
    let setsCount;
    if (block.id === 'warmup') {
      const w = s.warmup;
      setsCount = (w.bikeLog ? 1 : 0) + (w.stretchMinutes ? 1 : 0);
    } else {
      setsCount = blockSets.length;
    }

    const displayName = block.name;
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
    } else {
      renderMachineBlock(body, block);
    }

    // Abs/Core block: also render session-added machines + "Add Machine" row
    if (block.id === 'abs') {
      const otherMachines = s._ui.otherMachines || [];
      otherMachines.forEach(machineId => {
        const machine = App.data.machines[machineId];
        if (!machine) return;
        const setsForMachine = getMachineSets(machineId, block.id);
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

      const addRow = document.createElement('div');
      addRow.className = 'machine-row';
      addRow.onclick = () => showAddMachineToOtherModal('abs');
      addRow.innerHTML = `
        <span class="machine-row-name">+ Add Machine</span>
        <span class="block-chevron">&#9654;</span>
      `;
      body.appendChild(addRow);
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
    // Inline log form, pre-filled with the time from session start to the
    // first action (or elapsed so far) — issue #42
    const stretchId = 'warmup-stretch-mins';
    const inferred = inferStretchMinutes(s);
    stretchSection.innerHTML = `
      <div class="warmup-label">🧘 Stretch${inferred ? ` <span class="warmup-hint">est. ~${inferred} min from start</span>` : ''}</div>
      <div class="stretch-log-row">
        <input type="number" id="${stretchId}" class="input-sm" inputmode="numeric"
               min="1" max="60" placeholder="min" value="${inferred || ''}" onfocus="this.select()">
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

function showAddMachineToOtherModal(blockId) {
  // Collect all machine IDs already in this workout's template blocks
  const template = App.data.templates[App.session.templateId];
  const usedIds = new Set();
  template.blocks.forEach(b => {
    (b.suggestions || []).forEach(m => usedIds.add(m));
  });
  // Also exclude already-added other machines
  (App.session._ui.otherMachines || []).forEach(m => usedIds.add(m));

  const isAbsBlock = blockId === 'abs';
  const available = Object.values(App.data.machines)
    .filter(m => m.type !== 'conditioning' && !usedIds.has(m.id))
    .sort((a, b) => {
      // For abs block, show core machines first
      if (isAbsBlock) {
        const aCore = a.category === 'core' ? 0 : 1;
        const bCore = b.category === 'core' ? 0 : 1;
        if (aCore !== bCore) return aCore - bCore;
      }
      return a.name.localeCompare(b.name);
    });

  const overlay = $('modal-overlay');
  const bodyEl = $('modal-body');
  const actionsEl = $('modal-actions');

  bodyEl.innerHTML = '<h3>Add Machine</h3>';
  const list = document.createElement('div');
  list.style.cssText = 'max-height:50vh; overflow-y:auto; margin-top:12px;';

  function addMachineAndClose(machineId) {
    if (!App.session._ui.otherMachines) App.session._ui.otherMachines = [];
    App.session._ui.otherMachines.push(machineId);
    saveActiveSession();
    overlay.classList.add('hidden');
    renderWorkout();
  }

  available.forEach(machine => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.style.cssText = 'width:100%; text-align:left; margin-bottom:6px;';
    btn.textContent = machine.name;
    btn.onclick = () => addMachineAndClose(machine.id);
    list.appendChild(btn);
  });

  // Custom machine creation for abs block
  if (isAbsBlock) {
    const customBtn = document.createElement('button');
    customBtn.className = 'btn btn-ghost';
    customBtn.style.cssText = 'width:100%; text-align:left; margin-bottom:6px; font-style:italic;';
    customBtn.textContent = '+ Create Custom...';
    customBtn.onclick = () => {
      overlay.classList.add('hidden');
      showCreateCustomCoreModal();
    };
    list.appendChild(customBtn);
  }

  bodyEl.appendChild(list);

  actionsEl.innerHTML = '';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-ghost';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => overlay.classList.add('hidden');
  actionsEl.appendChild(cancelBtn);

  overlay.classList.remove('hidden');
}

function showCreateCustomCoreModal() {
  const overlay = $('modal-overlay');
  const bodyEl = $('modal-body');
  const actionsEl = $('modal-actions');

  bodyEl.innerHTML = `
    <h3>Create Core Machine</h3>
    <div class="form-group" style="margin-top:12px;">
      <label for="custom-core-name">Machine Name</label>
      <input type="text" id="custom-core-name" class="input-lg" placeholder="e.g. Ab Wheel" maxlength="40">
    </div>
  `;

  actionsEl.innerHTML = '';
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-ghost';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => overlay.classList.add('hidden');

  const createBtn = document.createElement('button');
  createBtn.className = 'btn btn-primary';
  createBtn.textContent = 'Create';
  createBtn.onclick = () => {
    const name = $('custom-core-name').value.trim();
    if (!name) { showToast('Enter a name'); return; }

    const id = 'custom_core_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (App.data.machines[id]) {
      showToast('Machine already exists');
      return;
    }

    App.data.machines[id] = {
      id,
      name,
      category: 'core',
      type: 'isolation',
      variants: [],
      repRange: { min: 10, max: 15 },
      rirPattern: [2, 1, 1],
      setupFields: [{ key: 'notes', label: 'Notes', type: 'text' }],
      tips: { setup: '', form: '', mantra: [], phasedCues: {} },
      familiarity: 'learning',
      lastUsedAt: null,
    };
    saveData();

    if (!App.session._ui.otherMachines) App.session._ui.otherMachines = [];
    App.session._ui.otherMachines.push(id);
    saveActiveSession();

    overlay.classList.add('hidden');
    renderWorkout();
    showToast(`${name} created`);
  };

  actionsEl.appendChild(cancelBtn);
  actionsEl.appendChild(createBtn);
  overlay.classList.remove('hidden');

  // Focus the input
  setTimeout(() => $('custom-core-name').focus(), 100);
}

function renderMachineBlock(body, block) {
  if (!block.suggestions || block.suggestions.length === 0) {
    body.innerHTML = '<div class="block-empty">No machines in this block</div>';
    return;
  }

  block.suggestions.forEach(machineId => {
    const machine = App.data.machines[machineId];
    if (!machine) return;

    const setsForMachine = getMachineSets(machineId, block.id);
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
  return App.session.sets.filter(s => ids.includes(s.machineId) &&
    (!s.blockId || s.blockId === block.id));
}

function isBlockComplete(block) {
  if (!block.suggestions || block.suggestions.length === 0) return true;
  if (block.id === 'warmup') return !!(App.session.warmup.bikeLog || App.session.warmup.stretchMinutes);
  if (block.id === 'abs') {
    // Abs/Core is supplementary — "complete" if any machine has at least one set
    const allMachines = [...(block.suggestions || []), ...(App.session._ui.otherMachines || [])];
    return allMachines.some(mid => getMachineSets(mid, block.id).length > 0);
  }
  // Choice-based blocks (e.g. compound primary/secondary with multiple options):
  // complete if ANY listed machine has at least one set. Reflects that compound
  // movements are interchangeable and fatigue/order shouldn't force redundant work.
  if (block.completion === 'any') {
    return block.suggestions.some(mid => getMachineSets(mid, block.id).length > 0);
  }
  // Default: a block is "complete" only if every machine has at least one set
  return block.suggestions.every(mid => getMachineSets(mid, block.id).length > 0);
}

/**
 * Sets for a machine this session. With a blockId, only sets logged from that
 * block — a machine can be listed in more than one block (e.g. MTS Row is both
 * a pull primary and secondary option), and a set should only count once.
 * Sets without a blockId (logged before this was tracked) match any block.
 */
export function getMachineSets(machineId, blockId) {
  if (!App.session) return [];
  return App.session.sets.filter(s => s.machineId === machineId &&
    (blockId == null || !s.blockId || s.blockId === blockId));
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
  trackEvent('machine_open', { machineId, blockId });
  saveActiveSession();
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

  // History tab
  renderHistoryTab(machine.id);

  // Mantra sticky
  renderMantraSticky(machine);

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
    notes.innerHTML = renderMarkdown(machine.tips.setup);
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
    group.appendChild(label);

    // Choice fields (e.g. Chest Press handle position 1/2/3) render as chips.
    // Tapping the active chip clears it.
    if (field.type === 'choice') {
      const row = document.createElement('div');
      row.className = 'chip-row';
      (field.options || []).forEach(opt => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.textContent = opt;
        chip.classList.toggle('chip-active', value === opt);
        chip.onclick = () => {
          const next = savedSetupValue(machine.id, field.key) === opt ? '' : opt;
          setSetupValue(machine.id, field.key, next);
          row.querySelectorAll('.chip').forEach(c => c.classList.toggle('chip-active', c.textContent === next));
        };
        row.appendChild(chip);
      });
      group.appendChild(row);
      container.appendChild(group);
      return;
    }

    label.setAttribute('for', `setup-${field.key}`);
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
    input.onchange = () => setSetupValue(machine.id, field.key, input.value);

    group.appendChild(input);
    container.appendChild(group);
  });
}

function savedSetupValue(machineId, key) {
  return App.data.machines[machineId]._setup?.[key] || '';
}

function setSetupValue(machineId, key, value) {
  const machine = App.data.machines[machineId];
  if (!machine._setup) machine._setup = {};
  machine._setup[key] = value;
  saveData();
}

/**
 * Snapshot of the choice-type setup values (handle position, grip…) at the time
 * a set is logged, so they're stored alongside weight and reps (issue #39).
 */
function setupSnapshot(machineId) {
  const machine = App.data.machines[machineId];
  const snap = {};
  (machine?.setupFields || []).forEach(f => {
    const v = f.type === 'choice' && machine._setup?.[f.key];
    if (v) snap[f.key] = v;
  });
  return Object.keys(snap).length ? snap : null;
}

/** Short label for a set's setup snapshot, e.g. "Handle Position 2" */
function setupLabel(machineId, setup) {
  if (!setup) return '';
  const fields = App.data.machines[machineId]?.setupFields || [];
  return fields
    .filter(f => setup[f.key])
    .map(f => `${f.label} ${setup[f.key]}`)
    .join(' · ');
}

export function renderFormTab(machine) {
  const formText = $('form-text');
  formText.innerHTML = renderMarkdown(machine.tips?.form) || '<p class="tips-p">No form tips available.</p>';

  // If familiar, collapse by default. The toggle sits directly under the text,
  // above "Read Form" (issue #41).
  const collapse = machine.familiarity === 'familiar' && !!machine.tips?.form;
  const expandBtn = $('btn-form-expand');
  formText.classList.toggle('collapsed', collapse);
  expandBtn.classList.toggle('hidden', !collapse);
  expandBtn.textContent = 'Show more';
  expandBtn.onclick = () => {
    formText.classList.toggle('collapsed');
    expandBtn.textContent = formText.classList.contains('collapsed') ? 'Show more' : 'Show less';
  };

  // Familiarity toggle — lives in the Form tab since it only controls whether
  // form tips start collapsed; irrelevant for machines without form tips (issue #40)
  const isFamiliar = machine.familiarity === 'familiar';
  $('familiar-row').classList.toggle('hidden', !machine.tips?.form || machine.type === 'conditioning');
  $('btn-toggle-familiar').textContent = isFamiliar ? 'Mark as Learning' : 'Mark Familiar';
  $('familiar-hint').textContent = isFamiliar ? 'Form tips start collapsed' : 'Collapses form tips';
}

function renderHistoryTab(machineId) {
  const container = $('machine-history');
  const sessions = App.data.sessions || [];

  // Collect all sessions that include this machine, most recent first
  const relevant = sessions
    .filter(s => s.sets?.some(st => st.machineId === machineId))
    .slice()
    .reverse();

  if (relevant.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">No history yet.</p>';
    return;
  }

  let html = '';
  relevant.forEach(s => {
    const date = new Date(s.startedAt);
    const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const machineSets = s.sets.filter(st => st.machineId === machineId);

    html += `<div class="history-session">`;
    html += `<div class="history-session-date">${label}</div>`;
    machineSets.forEach(st => {
      html += `<div class="history-set-row">Set ${st.setNumber}: ${st.weight} lbs &times; ${st.reps}`;
      if (st.rir != null && st.rir !== '') html += ` <span class="history-rir">RIR ${st.rir}</span>`;
      const setup = setupLabel(machineId, st.setup);
      if (setup) html += ` <span class="history-rir">· ${setup}</span>`;
      html += `</div>`;
    });
    html += `</div>`;
  });

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
  const sets = getMachineSets(machineId, App.currentBlockId);
  container.innerHTML = '';

  sets.forEach(s => {
    const row = document.createElement('div');
    row.className = 'set-row';
    const setup = setupLabel(machineId, s.setup);
    row.innerHTML = `
      <span class="set-row-num">${s.setNumber}</span>
      <span class="set-row-detail">${s.weight} lbs &times; ${s.reps}${setup ? `<span class="set-row-setup">${setup}</span>` : ''}</span>
      <span class="set-row-rir">RIR ${s.rir}</span>
      <button class="set-row-edit" aria-label="Edit set ${s.setNumber}">&#9998;</button>
    `;
    row.querySelector('.set-row-edit').onclick = () => showEditSetModal(s);
    container.appendChild(row);
  });
}

// ============================================================
// EDIT / DELETE A LOGGED SET (issue #9 — pencil to fix typos)
// ============================================================
function showEditSetModal(set) {
  const overlay = $('modal-overlay');
  const bodyEl = $('modal-body');
  const actionsEl = $('modal-actions');
  const machineId = set.machineId;

  bodyEl.innerHTML = `
    <h3>Edit Set ${set.setNumber}</h3>
    <div class="form-row" style="margin-top:12px;">
      <div class="form-group flex-1">
        <label for="edit-set-weight">Weight</label>
        <input type="number" id="edit-set-weight" class="input-lg" inputmode="decimal" min="0" step="2.5">
      </div>
      <div class="form-group flex-1">
        <label for="edit-set-reps">Reps</label>
        <input type="number" id="edit-set-reps" class="input-lg" inputmode="numeric" min="0" max="100">
      </div>
    </div>
    <p class="form-label">RIR</p>
    <div class="chip-row" id="edit-rir-chips">
      ${[0, 1, 2, 3].map(r => `<button class="chip${set.rir === r ? ' chip-active' : ''}" data-rir="${r}">${r === 3 ? '3+' : r}</button>`).join('')}
    </div>
  `;
  $('edit-set-weight').value = set.weight;
  $('edit-set-reps').value = set.reps;
  bodyEl.querySelectorAll('#edit-rir-chips .chip').forEach(chip => {
    chip.onclick = () => {
      bodyEl.querySelectorAll('#edit-rir-chips .chip').forEach(c => c.classList.remove('chip-active'));
      chip.classList.add('chip-active');
    };
  });

  const afterChange = () => {
    saveActiveSession();
    renderLoggedSets(machineId);
    updatePillRow();
    updateSegmentBar();
  };

  const makeBtn = (label, cls, fn) => {
    const btn = document.createElement('button');
    btn.className = `btn ${cls}`;
    btn.textContent = label;
    btn.onclick = fn;
    return btn;
  };

  actionsEl.innerHTML = '';
  actionsEl.appendChild(makeBtn('Delete', 'btn-danger', () => {
    const idx = App.session.sets.indexOf(set);
    if (idx === -1) return;
    App.session.sets.splice(idx, 1);
    renumberSets(machineId, set.blockId);
    overlay.classList.add('hidden');
    afterChange();
    refreshSetLoggerAfterDelete(machineId);
    showToast(`Set deleted`, () => {
      App.session.sets.splice(idx, 0, set);
      renumberSets(machineId, set.blockId);
      afterChange();
      refreshSetLoggerAfterDelete(machineId);
    });
  }));
  actionsEl.appendChild(makeBtn('Cancel', 'btn-ghost', () => overlay.classList.add('hidden')));
  actionsEl.appendChild(makeBtn('Save', 'btn-primary', () => {
    const weight = parseFloat($('edit-set-weight').value);
    const reps = parseInt($('edit-set-reps').value);
    if (isNaN(weight) || isNaN(reps) || reps <= 0) { showToast('Enter weight and reps'); return; }
    const rirChip = bodyEl.querySelector('#edit-rir-chips .chip-active');
    set.weight = weight;
    set.reps = reps;
    if (rirChip) set.rir = parseInt(rirChip.dataset.rir);
    set.editedAt = isoNow();
    overlay.classList.add('hidden');
    afterChange();
    showToast(`Set ${set.setNumber} updated`);
  }));

  overlay.classList.remove('hidden');
}

function renumberSets(machineId, blockId) {
  getMachineSets(machineId, blockId).forEach((s, i) => { s.setNumber = i + 1; });
}

function refreshSetLoggerAfterDelete(machineId) {
  if (App.currentMachineId !== machineId) return;
  // Mid data entry: keep the typed values, just fix the set number label
  const inEntry = !$('set-logger').classList.contains('hidden') &&
    !$('set-entry-phase').classList.contains('hidden');
  if (inEntry) {
    $('current-set-label').textContent = `Set ${getMachineSets(machineId, App.currentBlockId).length + 1}`;
  } else {
    renderSetLogger(machineId);
  }
}

function renderSetLogger(machineId) {
  const machine = App.data.machines[machineId];
  if (!machine || machine.type === 'conditioning') return;

  const sets = getMachineSets(machineId, App.currentBlockId);
  const rirPattern = machine.rirPattern || [2, 1, 1];

  // Once the typical working sets are done, show next-time suggestion + option for more
  if (sets.length >= rirPattern.length) {
    showNextTimeSuggestion(machineId);
    $('set-logger').classList.add('hidden');
    return;
  }

  showSetLoggerForNextSet(machineId);
}

/**
 * Reset the set logger to the "Set Done" phase for the next set on this machine.
 * Used both for the planned working sets and for "Log Another Set".
 */
function showSetLoggerForNextSet(machineId) {
  const machine = App.data.machines[machineId];
  const sets = getMachineSets(machineId, App.currentBlockId);
  const setNum = sets.length + 1;
  const rirPattern = machine.rirPattern || [2, 1, 1];
  const targetRir = rirPattern[Math.min(setNum, rirPattern.length) - 1];

  $('set-logger').classList.remove('hidden');
  $('next-time-suggestion').classList.add('hidden');

  $('current-set-label').textContent = `Set ${setNum}`;
  $('target-rir-label').textContent = `Target: RIR ${targetRir}`;

  // Show rep range inline near the reps input (issue #5)
  const hasRepRange = machine.repRange && machine.repRange.max > 0;
  const repRange = hasRepRange ? `${machine.repRange.min}–${machine.repRange.max}` : '';
  const repRangePill = $('set-rep-range');
  repRangePill.textContent = repRange;
  repRangePill.classList.toggle('hidden', !hasRepRange);

  // Pre-fill weight from last set, else last session / seed weight
  const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
  const weight = lastSet ? lastSet.weight : (getLastSessionWeight(machineId) ?? '');
  $('set-weight').value = weight;
  $('set-weight-pre').value = weight;
  $('set-reps').value = '';

  // Preview: target RIR + rep range to aim for (issue #37); weight is the stepper above it
  const previewParts = [`RIR ${targetRir}`];
  if (hasRepRange) previewParts.push(`${repRange} reps`);
  $('set-preview').textContent = previewParts.join(' · ');

  // Before the first set, remind what was planned last time (issue #35) so a
  // planned weight bump isn't forgotten
  const hint = $('set-plan-hint');
  const lastNote = sets.length === 0 ? getLastNextTimeNote(machineId) : null;
  if (lastNote && lastNote !== 'again') {
    const labels = { weight_up: '💪 Last time you planned: weight up', focus_form: '🎯 Last time you planned: focus on form' };
    hint.textContent = labels[lastNote] || `📝 Last time: ${lastNote}`;
    hint.classList.remove('hidden');
  } else {
    hint.classList.add('hidden');
  }

  // Reset to "Set Done" phase
  $('set-done-phase').classList.remove('hidden');
  $('set-entry-phase').classList.add('hidden');

  // Reset chips
  $$('#rir-chips .chip').forEach(c => c.classList.remove('chip-active'));
  $$('#note-chips .chip').forEach(c => c.classList.remove('chip-active'));
  $('set-custom-note').value = '';
}

/** Nudge the pre-set weight up/down (issue #35: adjustable before you start) */
export function adjustPreWeight(delta) {
  const input = $('set-weight-pre');
  const current = parseFloat(input.value) || 0;
  const next = Math.max(0, current + delta);
  input.value = next;
  $('set-weight').value = next;
}

/** The next-time note from the most recent previous session that used this machine */
function getLastNextTimeNote(machineId) {
  const sessions = App.data.sessions || [];
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if (s.sets?.some(st => st.machineId === machineId)) {
      return s.nextTimeNotes?.[machineId] || null;
    }
  }
  return null;
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
  const sets = getMachineSets(machineId, App.currentBlockId);

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
// LOG ANOTHER SET (beyond RIR pattern)
// ============================================================
export function logAnotherSet() {
  const machineId = App.currentMachineId;
  if (!machineId || !App.data.machines[machineId]) return;
  showSetLoggerForNextSet(machineId);
}

// ============================================================
// SET DONE — Phase 1: start rest timer, switch to data entry
// ============================================================
const AUTO_OFFSET_SEC = 4; // approximate delay picking up phone after set

export function setDone() {
  const machineId = App.currentMachineId;
  if (!machineId || !App.session) return;

  // Record when the set was actually finished (with auto-offset)
  App.setDoneAt = isoNow();

  // Carry any pre-set weight adjustment into the entry form
  $('set-weight').value = $('set-weight-pre').value;

  // This tap is a user gesture — unlock audio so the rest alert can play later (iOS)
  unlockAudio();

  // Start rest timer immediately with auto-offset
  const machine = App.data.machines[machineId];
  if (machine && machine.type !== 'conditioning') {
    startRestTimer(machine.type, AUTO_OFFSET_SEC);
  }

  // Switch to data entry phase
  $('set-done-phase').classList.add('hidden');
  $('set-entry-phase').classList.remove('hidden');
}

// ============================================================
// SET LOGGING — Phase 2: save set data
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

  const sets = getMachineSets(machineId, App.currentBlockId);
  const setNumber = sets.length + 1;

  const setData = {
    machineId,
    blockId: App.currentBlockId,
    setNumber,
    weight,
    reps,
    rir,
    notes,
    setup: setupSnapshot(machineId),
    loggedAt: App.setDoneAt || isoNow(),
  };

  App.session.sets.push(setData);
  trackEvent('set_completed', { machineId, setNumber, weight, reps, rir });

  // Update machine lastUsedAt
  App.data.machines[machineId].lastUsedAt = isoNow();
  saveData();
  saveActiveSession();

  // Clear setDoneAt
  App.setDoneAt = null;

  // Re-render
  renderLoggedSets(machineId);
  renderSetLogger(machineId);
  updatePillRow();
  updateSegmentBar();

  // Undo callback
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

  showToast(`Set ${setNumber} saved`, undoFn);
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

    if (note) {
      App.session.nextTimeNotes[machineId] = note;
    } else {
      delete App.session.nextTimeNotes[machineId];
    }
    trackEvent('machine_done', { machineId });
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

  trackEvent('bike_logged', { minutes, rpe });
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
// ============================================================
// WINDOW GLOBALS (for inline onclick handlers in rendered HTML)
// ============================================================
export function setupWorkoutGlobals() {
  window._appBikeQuick = () => {
    trackEvent('bike_open');
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
    trackEvent('stretch_logged', { minutes: mins });
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
