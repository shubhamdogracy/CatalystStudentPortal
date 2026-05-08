import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, Clock, Calculator as CalcIcon, Bookmark, ChevronDown } from 'lucide-react';
import { assignmentService } from '../../services/api';
import Calculator from './Calculator';
import DesmosCalculator from './DesmosCalculator';
import MathReferencesPanel from './MathReferencesPanel';
import { StudentReportModal } from './StudentReportModal';

const CHOICES = ['A', 'B', 'C', 'D'];

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}


// Colorful dashed SAT-style divider
function SATDivider() {
  const colors = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];
  return (
      <div className="flex h-[3px]">
        {colors.map((color, i) => (
            <div
                key={i}
                className="flex-1 border-t-2 border-dashed"
                style={{ borderColor: color }}
            />
        ))}
      </div>
  );
}

// More menu (⋮)
function MoreMenu({ onNotes, onSubmitModule, onClose }) {
  return (
      <div className="absolute right-0 top-11 z-[110] rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #e5e7eb', width: '200px' }}>
        <button
            onClick={() => { onNotes(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-gray-50"
            style={{ color: '#2A2A2A' }}
        >
          <span className="text-base">📝</span>
          <span className="font-semibold">Add Notes</span>
        </button>
        <div style={{ borderTop: '1px solid #F2F2F2' }} />
        <button
            onClick={() => { onSubmitModule(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-red-50"
            style={{ color: '#ef4444' }}
        >
          <span className="text-base">✅</span>
          <span className="font-semibold">Submit Test</span>
        </button>
      </div>
  );
}

// Notes modal
function NotesModal({ qid, notes, onAdd, onDelete, onClose }) {
  const [draft, setDraft] = useState('');
  const myNotes = notes[qid] || [];

  const handleAdd = () => {
    if (!draft.trim()) return;
    onAdd(qid, draft.trim());
    setDraft('');
  };

  return (
      <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
          {/* Header */}
          <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: '#F2F2F2', background: 'linear-gradient(135deg, #f0f7f0, #f9fdf9)' }}
          >
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#2A2A2A' }}>Notes for this question <br>You can revisit this question to check your notes.</br></h3>
              <p className="text-[11px] mt-0.5" style={{ color: '#2A2A2A99' }}>Ctrl+Enter to save quickly</p>
            </div>
            <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-colors hover:bg-gray-100"
                style={{ color: '#2A2A2A99', backgroundColor: '#F2F2F2' }}
            >
              ✕
            </button>
          </div>

          {/* Existing notes list */}
          <div className="p-5 space-y-2 max-h-56 overflow-y-auto" style={{ backgroundColor: '#FFFFFF' }}>
            {myNotes.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: '#2A2A2A66' }}>
                  No notes yet. Add your first note below.
                </p>
            )}
            {myNotes.map((note, i) => (
                <div
                    key={i}
                    className="flex items-start gap-2 rounded-xl px-3 py-2.5"
                    style={{ backgroundColor: '#80AF8115', border: '1px solid #80AF8130' }}
                >
                  <p className="flex-1 text-xs leading-relaxed" style={{ color: '#2A2A2A' }}>{note}</p>
                  <button
                      onClick={() => onDelete(qid, i)}
                      className="text-xs shrink-0 mt-0.5 transition-colors hover:opacity-60"
                      style={{ color: '#2A2A2A66' }}
                  >
                    ✕
                  </button>
                </div>
            ))}
          </div>

          {/* Input area */}
          <div className="px-5 pb-5 space-y-2" style={{ backgroundColor: '#FFFFFF' }}>
            <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleAdd(); }}
                placeholder="Write a note for this question…"
                className="w-full rounded-xl px-3 py-2 text-xs resize-none focus:outline-none transition-colors"
                style={{
                  border: '1.5px solid #e5e7eb',
                  color: '#2A2A2A',
                  backgroundColor: '#F2F2F2',
                }}
                rows={3}
            />
            <button
                onClick={handleAdd}
                disabled={!draft.trim()}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-opacity disabled:opacity-40"
                style={{ backgroundColor: '#80AF81', color: '#FFFFFF' }}
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
  );
}

