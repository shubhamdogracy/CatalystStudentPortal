import { useNavigate } from 'react-router-dom';
import { TrendingUp, Info } from 'lucide-react';
import { Button } from '../../components/ui';

function ScoreSkeleton() {
  return (
    <div className="rounded-[18px] p-6 animate-pulse" style={{ background: 'linear-gradient(135deg, #3730a3 0%, #6d28d9 55%, #7c3aed 100%)' }}>
      <div className="h-4 w-36 bg-white/20 rounded mb-4" />
      <div className="h-16 w-48 bg-white/20 rounded mb-3" />
      <div className="h-3 w-52 bg-white/15 rounded mb-6" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-white/10 rounded-xl" />
        <div className="h-16 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}

function MiniBar({ label, score, max = 800, color }) {
  const pct = Math.round(((score - 200) / (max - 200)) * 100);
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.12)' }}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] font-semibold text-white/70">{label}</span>
        <span className="text-[15px] font-black text-white">{score}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function PredictedScoreCard({ data, loading }) {
  const navigate = useNavigate();

  if (loading) return <ScoreSkeleton />;

  if (!data) {
    return (
      <div
        className="rounded-[18px] p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[160px]"
        style={{ background: 'linear-gradient(135deg, #3730a3 0%, #6d28d9 55%, #7c3aed 100%)' }}
      >
        <div className="text-4xl">📊</div>
        <div>
          <p className="text-white font-bold text-base mb-1">No Predicted Score Yet</p>
          <p className="text-white/60 text-[13px]">Complete a Diagnostic Test to unlock your projected SAT score</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/sat/diagnostic')}
          className="bg-white/20 hover:bg-white/30 text-white border-white/30 mt-1">
          Take Diagnostic →
        </Button>
      </div>
    );
  }

  const improvement = data.total - 400;
  const totalBarPct  = Math.round(((data.total - 400) / 1200) * 100);

  return (
    <div
      className="relative rounded-[18px] p-6 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #3730a3 0%, #6d28d9 55%, #7c3aed 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}
    >
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-purple-200" />
            <span className="text-[11px] font-extrabold text-purple-200 uppercase tracking-widest">Predicted SAT Score</span>
          </div>
          <Info size={14} className="text-white/40" />
        </div>

        <div className="flex items-end gap-3 mb-1">
          <span className="font-black text-white leading-none" style={{ fontSize: '3.5rem' }}>{data.total}</span>
          <span className="text-white/50 text-lg font-semibold mb-2">/1600</span>
        </div>

        {improvement > 0 && (
          <p className="text-[12px] text-emerald-300 font-semibold mb-4">
            ↑ {improvement} points above minimum score
          </p>
        )}

        <div className="h-1.5 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${totalBarPct}%`, background: 'linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0.95))' }} />
        </div>
        <div className="flex justify-between text-[9px] text-purple-300 font-semibold mb-4">
          <span>400</span><span>700</span><span>1000</span><span>1300</span><span>1600</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MiniBar label="Math" score={data.math.score} color="linear-gradient(90deg, #a78bfa, #c4b5fd)" />
          <MiniBar label="Reading & Writing" score={data.rw.score} color="linear-gradient(90deg, #60a5fa, #93c5fd)" />
        </div>
      </div>
    </div>
  );
}
