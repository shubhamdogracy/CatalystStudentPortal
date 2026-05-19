import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const exam  = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);
  return Math.round((exam - today) / (1000 * 60 * 60 * 24));
}

function urgencyStyle(days) {
  if (days <= 14) return { accent: '#ef4444', bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', border: '#fca5a5', text: '#991b1b' };
  if (days <= 30) return { accent: '#f59e0b', bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '#fde68a', text: '#92400e' };
  return               { accent: '#6366f1', bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', border: '#c7d2fe', text: '#3730a3' };
}

function CalendarWidget({ days, accent, text, border }) {
  return (
    <div className="relative shrink-0 w-14" style={{ height: 60 }}>
      {/* Ring binders */}
      <div className="absolute -top-1 flex justify-around w-full px-2 z-10">
        {[0,1].map(i => (
          <div key={i} className="w-2 h-3 rounded-t-full" style={{ background: accent }} />
        ))}
      </div>
      {/* Calendar body */}
      <div className="w-full h-full rounded-xl overflow-hidden flex flex-col"
        style={{ border: `1.5px solid ${border}`, boxShadow: '0 3px 10px rgba(0,0,0,0.08)', background: 'white' }}>
        <div className="h-5 flex items-center justify-center" style={{ background: accent }}>
          <span className="text-white text-[8px] font-extrabold uppercase tracking-widest">SAT</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="font-black leading-none" style={{ fontSize: '1.4rem', color: text }}>{days}</span>
        </div>
      </div>
    </div>
  );
}

export default function ExamCountdownCard({ satExamDate }) {
  const navigate = useNavigate();
  const days  = daysUntil(satExamDate);
  const style = days !== null ? urgencyStyle(days) : null;

  if (days === null) {
    return (
      <div className="rounded-[18px] p-5 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
        style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid #e2e8f0' }}
        onClick={() => navigate('/profile')}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={15} color="#94a3b8" />
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">SAT Exam</span>
          </div>
          <p className="text-[13px] font-semibold text-slate-500">Set your exam date →</p>
        </div>
        <div className="opacity-30">
          <CalendarWidget days="?" accent="#94a3b8" text="#475569" border="#e2e8f0" />
        </div>
      </div>
    );
  }

  if (days < 0) {
    return (
      <div className="rounded-[18px] p-5" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0' }}>
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays size={15} color="#16a34a" />
          <span className="text-[11px] font-extrabold text-green-600 uppercase tracking-wider">SAT Exam</span>
        </div>
        <p className="text-base font-bold text-green-800">Exam completed! 🎉</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-[18px] p-5 overflow-hidden flex items-center justify-between gap-4"
      style={{ background: style.bg, border: `1px solid ${style.border}` }}>
      <div className="pointer-events-none absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20" style={{ background: style.accent }} />

      <div className="relative z-10 flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <CalendarDays size={14} color={style.accent} />
          <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: style.accent }}>SAT Exam</span>
        </div>
        <div className="flex items-end gap-1.5">
          <span className="font-black leading-none" style={{ fontSize: '2.8rem', color: style.text }}>{days}</span>
          <span className="text-[13px] font-semibold mb-2" style={{ color: style.accent }}>days remaining</span>
        </div>
        {days <= 14 && (
          <p className="text-[11px] font-semibold mt-1" style={{ color: style.accent }}>⚡ Final sprint — stay consistent!</p>
        )}
      </div>

      <div className="relative z-10">
        <CalendarWidget days={days} accent={style.accent} text={style.text} border={style.border} />
      </div>
    </div>
  );
}
