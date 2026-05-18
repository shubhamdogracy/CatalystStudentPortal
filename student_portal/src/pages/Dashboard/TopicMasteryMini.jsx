import { LayoutGrid } from 'lucide-react';

const CELL = 18;

function cellBg(accuracy) {
  if (accuracy === null) return '#e2e8f0';
  if (accuracy >= 70)    return '#22c55e';
  if (accuracy >= 50)    return '#f59e0b';
  return                        '#ef4444';
}

function cellOpacity(accuracy) {
  if (accuracy === null) return 0.45;
  return 0.7 + (accuracy / 100) * 0.3;
}

const SUBJECT_LABELS = {
  math:            '📐 Math',
  reading_writing: '📖 R & W',
  reading:         '📖 Reading',
  english:         '📖 English',
};

export default function TopicMasteryMini({ topics }) {
  if (!topics?.length) return null;

  const bySubject = topics.reduce((acc, t) => {
    const key = t.subject || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="card flex-1">
      <div className="card-header mb-3">
        <span className="card-title"><LayoutGrid size={15} color="#4f46e5" /> Topic Mastery</span>
      </div>

      <div className="flex flex-col gap-3">
        {Object.entries(bySubject).map(([subj, items]) => {
          const attempted   = items.filter(t => t.accuracy !== null);
          const subjectAvg  = attempted.length > 0
            ? Math.round(attempted.reduce((s, t) => s + t.accuracy, 0) / attempted.length)
            : null;

          return (
            <div key={subj}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-extrabold text-slate-500 w-24 shrink-0 truncate">
                  {SUBJECT_LABELS[subj] || subj}
                </span>
                <div className="flex flex-wrap gap-1 flex-1">
                  {items.map(t => (
                    <div
                      key={t.name}
                      title={t.accuracy !== null ? `${t.name}: ${t.accuracy}%` : `${t.name}: Not started`}
                      style={{
                        width: CELL, height: CELL,
                        borderRadius: 3,
                        background: cellBg(t.accuracy),
                        opacity: cellOpacity(t.accuracy),
                        flexShrink: 0,
                        cursor: 'default',
                        transition: 'transform 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.3)'; e.currentTarget.style.zIndex = 10; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.zIndex = ''; }}
                    />
                  ))}
                </div>
                {subjectAvg !== null && (
                  <span className="text-[12px] font-extrabold tabular-nums w-9 text-right shrink-0"
                    style={{ color: cellBg(subjectAvg) }}>
                    {subjectAvg}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
        {[
          { label: 'Strong',  color: '#22c55e' },
          { label: 'Average', color: '#f59e0b' },
          { label: 'Weak',    color: '#ef4444' },
          { label: 'None',    color: '#e2e8f0', opacity: 0.5 },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color, opacity: l.opacity ?? 1 }} />
            <span className="text-[10px] text-slate-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
