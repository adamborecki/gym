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

  return window.marked.parse(processed);
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
