import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp } from 'lucide-react';
import { ProgressRing } from '../../components/ui';

function formatLastAttempt(dateStr) {
  if (!dateStr) return null;
  const d     = new Date(dateStr);
  const today = new Date();
  const diff  = Math.floor((today - d) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return `${diff}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function TestCard({
  emoji, title, typeLabel,
  total, completed,
  accentColor, bgGradient, ringColor,
  navPath, inProgress,
  avgScore, lastAttempt,
}) {
  const navigate = useNavigate();
  const pending  = Math.max(0, total - completed);
  const pct      = total > 0 ? Math.round((completed / total) * 100) : 0;
  const lastStr  = formatLastAttempt(lastAttempt);

  return (
    <div
      className="relative rounded-[18px] p-5 flex flex-col gap-3 overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: bgGradient, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
      onClick={() => navigate(navPath)}
    >
      <div className="pointer-events-none absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: ringColor }} />
      <div className="pointer-events-none absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-15" style={{ background: ringColor }} />

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
          <ProgressRing pct={pct} size={72} stroke={7} color={ringColor} />
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
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: ringColor }} />
        </div>
      </div>

      {/* Avg score + last attempt row */}
      {(avgScore !== null || lastStr) && (
        <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/40">
          {avgScore !== null ? (
            <div className="flex items-center gap-1">
              <TrendingUp size={11} style={{ color: accentColor }} />
              <span className="text-[11px] font-extrabold" style={{ color: accentColor }}>Avg {avgScore}%</span>
            </div>
          ) : <span />}
          {lastStr && (
            <span className="text-[11px] text-slate-400 font-medium">Last: {lastStr}</span>
          )}
        </div>
      )}

      {/* In progress / start CTA */}
      {inProgress ? (
        <div className="relative z-10 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px] font-semibold text-amber-700">In Progress</span>
          </div>
          <span className="text-[11px] font-bold text-amber-700">Resume {typeLabel} →</span>
        </div>
      ) : pending > 0 ? (
        <div className="relative z-10 flex items-center justify-end">
          <span className="text-[11px] font-semibold" style={{ color: accentColor }}>
            Start {typeLabel} Test →
          </span>
        </div>
      ) : null}
    </div>
  );
}
