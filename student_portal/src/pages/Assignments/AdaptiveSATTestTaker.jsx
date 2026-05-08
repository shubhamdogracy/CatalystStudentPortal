import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Clock, Calculator as CalcIcon, Bookmark, ChevronDown } from 'lucide-react';
import { satService } from '../../services/api';
import { StudentReportModal } from './StudentReportModal';
import DesmosCalculator from './DesmosCalculator';
import MathReferencesPanel from './MathReferencesPanel';

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildAnswers(questions, answersMap) {
  return questions.map((q) => ({
    question_id: q._id,
    selected: answersMap[q._id] || null,
  }));
}

// Converts session data into the shape StudentReportModal expects.
// m1Data / m2Data: { score, max_score, breakdown, questions? }
// When questions is null (fetched from getResults), breakdown items carry choices+description.
function buildReportData({ subject, testName, studentName, m1Data, m2Data }) {
  const sectionId   = subject === 'math' ? 'math' : 'rw';
  const sectionName = subject === 'math' ? 'Math' : 'Reading and Writing';

  const toAnswersMap = (breakdown) =>
    Object.fromEntries(
      (breakdown || [])
        .filter((b) => b.question_id)
        .map((b) => [b.question_id.toString(), b.selected]),
    );

  const buildQuestions = (questions, breakdown) => {
    if (!questions || questions.length === 0) {
      // getResults path: breakdown carries full question data including choices
      return (breakdown || []).map((b) => ({
        qid:           b.question_id?.toString(),
        id:            b.question_id?.toString(),
        title:         b.title,
        description:   b.description,
        choices:       b.choices,
        correctAnswer: b.correct_answer,
        topic:         b.topic,
        score:         b.points || 1,
        explanation:   b.explanation,
      }));
    }
    // In-memory path: questions have choices; correctAnswer comes from breakdown
    const bdByQId = Object.fromEntries(
      (breakdown || [])
        .filter((b) => b.question_id)
        .map((b) => [b.question_id.toString(), b]),
    );
    return questions.map((q) => {
      const qId = (q._id || q.id)?.toString();
      const bd  = bdByQId[qId] || {};
      return {
        qid:           qId,
        id:            qId,
        title:         q.title,
        description:   q.description,
        choices:       q.choices,
        correctAnswer: bd.correct_answer,
        topic:         q.topic,
        score:         q.points || 1,
        explanation:   bd.explanation,
      };
    });
  };

  const totalScore = (m1Data.score || 0) + (m2Data.score || 0);
  const totalMax   = (m1Data.max_score || 0) + (m2Data.max_score || 0);
  const totalPct   = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const attempt = {
    studentName,
    score:       totalScore,
    maxScore:    totalMax,
    percentage:  totalPct,
    passed:      totalPct >= 60,
    completedAt: new Date().toISOString(),
    sectionResults: [{
      sectionId,
      sectionName,
      modules: [
        {
          moduleNumber: 1,
          score:    m1Data.score    || 0,
          maxScore: m1Data.max_score || 0,
          timeTaken: null,
          answers:  toAnswersMap(m1Data.breakdown),
        },
        {
          moduleNumber: 2,
          score:    m2Data.score    || 0,
          maxScore: m2Data.max_score || 0,
          timeTaken: null,
          answers:  toAnswersMap(m2Data.breakdown),
        },
      ],
    }],
  };

  const assignment = {
    title:    testName,
    sections: [{
      id:      sectionId,
      sid:     sectionId,
      name:    sectionName,
      modules: [
        { number: 1, timeLimit: null, questions: buildQuestions(m1Data.questions, m1Data.breakdown) },
        { number: 2, timeLimit: null, questions: buildQuestions(m2Data.questions, m2Data.breakdown) },
      ],
    }],
  };

  return { attempt, assignment };
}

