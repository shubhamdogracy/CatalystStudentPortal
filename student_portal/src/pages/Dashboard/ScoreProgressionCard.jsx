import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';

// 2026 SAT guidelines
function satBand(score) {
  if (score >= 1500) return { label: 'Outstanding', color: '#059669' };
  if (score >= 1400) return { label: 'Very Good',   color: '#2563eb' };
  if (score >= 1200) return { label: 'Competitive', color: '#7c3aed' };
  if (score >= 1030) return { label: 'Average',     color: '#d97706' };
  return                   { label: 'Below Avg',    color: '#ef4444' };
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 shadow-xl text-[12px]"
         style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}>
      <p className="font-bold text-white mb-1">{d.name} · {d.date}</p>
      {d.total   != null && <p className="text-white font-black text-[15px]">Total: {d.total}</p>}
      {d.math    != null && <p className="text-purple-300 font-semibold">Math: {d.math}</p>}
      {d.rw      != null && <p className="text-sky-300 font-semibold">R&W: {d.rw}</p>}
    </div>
  );
}

function StatChip({ label, value, color, sub }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
      <p className="text-[9px] font-extrabold uppercase tracking-widest text-white/50 mb-1">{label}</p>
      <p className="text-[22px] font-black leading-none" style={{ color }}>{value ?? '—'}</p>
      {sub && <p className="text-[10px] mt-1 font-semibold" style={{ color }}>{sub}</p>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="rounded-[18px] p-6 animate-pulse"
         style={{ background: 'linear-gradient(135deg, #3730a3 0%, #6d28d9 55%, #7c3aed 100%)' }}>
      <div className="h-4 w-48 bg-white/20 rounded mb-4" />
      <div className="h-14 w-40 bg-white/20 rounded mb-5" />
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[0,1,2,3].map(i => <div key={i} className="h-16 bg-white/10 rounded-xl" />)}
      </div>
      <div className="h-32 bg-white/10 rounded-xl" />
    </div>
  );
}

export default function ScoreProgressionCard({ data, loading }) {
  const navigate = useNavigate();
  const hasPair  = data.some(d => d.isPair);
  const hasData  = data.length > 0;

  if (loading) return <Skeleton />;

  if (!hasData) {
    return (
      <div className="relative rounded-[18px] p-6 overflow-hidden flex flex-col items-center justify-center gap-3 min-h-[180px] text-center"
           style={{ background: 'linear-gradient(135deg, #3730a3 0%, #6d28d9 55%, #7c3aed 100%)' }}>
        <div className="text-4xl">📊</div>
        <p className="text-white font-bold text-base">No Predicted Score Yet</p>
        <p className="text-white/60 text-[13px]">Complete a Diagnostic Test to see your projected SAT score</p>
        <button onClick={() => navigate('/sat/diagnostic')}
          className="mt-1 px-4 py-2 rounded-xl text-[13px] font-bold text-white border border-white/30 hover:bg-white/10 transition-colors">
          Take Diagnostic →
        </button>
      </div>
    );
  }

  const latest = data[data.length - 1];
  const first  = data[0];
  const best   = Math.max(...data.map(d => d.total ?? 0));
  const delta  = data.length > 1 ? latest.total - first.total : null;
  const band   = satBand(latest.total ?? 0);

  const yDomain = hasPair ? [300, 1650] : [150, 850];
  const yTicks  = hasPair ? [400, 600, 800, 1000, 1200, 1400, 1600] : [200, 300, 400, 500, 600, 700, 800];

  return (
    <div className="relative rounded-[18px] p-6 overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #3730a3 0%, #6d28d9 55%, #7c3aed 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}>
      <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
           style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />

      <div className="relative z-10">
        {/* Title + current score */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] font-extrabold text-purple-200 uppercase tracking-widest mb-1">Predicted SAT Score</p>
            <div className="flex items-end gap-2">
              <span className="font-black text-white leading-none" style={{ fontSize: '3.2rem' }}>{latest.total}</span>
              <span className="text-white/50 text-lg font-semibold mb-1">/1600</span>
            </div>
            {delta !== null && (
              <p className="text-[12px] font-semibold mt-1" style={{ color: delta >= 0 ? '#6ee7b7' : '#fca5a5' }}>
                {delta >= 0 ? `↑ +${delta}` : `↓ ${delta}`} points since first test
              </p>
            )}
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold mt-1"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}>
            {band.label}
          </span>
        </div>

        {/* Stat chips */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <StatChip label="First"   value={first.total}  color="rgba(255,255,255,0.7)" />
          <StatChip label="Latest"  value={latest.total} color="#fff" />
          <StatChip label="Best"    value={best}         color="#6ee7b7" />
          <StatChip label="Change"  color={delta == null ? '#94a3b8' : delta > 0 ? '#6ee7b7' : delta < 0 ? '#fca5a5' : '#fff'}
            value={delta == null ? '—' : delta > 0 ? `+${delta}` : `${delta}`} />
        </div>

        {/* Chart */}
        <div>
          <div className="flex items-center gap-4 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-[3px] rounded-full bg-teal-300" />
              <span className="text-[10px] text-white/60 font-semibold">Total</span>
            </div>
            {hasPair && (
              <>
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="4" viewBox="0 0 16 4"><line x1="0" y1="2" x2="16" y2="2" stroke="#a78bfa" strokeWidth="2" strokeDasharray="4 2"/></svg>
                  <span className="text-[10px] text-white/60 font-semibold">Math</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="16" height="4" viewBox="0 0 16 4"><line x1="0" y1="2" x2="16" y2="2" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="4 2"/></svg>
                  <span className="text-[10px] text-white/60 font-semibold">R&amp;W</span>
                </div>
              </>
            )}
          </div>

          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)', fontWeight: 600 }} tickLine={false} axisLine={false} />
              <YAxis domain={yDomain} ticks={yTicks} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={hasPair ? 1200 : 650} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3" strokeWidth={1.5} />
              <Line type="monotone" dataKey="total" stroke="#5eead4" strokeWidth={3}
                dot={{ r: 5, fill: '#5eead4', stroke: 'white', strokeWidth: 2 }}
                activeDot={{ r: 7, stroke: '#5eead4', strokeWidth: 2, fill: 'white' }} connectNulls />
              {hasPair && <Line type="monotone" dataKey="math" stroke="#a78bfa" strokeWidth={2} strokeDasharray="6 3"
                dot={{ r: 3, fill: '#a78bfa', stroke: 'white', strokeWidth: 1.5 }} connectNulls />}
              {hasPair && <Line type="monotone" dataKey="rw"   stroke="#7dd3fc" strokeWidth={2} strokeDasharray="6 3"
                dot={{ r: 3, fill: '#7dd3fc', stroke: 'white', strokeWidth: 1.5 }} connectNulls />}
            </LineChart>
          </ResponsiveContainer>

          {data.length < 2 && (
            <p className="text-center text-[11px] text-white/40 mt-2">Complete more diagnostic tests to see your score trend</p>
          )}
        </div>
      </div>
    </div>
  );
}
