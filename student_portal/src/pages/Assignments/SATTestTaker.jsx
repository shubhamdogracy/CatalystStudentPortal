import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, Clock } from 'lucide-react';
import { assignmentService } from '../../services/api';
import Calculator from './Calculator';
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
      <div className="absolute right-0 top-9 z-[110] bg-white rounded-2xl shadow-2xl border border-gray-100 w-52 overflow-hidden">
        <button
            onClick={() => { onNotes(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="text-base">📝</span>
          <span className="font-semibold">Notes</span>
        </button>
        <div className="border-t border-gray-100" />
        <button
            onClick={() => { onSubmitModule(); onClose(); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <span className="text-base">✅</span>
          <span className="font-semibold">Submit Module</span>
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
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
          <div
              className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
              style={{ background: 'linear-gradient(135deg, #fef9c3, #fff7ed)' }}
          >
            <div>
              <h3 className="text-sm font-bold text-gray-800">Notes</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Ctrl+Enter to add</p>
            </div>
            <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/80 text-gray-500 hover:bg-white flex items-center justify-center text-sm font-bold shadow-sm"
            >
              ✕
            </button>
          </div>
          <div className="p-5 space-y-2 max-h-56 overflow-y-auto">
            {myNotes.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">No notes yet.</p>
            )}
            {myNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5">
                  <p className="flex-1 text-xs text-gray-700 leading-relaxed">{note}</p>
                  <button
                      onClick={() => onDelete(qid, i)}
                      className="text-gray-300 hover:text-red-400 text-sm shrink-0 mt-0.5 transition-colors"
                  >
                    ✕
                  </button>
                </div>
            ))}
          </div>
          <div className="px-5 pb-5 space-y-2">
          <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleAdd(); }}
              placeholder="Type a note… (Ctrl+Enter to save)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 resize-none focus:outline-none focus:border-indigo-300 transition-colors"
              rows={3}
          />
            <button
                onClick={handleAdd}
                disabled={!draft.trim()}
                className="w-full py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Add Note
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

