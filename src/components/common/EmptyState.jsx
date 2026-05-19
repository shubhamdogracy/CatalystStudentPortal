export default function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-slate-500 text-center gap-2.5">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-1">
        <Icon size={28} />
      </div>
      <p className="text-sm max-w-[280px] leading-relaxed">{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