// References (images) modal
function ReferencesModal({ images, onClose }) {
  return (
      <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h3 className="text-sm font-bold text-gray-800">References</h3>
            <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center text-sm font-bold transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="p-5 space-y-4">
            {images.map((src, i) => (
                <img key={i} src={src} alt={`Reference ${i + 1}`} className="w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
  );
}

// Question picker bottom sheet
function QuestionPicker({ questions, currentIdx, answers, markedForReview, onSelect, onClose }) {
  return (
      <div className="fixed inset-0 z-[150] bg-black/40 flex items-end justify-center pb-6" onClick={onClose}>
        <div
            className="rounded-3xl w-full max-w-2xl mx-4 p-5 shadow-2xl"
            style={{ backgroundColor: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: '#F2F2F2' }} />

          <p className="text-[11px] font-extrabold uppercase tracking-widest mb-3" style={{ color: '#80AF81' }}>
            Jump to Question
          </p>

          <div className="grid grid-cols-8 gap-2 mb-5">
            {questions.map((q, i) => {
              const answered  = !!answers[q.qid];
              const marked    = markedForReview.has(q.qid);
              const isCurrent = i === currentIdx;
              return (
                  <button
                      key={q.qid}
                      onClick={() => { onSelect(i); onClose(); }}
                      style={
                          isCurrent
                              ? { backgroundColor: '#80AF81', color: '#FFFFFF' }
                              : answered
                                  ? { backgroundColor: '#80AF8120', color: '#80AF81', border: '1px solid #80AF8140' }
                                  : { backgroundColor: '#F2F2F2', color: '#2A2A2A', border: '1px solid #e5e7eb' }
                      }
                      className="aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all hover:opacity-80"
                  >
                    <span>{i + 1}</span>
                    {marked && <span className="text-[8px] leading-none">🔖</span>}
                  </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] font-semibold mb-5" style={{ color: '#2A2A2A99' }}>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: '#80AF8120', border: '1px solid #80AF8140' }} />
              Answered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: '#F2F2F2', border: '1px solid #e5e7eb' }} />
              Unanswered
            </span>
            <span className="flex items-center gap-1.5">🔖 Marked for Review</span>
          </div>

          <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors"
              style={{ backgroundColor: '#F2F2F2', color: '#2A2A2A' }}
          >
            Close
          </button>
        </div>
      </div>
  );
}


// Start Screen
function StartScreen({ assignment, onBegin, onBack, error, isGuest }) {
  const sections = assignment.sections || [];
  const totalQs   = sections.reduce((a, s) => a + s.modules.reduce((b, m) => b + m.questions.length, 0), 0);
  const totalTime = sections.reduce((a, s) => a + s.modules.reduce((b, m) => b + (m.timeLimit || 0), 0), 0);

  return (
      <div className="page-content">
        <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-indigo-600 font-semibold mb-6 hover:text-indigo-800 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Assignments
        </button>
        <div className="max-w-xl mx-auto">
          <div className="card py-8 px-8 text-center">
            <div className="w-16 h-16 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              📋
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{assignment.title}</h2>
            {assignment.description && (
                <p className="text-sm text-slate-500 mb-5 leading-relaxed">{assignment.description}</p>
            )}
            <div className="flex justify-center gap-8 mb-6">
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl font-extrabold text-indigo-600">{totalQs}</span>
                <span className="text-xs text-slate-400">Questions</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl font-extrabold text-indigo-600">{totalTime}</span>
                <span className="text-xs text-slate-400">Minutes</span>
              </div>
              {!isGuest && (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl font-extrabold text-indigo-600">{assignment.passingScore}%</span>
                    <span className="text-xs text-slate-400">Pass Mark</span>
                  </div>
              )}
            </div>
            <div className="flex flex-col gap-2 mb-6 text-left">
              {sections.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 text-sm">
                    <span>{s.name.toLowerCase().includes('math') ? '🔢' : '📖'}</span>
                    <span className="font-semibold text-slate-700">{s.name}</span>
                    <span className="ml-auto text-slate-400">
                  {s.modules.reduce((a, m) => a + m.questions.length, 0)} q
                      &nbsp;·&nbsp;
                      {s.modules.reduce((a, m) => a + (m.timeLimit || 0), 0)} min
                </span>
                  </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            <button
                onClick={onBegin}
                className="w-full py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              Begin Test
            </button>
          </div>
        </div>
      </div>
  );
}


// Transforms the API result + flat answers into the attempt shape StudentReportModal expects.
function buildAttemptFromResult(result, assignment, finalAnswers, moduleTimings, student) {
  // Build a flat answers dict keyed by qid.
  // For fresh submissions finalAnswers is already populated.
  // For already-submitted assignments (page reload), reconstruct from stored server data.
  let answers = { ...finalAnswers };
  if (Object.keys(answers).length === 0) {
    (result?.sectionResponses || []).forEach(sr => {
      (sr.moduleResponses || []).forEach(mr => {
        if (Array.isArray(mr.answers)) {
          mr.answers.forEach(a => {
            // Server may use {qid, selected} or {questionId, answer} — handle both.
            const key = a.qid || a.questionId;
            const val = a.selected || a.answer;
            if (key && val) answers[key] = val;
          });
        } else if (mr.answers && typeof mr.answers === 'object') {
          Object.assign(answers, mr.answers);
        }
      });
    });
  }

  // Share the full flat answers dict for every module.
  // The modal iterates only over that module's questions when looking up answers,
  // so unrelated keys from other modules are simply ignored.
  return {
    studentName: student?.name || student?.displayName || 'You',
    batchName:   '',
    avatar:      (student?.name || student?.displayName || 'S').slice(0, 2).toUpperCase(),
    score:       result?.overallScore ?? result?.score ?? 0,
    maxScore:    result?.maxScore ?? 0,
    percentage:  result?.percentage ?? 0,
    passed:      result?.passed ?? false,
    completedAt: result?.completedAt || result?.updatedAt || new Date().toISOString(),
    sectionResults: (result?.sectionResponses || []).map(sr => {
      const section = (assignment.sections || []).find(
        s => (s.sid || s.id) === sr.sid,
      );
      return {
        sectionId:   sr.sid,
        sectionName: section?.name || (sr.sid === 'rw' ? 'Reading & Writing' : 'Mathematics'),
        modules: (sr.moduleResponses || []).map(mr => {
          const timing = moduleTimings.find(
            t => t.sectionId === sr.sid && t.moduleNum === mr.moduleNumber,
          );
          return {
            moduleNumber: mr.moduleNumber,
            score:        mr.score ?? 0,
            maxScore:     mr.maxScore ?? mr.totalQuestions ?? 0,
            timeTaken:    timing ? Math.round(timing.timeUsed / 60) : null,
            answers,  // share full flat dict — no per-module filtering needed
          };
        }),
      };
    }),
  };
}

// ── Main Test Taker ──────────────────────────────────────────
export default function SATTestTaker({ assignment, student, batchId, initialResponse, onBack }) {
  const isGuest          = student?.role === 'guest' || student?.accountType === 'guest';
  const alreadySubmitted = initialResponse?.status === 'submitted';
  const inProgress       = initialResponse?.status === 'in_progress';

  const sections = useMemo(() => assignment.sections || [], [assignment.sections]);

  // Flat sequence: [RW-M1, RW-M2, Math-M1, Math-M2]
  const moduleSequence = useMemo(() => {
    const seq = [];
    sections.forEach((s) => {
      const isMath = s.name.toLowerCase().includes('math');
      (s.modules || []).forEach((m) => {
        if ((m.questions || []).length === 0) return;
        seq.push({
          sectionId:         s.sid || s.id,
          sectionName:       s.name,
          moduleNum:         m.number,
          questions:         m.questions || [],
          timeLimit:         (m.timeLimit || (isMath ? 35 : 32)) * 60,
          calculatorAllowed: !!m.calculatorAllowed,
          isMath,
        });
      });
    });
    return seq;
  }, [sections]);

  const [phase,                 setPhase]                 = useState(alreadySubmitted ? 'result' : inProgress ? 'test' : 'start');
  const [responseId,            setResponseId]            = useState(inProgress ? initialResponse._id : null);
  const [result,                setResult]                = useState(alreadySubmitted ? initialResponse : null);
  // If the full response (from detail endpoint) includes assignment sections with correct
  // answers, use them straight away — same as the post-submit flow.
  // getResponseById populates assignmentId.sections with correctAnswer included.
  const [assignmentWithAnswers, setAssignmentWithAnswers] = useState(
    initialResponse?.assignmentId?.sections
      ? { ...assignment, sections: initialResponse.assignmentId.sections }
      : null,
  );
  const [error,                 setError]                 = useState('');

  // Navigation
  const [moduleIdx,   setModuleIdx]   = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);

  // Per-module timer
  const [timeLeft,  setTimeLeft]  = useState(() => moduleSequence[0]?.timeLimit ?? 32 * 60);
  const [showTimer, setShowTimer] = useState(true);

  // Answer & annotation state
  const [answers,         setAnswers]         = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [strikedChoices,  setStrikedChoices]  = useState({});
  const [notes,           setNotes]           = useState({});

  // State for result screen (no ref reads during render)
  const [moduleTimings, setModuleTimings] = useState([]);
  const [finalAnswers,  setFinalAnswers]  = useState({});

  // UI toggles
  const [showCalc,       setShowCalc]       = useState(false);
  const [showMore,       setShowMore]       = useState(false);
  const [showNotes,      setShowNotes]      = useState(false);
  const [showReferences, setShowReferences] = useState(false);
  const [showMathRef,    setShowMathRef]    = useState(false);
  const [showPicker,     setShowPicker]     = useState(false);

  // Refs for stale-closure safety in callbacks
  const answersRef       = useRef(answers);
  const responseIdRef    = useRef(responseId);
  const timeLeftRef      = useRef(timeLeft);
  const moduleTimingsRef = useRef([]);
  useEffect(() => { answersRef.current    = answers; });
  useEffect(() => { responseIdRef.current = responseId; });
  useEffect(() => { timeLeftRef.current   = timeLeft; });

  const currentModule   = moduleSequence[moduleIdx];
  const currentQuestion = currentModule?.questions[questionIdx];
  const isLastModule    = moduleIdx === moduleSequence.length - 1;
  const isLastQuestion  = questionIdx === (currentModule?.questions.length ?? 1) - 1;

  const handleBegin = async () => {
    try {
      setError('');
      const res = await assignmentService.start({ assignmentId: assignment._id, studentId: student._id, batchId });
      setResponseId(res.data._id);
      setPhase('test');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAnswer = (qid, choice) => setAnswers((prev) => ({ ...prev, [qid]: choice }));

  const toggleMark = (qid) =>
      setMarkedForReview((prev) => {
        const next = new Set(prev);
        next.has(qid) ? next.delete(qid) : next.add(qid);
        return next;
      });

  const toggleStrike = (qid, choice) =>
      setStrikedChoices((prev) => ({
        ...prev,
        [qid]: { ...(prev[qid] || {}), [choice]: !(prev[qid]?.[choice]) },
      }));

  const addNote    = (qid, text) => setNotes((prev) => ({ ...prev, [qid]: [...(prev[qid] || []), text] }));
  const deleteNote = (qid, idx)  => setNotes((prev) => ({ ...prev, [qid]: (prev[qid] || []).filter((_, i) => i !== idx) }));

  // Final submit — collects all answers across all modules
  const executeSubmit = useCallback(async () => {
    setPhase('submitting');
    const snapshotAnswers = { ...answersRef.current };
    setFinalAnswers(snapshotAnswers);
    try {
      const sectionResponses = sections.map((s) => ({
        sid: s.sid || s.id,
        moduleResponses: s.modules.map((m) => ({
          mid:          m.mid || m.id,
          moduleNumber: m.number,
          answers:      m.questions
              .filter((q) => snapshotAnswers[q.qid])
              .map((q) => ({ qid: q.qid, selected: snapshotAnswers[q.qid] })),
        })),
      }));
      const res = await assignmentService.submit(responseIdRef.current, { sectionResponses });
      setResult(res.data);
      if (res.data?.assignmentId?.sections) {
        setAssignmentWithAnswers({ ...assignment, sections: res.data.assignmentId.sections });
      }
      setPhase('result');
    } catch (e) {
      setError(e.message);
      setPhase('test');
    }
  }, [sections, assignment]);

  // Advance to next module, or submit if last
  const advanceModule = useCallback(() => {
    const mod = moduleSequence[moduleIdx];
    const newTiming = {
      sectionId:   mod.sectionId,
      sectionName: mod.sectionName,
      moduleNum:   mod.moduleNum,
      timeUsed:    mod.timeLimit - timeLeftRef.current,
      timeLimit:   mod.timeLimit,
    };
    moduleTimingsRef.current = [...moduleTimingsRef.current, newTiming];
    setModuleTimings([...moduleTimingsRef.current]);

    const nextIdx = moduleIdx + 1;
    if (nextIdx >= moduleSequence.length) {
      executeSubmit();
    } else {
      setModuleIdx(nextIdx);
      setQuestionIdx(0);
      setTimeLeft(moduleSequence[nextIdx]?.timeLimit ?? 32 * 60);
      if (!moduleSequence[nextIdx]?.calculatorAllowed) setShowCalc(false);
    }
  }, [moduleIdx, moduleSequence, executeSubmit]);

  const handleSubmitModule = () => {
    const unanswered = (currentModule?.questions || []).filter((q) => !answers[q.qid]).length;
    const msg = unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''} in this module. Submit module anyway?`
        : isLastModule
            ? 'Submit the full test now?'
            : 'Submit this module and proceed to the next?';
    if (!window.confirm(msg)) return;
    advanceModule();
  };

  // Per-module countdown — resets when moduleIdx changes
  useEffect(() => {
    if (phase !== 'test') return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase, moduleIdx]);

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (phase !== 'test' || timeLeft !== 0) return;
    const id = setTimeout(advanceModule, 0);
    return () => clearTimeout(id);
  }, [timeLeft, phase, advanceModule]);

  // ── Phase guards ──
  if (phase === 'result') {
    const attempt = buildAttemptFromResult(
      result,
      assignmentWithAnswers || assignment,
      finalAnswers,
      moduleTimings,
      student,
    );
    return (
      <StudentReportModal
        attempt={attempt}
        assignment={assignmentWithAnswers || assignment}
        onClose={onBack}
        isStudentView
      />
    );
  }
  if (phase === 'start')  return <StartScreen assignment={assignment} onBegin={handleBegin} onBack={onBack} error={error} isGuest={isGuest} />;
  if (phase === 'submitting') {
    return (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-600">Submitting your test…</p>
          </div>
        </div>
    );
  }

  if (!currentModule || !currentQuestion) return null;

  const hasImages  = (currentQuestion.images || []).length > 0;
  // hasDescription: question has a passage/description to show on the left panel.
  // When true, the question title goes on the right; when false, the title IS the left panel.
  const hasDescription = !!currentQuestion.description;
  const qNotes     = notes[currentQuestion.qid] || [];

  // Timer color: red when < 2 min, amber when < 5 min, brand typography otherwise
  const timerColor = timeLeft <= 120 ? '#ef4444' : timeLeft <= 300 ? '#d97706' : '#2A2A2A';
  const timerCls   = timeLeft <= 120 ? 'animate-pulse' : '';

  return (
      <div className="absolute inset-0 bg-white flex flex-col select-none overflow-hidden z-[60]">
        {/* Floating calculator — Desmos for math modules, basic otherwise */}
        {showCalc && currentModule.calculatorAllowed && (
          currentModule.isMath
            ? <DesmosCalculator onClose={() => setShowCalc(false)} />
            : <Calculator onClose={() => setShowCalc(false)} />
        )}

        {/* Modals */}
        {showNotes && (
            <NotesModal
                qid={currentQuestion.qid}
                notes={notes}
                onAdd={addNote}
                onDelete={deleteNote}
                onClose={() => setShowNotes(false)}
            />
        )}
        {showReferences && hasImages && (
            <ReferencesModal images={currentQuestion.images} onClose={() => setShowReferences(false)} />
        )}
        {showMathRef && currentModule.isMath && (
            <MathReferencesPanel onClose={() => setShowMathRef(false)} />
        )}
        {showPicker && (
            <QuestionPicker
                questions={currentModule.questions}
                currentIdx={questionIdx}
                answers={answers}
                markedForReview={markedForReview}
                onSelect={(i) => setQuestionIdx(i)}
                onClose={() => setShowPicker(false)}
            />
        )}

        {/* More menu backdrop */}
        {showMore && (
            <div className="fixed inset-0 z-[100]" onClick={() => setShowMore(false)} />
        )}

        {/* ── TOP BAR ── */}
        <div className="shrink-0 bg-white">
          <div className="flex items-center justify-between px-6 py-3 gap-4">

            {/* Left: Section name + module + Directions button */}
            <div className="flex flex-col gap-0.5 min-w-[180px]">
              <p className="text-[15px] font-extrabold text-gray-900 leading-tight">{currentModule.sectionName}</p>
              <p className="text-[11px] text-gray-500 font-medium">Module {currentModule.moduleNum}</p>
              <button className="self-start mt-1.5 flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Directions <ChevronDown size={10} />
              </button>
            </div>

            {/* Center: Large timer + hide/show */}
            <div className="flex flex-col items-center flex-1">
              {showTimer ? (
                  <span
                      className={`text-[30px] font-extrabold tracking-tight leading-none ${timerCls}`}
                      style={{ color: timerColor }}
                  >
                    {formatTime(timeLeft)}
                  </span>
              ) : (
                  <span className="text-sm font-semibold" style={{ color: '#2A2A2A99' }}>Timer hidden</span>
              )}
              <button
                  onClick={() => setShowTimer((p) => !p)}
                  className="mt-1.5 px-4 py-0.5 rounded-full border text-[11px] font-semibold transition-colors hover:bg-gray-50"
                  style={{ borderColor: '#e5e7eb', color: '#2A2A2A' }}
              >
                {showTimer ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Right: Tool buttons + More */}
            <div className="flex items-center gap-0.5 min-w-[180px] justify-end">

              {/* Calculator — math modules only */}
              {currentModule.calculatorAllowed && (
                <button
                  onClick={() => setShowCalc((p) => !p)}
                  className={`flex flex-col items-center justify-center gap-[3px] px-3 py-2 rounded-xl transition-all ${
                    showCalc
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  <CalcIcon size={17} className="shrink-0" />
                  <span className="text-[10px] font-semibold leading-none">Calculator</span>
                </button>
              )}

              {/* fx References — math modules only */}
              {currentModule.isMath && (
                <button
                  onClick={() => setShowMathRef((p) => !p)}
                  className={`flex flex-col items-center justify-center gap-[3px] px-3 py-2 rounded-xl transition-all ${
                    showMathRef
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  <span className="font-bold italic leading-none" style={{ fontFamily: 'Georgia, serif', fontSize: 17 }}>
                    f<span style={{ fontSize: 11, verticalAlign: 'sub' }}>x</span>
                  </span>
                  <span className="text-[10px] font-semibold leading-none">References</span>
                </button>
              )}

              {/* Image references */}
              {hasImages && (
                <button
                  onClick={() => setShowReferences(true)}
                  className="flex flex-col items-center justify-center gap-[3px] px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-all"
                >
                  <span className="text-base leading-none">📚</span>
                  <span className="text-[10px] font-semibold leading-none">Images</span>
                </button>
              )}

              {/* More (⋮) — always visible, top-right */}
              <div className="relative z-[110]">
                <button
                  onClick={() => setShowMore((p) => !p)}
                  className="flex flex-col items-center justify-center gap-[2px] px-3 py-2 rounded-xl transition-all"
                  style={showMore
                    ? { backgroundColor: '#F2F2F2', color: '#2A2A2A' }
                    : { color: '#2A2A2A99' }
                  }
                >
                  <span className="font-black leading-none" style={{ fontSize: 20, letterSpacing: 1 }}>⋮</span>
                  <span className="text-[10px] font-semibold leading-none">More</span>
                </button>
                {showMore && (
                  <MoreMenu
                    onNotes={() => setShowNotes(true)}
                    onSubmitModule={handleSubmitModule}
                    onClose={() => setShowMore(false)}
                  />
                )}
              </div>
            </div>
          </div>
          <SATDivider />
        </div>

        {/* ── CONTENT AREA — always split left / right ── */}
        <div className="flex-1 overflow-hidden flex flex-row" style={{ backgroundColor: '#F2F2F2' }}>

          {/* ── LEFT PANEL: description/passage OR question stem ── */}
          <div className="w-1/2 h-full overflow-y-auto border-r" style={{ backgroundColor: '#FFFFFF', borderColor: '#e5e7eb' }}>
            <div className="p-8">
              {hasDescription ? (
                /* Passage / description HTML */
                <div
                    className="text-sm leading-7 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-gray-200 [&_th]:px-2 [&_th]:py-1.5 [&_th]:bg-gray-50 [&_th]:font-semibold [&_p]:mb-2"
                    style={{ color: '#2A2A2A' }}
                    dangerouslySetInnerHTML={{ __html: currentQuestion.description }}
                />
              ) : (
                /* No description — question title/stem goes on the left */
                <p className="text-[15px] font-medium leading-relaxed" style={{ color: '#2A2A2A' }}>
                  {currentQuestion.title}
                </p>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL: header + question (if passage) + choices ── */}
          <div className="w-1/2 h-full overflow-y-auto" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="p-6 pt-5">

              {/* Question header row */}
              <div className="flex items-center gap-2.5 mb-4 py-2.5 px-3 rounded-xl" style={{ backgroundColor: '#F2F2F2' }}>
                <span
                    className="w-8 h-8 text-sm font-extrabold rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#2A2A2A', color: '#FFFFFF' }}
                >
                  {questionIdx + 1}
                </span>

                <button
                    onClick={() => toggleMark(currentQuestion.qid)}
                    className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
                    style={{ color: markedForReview.has(currentQuestion.qid) ? '#80AF81' : '#2A2A2A99' }}
                >
                  <Bookmark
                      size={13}
                      fill={markedForReview.has(currentQuestion.qid) ? '#80AF81' : 'none'}
                      stroke={markedForReview.has(currentQuestion.qid) ? '#80AF81' : 'currentColor'}
                      strokeWidth={2}
                  />
                  Mark for Review
                </button>

                <div className="flex-1" />

                <button className="text-[11px] font-semibold transition-colors hover:opacity-70" style={{ color: '#ef4444' }}>
                  Report Issue
                </button>

                <button
                    onClick={() => setShowNotes(true)}
                    className="px-2.5 py-1 rounded border text-[11px] font-bold tracking-wide transition-colors"
                    style={
                        qNotes.length > 0
                            ? { borderColor: '#80AF81', backgroundColor: '#80AF8115', color: '#80AF81' }
                            : { borderColor: '#d1d5db', color: '#2A2A2A99', backgroundColor: '#FFFFFF' }
                    }
                >
                  {qNotes.length > 0 ? `📝 ${qNotes.length}` : 'ABC'}
                </button>
              </div>

              {/* Topic tag */}
              {currentQuestion.topic && (
                  <span
                      className="inline-flex mb-3 text-[10px] font-semibold rounded-full px-2.5 py-0.5"
                      style={{ color: '#80AF81', backgroundColor: '#80AF8115', border: '1px solid #80AF8140' }}
                  >
                    {currentQuestion.topic}
                  </span>
              )}

              {/* Question title — only shown on right when description is on the left */}
              {hasDescription && (
                  <p className="text-[14px] font-medium leading-relaxed mb-5" style={{ color: '#2A2A2A' }}>
                    {currentQuestion.title}
                  </p>
              )}

              {/* Answer choices */}
              <div className="flex flex-col gap-3">
                {CHOICES.map((choice) => {
                  const label      = currentQuestion.choices?.[choice];
                  if (!label) return null;
                  const isSelected = answers[currentQuestion.qid] === choice;
                  const isStruck   = !!strikedChoices[currentQuestion.qid]?.[choice];

                  return (
                      <div key={choice} className="flex items-center gap-2 group">
                        <button
                            onClick={() => !isStruck && handleAnswer(currentQuestion.qid, choice)}
                            className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all"
                            style={
                                isStruck
                                    ? { opacity: 0.4, borderColor: '#F2F2F2', backgroundColor: '#F2F2F2', cursor: 'default' }
                                    : isSelected
                                        ? { borderColor: '#80AF81', backgroundColor: '#80AF8110' }
                                        : { borderColor: '#e5e7eb', backgroundColor: '#FFFFFF' }
                            }
                        >
                          <span
                              className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 transition-all"
                              style={
                                  isSelected && !isStruck
                                      ? { backgroundColor: '#80AF81', borderColor: '#80AF81', color: '#FFFFFF' }
                                      : { borderColor: '#d1d5db', color: '#2A2A2A99', backgroundColor: '#FFFFFF' }
                              }
                          >
                            {choice}
                          </span>
                          <span
                              className="text-sm flex-1 leading-relaxed"
                              style={
                                  isStruck
                                      ? { textDecoration: 'line-through', color: '#9ca3af' }
                                      : isSelected
                                          ? { fontWeight: 600, color: '#2A2A2A' }
                                          : { color: '#2A2A2A' }
                              }
                          >
                            {label}
                          </span>
                        </button>

                        {/* Strikethrough — reveal on hover, always visible when struck */}
                        <button
                            onClick={() => toggleStrike(currentQuestion.qid, choice)}
                            title={isStruck ? 'Restore choice' : 'Eliminate choice'}
                            className="w-7 h-7 rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 transition-all opacity-0 group-hover:opacity-100"
                            style={
                                isStruck
                                    ? { backgroundColor: '#2A2A2A', borderColor: '#2A2A2A', color: '#FFFFFF', opacity: 1 }
                                    : { borderColor: '#e5e7eb', color: '#9ca3af' }
                            }
                        >
                          {isStruck ? '↩' : 'S'}
                        </button>
                      </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="shrink-0 bg-white">
          <SATDivider />
          <div className="flex items-center px-4 py-3 gap-2">

            {/* Left: Back button */}
            <div className="flex-1 flex justify-start">
              <button
                  onClick={() => { if (questionIdx > 0) setQuestionIdx((i) => i - 1); }}
                  disabled={questionIdx === 0}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                  style={{ backgroundColor: '#2A2A2A', color: '#FFFFFF' }}
              >
                Back
              </button>
            </div>

            {/* Center: Question picker — accent green */}
            <button
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#80AF81', color: '#FFFFFF' }}
            >
              Question {questionIdx + 1} of {currentModule.questions.length}
              <ChevronDown size={14} />
            </button>

            {/* Right: Next / Submit */}
            <div className="flex-1 flex justify-end">
              {!isLastQuestion ? (
                  <button
                      onClick={() => setQuestionIdx((i) => i + 1)}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
                      style={{ backgroundColor: '#2A2A2A', color: '#FFFFFF' }}
                  >
                    Next
                  </button>
              ) : isLastModule ? (
                  <button
                      onClick={handleSubmitModule}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#80AF81', color: '#FFFFFF' }}
                  >
                    Submit Test
                  </button>
              ) : (
                  <button
                      onClick={handleSubmitModule}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
                      style={{ backgroundColor: '#2A2A2A', color: '#FFFFFF' }}
                  >
                    Next Module
                  </button>
              )}
            </div>
          </div>
        </div>

        {/* Error toast */}
        {error && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-xl z-[300]">
              {error}
            </div>
        )}
      </div>
  );
}
