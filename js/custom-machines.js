/**
 * Gym App — Custom Machines (user-created; create / edit / delete)
 *
 * A custom machine is any machine that isn't in DEFAULT_DATA. Built-ins are
 * refreshed from defaults on every load, so only custom ones are editable.
 * A custom machine can be "based on" a built-in: it borrows that machine's
 * tips, setup fields and RIR pattern, but keeps its own name, saved setup
 * values and history — e.g. the same lift on a different gym's equipment.
 */

import { $, deepClone, escapeHtml } from './utils.js';
import { App, saveData, saveActiveSession } from './state.js';
import { showToast, showModal } from './ui.js';
import { DEFAULT_DATA } from './data-defaults.js';

const NOTES_FIELD = { key: 'notes', label: 'Notes', type: 'text' };

export function isCustomMachine(machine) {
  return !!machine && !DEFAULT_DATA.machines[machine.id];
}

/** "Chest Press · Hotel gym" — name plus the gym tag, for pick lists */
export function machineLabel(machine) {
  return machine.gym ? `${machine.name} · ${machine.gym}` : machine.name;
}

/** Built-in machines a custom one can be based on */
function baseOptions() {
  return Object.values(DEFAULT_DATA.machines)
    .filter(m => m.type !== 'conditioning')
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Copy the static content (tips, setup fields, RIR pattern, category) from the
 * machine this one is based on. With no base, reset those to a blank machine.
 */
function applyBase(machine) {
  const base = machine.basedOn && DEFAULT_DATA.machines[machine.basedOn];
  if (!base) {
    if (machine.basedOn) return; // base no longer exists — leave content as is
    machine.category = 'core';
    machine.rirPattern = [2, 1, 1];
    machine.setupFields = [deepClone(NOTES_FIELD)];
    machine.tips = { setup: '', form: '', mantra: [], phasedCues: {} };
    return;
  }
  machine.category = base.category;
  machine.rirPattern = deepClone(base.rirPattern || [2, 1, 1]);
  machine.tips = deepClone(base.tips || {});
  machine.setupFields = deepClone(base.setupFields || []);
  if (!machine.setupFields.some(f => f.key === 'notes')) machine.setupFields.push(deepClone(NOTES_FIELD));
}

/** On load: re-pull borrowed content so based-on machines pick up tip updates */
export function syncCustomMachines(data) {
  Object.values(data.machines).forEach(m => {
    if (isCustomMachine(m) && m.basedOn) applyBase(m);
  });
}

/** Gym names seen so far: tags on custom machines plus gyms of past sessions */
export function knownGyms() {
  const names = [
    ...Object.values(App.data.machines).filter(m => !m.archived).map(m => m.gym),
    ...(App.data.sessions || []).map(s => s.gym),
  ];
  return [...new Set(names.filter(Boolean))].sort();
}

function hasHistory(machineId) {
  return (App.data.sessions || []).some(s => s.sets?.some(st => st.machineId === machineId));
}

function newMachineId(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'machine';
  let id = `custom_${slug}`;
  for (let n = 2; App.data.machines[id]; n++) id = `custom_${slug}_${n}`;
  return id;
}

/**
 * Create (machine = null) or edit a custom machine.
 * onSaved(machine, created) / onDeleted(machine) let the caller re-render.
 */
export function showCustomMachineModal({ machine = null, defaults = {}, onSaved, onDeleted } = {}) {
  const overlay = $('modal-overlay');
  const bodyEl = $('modal-body');
  const actionsEl = $('modal-actions');
  const editing = !!machine;
  const gyms = knownGyms();

  bodyEl.innerHTML = `
    <h3>${editing ? 'Edit Machine' : 'New Machine'}</h3>
    <div class="machine-edit-form">
      <div class="form-group">
        <label for="cm-name">Name</label>
        <input type="text" id="cm-name" class="input-lg" placeholder="e.g. Chest Press (hotel)" maxlength="40" autocomplete="off">
      </div>
      <div class="form-group">
        <label for="cm-base">Based on</label>
        <select id="cm-base" class="input-lg">
          <option value="">Nothing — blank machine</option>
          ${baseOptions().map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('')}
        </select>
        <p class="form-hint">Borrows that machine's form tips and setup fields. Weights, settings and history stay separate.</p>
      </div>
      <div class="form-group">
        <label for="cm-gym">Gym <span class="form-optional">optional</span></label>
        <input type="text" id="cm-gym" class="input-lg" placeholder="e.g. Hotel gym" maxlength="30" list="cm-gym-list" autocomplete="off">
        <datalist id="cm-gym-list">${gyms.map(g => `<option value="${escapeHtml(g)}">`).join('')}</datalist>
      </div>
      <p class="form-label">Type</p>
      <div class="chip-row" id="cm-type">
        <button type="button" class="chip" data-type="compound">Compound</button>
        <button type="button" class="chip" data-type="isolation">Isolation</button>
      </div>
      <div class="form-row">
        <div class="form-group flex-1">
          <label for="cm-rep-min">Min reps</label>
          <input type="number" id="cm-rep-min" class="input-lg" inputmode="numeric" min="1" max="100">
        </div>
        <div class="form-group flex-1">
          <label for="cm-rep-max">Max reps</label>
          <input type="number" id="cm-rep-max" class="input-lg" inputmode="numeric" min="1" max="100">
        </div>
      </div>
    </div>
  `;

  const setType = (type) => bodyEl.querySelectorAll('#cm-type .chip')
    .forEach(c => c.classList.toggle('chip-active', c.dataset.type === type));
  const setReps = (range) => {
    $('cm-rep-min').value = range.min;
    $('cm-rep-max').value = range.max;
  };

  $('cm-name').value = machine?.name || '';
  $('cm-base').value = (machine?.basedOn && DEFAULT_DATA.machines[machine.basedOn]) ? machine.basedOn : '';
  $('cm-gym').value = (editing ? machine.gym : defaults.gym) || '';
  setType(machine?.type || 'isolation');
  setReps(machine?.repRange || { min: 10, max: 15 });

  bodyEl.querySelectorAll('#cm-type .chip').forEach(c => { c.onclick = () => setType(c.dataset.type); });
  // Picking a base pre-fills its type and rep range (still editable)
  $('cm-base').onchange = () => {
    const base = DEFAULT_DATA.machines[$('cm-base').value];
    if (!base) return;
    setType(base.type);
    if (base.repRange) setReps(base.repRange);
  };

  const makeBtn = (label, cls, fn) => {
    const btn = document.createElement('button');
    btn.className = `btn ${cls}`;
    btn.textContent = label;
    btn.onclick = fn;
    return btn;
  };
  const close = () => overlay.classList.add('hidden');

  actionsEl.innerHTML = '';
  if (editing) {
    actionsEl.appendChild(makeBtn('Delete', 'btn-danger', () => confirmDelete(machine, onDeleted)));
  }
  actionsEl.appendChild(makeBtn('Cancel', 'btn-ghost', close));
  actionsEl.appendChild(makeBtn(editing ? 'Save' : 'Create', 'btn-primary', () => {
    const name = $('cm-name').value.trim();
    if (!name) { showToast('Enter a name'); return; }

    const sameName = Object.values(App.data.machines)
      .find(m => m !== machine && m.name.toLowerCase() === name.toLowerCase());
    if (sameName && !sameName.archived) { showToast('That name is already used'); return; }

    const min = parseInt($('cm-rep-min').value);
    const max = parseInt($('cm-rep-max').value);
    if (isNaN(min) || isNaN(max) || min < 1 || max < min) { showToast('Check the rep range'); return; }

    // Re-creating a deleted machine brings it (and its history) back
    const target = machine || (sameName && isCustomMachine(sameName) ? sameName : null) || {
      id: newMachineId(name),
      variants: [],
      familiarity: 'learning',
      lastUsedAt: null,
      _setup: {},
    };
    if (sameName && target !== sameName) { showToast('That name is already used'); return; }

    const prevBase = target.basedOn || '';
    target.name = name;
    target.basedOn = $('cm-base').value || null;
    target.gym = $('cm-gym').value.trim() || null;
    target.type = bodyEl.querySelector('#cm-type .chip-active')?.dataset.type || 'isolation';
    target.repRange = { min, max };
    delete target.archived;
    // Only touch borrowed content when the base changed (or the machine is new)
    if (!target.tips || prevBase !== (target.basedOn || '')) applyBase(target);

    App.data.machines[target.id] = target;
    saveData();
    close();
    showToast(editing ? 'Machine updated' : `${escapeHtml(name)} ${target === sameName ? 'restored' : 'created'}`);
    if (onSaved) onSaved(target, !editing);
  }));

  overlay.classList.remove('hidden');
  if (!editing) setTimeout(() => $('cm-name').focus(), 100);
}

/**
 * "My Machines" in Settings: every custom machine (tap to edit), a button to
 * create one, and deleted machines that can be restored.
 */
export function renderMyMachines() {
  const list = $('my-machines-list');
  const rerender = () => renderMyMachines();
  const custom = Object.values(App.data.machines).filter(isCustomMachine)
    .sort((a, b) => a.name.localeCompare(b.name));
  const active = custom.filter(m => !m.archived);
  const deleted = custom.filter(m => m.archived);

  $('btn-new-machine').onclick = () => showCustomMachineModal({ onSaved: rerender });
  list.innerHTML = active.length ? '' : '<p class="my-machines-empty">No custom machines yet.</p>';

  const addRow = (machine, action, onAction) => {
    const base = machine.basedOn && DEFAULT_DATA.machines[machine.basedOn];
    const sub = [machine.gym && `📍 ${machine.gym}`, base && `Like ${base.name}`,
      `${machine.repRange.min}–${machine.repRange.max} reps`].filter(Boolean).join(' · ');
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'my-machine-row';
    row.innerHTML = `
      <span class="my-machine-text">
        <span class="my-machine-name">${escapeHtml(machine.name)}</span>
        <span class="my-machine-sub">${escapeHtml(sub)}</span>
      </span>
      <span class="my-machine-action">${action}</span>
    `;
    row.onclick = onAction;
    list.appendChild(row);
  };

  active.forEach(m => addRow(m, '&#9998;', () =>
    showCustomMachineModal({ machine: m, onSaved: rerender, onDeleted: rerender })));

  if (deleted.length) {
    const label = document.createElement('div');
    label.className = 'picker-section-label';
    label.textContent = 'Deleted';
    list.appendChild(label);
    deleted.forEach(m => addRow(m, 'Restore', () => {
      delete m.archived;
      saveData();
      showToast(`${escapeHtml(m.name)} restored`);
      rerender();
    }));
  }
}

function confirmDelete(machine, onDeleted) {
  if (App.session?.sets?.some(st => st.machineId === machine.id)) {
    showToast('Delete its sets from this workout first');
    return;
  }
  const kept = hasHistory(machine.id);
  showModal(
    `Delete ${escapeHtml(machine.name)}?`,
    kept
      ? 'It will be removed from your machine list. Past workouts keep their logged sets.'
      : 'It has no logged sets, so nothing else is lost.',
    [
      { label: 'Cancel', class: 'btn-ghost' },
      { label: 'Delete', class: 'btn-danger', action: () => {
        // With history, keep the record (hidden) so past workouts still show its name
        if (kept) machine.archived = true;
        else delete App.data.machines[machine.id];
        saveData();
        // Take it out of the current workout's added machines (any block)
        const ui = App.session?._ui;
        if (ui) {
          const without = (ids) => (ids || []).filter(id => id !== machine.id);
          ui.otherMachines = without(ui.otherMachines);
          Object.keys(ui.addedMachines || {}).forEach(b => { ui.addedMachines[b] = without(ui.addedMachines[b]); });
          saveActiveSession();
        }
        showToast('Machine deleted');
        if (onDeleted) onDeleted(machine);
      }},
    ]
  );
}
