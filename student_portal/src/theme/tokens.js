// ─── Brand ────────────────────────────────────────────────────────────────────
export const brand = {
  primary:   '#4f46e5',  // indigo-600
  secondary: '#7c3aed',  // violet-600
  accent:    '#80AF81',  // SAT green
};

// ─── Status ───────────────────────────────────────────────────────────────────
export const status = {
  success: { DEFAULT: '#10b981', bg: '#f0fdf4', border: '#6ee7b7', dark: '#065f46' },
  warning: { DEFAULT: '#f59e0b', bg: '#fef3c7', border: '#fde68a', dark: '#92400e' },
  error:   { DEFAULT: '#ef4444', bg: '#fee2e2', border: '#fca5a5', dark: '#991b1b' },
  info:    { DEFAULT: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
};

// ─── Surface (SAT test UI) ────────────────────────────────────────────────────
export const surface = {
  accentLight:  '#80AF8115',
  accentBorder: '#80AF8140',
  text:         '#2A2A2A',
  textMuted:    '#2A2A2A99',
  bg:           '#F2F2F2',
  bgWhite:      '#FFFFFF',
  border:       '#e5e7eb',
};

// ─── Neutral palette ──────────────────────────────────────────────────────────
export const neutral = {
  900: '#0f172a',
  800: '#1e293b',
  700: '#334155',
  600: '#475569',
  500: '#64748b',
  400: '#94a3b8',
  300: '#cbd5e1',
  200: '#e2e8f0',
  100: '#f1f5f9',
  50:  '#f8fafc',
};

// ─── Gradients ────────────────────────────────────────────────────────────────
export const gradients = {
  // Primary brand
  primary:    'linear-gradient(135deg, #4f46e5, #7c3aed)',
  primaryBtn: 'linear-gradient(to bottom right, #4f46e5, #a855f7)',

  // Dark headers (reports, modals)
  darkHeader: 'linear-gradient(90deg, #1e293b, #334155)',
  deepDark:   'linear-gradient(135deg, #1e1b4b, #312e81)',

  // Score range indicators
  hot:         'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)',
  successGrad: 'linear-gradient(135deg, #059669, #10b981)',

  // Dashboard test cards
  diagnostic: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
  practice:   'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
  mock:       'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
};

// ─── Mastery levels ───────────────────────────────────────────────────────────
// Each level: min score %, display label, text color, background, progress bar color
export const masteryLevels = [
  { min: 85, label: 'MASTER',       color: '#2563eb', bg: '#dbeafe', bar: '#10b981' },
  { min: 70, label: 'ELITE',        color: '#0891b2', bg: '#cffafe', bar: '#06b6d4' },
  { min: 55, label: 'EXPERT',       color: '#7c3aed', bg: '#ede9fe', bar: '#8b5cf6' },
  { min: 40, label: 'ADVANCED',     color: '#d97706', bg: '#fef3c7', bar: '#f59e0b' },
  { min: 25, label: 'INTERMEDIATE', color: '#ea580c', bg: '#ffedd5', bar: '#f97316' },
  { min: 0,  label: 'NOVICE',       color: '#ef4444', bg: '#fee2e2', bar: '#ef4444' },
];

export function getMasteryLevel(pct) {
  return masteryLevels.find(l => pct >= l.min);
}

// ─── Chart colors ─────────────────────────────────────────────────────────────
export const chartPalette = ['#4472C4', '#70AD47', '#ED7D31', '#FF69B4', '#FFC000', '#00B0F0'];

export const masteryChartColors = {
  MASTER:       '#4472C4',
  ELITE:        '#70AD47',
  EXPERT:       '#ED7D31',
  ADVANCED:     '#FFC000',
  INTERMEDIATE: '#FF69B4',
  NOVICE:       '#A5A5A5',
};

// ─── Subject config ───────────────────────────────────────────────────────────
export const subjects = {
  rw:   { id: 'rw',   label: 'Reading and Writing', icon: '📖', accent: '#4f46e5', bg: '#eef2ff' },
  math: { id: 'math', label: 'Math',                icon: '📐', accent: '#7c3aed', bg: '#f5f3ff' },
};

// ─── Dashboard test card config ───────────────────────────────────────────────
export const dashboardCards = {
  diagnostic: { bgGradient: gradients.diagnostic, accentColor: '#ea580c', ringColor: '#f97316' },
  practice:   { bgGradient: gradients.practice,   accentColor: '#16a34a', ringColor: '#22c55e' },
  mock:       { bgGradient: gradients.mock,        accentColor: '#7c3aed', ringColor: '#8b5cf6' },
};
