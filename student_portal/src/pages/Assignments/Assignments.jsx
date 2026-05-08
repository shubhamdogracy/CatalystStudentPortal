import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, User, AlertCircle, CheckCircle, FileText, Zap } from 'lucide-react';
import { assignmentService, satService } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import EmptyState from '../../components/common/EmptyState';
import SATTestTaker from './SATTestTaker';
import AdaptiveSATTestTaker from './AdaptiveSATTestTaker';
import PracticeAssignmentTaker from './PracticeAssignmentTaker';

// ── Old batch-assignment card ────────────────────────────────
function statusConfig(response, dueDate) {
  if (response?.status === 'submitted') {
    return { label: 'Completed', cls: 'bg-emerald-100 text-emerald-700', btn: 'View Results', btnCls: 'bg-emerald-600 hover:bg-emerald-700' };
  }
  if (response?.status === 'in_progress') {
    return { label: 'In Progress', cls: 'bg-amber-100 text-amber-700', btn: 'Resume Test', btnCls: 'bg-amber-500 hover:bg-amber-600' };
  }
  const isOverdue = dueDate && new Date(dueDate) < new Date();
  return {
    label:  isOverdue ? 'Overdue' : 'Available',
    cls:    isOverdue ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700',
    btn:    'Start Test',
    btnCls: 'bg-indigo-600 hover:bg-indigo-700',
  };
}

