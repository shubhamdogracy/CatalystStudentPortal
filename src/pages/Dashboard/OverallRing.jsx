export default function OverallRing({ pct }) {
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
