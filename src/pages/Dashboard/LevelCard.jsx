import { Trophy } from 'lucide-react';

const LEVELS = [
  { level: 1,  name: 'Starter',      min: 0,    next: 400,  color: '#94a3b8', bar: '#cbd5e1', emoji: '🌱' },
  { level: 2,  name: 'Explorer',     min: 400,  next: 500,  color: '#64748b', bar: '#94a3b8', emoji: '🔍' },
  { level: 3,  name: 'Learner',      min: 500,  next: 600,  color: '#6366f1', bar: '#818cf8', emoji: '📚' },
  { level: 4,  name: 'Practitioner', min: 600,  next: 700,  color: '#8b5cf6', bar: '#a78bfa', emoji: '✏️' },
  { level: 5,  name: 'Developing',   min: 700,  next: 800,  color: '#a855f7', bar: '#c084fc', emoji: '📈' },
  { level: 6,  name: 'Improving',    min: 800,  next: 900,  color: '#3b82f6', bar: '#60a5fa', emoji: '⚡' },
  { level: 7,  name: 'Advancing',    min: 900,  next: 1030, color: '#0ea5e9', bar: '#38bdf8', emoji: '🚀' },
  { level: 8,  name: 'Average',      min: 1030, next: 1100, color: '#f59e0b', bar: '#fbbf24', emoji: '⭐' },
  { level: 9,  name: 'Solid',        min: 1100, next: 1200, color: '#f97316', bar: '#fb923c', emoji: '💪' },
  { level: 10, name: 'Competitive',  min: 1200, next: 1300, color: '#ef4444', bar: '#f87171', emoji: '🎯' },
  { level: 11, name: 'Strong',       min: 1300, next: 1400, color: '#ec4899', bar: '#f472b6', emoji: '🦁' },
  { level: 12, name: 'SAT Warrior',  min: 1400, next: 1450, color: '#7c3aed', bar: '#a78bfa', emoji: '⚔️' },
  { level: 13, name: 'Outstanding',  min: 1450, next: 1500, color: '#059669', bar: '#34d399', emoji: '💎' },
  { level: 14, name: 'Legend',       min: 1500, next: 1601, color: '#d97706', bar: '#fbbf24', emoji: '👑' },
];

const BADGES = [
  { id: 'first_diag',  icon: '🔬', label: 'Diagnostician', desc: 'Completed a diagnostic',   check: ({ diag })     => diag >= 1 },
  { id: 'score_1030',  icon: '⭐', label: 'Average Band',   desc: 'Reached SAT 1030',         check: ({ score })    => score >= 1030 },
  { id: 'practice_5',  icon: '📝', label: 'Practice Pro',   desc: '5 practice tests done',    check: ({ practice }) => practice >= 5 },
  { id: 'streak_7',    icon: '🔥', label: 'On Fire',        desc: '7-day study streak',       check: ({ streak })   => streak >= 7 },
  { id: 'first_mock',  icon: '🎓', label: 'Mock Taker',     desc: 'Completed a mock test',    check: ({ mock })     => mock >= 1 },
  { id: 'score_1200',  icon: '🎯', label: 'Competitive',    desc: 'Reached SAT 1200',         check: ({ score })    => score >= 1200 },
  { id: 'score_1400',  icon: '🏆', label: 'Very Good',      desc: 'Reached SAT 1400',         check: ({ score })    => score >= 1400 },
  { id: 'score_1500',  icon: '💎', label: 'Outstanding',    desc: 'Reached SAT 1500',         check: ({ score })    => score >= 1500 },
];

function resolveLevel(score) {
  if (score === null || score === undefined) return LEVELS[0];
  return [...LEVELS].reverse().find(l => score >= l.min) || LEVELS[0];
}

export default function LevelCard({ score, testStats, streak }) {
  const safeScore   = score ?? 0;
  const lvl         = resolveLevel(score);
  const nextLvl     = LEVELS[lvl.level] || null; // LEVELS is 0-indexed, level numbers are 1-indexed
  const xpInLevel   = Math.max(0, safeScore - lvl.min);
  const xpRange     = (lvl.next - lvl.min) || 1;
  const xpPct       = Math.min(100, Math.round((xpInLevel / xpRange) * 100));
  const overallPct  = Math.min(100, Math.round((safeScore / 1600) * 100));

  const badgeCtx = {
    score:    safeScore,
    diag:     testStats?.diagnostic?.completed ?? 0,
    practice: testStats?.practice?.completed   ?? 0,
    mock:     testStats?.mock?.completed        ?? 0,
    streak:   streak?.current ?? 0,
  };

  const badges = BADGES.map(b => ({ ...b, earned: b.check(badgeCtx) }));
  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div className="rounded-[18px] overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)', boxShadow: '0 8px 32px rgba(15,23,42,0.3)' }}>
      <div className="p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={16} color="#fbbf24" />
            <span className="text-[12px] font-extrabold text-amber-300 uppercase tracking-widest">Level & Badges</span>
          </div>
          <span className="text-[11px] font-bold text-white/30">{earnedCount}/{badges.length} earned</span>
        </div>

        {/* Level display */}
        <div className="flex items-center gap-4 mb-4">
          <div className="shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center"
            style={{ background: `${lvl.color}22`, border: `2px solid ${lvl.color}55` }}>
            <span className="text-[22px] leading-none">{lvl.emoji}</span>
            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5" style={{ color: lvl.color }}>
              LVL {lvl.level}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[17px] font-black text-white">{lvl.name}</span>
              {nextLvl && (
                <span className="text-[10px] font-semibold text-white/30">
                  next: {nextLvl.name}
                </span>
              )}
            </div>

            {/* Within-level XP bar */}
            <div className="mb-1">
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${lvl.color}, ${lvl.bar})` }} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold" style={{ color: lvl.color }}>
                {xpInLevel} / {xpRange} XP
              </span>
              <span className="text-[10px] font-semibold text-white/30">
                {score !== null ? `Score: ${safeScore}` : 'No score yet'}
              </span>
            </div>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/30">Overall Progress</span>
            <span className="text-[10px] font-bold text-white/40">{safeScore} / 1600</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg, #6366f1, #a78bfa, #fbbf24)' }} />
          </div>
        </div>

        {/* Badges */}
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/30 mb-2">Badges</p>
          <div className="grid grid-cols-4 gap-2">
            {badges.map(b => (
              <div key={b.id} title={`${b.label}: ${b.desc}`}
                className="flex flex-col items-center gap-1 rounded-xl py-2 px-1 transition-all"
                style={{
                  background: b.earned ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                  border:     b.earned ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.05)',
                  opacity:    b.earned ? 1 : 0.4,
                }}>
                <span className="text-[20px] leading-none" style={{ filter: b.earned ? 'none' : 'grayscale(1)' }}>
                  {b.earned ? b.icon : '🔒'}
                </span>
                <span className="text-[8px] font-bold text-center leading-tight"
                  style={{ color: b.earned ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
