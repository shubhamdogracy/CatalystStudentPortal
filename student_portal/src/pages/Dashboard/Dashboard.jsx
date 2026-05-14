import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Star, ChevronRight, TrendingUp } from 'lucide-react';
import { satService } from '../../services/api';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Circular progress ring ────────────────────────────────────────────────────
function RingProgress({ pct, size = 72, stroke = 7, color }) {
  const r     = (size - stroke) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  );
}

// ── Test Progress Card ────────────────────────────────────────────────────────
function TestCard({ emoji, title, total, completed, accentColor, bgGradient, ringColor, navPath }) {
  const navigate  = useNavigate();
  const pending   = Math.max(0, total - completed);
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className="relative rounded-[18px] p-5 flex flex-col gap-3 overflow-hidden cursor-pointer group"
      style={{ background: bgGradient, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
      onClick={() => navigate(navPath)}
    >
      {/* Decorative bubble */}
      <div className="pointer-events-none absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
        style={{ background: ringColor }} />
      <div className="pointer-events-none absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-15"
        style={{ background: ringColor }} />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{emoji}</span>
          <h3 className="text-[14px] font-extrabold text-slate-800">{title}</h3>
        </div>
        <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* Ring + stats */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="relative flex-shrink-0">
          <RingProgress pct={pct} size={72} stroke={7} color={ringColor} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-black" style={{ color: accentColor }}>{pct}%</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex justify-between text-[12px]">
            <span className="text-slate-500">Available</span>
            <span className="font-bold text-slate-800">{total}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-slate-500">Completed</span>
            <span className="font-bold" style={{ color: accentColor }}>{completed}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-slate-500">Pending</span>
            <span className="font-bold text-slate-600">{pending}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10">
        <div className="w-full h-2 rounded-full bg-white/50">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: ringColor }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Overall progress ring (larger) ───────────────────────────────────────────
function OverallRing({ pct }) {
  const size   = 100;
  const stroke = 9;
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const dash   = (pct / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="overallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#overallGrad)" strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-black text-indigo-600 leading-none">{pct}%</span>
        <span className="text-[9px] font-semibold text-slate-400 mt-0.5">Overall</span>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard({ student }) {
  const navigate = useNavigate();

  const firstName  = student?.name?.split(' ')[0] || 'there';
  const allMentors = student?.mentors || [];
  const enrollDate = student?.enrollmentDate
    ? new Date(student.enrollmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  // ── Test data ──────────────────────────────────────────────────────────────
  const [testStats, setTestStats] = useState({
    diagnostic: { total: 0, completed: 0 },
    practice:   { total: 0, completed: 0 },
    mock:       { total: 0, completed: 0 },
  });
  const [loadingTests, setLoadingTests] = useState(true);

  const loadTestStats = useCallback(async () => {
    try {
      const [examRes, histRes, practiceRes, practiceHistRes] = await Promise.all([
        satService.listExamConfigs().catch(() => ({ data: [] })),
        satService.getHistory().catch(() => ({ data: [] })),
        satService.listPractice().catch(() => ({ data: [] })),
        satService.getPracticeHistory().catch(() => ({ data: [] })),
      ]);

      const examConfigs  = examRes.data        || [];
      const history      = histRes.data        || [];
      const practiceConf = practiceRes.data    || [];
      const practiceHist = practiceHistRes.data || [];

      // A series test has two sibling configs named "X — Math" / "X — Reading & Writing".
      // They represent ONE test, so we group them and count the pair as a single entry.
      const SERIES_SUFFIX = / — (Math|Reading & Writing)$/;
      const getSeriesName = (name) => name.replace(SERIES_SUFFIX, '').trim();

      const seriesConfigs     = examConfigs.filter(c =>  SERIES_SUFFIX.test(c.name));
      const standaloneConfigs = examConfigs.filter(c => !SERIES_SUFFIX.test(c.name));

      // Group series configs by series name → each group is one test
      const seriesGroups = Object.values(
        seriesConfigs.reduce((acc, c) => {
          const key = getSeriesName(c.name);
          if (!acc[key]) acc[key] = { type: c.type || 'mock', math: null, rw: null };
          if (c.subject === 'math') acc[key].math = c;
          else acc[key].rw = c;
          return acc;
        }, {})
      );

      const diagGroups      = seriesGroups.filter(g => g.type === 'diagnostic');
      const mockGroups      = seriesGroups.filter(g => g.type !== 'diagnostic');
      const diagStandalones = standaloneConfigs.filter(c => c.type === 'diagnostic');
      const mockStandalones = standaloneConfigs.filter(c => c.type !== 'diagnostic');

      // Unique completed config IDs from history
      const completedExamIds = new Set(
        history
          .filter(s => s.status === 'complete' || s.status === 'completed')
          .map(s => s.exam_config_id?._id || s.exam_config_id)
          .filter(Boolean)
      );

      // A series is "completed" when BOTH its math and rw configs have been completed.
      // A standalone is completed when its own config ID is in the set.
      const countSeriesCompleted = (groups) =>
        groups.filter(g =>
          completedExamIds.has(g.math?._id) && completedExamIds.has(g.rw?._id)
        ).length;

      const diagTotal     = diagGroups.length + diagStandalones.length;
      const mockTotal     = mockGroups.length + mockStandalones.length;
      const diagCompleted = countSeriesCompleted(diagGroups) + diagStandalones.filter(c => completedExamIds.has(c._id)).length;
      const mockCompleted = countSeriesCompleted(mockGroups) + mockStandalones.filter(c => completedExamIds.has(c._id)).length;

      // Practice: unique completed config IDs
      const completedPracticeIds = new Set(
        practiceHist
          .filter(s => s.status === 'complete' || s.status === 'completed')
          .map(s => s.practice_config_id?._id || s.practice_config_id)
          .filter(Boolean)
      );
      const practiceCompleted = practiceConf.filter(c => completedPracticeIds.has(c._id)).length;

      setTestStats({
        diagnostic: { total: diagTotal,           completed: diagCompleted },
        practice:   { total: practiceConf.length, completed: practiceCompleted },
        mock:       { total: mockTotal,            completed: mockCompleted },
      });
    } catch (e) {
      console.error('Dashboard test stats error:', e);
    } finally {
      setLoadingTests(false);
    }
  }, []);

  useEffect(() => { loadTestStats(); }, [loadTestStats]);

  // Overall progress = average of the three test-type progresses
  const diagPct     = testStats.diagnostic.total > 0 ? Math.round((testStats.diagnostic.completed / testStats.diagnostic.total) * 100) : 0;
  const practicePct = testStats.practice.total   > 0 ? Math.round((testStats.practice.completed   / testStats.practice.total)   * 100) : 0;
  const mockPct     = testStats.mock.total        > 0 ? Math.round((testStats.mock.completed        / testStats.mock.total)        * 100) : 0;

  const activeTypes    = [diagPct, practicePct, mockPct].filter((_, i) => [testStats.diagnostic.total, testStats.practice.total, testStats.mock.total][i] > 0);
  const overallPct     = activeTypes.length > 0 ? Math.round(activeTypes.reduce((a, b) => a + b, 0) / activeTypes.length) : 0;

  const TEST_CARDS = [
    {
      key:       'diagnostic',
      emoji:     '🔬',
      title:     'Diagnostic Tests',
      bgGradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      accentColor: '#ea580c',
      ringColor:  '#f97316',
      navPath:   '/sat/diagnostic',
      stats:     testStats.diagnostic,
    },
    {
      key:       'practice',
      emoji:     '📝',
      title:     'Practice Tests',
      bgGradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      accentColor: '#16a34a',
      ringColor:  '#22c55e',
      navPath:   '/sat/practice',
      stats:     testStats.practice,
    },
    {
      key:       'mock',
      emoji:     '🏆',
      title:     'Mock Tests',
      bgGradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      accentColor: '#7c3aed',
      ringColor:  '#8b5cf6',
      navPath:   '/sat/mock',
      stats:     testStats.mock,
    },
  ];

  return (
    <div className="page-content">
      {/* ── Welcome banner ──────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-indigo-600 to-[#7c3aed] rounded-[14px] px-8 py-7 text-white mb-6 flex items-center justify-between overflow-hidden">
        <div className="pointer-events-none absolute -top-10 right-[120px] w-[200px] h-[200px] bg-white/5 rounded-full" />
        <div className="pointer-events-none absolute -bottom-[60px] right-[60px]  w-[160px] h-[160px] bg-white/5 rounded-full" />
        <div className="relative z-10">
          <h2 className="text-[22px] font-bold text-white mb-1.5">
            {greeting()}, {firstName}! 👋
          </h2>
          <p className="text-sm text-white/75">
            {overallPct > 0
              ? `You're ${overallPct}% through your tests. Keep it up!`
              : "Let's get started — your tests are waiting!"}
          </p>
        </div>
        <div className="text-[64px] leading-none relative z-10">🎓</div>
      </div>

      {/* ── Student Progress ────────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} color="#4f46e5" />
            <h2 className="text-[16px] font-extrabold text-slate-800">Student Progress</h2>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 px-3.5 py-1.5 rounded-full">
            <span className="text-[12px] font-semibold text-slate-500">Overall</span>
            <span className="text-[13px] font-black text-indigo-600">{overallPct}%</span>
          </div>
        </div>

        {loadingTests ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-[18px] h-36 md:h-44 bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {TEST_CARDS.map(card => (
              <TestCard
                key={card.key}
                emoji={card.emoji}
                title={card.title}
                total={card.stats.total}
                completed={card.stats.completed}
                accentColor={card.accentColor}
                bgGradient={card.bgGradient}
                ringColor={card.ringColor}
                navPath={card.navPath}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Course Details + My Mentor: stacked on mobile, 2-col on desktop ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

      {/* Course Details — appears first on mobile, right column on desktop */}
      <div className="card md:order-2">
        <div className="card-header">
          <span className="card-title"><BookOpen size={18} color="#4f46e5" /> Course Details</span>
        </div>
        <div className="flex flex-col">
          {allMentors.length > 0 ? (
            allMentors.map(({ batch }, idx) => batch && (
              <div key={batch._id || idx} className={idx > 0 ? 'mt-3 pt-3 border-t border-slate-100' : ''}>
                {allMentors.length > 1 && (
                  <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.5px] mb-1.5 capitalize">
                    {batch.subject} · {batch.name}
                  </div>
                )}
                {[
                  { label: 'Course',   value: 'SAT' },
                  { label: 'Batch',    value: batch.name || '—' },
                  { label: 'Enrolled', value: enrollDate },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-slate-100 last:border-b-0 text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            ))
          ) : (
            [{ label: 'Enrolled', value: enrollDate }].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-slate-100 last:border-b-0 text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-900">{value}</span>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          <OverallRing pct={overallPct} />
          <div className="flex flex-col gap-2 flex-1">
            {[
              { label: 'Diagnostic', pct: diagPct,     color: '#f97316' },
              { label: 'Practice',   pct: practicePct, color: '#22c55e' },
              { label: 'Mock',       pct: mockPct,     color: '#8b5cf6' },
            ].map(({ label, pct: p, color }) => (
              <div key={label}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-bold" style={{ color }}>{p}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Mentor — appears second on mobile, left column on desktop */}
      <div className="card md:order-1">
        <div className="card-header">
          <span className="card-title"><Star size={18} color="#4f46e5" /> My Mentor{allMentors.length > 1 ? 's' : ''}</span>
        </div>
        {allMentors.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No mentor assigned yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {allMentors.map(({ mentor, batch }, idx) => (
              <div key={mentor?._id || idx}>
                {allMentors.length > 1 && (
                  <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-[0.5px] mb-2 capitalize">
                    {batch?.subject} · {batch?.name || '—'}
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-500 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                    {mentor?.name?.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-base text-slate-900 mb-0.5">{mentor?.name}</div>
                    <div className="text-[13px] text-slate-500 mb-1.5">
                      {mentor?.specialization || mentor?.specialisation || '—'}
                      {mentor?.experience ? ` · ${mentor.experience} yrs exp` : ''}
                    </div>
                    <span className="inline-flex items-center gap-1.5 bg-indigo-600/[0.08] text-indigo-600 px-2.5 py-1 rounded-full text-xs font-semibold">
                      <Star size={11} /> Your Mentor
                    </span>
                  </div>
                </div>
                {idx < allMentors.length - 1 && <div className="border-t border-slate-100 mt-1" />}
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/communication')}>Message</button>
            </div>
          </div>
        )}
      </div>

      </div>{/* end 2-col grid */}
    </div>
  );
}
