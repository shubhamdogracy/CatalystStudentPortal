const COLOR_MAP = {
  indigo: 'bg-indigo-600/10 text-indigo-600',
  green:  'bg-emerald-500/10 text-emerald-500',
  amber:  'bg-amber-500/10 text-amber-500',
  purple: 'bg-violet-500/10 text-violet-500',
  red:    'bg-red-500/10 text-red-500',
  blue:   'bg-blue-500/10 text-blue-500',
};

export default function StatCard({ icon: Icon, count, label, colorClass, children }) {
  return (
    <div className="bg-white rounded-[14px] px-6 py-5 border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0 ${COLOR_MAP[colorClass] ?? COLOR_MAP.indigo}`}>
        <Icon size={22} />
      </div>
      <div className="stat-info">
        <h3 className="text-[26px] font-bold text-slate-900 leading-none mb-1">{count}</h3>
        <p className="text-[13px] text-slate-500">{label}</p>
        {children}
      </div>
    </div>
  );
}
