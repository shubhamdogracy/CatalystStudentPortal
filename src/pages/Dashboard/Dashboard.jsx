import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { BookOpen, Star } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from './useDashboardData';
import TestCard             from './TestCard';
import OverallRing          from './OverallRing';
import ScoreProgressionCard  from './ScoreProgressionCard';
import ExamCountdownCard    from './ExamCountdownCard';
import StreakCard           from './StreakCard';
import WeakAreasCard        from './WeakAreasCard';
import ContinueLearningCard from './ContinueLearningCard';
import TopicMasteryHeatmap  from './TopicMasteryHeatmap';
import ActivityHeatmap      from './ActivityHeatmap';
import RecommendationCard   from './RecommendationCard';
import LevelCard            from './LevelCard';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const TEST_CARDS_CONFIG = [
  { key: 'diagnostic', emoji: '🔬', title: 'Diagnostic Tests', typeLabel: 'Diagnostic', navPath: '/sat/diagnostic' },
  { key: 'practice',   emoji: '📝', title: 'Practice Tests',   typeLabel: 'Practice',   navPath: '/sat/practice'   },
  { key: 'mock',       emoji: '🏆', title: 'Mock Tests',        typeLabel: 'Mock',       navPath: '/sat/mock'        },
];

const CARD_STYLE = {
  diagnostic: { bgGradient: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', accentColor: '#ea580c', ringColor: '#f97316' },
  practice:   { bgGradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', accentColor: '#16a34a', ringColor: '#22c55e' },
  mock:       { bgGradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', accentColor: '#7c3aed', ringColor: '#8b5cf6' },
};

export default function Dashboard({ student }) {
  const navigate    = useNavigate();
  const { refreshUser } = useAuth();
  useEffect(() => { refreshUser(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const firstName   = student?.name?.split(' ')[0] || 'there';
  const allMentors  = student?.mentors || [];
  const enrollDate  = student?.enrollmentDate
    ? new Date(student.enrollmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const {
    testStats, inProgress, loadingTests,
    diagPct, practicePct, mockPct, overallPct,
    practiceAvgScore, lastPracticeAttempt,
    weakAreas, topicMastery, continueLearning,
    loadingScore, scoreProgression, activityDates,
  } = useDashboardData();

  return (
    <div className="page-content">

      {/* ── Greeting ─────────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-indigo-600 to-[#7c3aed] rounded-[14px] px-8 py-6 text-white mb-5 flex items-center justify-between overflow-hidden">
        <div className="pointer-events-none absolute -top-10 right-[120px] w-[200px] h-[200px] bg-white/5 rounded-full" />
        <div className="pointer-events-none absolute -bottom-[60px] right-[60px] w-[160px] h-[160px] bg-white/5 rounded-full" />
        <div className="relative z-10">
          <h2 className="text-[22px] font-bold text-white mb-1">{greeting()}, {firstName}! 👋</h2>
          <p className="text-sm text-white/75">Let&apos;s continue your SAT preparation journey.</p>
        </div>
        <div className="text-[56px] leading-none relative z-10">🎓</div>
      </div>

      {/* ── Row 1: Predicted Score + Countdown + Streak ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5 items-stretch">
        <div className="lg:col-span-2 flex flex-col">
          <ScoreProgressionCard data={scoreProgression} loading={loadingScore} className="flex-1 h-full" />
        </div>
        <div className="flex flex-col gap-4">
          <ExamCountdownCard satExamDate={student?.satExamDate} />
          <StreakCard streak={student?.streak} />
          <LevelCard
            score={scoreProgression.length > 0 ? scoreProgression[scoreProgression.length - 1]?.total : null}
            testStats={testStats}
            streak={student?.streak}
          />
        </div>
      </div>

      {/* ── Row 2: Test cards ─────────────────────────────────────────────────── */}
      {loadingTests ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {[0, 1, 2].map(i => <div key={i} className="rounded-[18px] h-44 bg-slate-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {TEST_CARDS_CONFIG.map(card => (
            <TestCard
              key={card.key}
              emoji={card.emoji}
              title={card.title}
              typeLabel={card.typeLabel}
              navPath={card.navPath}
              total={testStats[card.key].total}
              completed={testStats[card.key].completed}
              inProgress={inProgress[card.key]}
              avgScore={card.key === 'practice' ? practiceAvgScore : null}
              lastAttempt={card.key === 'practice' ? lastPracticeAttempt : null}
              {...CARD_STYLE[card.key]}
            />
          ))}
        </div>
      )}

      {/* ── Row 3: Recommendations ───────────────────────────────────────────── */}
      <div className="mb-5">
        <RecommendationCard scoreProgression={scoreProgression} weakAreas={weakAreas} testStats={testStats} />
      </div>

      {/* ── Row 4: Weak Areas + Continue Learning ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <WeakAreasCard areas={weakAreas} />
        <ContinueLearningCard continueLearning={continueLearning} />
      </div>

      {/* ── Row 4: Activity Heatmap ───────────────────────────────────────────── */}
      <div className="mb-5">
        <ActivityHeatmap activityDates={activityDates} />
      </div>

      {/* ── Row 5: Topic Mastery Heatmap ─────────────────────────────────────── */}
      <div className="mb-5">
        <TopicMasteryHeatmap topics={topicMastery} />
      </div>

      {/* ── Row 5: Course Details + Mentor ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <Card className="md:order-2">
          <CardHeader>
            <CardTitle><BookOpen size={18} color="#4f46e5" /> Course Details</CardTitle>
          </CardHeader>
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
              <div className="flex justify-between py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500">Enrolled</span>
                <span className="font-semibold text-slate-900">{enrollDate}</span>
              </div>
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
        </Card>

        <Card className="md:order-1">
          <CardHeader>
            <CardTitle><Star size={18} color="#4f46e5" /> My Mentor{allMentors.length > 1 ? 's' : ''}</CardTitle>
          </CardHeader>
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
                      {mentor?.name?.split(' ').map(n => n[0]).join('')}
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
                <Button variant="primary" size="sm" onClick={() => navigate('/communication')}>Message</Button>
              </div>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
