import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, User, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { assignmentService } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';

const STATUS_STYLES = {
  available:   'bg-indigo-100 text-indigo-700',
  'not-started': 'bg-amber-100 text-amber-700',
  completed:   'bg-emerald-100 text-emerald-700',
};

function SATBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-violet-100 text-violet-700">
      SAT
    </span>
  );
}

function AssignmentCard({ assignment }) {
  const [expanded, setExpanded] = useState(false);

  const due      = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isOverdue = due && due < new Date() && assignment.status !== 'completed';
  const statusLabel = isOverdue ? 'Overdue' : 'Available';
  const statusCls   = isOverdue ? 'bg-red-100 text-red-700' : STATUS_STYLES.available;

  // const totalModules = (assignment.sections || []).reduce((a, s) => a + (s.modules || []).length, 0);
  const totalTime    = (assignment.sections || []).reduce(
    (a, s) => a + (s.modules || []).reduce((b, m) => b + (m.timeLimit || 0), 0), 0
  );
  const hasCalculator = (assignment.sections || []).some((s) =>
    (s.modules || []).some((m) => m.calculatorAllowed)
  );

  return (
    <div className="bg-white border border-slate-200 rounded-[12px] overflow-hidden hover:border-indigo-200 hover:shadow-[0_4px_12px_rgba(79,70,229,0.06)] transition-all">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
      <div className="px-[22px] py-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <FileText size={16} className="text-indigo-500 shrink-0" />
            <span className="text-base font-bold text-slate-900">{assignment.title}</span>
            <SATBadge />
          </div>
          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${statusCls}`}>
            {statusLabel}
          </span>
        </div>

        {/* Description */}
        {assignment.description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-3">{assignment.description}</p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-5 text-xs text-slate-500 mb-4 flex-wrap">
          {due && (
            <span className={`flex items-center gap-[5px] ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
              <Calendar size={13} />
              Due: <strong>{due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </span>
          )}
          {totalTime > 0 && (
            <span className="flex items-center gap-[5px]">
              <Clock size={13} /> {totalTime} min total
            </span>
          )}
          {assignment.createdBy?.name && (
            <span className="flex items-center gap-[5px]">
              <User size={13} /> {assignment.createdBy.name}
            </span>
          )}
          {hasCalculator && (
            <span className="flex items-center gap-[5px] text-emerald-600">
              🧮 Calculator (Math)
            </span>
          )}
        </div>

        {/* Sections summary */}
        {(assignment.sections || []).length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {assignment.sections.map((s, i) => {
              const qCount = (s.modules || []).reduce((a, m) => a + (m.questions || []).length, 0);
              const isMath = s.name?.toLowerCase().includes('math');
              return (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                    isMath ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'
                  }`}
                >
                  <span>{isMath ? '🔢' : '📖'}</span>
                  <span>{s.name}</span>
                  {qCount > 0 && <span className="opacity-60">· {qCount}Q</span>}
                  <span className="opacity-60">· {(s.modules || []).length} mod</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Module breakdown (expandable) */}
        {(assignment.sections || []).some((s) => (s.modules || []).length > 0) && (
          <div className="mb-4">
            <button
              onClick={() => setExpanded((p) => !p)}
              className="text-xs text-indigo-500 font-semibold hover:text-indigo-700 transition-colors"
            >
              {expanded ? '▲ Hide modules' : '▼ View module breakdown'}
            </button>
            {expanded && (
              <div className="mt-3 space-y-2">
                {assignment.sections.map((s, si) =>
                  (s.modules || []).map((m, mi) => (
                    <div
                      key={`${si}-${mi}`}
                      className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl text-xs"
                    >
                      <span className="font-semibold text-slate-700">
                        {s.name} — Module {m.number}
                      </span>
                      <div className="flex gap-3 text-slate-500">
                        <span>⏱ {m.timeLimit} min</span>
                        {(m.questions || []).length > 0 && <span>📝 {m.questions.length} Q</span>}
                        <span className={m.calculatorAllowed ? 'text-emerald-600' : 'text-slate-400'}>
                          {m.calculatorAllowed ? '🧮' : '🚫'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Action */}
        <div className="flex gap-2.5 pt-3 border-t border-slate-100">
          <button
            disabled
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white opacity-60 cursor-not-allowed"
            title="Test-taking coming soon"
          >
            Start Test
          </button>
          {assignment.passingScore && (
            <span className="flex items-center text-xs text-slate-400">
              🎯 Pass: {assignment.passingScore}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Assignments({ student }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  useEffect(() => {
    const batchIds = (student?.mentors || [])
        .map((m) => m.batch?._id)
        .filter(Boolean);

    if (!batchIds.length) return;

    const fetchAssignments = async () => {
      try {
        setLoading(true);

        const results = await Promise.all(
            batchIds.map((id) => assignmentService.getByBatch(id))
        );

        const all = results.flatMap((r) => r.data || []);

        const seen = new Set();

        const unique = all.filter((a) => {
          if (seen.has(a._id) || a.status !== "published") return false;
          seen.add(a._id);
          return true;
        });

        setAssignments(unique);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [student]);

  const overdue = assignments.filter(
    (a) => a.dueDate && new Date(a.dueDate) < new Date()
  ).length;

  if (loading) {
    return (
      <div className="page-content flex items-center justify-center py-32 text-slate-400 text-sm">
        Loading assignments…
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <StatCard icon={BookOpen}    count={assignments.length} label="Total Assignments" colorClass="indigo" />
        <StatCard icon={CheckCircle} count={assignments.length - overdue} label="Available"    colorClass="green"  />
        <StatCard icon={AlertCircle} count={overdue}            label="Overdue"          colorClass="red"    />
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><BookOpen size={18} color="#4f46e5" /> SAT Assignments</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {assignments.length === 0 ? (
          <EmptyState icon={BookOpen} message="No assignments assigned to your batch yet." />
        ) : (
          <div className="flex flex-col gap-4">
            {assignments.map((a) => (
              <AssignmentCard key={a._id} assignment={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
