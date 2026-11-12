/**
 * Gym App — block iPhone double-tap-to-zoom.
 *
 * CSS `touch-action: manipulation` (app.css) is the primary fix, but iOS
 * Safari doesn't always honour it. Fallback: when a tap lands within
 * DOUBLE_TAP_MS of the previous one, cancel its default (which is what
 * triggers the zoom) and fire the click ourselves, so rapid taps such as
 * weight +/- still all count.
 */

const DOUBLE_TAP_MS = 350;
const MOVE_PX = 10;
const NATIVE_INPUT_TYPES = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range']);

// Text fields need the native touch to place the caret / open the keyboard
function needsNativeTouch(el) {
  if (el.closest('textarea, select, [contenteditable=""], [contenteditable="true"]')) return true;
  return el.tagName === 'INPUT' && !NATIVE_INPUT_TYPES.has(el.type);
}

export function installNoDoubleTapZoom() {
  let lastTapEnd = 0;
  let startX = 0, startY = 0, moved = false, multi = false;

  document.addEventListener('touchstart', (e) => {
    multi = e.touches.length > 1;
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY; moved = false;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (Math.abs(t.clientX - startX) > MOVE_PX || Math.abs(t.clientY - startY) > MOVE_PX) moved = true;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (e.touches.length > 0 || multi || moved) return;  // pinch, scroll or drag — not a tap
    const now = Date.now();
    const isSecondTap = now - lastTapEnd < DOUBLE_TAP_MS;
    lastTapEnd = now;
    if (!isSecondTap) return;

    const el = e.target instanceof Element ? e.target : e.target.parentElement;
    if (!el || needsNativeTouch(el)) return;
    e.preventDefault();  // no zoom — but also no native click, so…
    el.click();          // …deliver it ourselves
  }, { passive: false });
}