// SAT Math Formula Reference Panel
function MathReferencesPanel({ onClose }) {
  return (
      <div
          className="fixed right-4 top-[72px] z-[200] w-72 max-h-[calc(100vh-88px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{ border: '1px solid #374151' }}
      >
        {/* Dark header */}
        <div className="flex items-start justify-between px-4 py-3 shrink-0" style={{ background: '#111827' }}>
          <div>
            <h3 className="text-sm font-bold text-white">References</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">SAT Math Formula Sheet</p>
          </div>
          <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-white/20 text-white hover:bg-white/30 flex items-center justify-center text-xs font-bold transition-colors mt-0.5"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">

          {/* Area */}
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Area</p>
            <div className="grid grid-cols-3 gap-2">
              {/* Circle */}
              <div className="text-center bg-white rounded-xl p-2 border border-gray-100">
                <svg viewBox="0 0 40 40" className="w-8 h-8 mx-auto mb-1">
                  <circle cx="20" cy="20" r="14" fill="none" stroke="#374151" strokeWidth="1.5"/>
                  <line x1="20" y1="20" x2="34" y2="20" stroke="#374151" strokeWidth="1.5"/>
                  <text x="28" y="18" fontSize="6" fill="#374151" textAnchor="middle">r</text>
                </svg>
                <p className="text-[9px] font-bold text-gray-700">A = πr²</p>
                <p className="text-[9px] text-gray-500">C = 2πr</p>
              </div>
              {/* Rectangle */}
              <div className="text-center bg-white rounded-xl p-2 border border-gray-100">
                <svg viewBox="0 0 40 40" className="w-8 h-8 mx-auto mb-1">
                  <rect x="4" y="12" width="32" height="18" fill="none" stroke="#374151" strokeWidth="1.5"/>
                  <text x="20" y="10" fontSize="6" fill="#374151" textAnchor="middle">ℓ</text>
                  <text x="37" y="23" fontSize="6" fill="#374151" textAnchor="middle">w</text>
                </svg>
                <p className="text-[9px] font-bold text-gray-700">A = ℓw</p>
              </div>
              {/* Triangle */}
              <div className="text-center bg-white rounded-xl p-2 border border-gray-100">
                <svg viewBox="0 0 40 40" className="w-8 h-8 mx-auto mb-1">
                  <polygon points="20,5 4,35 36,35" fill="none" stroke="#374151" strokeWidth="1.5"/>
                  <line x1="20" y1="5" x2="20" y2="35" stroke="#374151" strokeWidth="1" strokeDasharray="2,2"/>
                  <text x="23" y="22" fontSize="5.5" fill="#374151">h</text>
                  <text x="20" y="41" fontSize="6" fill="#374151" textAnchor="middle">b</text>
                </svg>
                <p className="text-[9px] font-bold text-gray-700">A = ½bh</p>
              </div>
            </div>
          </div>

          {/* Pythagorean Theorem */}
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Pythagorean Theorem</p>
            <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
              <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0">
                <polygon points="6,38 38,38 6,10" fill="none" stroke="#374151" strokeWidth="1.5"/>
                <rect x="6" y="30" width="8" height="8" fill="none" stroke="#374151" strokeWidth="1"/>
                <text x="22" y="44" fontSize="6" fill="#374151" textAnchor="middle">a</text>
                <text x="2" y="25" fontSize="6" fill="#374151" textAnchor="middle">b</text>
                <text x="25" y="26" fontSize="6" fill="#374151" textAnchor="middle">c</text>
              </svg>
              <p className="text-sm font-bold text-gray-800">c² = a² + b²</p>
            </div>
          </div>

          {/* Special Right Triangles */}
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Special Right Triangles</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-700 mb-1">30°-60°-90°</p>
                <p className="text-[9px] text-gray-600">x · x√3 · 2x</p>
              </div>
              <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
                <p className="text-[10px] font-bold text-gray-700 mb-1">45°-45°-90°</p>
                <p className="text-[9px] text-gray-600">x · x · x√2</p>
              </div>
            </div>
          </div>

          {/* Volume */}
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Volume</p>
            <div className="space-y-1.5">
              {[
                { label: 'Rectangular Prism', formula: 'V = ℓwh' },
                { label: 'Cylinder',          formula: 'V = πr²h' },
                { label: 'Sphere',            formula: 'V = ⁴⁄₃πr³' },
                { label: 'Cone',              formula: 'V = ⅓πr²h' },
                { label: 'Pyramid',           formula: 'V = ⅓ℓwh' },
              ].map(({ label, formula }) => (
                  <div key={label} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
                    <span className="text-[10px] text-gray-500">{label}</span>
                    <span className="text-[11px] font-bold text-gray-800">{formula}</span>
                  </div>
              ))}
            </div>
          </div>

          {/* Key Facts */}
          <div>
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Key Facts</p>
            <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-1.5">
              <p className="text-[10px] text-gray-600">• A circle contains 360°</p>
              <p className="text-[10px] text-gray-600">• A circle contains 2π radians</p>
              <p className="text-[10px] text-gray-600">• The angles of a triangle sum to 180°</p>
            </div>
          </div>
        </div>
      </div>
  );
}

