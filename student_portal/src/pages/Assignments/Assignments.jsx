import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, User, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { assignmentService } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import SATTestTaker from './SATTestTaker';

function SATBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-violet-100 text-violet-700">
      SAT
    </span>
  );
}

function statusConfig(response, dueDate) {
  if (response?.status === 'submitted') {
    return { label: 'Completed', cls: 'bg-emerald-100 text-emerald-700', btn: 'View Results', btnCls: 'bg-emerald-600 hover:bg-emerald-700' };
  }
  if (response?.status === 'in_progress') {
    return { label: 'In Progress', cls: 'bg-amber-100 text-amber-700', btn: 'Resume Test', btnCls: 'bg-amber-500 hover:bg-amber-600' };
  }
  const isOverdue = dueDate && new Date(dueDate) < new Date();
  return {
    label: isOverdue ? 'Overdue' : 'Available',
    cls:   isOverdue ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700',
    btn:   'Start Test',
    btnCls: 'bg-indigo-600 hover:bg-indigo-700',
  };
}

function AssignmentCard({ assignment, onStart, isGuest }) {
  const [expanded, setExpanded] = useState(false);

  const due      = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const totalTime = (assignment.sections || []).reduce(
    (a, s) => a + (s.modules || []).reduce((b, m) => b + (m.timeLimit || 0), 0), 0
  );
  const hasCalculator = (assignment.sections || []).some((s) =>
    (s.modules || []).some((m) => m.calculatorAllowed)
  );

  const cfg = statusConfig(assignment._response, assignment.dueDate);

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
          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${cfg.cls}`}>
            {cfg.label}
          </span>
        </div>

        {/* Description */}
        {assignment.description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-3">{assignment.description}</p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-5 text-xs text-slate-500 mb-4 flex-wrap">
          {due && (
            <span className={`flex items-center gap-[5px] ${cfg.label === 'Overdue' ? 'text-red-500 font-semibold' : ''}`}>
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
        <div className="flex gap-2.5 pt-3 border-t border-slate-100 items-center">
          <button
            onClick={() => onStart(assignment)}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${cfg.btnCls}`}
          >
            {cfg.btn}
          </button>
          {!isGuest && assignment.passingScore && (
            <span className="flex items-center text-xs text-slate-400">
              🎯 Pass: {assignment.passingScore}%
            </span>
          )}
          {assignment._response?.status === 'submitted' && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <CheckCircle size={12} /> {assignment._response.percentage}% scored
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
  const [takingTest, setTakingTest]   = useState(null); // { assignment, batchId }

  const isGuest = student?.role === 'guest' || student?.accountType === 'guest';

  const loadGuestAssignments = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, responsesRes] = await Promise.all([
        assignmentService.getForGuest(),
        assignmentService.getResponses(student._id).catch(() => ({ data: [] })),
      ]);
      const responseMap = {};
      for (const r of (responsesRes.data || [])) {
        const aId = r.assignmentId?._id?.toString() || r.assignmentId?.toString();
        if (aId) responseMap[aId] = r;
      }
      setAssignments((assignmentsRes.data || []).map((a) => ({ ...a, _response: responseMap[a._id?.toString()] || null })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentAssignments = async () => {
    const batchIds = (student?.mentors || []).map((m) => m.batch?._id).filter(Boolean);
    if (!batchIds.length) { setLoading(false); return; }
    try {
      setLoading(true);
      const [assignmentResults, responsesRes] = await Promise.all([
        Promise.all(batchIds.map((id) =>
          assignmentService.getByBatch(id).then((r) => ({ batchId: id, data: r.data || [] }))
        )),
        assignmentService.getResponses(student._id).catch(() => ({ data: [] })),
      ]);
      const responseMap = {};
      for (const r of (responsesRes.data || [])) {
        const aId = r.assignmentId?._id?.toString() || r.assignmentId?.toString();
        if (aId) responseMap[aId] = r;
      }
      const seen = new Set();
      const unique = assignmentResults
        .flatMap(({ batchId, data }) => data.map((a) => ({ ...a, _batchId: batchId })))
        .filter((a) => {
          if (seen.has(a._id) || a.status !== 'published') return false;
          seen.add(a._id);
          return true;
        })
        .map((a) => ({ ...a, _response: responseMap[a._id?.toString()] || null }));
      setAssignments(unique);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!student?._id) { setLoading(false); return; }
    if (isGuest) loadGuestAssignments();
    else loadStudentAssignments();
  }, [student]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = async (assignment) => {
    // For completed assignments, fetch the full response (with per-question answers
    // and correct answers) before opening the result modal.
    if (assignment._response?.status === 'submitted' && assignment._response?._id) {
      try {
        const res = await assignmentService.getResponse(assignment._response._id);
        const fullResponse = res.data || res;
        setTakingTest({ assignment, batchId: assignment._batchId, fullResponse });
        return;
      } catch {
        // Fall through — open with the lightweight response we already have.
      }
    }
    setTakingTest({ assignment, batchId: assignment._batchId });
  };

  const handleBack = () => {
    setTakingTest(null);
    if (isGuest) loadGuestAssignments();
    else loadStudentAssignments();
  };

  // Show test taker
  if (takingTest) {
    return (
      <SATTestTaker
        assignment={takingTest.assignment}
        student={student}
        batchId={takingTest.batchId}
        initialResponse={takingTest.fullResponse || takingTest.assignment._response}
        onBack={handleBack}
      />
    );
  }

  const completed = assignments.filter((a) => a._response?.status === 'submitted').length;
  const overdue   = assignments.filter(
    (a) => a.dueDate && new Date(a.dueDate) < new Date() && a._response?.status !== 'submitted'
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
        <StatCard icon={BookOpen}    count={assignments.length}  label="Total Assignments" colorClass="indigo" />
        <StatCard icon={CheckCircle} count={completed}           label="Completed"         colorClass="green"  />
        <StatCard icon={AlertCircle} count={overdue}             label="Overdue"           colorClass="red"    />
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
              <AssignmentCard key={a._id} assignment={a} onStart={handleStart} isGuest={isGuest} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
