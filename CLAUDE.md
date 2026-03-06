# Gym App — Agent Instructions

## Versioning

- **Format**: Date-based — `vYYYY.MM.DD` (e.g. `v2026.03.06`)
- **Location**: `js/config.js` → `APP_VERSION` constant
- **Rule**: Always update `APP_VERSION` to today's date when making code changes. If multiple changes happen on the same day, the version stays the same date.

## Project Structure

- Pure vanilla JS app (no build tools, no framework)
- Single `index.html` with CSS in `css/app.css` and JS modules in `js/`
- All data stored in localStorage
- Mobile-first design, dark/light mode via `prefers-color-scheme`
- Dev server: `python3 server.py` on port 8080
