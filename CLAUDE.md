# Gym App — Agent Instructions

## Versioning

- **Format**: Date-based with build letter — `vYYYY.MM.DDx` (e.g. `v2026.03.06a`)
- **Location**: `js/config.js` → `APP_VERSION` constant
- **Rule**: Always update `APP_VERSION` when making code changes.
  - Same day: increment the build letter (`a` → `b` → `c` → ...)
  - New day: use today's date and reset to `a`

## Project Structure

- Pure vanilla JS app (no build tools, no framework)
- Single `index.html` with CSS in `css/app.css` and JS modules in `js/`
- All data stored in localStorage
- Mobile-first design, dark/light mode via `prefers-color-scheme`
- Dev server: `python3 server.py` on port 8080
