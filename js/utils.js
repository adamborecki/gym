/**
 * Gym App — Utility Functions
 */

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatTime(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec}s`;
}

/** Human-friendly elapsed time: "45s", "12m", "1h 05m", "2d 3h". */
export function formatElapsed(ms) {
  const totalMin = Math.floor(Math.max(ms, 0) / 60000);
  if (totalMin < 1) return `${Math.floor(Math.max(ms, 0) / 1000)}s`;
  if (totalMin < 60) return `${totalMin}m`;
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  if (h < 24) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export function $(id) { return document.getElementById(id); }
export function $$(sel) { return document.querySelectorAll(sel); }

export function isoNow() { return new Date().toISOString(); }

/** Return 'YYYY-MM-DD' in the user's local timezone */
export function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Convert a markdown tips string to HTML using marked.js.
 * Pre-processes legacy format (• bullets, **Header** lines) into standard markdown.
 */
export function renderMarkdown(text) {
  if (!text) return '';

  // Pre-process: convert legacy format to standard markdown
  const processed = text
    // **Header** on its own line → ### Header (so marked renders as <h3>)
    .replace(/^\*\*(.+)\*\*$/gm, '### $1')
    // Unicode bullets → standard markdown list items
    .replace(/^[•✦]\s/gm, '- ')
    // Strip leading tabs (from template literals)
    .replace(/^\t+/gm, '');

  // marked.js loads from a CDN; if it didn't (bad gym signal), fall back to
  // plain text rather than throwing — a throw here breaks opening a machine.
  if (window.marked?.parse) return window.marked.parse(processed);
  return processed.split('\n')
    .map(line => escapeHtml(line.replace(/^#+\s*/, '').replace(/\*\*/g, '')))
    .join('<br>');
}

/** Strip markdown formatting for TTS plain text */
export function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold** → plain
    .replace(/^[\s]*[•✦]\s+/gm, '')   // bullets
    .replace(/^[\s]*-\s+/gm, '')       // dashes
    .trim();
}

/** Escape user-entered text before inserting into innerHTML */
export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Display text for a next-time note ('weight_up' → 'Weight up', custom text as-is) */
export function formatNextTimeNote(note) {
  if (!note) return '';
  const presets = { again: 'Again', weight_up: 'Weight up', focus_form: 'Focus form' };
  return presets[note] || note;
}
