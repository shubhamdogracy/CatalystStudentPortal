/**
 * ProjectedSATScore.jsx
 * Calculates and renders the projected SAT score (out of 1600)
 * based on diagnostic test results using difficulty-weighted scoring.
 */

import { useMemo } from 'react';
import { computeProjectedSATScore } from './satScoreUtils';

// ── UI helpers ───────────────────────────────────────────────────────────────────
const barColor = pct => pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444';

function scoreGrade(total) {
  if (total >= 1400) return { label: 'Exceptional', color: '#059669' };
  if (total >= 1200) return { label: 'Strong',      color: '#2563eb' };
  if (total >= 1000) return { label: 'Competitive', color: '#7c3aed' };
  if (total >= 800)  return { label: 'Developing',  color: '#d97706' };
  return                   { label: 'Foundational', color: '#ef4444' };
}

function InfoChip({ icon, label, value, bg, labelColor, valueColor }) {
  return (
    <div className="rounded-2xl p-4 shadow-sm border border-white/40" style={{ background: bg }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{icon}</span>
        <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: labelColor }}>{label}</p>
      </div>
      <p className="text-[13px] font-extrabold truncate leading-tight" style={{ color: valueColor }}>{value}</p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────────
export default function ProjectedSATScore({ rwM1, rwM2, mathM1, mathM2 }) {
  const d     = useMemo(() => computeProjectedSATScore(rwM1, rwM2, mathM1, mathM2), [rwM1, rwM2, mathM1, mathM2]);
  const grade = scoreGrade(d.total);

  const totalBarPct = ((d.total        - 400) / 1200) * 100;
  const rwBarPct    = ((d.rw.score     - 200) / 600)  * 100;
  const mathBarPct  = ((d.math.score   - 200) / 600)  * 100;
  const rangeLPct   = ((d.totalRange[0] - 400) / 1200) * 100;
  const rangeWPct   = ((d.totalRange[1] - d.totalRange[0]) / 1200) * 100;

  return (
    <div className="p-5 pb-8 space-y-5 max-w-2xl mx-auto w-full">

      {/* ── Hero Score Card ──────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden select-none"
           style={{ background: 'linear-gradient(135deg, #3730a3 0%, #6d28d9 55%, #a21caf 100%)' }}>
        {/* decorative blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20 pointer-events-none"
             style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full opacity-15 pointer-events-none"
             style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />

        <div className="relative z-10 px-8 pt-7 pb-6 text-center">
          <p className="text-[10px] font-extrabold text-purple-200 uppercase tracking-[0.2em] mb-2">
            Projected SAT Score
          </p>

          <p className="font-black text-white leading-none mb-1" style={{ fontSize: '5rem' }}>
            {d.total}
          </p>

          <span className="inline-block px-4 py-1 rounded-full text-xs font-extrabold mb-3"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
            {grade.label}
          </span>

          <p className="text-sm text-purple-200">
            Likely range &nbsp;
            <strong className="text-white font-extrabold">
              {d.totalRange[0]} – {d.totalRange[1]}
            </strong>
          </p>

          {/* Score bar */}
          <div className="mt-5 px-2">
            <div className="relative h-4 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
              {/* Range highlight */}
              <div className="absolute top-0 h-full rounded-full pointer-events-none"
                   style={{
                     left:    `${rangeLPct}%`,
                     width:   `${rangeWPct}%`,
                     background: 'rgba(255,255,255,0.25)',
                   }} />
              {/* Score fill */}
              <div className="h-full rounded-full transition-all duration-700"
                   style={{
                     width:      `${totalBarPct}%`,
                     background: 'linear-gradient(90deg, rgba(255,255,255,0.85), rgba(255,255,255,0.95))',
                   }} />
            </div>
            <div className="flex justify-between text-[10px] text-purple-300 mt-1.5 font-semibold">
              <span>400</span><span>700</span><span>1000</span><span>1300</span><span>1600</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section Score Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">

        {/* R&W */}
        <div className="rounded-2xl p-5 shadow-sm border border-blue-100"
             style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
              R
            </div>
            <p className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wide leading-tight">
              Reading &amp;<br />Writing
            </p>
          </div>
          <p className="text-5xl font-black text-blue-900 mb-0.5">{d.rw.score}</p>
          <p className="text-[11px] text-blue-500 mb-3">Range {d.rw.range[0]} – {d.rw.range[1]}</p>
          <div className="h-2.5 rounded-full overflow-hidden bg-blue-200">
            <div className="h-full rounded-full transition-all duration-700"
                 style={{ width: `${rwBarPct}%`, background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }} />
          </div>
        </div>

        {/* Math */}
        <div className="rounded-2xl p-5 shadow-sm border border-purple-100"
             style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white text-xs font-extrabold shadow-sm">
              √x
            </div>
            <p className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wide leading-tight">
              Math
            </p>
          </div>
          <p className="text-5xl font-black text-purple-900 mb-0.5">{d.math.score}</p>
          <p className="text-[11px] text-purple-500 mb-3">Range {d.math.range[0]} – {d.math.range[1]}</p>
          <div className="h-2.5 rounded-full overflow-hidden bg-purple-200">
            <div className="h-full rounded-full transition-all duration-700"
                 style={{ width: `${mathBarPct}%`, background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)' }} />
          </div>
        </div>
      </div>

      {/* ── Performance Breakdown ────────────────────────────────────────── */}
      {d.topicList.length > 0 && (
        <div className="rounded-2xl p-5 bg-white border border-gray-100 shadow-sm">
          <p className="text-sm font-extrabold text-gray-800 mb-4">Performance Breakdown</p>
          <div className="space-y-3">
            {d.topicList.slice(0, 8).map(t => (
              <div key={t.name} className="flex items-center gap-3">
                <span className="text-[12px] text-gray-600 w-40 shrink-0 truncate" title={t.name}>
                  {t.name}
                </span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                       style={{ width: `${t.pct}%`, background: barColor(t.pct) }} />
                </div>
                <span className="text-[11px] font-extrabold shrink-0 w-9 text-right tabular-nums"
                      style={{ color: barColor(t.pct) }}>
                  {t.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Info Chips ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <InfoChip
          icon="📘" label="R&W Module 2"
          value={d.rw.tier === 'hard' ? 'Hard route taken' : 'Standard route'}
          bg="linear-gradient(135deg, #eef2ff, #e0e7ff)"
          labelColor="#6366f1" valueColor="#3730a3"
        />
        <InfoChip
          icon="📐" label="Math Module 2"
          value={d.math.tier === 'hard' ? 'Hard route taken' : 'Standard route'}
          bg="linear-gradient(135deg, #faf5ff, #ede9fe)"
          labelColor="#8b5cf6" valueColor="#5b21b6"
        />
        <InfoChip
          icon="🏆" label="Strongest Area"
          value={d.strongest}
          bg="linear-gradient(135deg, #f0fdf4, #dcfce7)"
          labelColor="#16a34a" valueColor="#14532d"
        />
        <InfoChip
          icon="🎯" label="Focus Area"
          value={d.focusArea}
          bg="linear-gradient(135deg, #fff7ed, #ffedd5)"
          labelColor="#ea580c" valueColor="#7c2d12"
        />
      </div>

      {/* ── Nudge to explore tabs ──────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-1.5 py-2 text-gray-400">
        <p className="text-[11px] font-medium">Explore Topic Mastery, Charts &amp; AI Summary using the tabs above</p>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 3v12M9 15l-3.5-3.5M9 15l3.5-3.5"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

    </div>
  );
}
