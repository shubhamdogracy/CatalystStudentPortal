/**
 * testConstants.js
 *
 * Design tokens and utility helpers shared across test-taking components.
 * Kept in a separate (non-component) file to satisfy react-refresh/only-export-components.
 */

// ─── Design tokens (Image #2) ──────────────────────────────────────────────────
export const C = {
  accent:       '#80AF81',
  accentLight:  '#80AF8115',
  accentBorder: '#80AF8140',
  text:         '#2A2A2A',
  textMuted:    '#2A2A2A99',
  bg1:          '#F2F2F2',
  bg2:          '#FFFFFF',
  border:       '#e5e7eb',
  red:          '#ef4444',
};

// ─── Timer formatter ───────────────────────────────────────────────────────────
export function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
