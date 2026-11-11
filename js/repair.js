/**
 * Gym App — one-time repair of saved sessions damaged by the old "forgot to
 * stop" flow (fixed in v2026.11.11a):
 *
 *  1. Merged workouts: tapping Resume on a days-old session logged the next
 *     workout into it, so two workouts were saved as one under the first date.
 *     Split at any activity gap longer than STALE_SESSION_MS.
 *  2. Inflated durations: ending a forgotten session days later set endedAt to
 *     "now". Trim endedAt back to the last activity.
 *
 * Idempotent — a repaired history has nothing left to repair, so it's safe to
 * run on every launch.
 */

import { STALE_SESSION_MS } from './config.js';

const ms = (iso) => new Date(iso).getTime();
const iso = (t) => new Date(t).toISOString();

// Things that mean "a workout happened" (vs. just opening a screen)
const hasContent = (part) => part.sets.length > 0 || part.bikeLogs.length > 0 || !!part.warmupBike ||
  part.events.some(e => e.type === 'stretch_logged');

/** Returns { sessions, changed } — the input array is not modified. */
export function repairSessions(sessions) {
  let changed = 0;
  const out = [];
  for (const s of sessions) {
    const fixed = repairOne(s);
    if (fixed) { changed++; out.push(...fixed); } else out.push(s);
  }
  return { sessions: out, changed };
}

/** Returns replacement session(s), or null if this one is fine. */
function repairOne(s) {
  if (!s?.startedAt || !s.endedAt) return null;
  const events = (s.events || []).filter(e => e.type !== 'session_start' && e.type !== 'session_end');
  const sets = s.sets || [];
  const bikeLogs = s.bikeLogs || [];
  const warmupBike = s.warmup?.bikeLog || null;

  // All activity times, in order
  const times = [ms(s.startedAt), ...events.map(e => ms(e.at)), ...sets.map(x => ms(x.loggedAt)),
    ...bikeLogs.filter(b => b.loggedAt).map(b => ms(b.loggedAt))].filter(Number.isFinite).sort((a, b) => a - b);

  // Split points: the first activity after each long gap
  const cuts = [];
  for (let i = 1; i < times.length; i++) {
    if (times[i] - times[i - 1] > STALE_SESSION_MS) cuts.push(times[i]);
  }
  const lastActivity = times[times.length - 1];
  const endTrimmed = ms(s.endedAt) - lastActivity > STALE_SESSION_MS;
  if (cuts.length === 0 && !endTrimmed) return null;

  // Bucket everything into time windows
  const bounds = [-Infinity, ...cuts, Infinity];
  const inPart = (t, k) => t >= bounds[k] && t < bounds[k + 1];
  const parts = [];
  for (let k = 0; k < bounds.length - 1; k++) {
    parts.push({
      events: events.filter(e => inPart(ms(e.at), k)),
      sets: sets.filter(x => inPart(ms(x.loggedAt), k)),
      bikeLogs: bikeLogs.filter(b => inPart(b.loggedAt ? ms(b.loggedAt) : ms(s.startedAt), k)),
      warmupBike: k === 0 ? warmupBike : null,
      start: k === 0 ? ms(s.startedAt) : cuts[k - 1],
    });
  }

  // Drop windows where nothing was logged (e.g. started Monday, actually
  // trained Thursday → the Thursday part becomes the whole session)
  const kept = parts.filter(hasContent);
  if (kept.length === 0) return null;

  // Next-time notes go with the last part that used that machine
  const notes = s.nextTimeNotes || {};
  const noteOwner = {};
  Object.keys(notes).forEach(mid => {
    const owner = [...kept].reverse().find(p => p.sets.some(x => x.machineId === mid));
    noteOwner[mid] = owner || kept[kept.length - 1];
  });

  return kept.map((p, i) => {
    const isFirst = p === parts[0];
    const partTimes = [p.start, ...p.events.map(e => ms(e.at)), ...p.sets.map(x => ms(x.loggedAt)),
      ...p.bikeLogs.filter(b => b.loggedAt).map(b => ms(b.loggedAt))];
    const partLast = Math.max(...partTimes);
    const isLast = i === kept.length - 1;
    // Keep the real end time for the final part unless it was a forgotten-session end
    const end = isLast && ms(s.endedAt) - partLast <= STALE_SESSION_MS ? ms(s.endedAt) : partLast;

    // Renumber sets per machine+block within this part
    const counts = {};
    const partSets = p.sets.map(x => {
      const key = `${x.machineId}|${x.blockId || ''}`;
      counts[key] = (counts[key] || 0) + 1;
      return { ...x, setNumber: counts[key] };
    });

    const warmup = isFirst
      ? { ...s.warmup }
      : { stretchMinutes: null, bikeLog: null, durationSec: 0 };
    if (!isFirst && partSets.length) {
      warmup.durationSec = Math.max(0, Math.floor((ms(partSets[0].loggedAt) - p.start) / 1000));
    }

    const partNotes = {};
    Object.keys(notes).forEach(mid => { if (noteOwner[mid] === p) partNotes[mid] = notes[mid]; });

    return {
      ...s,
      id: i === 0 ? s.id : `${s.id}_${i + 1}`,
      startedAt: iso(p.start),
      endedAt: iso(end),
      warmup,
      sets: partSets,
      bikeLogs: p.bikeLogs,
      nextTimeNotes: partNotes,
      events: [
        { type: 'session_start', detail: { dayType: s.dayType }, at: iso(p.start) },
        ...p.events,
        { type: 'session_end', detail: null, at: iso(end) },
      ],
      repairedFrom: s.id,
    };
  });
}
