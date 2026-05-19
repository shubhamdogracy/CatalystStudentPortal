import { useNavigate } from 'react-router-dom';
import { Target, ArrowRight } from 'lucide-react';

// 2026 SAT score band guidelines
const BANDS = [
  { min: 1500, label: 'Outstanding / Elite', color: '#059669', desc: 'Ivy League, Stanford, MIT, top-tier schools' },
  { min: 1400, label: 'Very Good',           color: '#2563eb', desc: 'Top 50 universities & competitive honors programs' },
  { min: 1200, label: 'Good / Competitive',  color: '#7c3aed', desc: 'Competitive state & mid-tier private schools' },
  { min: 1030, label: 'Average',             color: '#d97706', desc: 'Local public universities' },
  { min: 0,    label: 'Below Average',       color: '#ef4444', desc: 'Needs significant improvement' },
];

// The score thresholds a student should aim to cross next
const MILESTONES = [
  { score: 1030, band: 'Average',           colleges: 'Local public universities',                          color: '#d97706' },
  { score: 1200, band: 'Good / Competitive', colleges: 'Competitive state & mid-tier private schools',      color: '#7c3aed' },
  { score: 1400, band: 'Very Good',          colleges: 'Top 50 universities & competitive honors programs', color: '#2563eb' },
  { score: 1500, band: 'Outstanding',        colleges: 'Ivy League, Stanford, MIT',                        color: '#059669' },
  { score: 1600, band: 'Elite / Perfect',    colleges: 'Elite scholarships & perfect score recognition',   color: '#f59e0b' },
];

// Tick positions on the progress bar (400–1600 scale)
const TICKS    = [400, 1030, 1200, 1400, 1500, 1600];
const SCALE    = 1200; // 1600 - 400

function pct(score) { return Math.min(100, Math.max(0, ((score - 400) / SCALE) * 100)); }
function currentBand(score) { return BANDS.find(b => score >= b.min) || BANDS[BANDS.length - 1]; }
function nextMilestone(score) { return MILESTONES.find(m => m.score > score) || MILESTONES[MILESTONES.length - 1]; }

function buildRecs(latest, weakAreas, testStats) {
  const recs = [];

  // 1. Weaker section
  if (latest?.isPair && latest.math != null && latest.rw != null) {
    const gap    = Math.abs(latest.math - latest.rw);
    const weaker = latest.math < latest.rw ? 'Math' : 'Reading & Writing';
    const icon   = latest.math < latest.rw ? '📐' : '📖';
    const weakS  = latest.math < latest.rw ? latest.math   : latest.rw;
    const strongS = latest.math < latest.rw ? latest.rw    : latest.math;
    const strongLabel = latest.math < latest.rw ? 'R&W' : 'Math';
    if (gap >= 30) {
      recs.push({
        icon, nav: '/sat/practice',
        title: `${weaker} is holding your score back`,
        detail: `${weaker} ${weakS} vs ${strongLabel} ${strongS} — a ${gap}-pt gap. Closing it gives the fastest overall score boost.`,
      });
    }
  }

  // 2. Weakest practice topic
  if (weakAreas.length > 0) {
    const top = weakAreas[0];
    recs.push({
      icon: top.subject === 'math' ? '📐' : '📖', nav: '/sat/practice',
      title: `Drill "${top.name}" — your weakest topic`,
      detail: `${top.accuracy}% accuracy. Targeted practice on your lowest topic compounds quickly into real score points.`,
    });
  }

  // 3. Test activity nudge
  if (testStats.diagnostic.completed < 2) {
    recs.push({
      icon: '🔬', nav: '/sat/diagnostic',
      title: 'Complete more diagnostic tests',
      detail: `${testStats.diagnostic.completed}/${testStats.diagnostic.total} done. More data makes your predicted score and band placement more accurate.`,
    });
  } else if (testStats.mock.completed === 0 && testStats.mock.total > 0) {
    recs.push({
      icon: '🏆', nav: '/sat/mock',
      title: 'Take a full mock test',
      detail: 'Timed, full-length conditions reveal gaps that shorter practice tests miss — and build real exam stamina.',
    });
  } else {
    recs.push({
      icon: '📝', nav: '/sat/practice',
      title: 'Maintain your practice habit',
      detail: `${testStats.practice.completed} practice tests done. Consistent daily practice — even 20 minutes — is the most reliable path to the next score band.`,
    });
  }

  return recs.slice(0, 3);
}

export default function RecommendationCard({ scoreProgression, weakAreas, testStats }) {
  const navigate = useNavigate();

  const latest    = scoreProgression?.length > 0 ? scoreProgression[scoreProgression.length - 1] : null;
  const score     = latest?.total ?? null;

  if (score === null) return null;

  const band      = currentBand(score);
  const milestone = nextMilestone(score);
  const gap       = milestone.score - score;
  const recs      = buildRecs(latest, weakAreas || [], testStats || {});

  return (
    <div className="rounded-[18px] overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f4c75 100%)', boxShadow: '0 8px 32px rgba(15,23,42,0.35)' }}>
      <div className="p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Target size={18} color="#38bdf8" />
            <span className="text-[13px] font-extrabold text-sky-300 uppercase tracking-widest">Score Roadmap</span>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold"
            style={{ background: `${band.color}22`, color: band.color, border: `1px solid ${band.color}44` }}>
            {band.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="relative h-3 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct(score)}%`, background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)' }} />
            {MILESTONES.map(m => (
              <div key={m.score} className="absolute top-0 h-full w-px"
                style={{ left: `${pct(m.score)}%`, background: 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
          <div className="relative" style={{ height: 14 }}>
            {TICKS.map(v => (
              <span key={v} className="absolute text-[9px] font-semibold -translate-x-1/2"
                style={{ left: `${pct(v)}%`, color: 'rgba(255,255,255,0.3)' }}>{v}</span>
            ))}
          </div>
        </div>

        {/* Current band + next milestone */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-[12px] px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${band.color}33` }}>
            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: band.color }}>Your current band</p>
            <p className="text-white font-bold text-[13px] leading-snug">{band.label}</p>
            <p className="text-[10px] mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{band.desc}</p>
          </div>
          <div className="rounded-[12px] px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
            <p className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest mb-1">Next milestone</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-[22px] font-black leading-none" style={{ color: '#38bdf8' }}>+{gap}</p>
              <p className="text-[11px] font-semibold text-white/40">pts</p>
            </div>
            <p className="text-white font-semibold text-[12px] mt-0.5">{milestone.score} — {milestone.band}</p>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{milestone.colleges}</p>
          </div>
        </div>

        {/* Recommendations */}
        <p className="text-[11px] font-extrabold text-white/40 uppercase tracking-widest mb-3">How to get there</p>
        <div className="flex flex-col gap-2.5">
          {recs.map((r, i) => (
            <div key={i}
              className="flex items-start gap-3 rounded-[12px] px-4 py-3 cursor-pointer group transition-all duration-150 hover:scale-[1.01]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={() => navigate(r.nav)}>
              <span className="text-[20px] shrink-0 mt-0.5">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-white leading-snug">{r.title}</p>
                <p className="text-[11px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{r.detail}</p>
              </div>
              <ArrowRight size={14} className="text-white/20 shrink-0 mt-1 group-hover:text-white/50 transition-colors" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
