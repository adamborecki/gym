/**
 * Gym App — Constants & Configuration
 */

export const STORAGE_KEY = 'gymApp_v1_data';
export const SESSION_KEY = 'gymApp_v1_activeSession';
// Version: date-based (YYYY.MM.DD + build letter). Update on every code change.
// Same day: increment letter (a→b→c). New day: reset to 'a'.
export const APP_VERSION = 'v2026.03.07a';

export const REST_TARGETS = {
  compound:  { normal: 90, hurry: 60 }, // seconds
  isolation: { normal: 60, hurry: 45 },
};

// Legacy: kept for backward compat with old saved sessions that have string timeGoal
export const TIME_GOALS = {
  '30-45': { min: 30, max: 45 },
  '40-60': { min: 40, max: 60 },
  '60-90': { min: 60, max: 90 },
};

export const COUNTUP_SOFT_TARGET_MIN = 60;
export const DEFAULT_COUNTDOWN_MIN = 45;

// Starting weights seeded from user's Google Keep history (last logged weight per machine)
// Used as fallback when no previous session data exists for a machine
export const SEED_WEIGHTS = {
  chest_press:               40,   // 2/25: 40 ×3×10
  incline_press:             20,   // 2/19: 20 ×3×12
  shoulder_press:            30,   // 2/28: 30 ×3×9
  pec_fly:                   55,   // 2/25: 55 ×3×13
  rear_delt:                 45,   // 2/25: 45 ×3×12
  triceps_pushdown:          90,   // 2/25: 90 ×3×12
  triceps_extension_machine: 40,   // 2/14: 40 ×3×13
  lat_pulldown:              70,   // last logged 75 but note says drop to 70 for form
  seated_row:                75,   // 2/17: 75 ×3×10
  biceps_curl_machine:       25,   // 2/17: 25 ×3×12
  assisted_chin:             70,   // 2/17: 70 lb assist ×3×12 (higher = more assistance = easier)
  seated_leg_press:         180,   // 2/19: 180 ×3×13
  seated_leg_curl:           70,   // 2/19: 70 ×3×13
  leg_extension:             65,   // 2/23: 65 ×3×12
  hip_abduction:            110,   // 2/19: 110 ×3×20
  hip_adduction:            120,   // 2/23: 120 ×3×20
};
