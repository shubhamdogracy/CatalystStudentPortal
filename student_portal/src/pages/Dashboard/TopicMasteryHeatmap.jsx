import { useNavigate } from 'react-router-dom';
import { LayoutGrid, ArrowRight } from 'lucide-react';

const CELL_SIZE = 22;

function cellBg(accuracy) {
  if (accuracy === null) return '#e2e8f0';   // gray — not started
  if (accuracy >= 70)    return '#22c55e';   // green — strong
  if (accuracy >= 50)    return '#f59e0b';   // orange — average
  return                        '#ef4444';   // red — weak
}

function cellOpacity(accuracy) {
  if (accuracy === null) return 0.5;
  return 0.75 + (accuracy / 100) * 0.25;    // more accurate = more opaque
}

function Cell({ name, accuracy }) {
  const label = accuracy !== null ? `${name}: ${accuracy}%` : `${name}: Not started`;
  return (
    <div
      title={label}
      style={{
        width: CELL_SIZE, height: CELL_SIZE,
        borderRadius: 4,
        background: cellBg(accuracy),
        opacity: cellOpacity(accuracy),
        flexShrink: 0,
        cursor: 'default',
        transition: 'transform 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.25)'; e.currentTarget.style.zIndex = 10; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.zIndex = '';  }}
    />
  );
}

const SUBJECT_LABELS = {
  math:            '📐 Math',
  reading_writing: '📖 Reading & Writing',
  reading:         '📖 Reading',
  english:         '📖 English',
};

const LEGEND = [
  { label: 'Strong',      color: '#22c55e' },
  { label: 'Average',     color: '#f59e0b' },
  { label: 'Weak',        color: '#ef4444' },
  { label: 'Not started', color: '#e2e8f0', opacity: 0.5 },
];

export default function TopicMasteryHeatmap({ topics }) {
  const navigate = useNavigate();

  // Group by subject
  const bySubject = topics.reduce((acc, t) => {
    const key = t.subject || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const hasData = topics.length > 0;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title"><LayoutGrid size={16} color="#4f46e5" /> Topic Mastery</span>
        <button
          onClick={() => navigate('/sat/practice')}
          className="flex items-center gap-1 text-[12px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Practice More <ArrowRight size={13} />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-5 pb-4 border-b border-slate-100">
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div style={{ width: 14, height: 14, borderRadius: 3, background: l.color, opacity: l.opacity ?? 1 }} />
            <span className="text-[11px] text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
          <span className="text-3xl">🗺️</span>
          <p className="text-[13px] font-semibold text-slate-600">No topic data yet</p>
          <p className="text-[12px] text-slate-400">Complete practice tests to build your mastery map</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {Object.entries(bySubject).map(([subj, items]) => {
            const attempted = items.filter(t => t.accuracy !== null);
            const subjectAvg = attempted.length > 0
              ? Math.round(attempted.reduce((s, t) => s + t.accuracy, 0) / attempted.length)
              : null;
            return (
              <div key={subj}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[12px] font-extrabold text-slate-600 w-36 shrink-0">
                    {SUBJECT_LABELS[subj] || subj}
                  </span>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {items.map(t => (
                      <Cell key={t.name} name={t.name} accuracy={t.accuracy} />
                    ))}
                  </div>
                  {subjectAvg !== null && (
                    <span className="text-[13px] font-extrabold tabular-nums w-10 text-right shrink-0"
                      style={{ color: cellBg(subjectAvg) }}>
                      {subjectAvg}%
                    </span>
                  )}
                </div>
                {/* Topic group labels (subtle) */}
                <div className="ml-[calc(144px+12px)] flex flex-wrap gap-x-3 gap-y-0.5">
                  {items.map(t => (
                    <span key={t.name} className="text-[9px] text-slate-300" style={{ width: CELL_SIZE, textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {t.name.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