// ── Question view ────────────────────────────────────────────
// Renders only the question header + choices; description/passage is handled at layout level.
function QuestionView({ question, answers, onAnswer, index, markedIds, onToggleMark, onOpenNotes, noteCount, showTitle }) {
  const selected = answers[question._id];
  const isMarked = markedIds?.has(question._id);

  return (
    <div className="flex flex-col gap-4">
      {/* Question header row */}
      <div className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl" style={{ backgroundColor: '#F2F2F2' }}>
        <span
          className="w-8 h-8 text-sm font-extrabold rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#2A2A2A', color: '#FFFFFF' }}
        >
          {index + 1}
        </span>
        <button
          onClick={() => onToggleMark?.(question._id)}
          className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
          style={{ color: isMarked ? '#80AF81' : '#2A2A2A99' }}
        >
          <Bookmark size={13} fill={isMarked ? '#80AF81' : 'none'} stroke={isMarked ? '#80AF81' : 'currentColor'} strokeWidth={2} />
          Mark for Review
        </button>
        <div className="flex-1" />
        <button className="text-[11px] font-semibold transition-colors hover:opacity-70" style={{ color: '#ef4444' }}>
          Report Issue
        </button>
        <button
          onClick={() => onOpenNotes?.()}
          className="px-2.5 py-1 rounded border text-[11px] font-bold tracking-wide transition-colors"
          style={
            noteCount > 0
              ? { borderColor: '#80AF81', backgroundColor: '#80AF8115', color: '#80AF81' }
              : { borderColor: '#e5e7eb', color: '#2A2A2A99', backgroundColor: '#FFFFFF' }
          }
        >
          {noteCount > 0 ? `📝 ${noteCount}` : 'ABC'}
        </button>
      </div>

      {/* Topic tag */}
      {question.topic && (
        <span
          className="self-start text-[10px] font-semibold rounded-full px-2.5 py-0.5"
          style={{ color: '#80AF81', backgroundColor: '#80AF8115', border: '1px solid #80AF8140' }}
        >
          {question.topic}
        </span>
      )}

      {/* Question title — only shown on right when description/passage is on the left */}
      {showTitle && (
        <p className="text-[14px] font-medium leading-relaxed mb-1" style={{ color: '#2A2A2A' }}>{question.title}</p>
      )}

      {/* Answer choices */}
      <div className="flex flex-col gap-3">
        {['A', 'B', 'C', 'D'].map((opt) => {
          const label = question.choices?.[opt];
          if (!label) return null;
          const isSelected = selected === opt;
          return (
            <button
              key={opt}
              onClick={() => onAnswer(question._id, opt)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all"
              style={
                isSelected
                  ? { borderColor: '#80AF81', backgroundColor: '#80AF8110' }
                  : { borderColor: '#e5e7eb', backgroundColor: '#FFFFFF' }
              }
            >
              <span
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 transition-all"
                style={
                  isSelected
                    ? { backgroundColor: '#80AF81', borderColor: '#80AF81', color: '#FFFFFF' }
                    : { borderColor: '#d1d5db', color: '#2A2A2A99', backgroundColor: '#FFFFFF' }
                }
              >
                {opt}
              </span>
              <span
                className="text-sm flex-1 leading-relaxed"
                style={{ color: '#2A2A2A', fontWeight: isSelected ? 600 : 400 }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Notes modal ─────────────────────────────────────────────
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
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#F2F2F2', background: 'linear-gradient(135deg, #f0f7f0, #f9fdf9)' }}>
          <div>
            <h3 className="text-sm font-bold" style={{ color: '#2A2A2A' }}>Notes for this question</h3>
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

        {/* Existing notes */}
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
                className="text-xs shrink-0 mt-0.5 transition-colors hover:opacity-70"
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

// ── Question picker bottom sheet ────────────────────────────
function QuestionPicker({ questions, currentIdx, answers, markedIds, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[150] bg-black/40 flex items-end justify-center pb-6" onClick={onClose}>
      <div
        className="rounded-3xl w-full max-w-2xl mx-4 p-5 shadow-2xl"
        style={{ backgroundColor: '#FFFFFF' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: '#F2F2F2' }} />

        <p className="text-[11px] font-extrabold uppercase tracking-widest mb-3" style={{ color: '#80AF81' }}>
          Jump to Question
        </p>

        <div className="grid grid-cols-8 gap-2 mb-5">
          {questions.map((q, i) => {
            const qid       = q._id || q.qid;
            const answered  = !!answers[qid];
            const marked    = markedIds?.has(qid);
            const isCurrent = i === currentIdx;
            return (
              <button
                key={qid}
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

// ── Module 1 → Module 2 transition ──────────────────────────
function ModuleTransition({ m1Result, onContinue, busy }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl mx-auto mb-5">
          ✅
        </div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">Module 1 Complete</h2>
        <p className="text-xs text-gray-400 mb-6">Your Module 2 difficulty has been set based on your score.</p>

        <div className="flex justify-center gap-8 mb-5">
          <div>
            <p className="text-2xl font-extrabold text-gray-900">{m1Result.percentage}%</p>
            <p className="text-xs text-gray-400 mt-0.5">Score</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-900">{m1Result.score}/{m1Result.max_score}</p>
            <p className="text-xs text-gray-400 mt-0.5">Points</p>
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-6 ${
          m1Result.tier === 'hard' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {m1Result.tier === 'hard' ? '📈 Advanced Module 2' : '📊 Standard Module 2'}
        </div>

        <button
          onClick={onContinue}
          disabled={busy}
          className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60 transition-all"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          {busy ? 'Loading…' : 'Begin Module 2 →'}
        </button>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
export default function AdaptiveSATTestTaker({ satAssignment, student, onBack }) {
  const testName =
    satAssignment.exam_config_id?.name ||
    satAssignment.full_length_exam_config_id?.name ||
    'SAT Practice Test';
  const subject     = satAssignment.exam_config_id?.subject || 'math';
  const studentName = student?.name || 'Student';

  const [phase,       setPhase]       = useState('loading');
  // 'loading' | 'module1' | 'm1_done' | 'module2' | 'submitting' | 'report' | 'error'
  const [sessionId,   setSessionId]   = useState(null);
  const [questions,   setQuestions]   = useState([]);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [m1Result,    setM1Result]    = useState(null);
  const [reportData,  setReportData]  = useState(null);
  const [error,       setError]       = useState('');
  const [showCalc,        setShowCalc]        = useState(false);
  const [showMathRef,     setShowMathRef]     = useState(false);
  const [showTimer,       setShowTimer]       = useState(true);
  const [showMore,        setShowMore]        = useState(false);
  const [showPicker,      setShowPicker]      = useState(false);
  const [showNotes,       setShowNotes]       = useState(false);
  const [notes,           setNotes]           = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());

  const addNote    = (qid, text) => setNotes((prev) => ({ ...prev, [qid]: [...(prev[qid] || []), text] }));
  const deleteNote = (qid, idx)  => setNotes((prev) => ({ ...prev, [qid]: (prev[qid] || []).filter((_, i) => i !== idx) }));

  const toggleMark = (qid) =>
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      next.has(qid) ? next.delete(qid) : next.add(qid);
      return next;
    });

  const submittingRef  = useRef(false);
  const sessionRef     = useRef(null);
  const questionsRef   = useRef([]);
  const answersRef     = useRef({});
  const m1SavedRef     = useRef(null);   // { score, max_score, breakdown, questions }

  sessionRef.current   = sessionId;
  questionsRef.current = questions;
  answersRef.current   = answers;

  // Init: load results for completed, or start/resume session
  useEffect(() => {
    if (satAssignment.status === 'completed' && satAssignment.session_id) {
      satService.getResults(satAssignment.session_id)
        .then((res) => {
          const data = res.data;
          const report = buildReportData({
            subject:     data.subject || subject,
            testName,
            studentName,
            m1Data: {
              score:     data.module_1.score,
              max_score: data.module_1.max_score,
              breakdown: data.module_1.breakdown,
              questions: null,
            },
            m2Data: {
              score:     data.module_2?.score,
              max_score: data.module_2?.max_score,
              breakdown: data.module_2?.breakdown,
              questions: null,
            },
          });
          setReportData(report);
          setPhase('report');
        })
        .catch((e) => { setError(e.message); setPhase('error'); });
    } else {
      satService.startSession(satAssignment._id)
        .then((res) => {
          setSessionId(res.session_id);
          setQuestions(res.module_1.questions);
          setTimeLeft(res.module_1.time_limit_minutes * 60);
          setPhase('module1');
        })
        .catch((e) => { setError(e.message); setPhase('error'); });
    }
  }, [satAssignment._id]); // eslint-disable-line

  // Timer countdown
  useEffect(() => {
    if (phase !== 'module1' && phase !== 'module2') return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft !== 0) return;
    if (phase === 'module1') submitM1();
    else if (phase === 'module2') submitM2();
  }, [timeLeft]); // eslint-disable-line

  const submitM1 = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const res = await satService.submitModule1(
        sessionRef.current,
        buildAnswers(questionsRef.current, answersRef.current),
      );
      // Save M1 data for later use in buildReportData
      m1SavedRef.current = {
        score:     res.module_1.score,
        max_score: res.module_1.max_score,
        breakdown: res.breakdown,
        questions: [...questionsRef.current],
      };
      setM1Result({ ...res.module_1, tier: res.adaptive?.tier });
      setPhase('m1_done');
    } catch (e) {
      setError(e.message);
    } finally {
      submittingRef.current = false;
    }
  }, []);

  const loadModule2 = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const res = await satService.getModule2(sessionRef.current);
      setQuestions(res.module_2.questions);
      setTimeLeft(res.module_2.time_limit_minutes * 60);
      setQuestionIdx(0);
      setAnswers({});
      setPhase('module2');
    } catch (e) {
      setError(e.message);
    } finally {
      submittingRef.current = false;
    }
  }, []);

  const submitM2 = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPhase('submitting');
    try {
      const res = await satService.submitModule2(
        sessionRef.current,
        buildAnswers(questionsRef.current, answersRef.current),
      );
      const m1 = m1SavedRef.current || {};
      const report = buildReportData({
        subject,
        testName,
        studentName,
        m1Data: {
          score:     m1.score,
          max_score: m1.max_score,
          breakdown: m1.breakdown,
          questions: m1.questions,
        },
        m2Data: {
          score:     res.module_2.score,
          max_score: res.module_2.max_score,
          breakdown: res.breakdown,
          questions: [...questionsRef.current],
        },
      });
      setReportData(report);
      setPhase('report');
    } catch (e) {
      setError(e.message);
      setPhase('module2');
    } finally {
      submittingRef.current = false;
    }
  }, []); // eslint-disable-line

  const handleAnswer = (qid, choice) =>
    setAnswers((prev) => ({ ...prev, [qid]: choice }));

  const handleNext = () => {
    if (questionIdx < questions.length - 1) {
      setQuestionIdx((i) => i + 1);
    } else {
      if (phase === 'module1') submitM1();
      else submitM2();
    }
  };

  // ── Phase renders ────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="page-content flex items-center justify-center py-32 text-slate-400 text-sm">
        {satAssignment.status === 'completed' ? 'Loading results…' : 'Loading SAT test…'}
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="page-content">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-indigo-600 font-semibold mb-6">
          <ChevronLeft size={16} /> Back
        </button>
        <div className="card p-6 text-center">
          <p className="text-red-500 font-semibold mb-4">{error}</p>
          <button onClick={onBack} className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-100 text-gray-700">
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'report' && reportData) {
    return (
      <StudentReportModal
        attempt={reportData.attempt}
        assignment={reportData.assignment}
        onClose={onBack}
        isStudentView={true}
      />
    );
  }

  if (phase === 'm1_done') {
    return (
      <ModuleTransition
        m1Result={m1Result}
        onContinue={loadModule2}
        busy={submittingRef.current}
      />
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="page-content flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-600">Submitting your test…</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[questionIdx];
  if (!currentQuestion) return null;

  const isLastQuestion  = questionIdx === questions.length - 1;
  // Always split — description (or title when no description) on left, choices on right
  const hasDescription  = !!currentQuestion.description;
  const sectionLabel    = subject === 'math' ? 'Mathematics' : 'Reading and Writing';
  const moduleLabel     = phase === 'module1' ? 'Module 1' : 'Module 2';

  const timerColor = timeLeft <= 120 ? '#ef4444' : timeLeft <= 300 ? '#d97706' : '#2A2A2A';
  const timerCls   = timeLeft <= 120 ? 'animate-pulse' : '';

  // Colorful dashed SAT-style divider
  const SATDivider = () => {
    const colors = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];
    return (
      <div className="flex h-[3px]">
        {colors.map((color, i) => (
          <div key={i} className="flex-1 border-t-2 border-dashed" style={{ borderColor: color }} />
        ))}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-white flex flex-col select-none overflow-hidden z-[60]">
      {/* Floating panels — math subject only */}
      {showCalc    && subject === 'math' && <DesmosCalculator   onClose={() => setShowCalc(false)}    />}
      {showMathRef && subject === 'math' && <MathReferencesPanel onClose={() => setShowMathRef(false)} />}

      {/* More menu backdrop */}
      {showMore && <div className="fixed inset-0 z-[100]" onClick={() => setShowMore(false)} />}

      {/* Question picker */}
      {showPicker && (
        <QuestionPicker
          questions={questions}
          currentIdx={questionIdx}
          answers={answers}
          markedIds={markedForReview}
          onSelect={(i) => setQuestionIdx(i)}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Notes modal */}
      {showNotes && (
        <NotesModal
          qid={currentQuestion._id}
          notes={notes}
          onAdd={addNote}
          onDelete={deleteNote}
          onClose={() => setShowNotes(false)}
        />
      )}

      {/* ── TOP BAR ── */}
      <div className="shrink-0 bg-white">
        <div className="flex items-center justify-between px-6 py-3 gap-4">

          {/* Left: Section name + module + Directions */}
          <div className="flex flex-col gap-0.5 min-w-[180px]">
            <p className="text-[15px] font-extrabold text-gray-900 leading-tight">{sectionLabel}</p>
            <p className="text-[11px] text-gray-500 font-medium">{moduleLabel}</p>
            <button
              onClick={() => { if (window.confirm('Exit the test? Your progress may be lost.')) onBack(); }}
              className="self-start mt-1.5 flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={10} /> Exit
            </button>
          </div>

          {/* Center: Large timer */}
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
            {subject === 'math' && (
              <>
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
              </>
            )}

            {/* More (⋮) — always visible */}
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
                <div className="absolute right-0 top-11 z-[110] rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #e5e7eb', width: '200px' }}>
                  <button
                    onClick={() => { setShowMore(false); setShowNotes(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-gray-50"
                    style={{ color: '#2A2A2A' }}
                  >
                    <span className="text-base">📝</span>
                    <span className="font-semibold">Add Notes</span>
                  </button>
                  <div style={{ borderTop: '1px solid #F2F2F2' }} />
                  <button
                    onClick={() => { setShowMore(false); if (phase === 'module1') submitM1(); else submitM2(); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-red-50"
                    style={{ color: '#ef4444' }}
                  >
                    <span className="text-base">✅</span>
                    <span className="font-semibold">Submit Test</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <SATDivider />
      </div>

      {/* ── CONTENT AREA — always split left / right ── */}
      <div className="flex-1 overflow-hidden flex flex-row" style={{ backgroundColor: '#F2F2F2' }}>

        {/* ── LEFT PANEL: description/passage OR question title ── */}
        <div className="w-1/2 h-full overflow-y-auto border-r" style={{ backgroundColor: '#FFFFFF', borderColor: '#e5e7eb' }}>
          <div className="p-8">
            {hasDescription ? (
              <div
                className="text-sm leading-7 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-gray-200 [&_th]:px-2 [&_th]:py-1.5 [&_th]:bg-gray-50 [&_th]:font-semibold [&_p]:mb-2"
                style={{ color: '#2A2A2A' }}
                dangerouslySetInnerHTML={{ __html: currentQuestion.description }}
              />
            ) : (
              <p className="text-[15px] font-medium leading-relaxed" style={{ color: '#2A2A2A' }}>
                {currentQuestion.title}
              </p>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: header + (title if description) + choices ── */}
        <div className="w-1/2 h-full overflow-y-auto" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="p-6 pt-5">
            <QuestionView
              question={currentQuestion}
              answers={answers}
              onAnswer={handleAnswer}
              index={questionIdx}
              total={questions.length}
              markedIds={markedForReview}
              onToggleMark={toggleMark}
              showTitle={hasDescription}
              onOpenNotes={() => setShowNotes(true)}
              noteCount={(notes[currentQuestion._id] || []).length}
            />
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
              onClick={() => setQuestionIdx((i) => i - 1)}
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
            Question {questionIdx + 1} of {questions.length}
            <ChevronDown size={14} />
          </button>

          {/* Right: Next / Submit */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={handleNext}
              disabled={submittingRef.current}
              className="px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 transition-colors shadow-sm"
              style={
                isLastQuestion
                  ? { backgroundColor: '#80AF81', color: '#FFFFFF' }
                  : { backgroundColor: '#2A2A2A', color: '#FFFFFF' }
              }
            >
              {isLastQuestion
                ? phase === 'module1' ? 'Submit Module 1' : 'Submit Test'
                : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-5 py-3 rounded-xl shadow-xl z-[300]">
          {error}
        </div>
      )}
    </div>
  );
}