// Question picker bottom sheet
function QuestionPicker({ questions, currentIdx, answers, markedForReview, onSelect, onClose }) {
  return (
      <div className="fixed inset-0 z-[150] bg-black/50 flex items-end justify-center" onClick={onClose}>
        <div
            className="bg-white rounded-t-3xl w-full max-w-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
          <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">
            Jump to Question
          </p>
          <div className="grid grid-cols-8 gap-2 mb-4">
            {questions.map((q, i) => {
              const answered = !!answers[q.qid];
              const marked   = markedForReview.has(q.qid);
              const isCurrent = i === currentIdx;
              return (
                  <button
                      key={q.qid}
                      onClick={() => { onSelect(i); onClose(); }}
                      className={`aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${
                          isCurrent
                              ? 'bg-indigo-600 text-white shadow-md'
                              : answered
                                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                  >
                    <span>{i + 1}</span>
                    {marked && <span className="text-[8px] leading-none">🔖</span>}
                  </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-400 font-semibold mb-4">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-200 inline-block" /> Answered</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" /> Unanswered</span>
            <span className="flex items-center gap-1">🔖 Marked</span>
          </div>
          <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
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

  const hasImages     = (currentQuestion.images || []).length > 0;
  const hasPassage    = !!currentQuestion.description;
  const isRWWithPassage = !currentModule.isMath && hasPassage;
  const qNotes        = notes[currentQuestion.qid] || [];

  const timerCls = timeLeft <= 120
      ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
      : timeLeft <= 300
          ? 'bg-amber-50 border-amber-200 text-amber-600'
          : 'bg-white border-gray-200 text-slate-700';

  return (
      <div className="absolute inset-0 bg-white flex flex-col select-none overflow-hidden z-[60]">
        {/* Floating calculator */}
        {showCalc && currentModule.calculatorAllowed && <Calculator onClose={() => setShowCalc(false)} />}

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
        <div className="shrink-0 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5">
            {/* Assignment title */}
            <div className="min-w-[120px]">
              <p className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[160px]">{assignment.title}</p>
              <p className="text-[10px] text-gray-400">SAT Assessment</p>
            </div>

            {/* Timer (centered) */}
            <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-bold text-indigo-500 tracking-wide">
              {currentModule.sectionName} · Module {currentModule.moduleNum}
            </span>
              {showTimer ? (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${timerCls}`}>
                    <Clock size={11} />
                    {formatTime(timeLeft)}
                  </div>
              ) : (
                  <span className="text-[11px] text-gray-400 font-medium">Timer hidden</span>
              )}
              <button
                  onClick={() => setShowTimer((p) => !p)}
                  className="text-[10px] text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
              >
                {showTimer ? 'Hide' : 'Show'}
              </button>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 min-w-[120px] justify-end">
              {/* fx References — always visible for math */}
              {currentModule.isMath && (
                  <button
                      onClick={() => setShowMathRef((p) => !p)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors whitespace-nowrap ${
                          showMathRef
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                      }`}
                  >
                    <span className="font-serif italic font-bold">f</span>
                    <span className="text-[9px] -ml-0.5 -mt-1">x</span>
                    <span className="ml-0.5">References</span>
                  </button>
              )}
              {/* Question image references */}
              {hasImages && (
                  <button
                      onClick={() => setShowReferences(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-colors whitespace-nowrap"
                  >
                    📚 Ref
                  </button>
              )}
              {currentModule.calculatorAllowed && (
                  <button
                      onClick={() => setShowCalc((p) => !p)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                          showCalc
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                      }`}
                  >
                    🧮
                  </button>
              )}
              {/* More (⋮) */}
              <div className="relative z-[110]">
                <button
                    onClick={() => setShowMore((p) => !p)}
                    className="w-8 h-8 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg font-bold transition-colors"
                >
                  ⋮
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

        {/* ── CONTENT AREA ── */}
        <div className={`flex-1 overflow-hidden flex ${isRWWithPassage ? 'flex-row' : 'flex-col'}`}>
          {/* Passage panel — RW only */}
          {isRWWithPassage && (
              <div className="w-1/2 h-full overflow-y-auto border-r border-gray-200 p-6 bg-gray-50/40">
                <div
                    className="text-sm text-gray-700 leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-gray-200 [&_th]:px-2 [&_th]:py-1.5 [&_th]:bg-gray-100 [&_th]:font-semibold [&_p]:mb-1"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.description }}
                />
              </div>
          )}

          {/* Question panel */}
          <div className={`${isRWWithPassage ? 'w-1/2' : 'w-full max-w-2xl mx-auto'} h-full overflow-y-auto p-6`}>
            {/* Question stem */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-start gap-3 flex-1">
              <span className="w-7 h-7 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">
                {questionIdx + 1}
              </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                    {currentQuestion.title}
                  </p>
                  {currentQuestion.topic && (
                      <span className="inline-flex mt-1.5 text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-0.5">
                    {currentQuestion.topic}
                  </span>
                  )}
                  {/* Description below title (Math or RW without passage split) */}
                  {!isRWWithPassage && currentQuestion.description && (
                      <div
                          className="text-sm text-gray-600 mt-2 leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-gray-200 [&_th]:px-2 [&_th]:py-1.5 [&_th]:bg-gray-50 [&_th]:font-semibold [&_p]:mb-1"
                          dangerouslySetInnerHTML={{ __html: currentQuestion.description }}
                      />
                  )}
                </div>
              </div>

              {/* Mark for Review */}
              <button
                  onClick={() => toggleMark(currentQuestion.qid)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                      markedForReview.has(currentQuestion.qid)
                          ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600'
                  }`}
              >
                🔖 {markedForReview.has(currentQuestion.qid) ? 'Marked' : 'Mark'}
              </button>
            </div>

            {/* Choices */}
            <div className="flex flex-col gap-2.5">
              {CHOICES.map((choice) => {
                const label      = currentQuestion.choices?.[choice];
                if (!label) return null;
                const isSelected = answers[currentQuestion.qid] === choice;
                const isStruck   = !!strikedChoices[currentQuestion.qid]?.[choice];

                return (
                    <div key={choice} className="flex items-center gap-2">
                      <button
                          onClick={() => !isStruck && handleAnswer(currentQuestion.qid, choice)}
                          className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] text-left transition-all ${
                              isStruck
                                  ? 'opacity-40 border-gray-100 bg-gray-50 cursor-default'
                                  : isSelected
                                      ? 'border-indigo-500 bg-indigo-50'
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                      >
                    <span
                        className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                            isSelected && !isStruck
                                ? 'bg-indigo-500 border-indigo-500 text-white'
                                : 'border-gray-300 text-gray-500'
                        }`}
                    >
                      {choice}
                    </span>
                        <span
                            className={`text-sm flex-1 ${
                                isStruck
                                    ? 'line-through text-gray-400'
                                    : isSelected
                                        ? 'font-semibold text-indigo-700'
                                        : 'text-gray-700'
                            }`}
                        >
                      {label}
                    </span>
                      </button>

                      {/* Strikethrough toggle (S / ↩) */}
                      <button
                          onClick={() => toggleStrike(currentQuestion.qid, choice)}
                          title={isStruck ? 'Restore choice' : 'Eliminate choice'}
                          className={`w-7 h-7 rounded-lg border text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                              isStruck
                                  ? 'bg-gray-700 border-gray-700 text-white'
                                  : 'border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-600'
                          }`}
                      >
                        {isStruck ? '↩' : 'S'}
                      </button>
                    </div>
                );
              })}
            </div>

            {/* Notes indicator */}
            {qNotes.length > 0 && (
                <button
                    onClick={() => setShowNotes(true)}
                    className="mt-4 flex items-center gap-1.5 text-xs text-amber-600 font-semibold hover:text-amber-700 transition-colors"
                >
                  📝 {qNotes.length} note{qNotes.length > 1 ? 's' : ''}
                </button>
            )}
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="shrink-0 bg-white shadow-sm">
          <SATDivider />
          <div className="flex items-center justify-between px-4 py-3">
            {/* Back */}
            <button
                onClick={() => { if (questionIdx > 0) setQuestionIdx((i) => i - 1); }}
                disabled={questionIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Back
            </button>

            {/* Question picker trigger */}
            <button
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
            >
              Question {questionIdx + 1} of {currentModule.questions.length} ▼
            </button>

            {/* Next / Next Module / Submit Test */}
            {!isLastQuestion ? (
                <button
                    onClick={() => setQuestionIdx((i) => i + 1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                >
                  Next →
                </button>
            ) : isLastModule ? (
                <button
                    onClick={handleSubmitModule}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  Submit Test ✓
                </button>
            ) : (
                <button
                    onClick={handleSubmitModule}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
                >
                  Next Module →
                </button>
            )}
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