function AssignmentCard({ assignment, onStart, isGuest }) {
  const [expanded, setExpanded] = useState(false);

  const due      = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const totalTime = (assignment.sections || []).reduce(
    (a, s) => a + (s.modules || []).reduce((b, m) => b + (m.timeLimit || 0), 0), 0,
  );
  const hasCalculator = (assignment.sections || []).some((s) =>
    (s.modules || []).some((m) => m.calculatorAllowed),
  );
  const cfg = statusConfig(assignment._response, assignment.dueDate);

  return (
    <div className="bg-white border border-slate-200 rounded-[12px] overflow-hidden hover:border-indigo-200 hover:shadow-[0_4px_12px_rgba(79,70,229,0.06)] transition-all">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
      <div className="px-[22px] py-5">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <FileText size={16} className="text-indigo-500 shrink-0" />
            <span className="text-base font-bold text-slate-900">{assignment.title}</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-violet-100 text-violet-700">SAT</span>
          </div>
          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${cfg.cls}`}>{cfg.label}</span>
        </div>

        {assignment.description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-3">{assignment.description}</p>
        )}

        <div className="flex items-center gap-5 text-xs text-slate-500 mb-4 flex-wrap">
          {due && (
            <span className={`flex items-center gap-[5px] ${cfg.label === 'Overdue' ? 'text-red-500 font-semibold' : ''}`}>
              <Calendar size={13} />
              Due: <strong>{due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </span>
          )}
          {totalTime > 0 && <span className="flex items-center gap-[5px]"><Clock size={13} /> {totalTime} min total</span>}
          {assignment.createdBy?.name && <span className="flex items-center gap-[5px]"><User size={13} /> {assignment.createdBy.name}</span>}
          {hasCalculator && <span className="flex items-center gap-[5px] text-emerald-600">🧮 Calculator (Math)</span>}
        </div>

        {(assignment.sections || []).length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {assignment.sections.map((s, i) => {
              const qCount = (s.modules || []).reduce((a, m) => a + (m.questions || []).length, 0);
              const isMath = s.name?.toLowerCase().includes('math');
              return (
                <div key={i} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${isMath ? 'bg-blue-50 text-blue-700' : 'bg-indigo-50 text-indigo-700'}`}>
                  <span>{isMath ? '🔢' : '📖'}</span>
                  <span>{s.name}</span>
                  {qCount > 0 && <span className="opacity-60">· {qCount}Q</span>}
                </div>
              );
            })}
          </div>
        )}

        {(assignment.sections || []).some((s) => (s.modules || []).length > 0) && (
          <div className="mb-4">
            <button onClick={() => setExpanded((p) => !p)} className="text-xs text-indigo-500 font-semibold hover:text-indigo-700 transition-colors">
              {expanded ? '▲ Hide modules' : '▼ View module breakdown'}
            </button>
            {expanded && (
              <div className="mt-3 space-y-2">
                {assignment.sections.map((s, si) =>
                  (s.modules || []).map((m, mi) => (
                    <div key={`${si}-${mi}`} className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl text-xs">
                      <span className="font-semibold text-slate-700">{s.name} — Module {m.number}</span>
                      <div className="flex gap-3 text-slate-500">
                        <span>⏱ {m.timeLimit} min</span>
                        {(m.questions || []).length > 0 && <span>📝 {m.questions.length} Q</span>}
                        <span className={m.calculatorAllowed ? 'text-emerald-600' : 'text-slate-400'}>{m.calculatorAllowed ? '🧮' : '🚫'}</span>
                      </div>
                    </div>
                  )),
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2.5 pt-3 border-t border-slate-100 items-center">
          <button onClick={() => onStart(assignment)} className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${cfg.btnCls}`}>
            {cfg.btn}
          </button>
          {!isGuest && assignment.passingScore && (
            <span className="flex items-center text-xs text-slate-400">🎯 Pass: {assignment.passingScore}%</span>
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

// ── New adaptive SAT assignment card ─────────────────────────
const SAT_SUBJECT_STYLE = {
  math:            { bg: 'bg-blue-50',    text: 'text-blue-700',   label: 'Math' },
  reading_writing: { bg: 'bg-purple-50',  text: 'text-purple-700', label: 'Reading & Writing' },
};
const SAT_STATUS = {
  pending:     { label: 'Not Started', cls: 'bg-indigo-100 text-indigo-700', btn: 'Start Test',    btnCls: 'bg-indigo-600 hover:bg-indigo-700' },
  in_progress: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700',   btn: 'Resume Test',   btnCls: 'bg-amber-500 hover:bg-amber-600' },
  completed:   { label: 'Completed',   cls: 'bg-emerald-100 text-emerald-700', btn: 'View Results', btnCls: 'bg-emerald-600 hover:bg-emerald-700' },
};

function AdaptiveSATCard({ assignment, onStart }) {
  const cfg      = SAT_STATUS[assignment.status] || SAT_STATUS.pending;
  const examCfg  = assignment.exam_config_id;
  const flCfg    = assignment.full_length_exam_config_id;
  const testName = examCfg?.name || flCfg?.name || 'SAT Practice Test';
  const isFL     = assignment.test_type === 'full_length';
  const subjStyle = !isFL && examCfg?.subject ? (SAT_SUBJECT_STYLE[examCfg.subject] || SAT_SUBJECT_STYLE.math) : null;
  const due      = assignment.due_date ? new Date(assignment.due_date) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-[12px] overflow-hidden hover:border-violet-300 hover:shadow-[0_4px_12px_rgba(124,58,237,0.08)] transition-all">
      <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
      <div className="px-[22px] py-5">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Zap size={16} className="text-violet-500 shrink-0" />
            <span className="text-base font-bold text-slate-900">{testName}</span>
            {isFL ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-700">Full Length</span>
            ) : subjStyle ? (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${subjStyle.bg} ${subjStyle.text}`}>{subjStyle.label}</span>
            ) : null}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-200">⚡ Adaptive</span>
          </div>
          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${cfg.cls}`}>{cfg.label}</span>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-500 mb-4 flex-wrap">
          {due && (
            <span className="flex items-center gap-[5px]">
              <Calendar size={13} />
              Due: <strong>{due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </span>
          )}
          {examCfg?.module_1 && (
            <span className="flex items-center gap-[5px]">
              <Clock size={13} /> {examCfg.module_1.time_limit_minutes}min per module
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-100 mb-4">
          <span className="text-sm">🎯</span>
          <p className="text-[11px] text-violet-700 leading-snug">
            <strong>Adaptive test</strong> — Module 2 difficulty adjusts based on your Module 1 score.
          </p>
        </div>

        {isFL && flCfg && (
          <div className="flex gap-2 mb-4">
            {[{ label: 'Math', name: flCfg.math_exam_config_id?.name }, { label: 'R&W', name: flCfg.rw_exam_config_id?.name }].map(({ label, name }) => name && (
              <div key={label} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-600">
                <span>{label === 'Math' ? '🔢' : '📖'}</span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2.5 pt-3 border-t border-slate-100 items-center">
          <button
            onClick={() => onStart(assignment)}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${cfg.btnCls}`}
          >
            {cfg.btn}
          </button>
          {examCfg?.adaptive_threshold && (
            <span className="text-xs text-slate-400">
              Threshold: {examCfg.adaptive_threshold}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Practice SAT assignment card ──────────────────────────────
function PracticeAssignmentCard({ assignment, onStart }) {
  const cfg         = SAT_STATUS[assignment.status] || SAT_STATUS.pending;
  const practiceCfg = assignment.practice_config_id;
  const testName    = practiceCfg?.name || 'Practice Test';
  const due         = assignment.due_date ? new Date(assignment.due_date) : null;

  const subjectCls  = practiceCfg?.subject === 'math'
    ? 'bg-blue-50 text-blue-700'
    : 'bg-purple-50 text-purple-700';
  const subjectLabel = practiceCfg?.subject === 'math' ? 'Math' : 'R&W';

  return (
    <div className="bg-white border border-slate-200 rounded-[12px] overflow-hidden hover:border-teal-300 hover:shadow-[0_4px_12px_rgba(20,184,166,0.08)] transition-all">
      <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
      <div className="px-[22px] py-5">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <BookOpen size={16} className="text-teal-500 shrink-0" />
            <span className="text-base font-bold text-slate-900">{testName}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${subjectCls}`}>{subjectLabel}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-200">Practice</span>
          </div>
          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${cfg.cls}`}>{cfg.label}</span>
        </div>

        <div className="flex items-center gap-5 text-xs text-slate-500 mb-4 flex-wrap">
          {due && (
            <span className="flex items-center gap-[5px]">
              <Calendar size={13} />
              Due: <strong>{due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </span>
          )}
          {practiceCfg?.topic  && <span className="flex items-center gap-[5px]">📚 {practiceCfg.topic}</span>}
          {practiceCfg?.domain && <span className="flex items-center gap-[5px]">🎯 {practiceCfg.domain}</span>}
          {practiceCfg?.total_questions && (
            <span className="flex items-center gap-[5px]"><FileText size={13} /> {practiceCfg.total_questions} questions</span>
          )}
        </div>

        <div className="flex gap-2.5 pt-3 border-t border-slate-100">
          <button onClick={() => onStart(assignment)} className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${cfg.btnCls}`}>
            {cfg.btn}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────
export default function Assignments({ student }) {
  const [assignments,        setAssignments]        = useState([]);
  const [satAssignments,     setSatAssignments]     = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState('');
  const [takingTest,         setTakingTest]         = useState(null);    // old batch test
  const [takingSatTest,      setTakingSatTest]      = useState(null);    // adaptive SAT
  const [takingPracticeTest, setTakingPracticeTest] = useState(null);    // practice SAT assignment

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
    try {
      setLoading(true);
      const [assignmentResults, responsesRes, satRes] = await Promise.all([
        batchIds.length > 0
          ? Promise.all(batchIds.map((id) =>
              assignmentService.getByBatch(id).then((r) => ({ batchId: id, data: r.data || [] })),
            ))
          : Promise.resolve([]),
        assignmentService.getResponses(student._id).catch(() => ({ data: [] })),
        satService.getMyAssignments(student._id).catch(() => null),
      ]);

      // Process batch assignments
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

      // Process SAT assignments
      if (satRes) {
        const satList = Array.isArray(satRes) ? satRes : (satRes.data || satRes.assignments || []);
        setSatAssignments(satList);
      }
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
    if (assignment._response?.status === 'submitted' && assignment._response?._id) {
      try {
        const res = await assignmentService.getResponse(assignment._response._id);
        const fullResponse = res.data || res;
        setTakingTest({ assignment, batchId: assignment._batchId, fullResponse });
        return;
      } catch {
        // fall through
      }
    }
    setTakingTest({ assignment, batchId: assignment._batchId });
  };

  const handleBack = () => {
    setTakingTest(null);
    setTakingSatTest(null);
    setTakingPracticeTest(null);
    if (isGuest) loadGuestAssignments();
    else loadStudentAssignments();
  };

  // Old batch test taker
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

  // New adaptive SAT test taker
  if (takingSatTest) {
    return (
      <AdaptiveSATTestTaker
        satAssignment={takingSatTest}
        student={student}
        onBack={handleBack}
      />
    );
  }

  // Practice SAT assignment taker
  if (takingPracticeTest) {
    return (
      <PracticeAssignmentTaker
        assignment={takingPracticeTest}
        onBack={handleBack}
      />
    );
  }

  const completed = assignments.filter((a) => a._response?.status === 'submitted').length;
  const overdue   = assignments.filter(
    (a) => a.dueDate && new Date(a.dueDate) < new Date() && a._response?.status !== 'submitted',
  ).length;

  if (loading) {
    return (
      <div className="page-content flex items-center justify-center py-32 text-slate-400 text-sm">
        Loading assignments…
      </div>
    );
  }

  const adaptiveSatAssignments  = satAssignments.filter(a => a.test_type !== 'practice');
  const practiceSatAssignments  = satAssignments.filter(a => a.test_type === 'practice');
  const totalCount = assignments.length + satAssignments.length;

  return (
    <div className="page-content">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <StatCard icon={BookOpen}    count={totalCount} label="Total Assignments" colorClass="indigo" />
        <StatCard icon={CheckCircle} count={completed}  label="Completed"         colorClass="green"  />
        <StatCard icon={AlertCircle} count={overdue}    label="Overdue"           colorClass="red"    />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Adaptive SAT Tests (mock / diagnostic / full-length) */}
      {adaptiveSatAssignments.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <span className="card-title"><Zap size={18} color="#7c3aed" /> Adaptive SAT Tests</span>
          </div>
          <div className="flex flex-col gap-4">
            {adaptiveSatAssignments.map((a) => (
              <AdaptiveSATCard
                key={a._id}
                assignment={a}
                onStart={(sa) => setTakingSatTest(sa)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Practice SAT Tests (assigned by mentor) */}
      {practiceSatAssignments.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <span className="card-title"><BookOpen size={18} color="#0d9488" /> Practice Tests (Assigned)</span>
          </div>
          <div className="flex flex-col gap-4">
            {practiceSatAssignments.map((a) => (
              <PracticeAssignmentCard
                key={a._id}
                assignment={a}
                onStart={(sa) => setTakingPracticeTest(sa)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Batch assignments */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><BookOpen size={18} color="#4f46e5" /> SAT Assignments</span>
        </div>

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
