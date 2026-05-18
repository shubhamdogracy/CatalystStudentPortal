import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui';

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ContinueLearningCard({ continueLearning }) {
  const navigate = useNavigate();

  if (!continueLearning) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title"><BookOpen size={16} color="#4f46e5" /> Continue Learning</span>
        </div>
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
          <span className="text-3xl">📚</span>
          <p className="text-[13px] font-semibold text-slate-600">No sessions yet</p>
          <p className="text-[12px] text-slate-400 mb-2">Start a practice test to see your progress here</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/sat/practice')}>Start Practicing</Button>
        </div>
      </div>
    );
  }

  const { session, config, type } = continueLearning;
  const subject      = session?.subject || config?.subject || 'rw';
  const isMath       = subject === 'math';
  const subjectColor = isMath ? '#7c3aed' : '#4f46e5';
  const bgGradient   = isMath ? 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)' : 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)';
  const borderColor  = isMath ? '#ddd6fe' : '#c7d2fe';

  const label       = config?.name || session?.sub_topic || 'Practice Session';
  const subLabel    = session?.sub_topic || config?.sub_topic || '';
  const attemptDate = formatDate(session?.submitted_at || session?.updatedAt);

  const progressPct = type === 'resume'
    ? Math.round(((session.answers?.length || 0) / (session.question_ids?.length || 1)) * 100)
    : type === 'completed' ? (session?.percentage || 100)
    : 0;

  const subtitleMap = { resume: 'Resume your last session', start: 'Next up for you', completed: 'All caught up — keep going' };
  const buttonMap   = { resume: 'Resume Session', start: 'Start Practice', completed: 'Practice Again' };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title"><BookOpen size={16} color="#4f46e5" /> Continue Learning</span>
        <span className="text-[11px] text-slate-400">{subtitleMap[type]}</span>
      </div>

      <div className="rounded-[14px] p-4 mb-4" style={{ background: bgGradient, border: `1px solid ${borderColor}` }}>
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-extrabold text-slate-800 leading-snug truncate">{label}</p>
            {subLabel && <p className="text-[11px] font-medium mt-0.5" style={{ color: subjectColor }}>{subLabel}</p>}
          </div>
          {type === 'resume' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 shrink-0 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              In Progress
            </span>
          )}
          {type === 'start' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 shrink-0 ml-2">
              Not Started
            </span>
          )}
          {type === 'completed' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 shrink-0 ml-2">
              Completed
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPct}%`, background: subjectColor }} />
          </div>
          <span className="text-[12px] font-extrabold tabular-nums" style={{ color: subjectColor }}>
            {type === 'start' ? '—' : `${progressPct}%`}
          </span>
        </div>

        {type !== 'start' && attemptDate && (
          <p className="text-[10px] text-slate-400 font-medium">
            {type === 'completed' ? `Completed ${attemptDate}` : `Started ${attemptDate}`}
          </p>
        )}
        {type === 'start' && (
          <p className="text-[10px] text-slate-400 font-medium">Ready to begin</p>
        )}
      </div>

      <Button variant="primary" size="sm" onClick={() => navigate('/sat/practice')} className="w-full justify-center">
        {buttonMap[type]} <ArrowRight size={13} />
      </Button>
    </div>
  );
}
