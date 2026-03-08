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

/**
 * Convert a markdown-like tips string to safe HTML.
 * Supported syntax:
 *   **Header**        → styled section header
 *   • text / - text   → list items (grouped into <ul>)
 *   🗣️ "..."          → micro-cue callout block
 *   blank line        → paragraph break / list separator
 *   everything else   → <p> paragraph
 */
export function renderMarkdown(text) {
  if (!text) return '';
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  const closeList = () => {
    if (inList) { html += '</ul>'; inList = false; }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/^\t/, '').trimEnd();

    // Blank line → close list, add spacing
    if (line.trim() === '') {
      closeList();
      html += '<div class="tips-spacer"></div>';
      continue;
    }

    // **Header** → section header
    const headerMatch = line.match(/^\*\*(.+)\*\*$/);
    if (headerMatch) {
      closeList();
      html += `<div class="tips-header">${escHtml(headerMatch[1])}</div>`;
      continue;
    }

    // Bullet: leading •, -, or ✦ (optionally with leading whitespace/tab)
    const bulletMatch = line.match(/^[\s]*[•\-✦]\s+(.*)/);
    if (bulletMatch) {
      if (!inList) { html += '<ul class="tips-list">'; inList = true; }
      html += `<li>${escHtml(bulletMatch[1])}</li>`;
      continue;
    }

    // Micro-cue line: starts with an emoji and contains a closing quote (smart or straight)
    const cueLine = line.trim();
    if ((/^\p{Extended_Pictographic}/u.test(cueLine) && /[\u201c\u201d\u2019"']/.test(cueLine)) || /^Micro-cue/.test(cueLine)) {
      closeList();
      html += `<div class="tips-cue">${escHtml(cueLine)}</div>`;
      continue;
    }

    // Regular line → paragraph (or append to open paragraph)
    closeList();
    html += `<p class="tips-p">${escHtml(cueLine)}</p>`;
  }

  closeList();
  return html;
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

/** HTML-escape a string */
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
