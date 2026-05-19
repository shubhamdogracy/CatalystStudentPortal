import { computeSummary } from './insightsUtils';

const SUBJ_LABEL = { math: 'Math', reading_writing: 'Reading & Writing' };
const TREND_ICON  = { improving: '↗', declining: '↘', stable: '→' };
const TREND_CLS   = {
  improving: 'text-green-600 bg-green-50 border-green-200',
  declining: 'text-red-600 bg-red-50 border-red-200',
  stable:    'text-amber-600 bg-amber-50 border-amber-200',
};

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-0.5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function InsightsSummary({ enriched }) {
  const summary = computeSummary(enriched);

  if (summary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-4xl mb-3">🎯</p>
        <p className="text-sm font-semibold text-slate-600">No completed practices yet.</p>
        <p className="text-xs text-slate-400 mt-1">Start practising to see your insights!</p>
      </div>
    );
  }

  const totalAttempts = summary.reduce((a, s) => a + s.attempts, 0);
  const overallAvg    = Math.round(summary.reduce((a, s) => a + s.avg * s.attempts, 0) / totalAttempts);
  const improving     = summary.filter(s => s.trend === 'improving');
  const needsWork     = summary.filter(s => s.avg < 60 && s.attempts >= 2);
  const strengths     = summary.filter(s => s.avg >= 75);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Attempts"    value={totalAttempts} />
        <StatCard label="Overall Average"   value={`${overallAvg}%`} />
        <StatCard label="Topics Practised"  value={summary.length} />
        <StatCard label="Improving Topics"  value={improving.length} sub="upward trend" />
      </div>

      {strengths.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <p className="text-sm font-bold text-green-800 mb-3">Strengths (avg ≥ 75%)</p>
          <div className="flex flex-col gap-3">
            {strengths.map(s => (
              <div key={`${s.topic}::${s.subtopic}`} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-900">{s.subtopic}</p>
                  <p className="text-xs text-green-600">{SUBJ_LABEL[s.subject] || s.subject} · {s.topic}</p>
                </div>
                <span className="text-sm font-black text-green-700">{s.avg}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {needsWork.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-sm font-bold text-red-800 mb-3">Areas to Improve (avg &lt; 60% after 2+ attempts)</p>
          <div className="flex flex-col gap-3">
            {needsWork.map(s => (
              <div key={`${s.topic}::${s.subtopic}`} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-900">{s.subtopic}</p>
                  <p className="text-xs text-red-400">{SUBJ_LABEL[s.subject] || s.subject} · {s.topic} · {s.attempts} attempts</p>
                </div>
                <span className="text-sm font-black text-red-600">{s.avg}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-sm font-bold text-slate-700 mb-4">All Sub-topics</p>
        <div className="flex flex-col gap-4">
          {summary.map(s => (
            <div key={`${s.topic}::${s.subtopic}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="min-w-0 mr-2">
                  <p className="text-xs font-semibold text-slate-700 truncate">{s.subtopic}</p>
                  <p className="text-[10px] text-slate-400">{SUBJ_LABEL[s.subject] || s.subject} · {s.topic}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${TREND_CLS[s.trend]}`}>
                    {TREND_ICON[s.trend]} {s.trend}
                  </span>
                  <span className="text-xs font-black text-slate-900 w-9 text-right">{s.avg}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${s.avg}%`,
                  backgroundColor: s.avg >= 75 ? '#10b981' : s.avg >= 60 ? '#f59e0b' : '#ef4444',
                }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.attempts} attempt{s.attempts !== 1 ? 's' : ''} · Best: {s.bestScore}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
