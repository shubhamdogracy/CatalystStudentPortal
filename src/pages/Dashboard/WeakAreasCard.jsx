import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function accuracyColor(pct) {
  if (pct >= 70) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

function AccuracyBar({ pct }) {
  const color = accuracyColor(pct);
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-extrabold tabular-nums w-8 text-right" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function WeakAreasCard({ areas }) {
  const navigate = useNavigate();

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <AlertTriangle size={16} color="#ef4444" />
          Weak Areas
        </span>
        <button
          onClick={() => navigate('/sat/practice')}
          className="flex items-center gap-1 text-[12px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Practice <ArrowRight size={13} />
        </button>
      </div>

      {areas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
          <span className="text-3xl">🎯</span>
          <p className="text-[13px] font-semibold text-slate-600">No data yet</p>
          <p className="text-[12px] text-slate-400">Complete practice tests to see your weak areas</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {areas.map((area) => (
            <div key={area.name}>
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 leading-snug truncate" title={area.name}>{area.name}</p>
                  <p className="text-[11px] text-slate-400">{area.topic} · {area.subject === 'math' ? 'Math' : 'Reading & Writing'}</p>
                </div>
              </div>
              <AccuracyBar pct={area.accuracy} />
            </div>
          ))}
          <p className="text-[11px] text-slate-400 mt-1">Focus on these topics to improve your overall score</p>
        </div>
      )}
    </div>
  );
}
