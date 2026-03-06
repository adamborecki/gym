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
