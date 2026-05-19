const CLASS_MAP = {
  pending:   'bg-amber-500/10 text-amber-500',
  submitted: 'bg-emerald-500/10 text-emerald-500',
  overdue:   'bg-red-500/10 text-red-500',
  upcoming:  'bg-indigo-600/10 text-indigo-600',
  completed: 'bg-emerald-500/10 text-emerald-500',
};

export default function Badge({ status, label }) {
  const cls = CLASS_MAP[status] ?? CLASS_MAP.upcoming;
  const text = label ?? (status.charAt(0).toUpperCase() + status.slice(1));
  return (
    <span className={`px-2.5 py-[3px] rounded-full text-[11px] font-semibold flex-shrink-0 ${cls}`}>
      {text}
    </span>
  );
}
