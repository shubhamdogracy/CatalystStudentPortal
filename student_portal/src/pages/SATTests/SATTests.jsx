/**
 * SATTests.jsx
 *
 * SAT test browsing and taking page.
 *
 * Test-taking UI matches Image #1 / #3:
 *   • Full-screen split layout (left: passage, right: question + choices)
 *   • Top bar: section name · module · Directions  |  large timer  |  tools
 *   • Bottom bar: home button  ·  question picker  ·  Back / Next
 *   • Calculator + References for Math sections (Image #3)
 *   • Design tokens from Image #2 (#80AF81 / #2A2A2A / #F2F2F2 / #FFFFFF)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import MathContent from '../../components/common/MathContent';
import { satService } from '../../services/api';
import DesmosCalculator    from '../Assignments/DesmosCalculator';
import MathReferencesPanel from '../Assignments/MathReferencesPanel';
import { C } from '../Assignments/testConstants';
import {
  SATDivider,
  TestTopBar,
  TestBottomBar,
  SplitContentArea,
  NotesModal,
  QuestionPicker,
} from '../Assignments/TestSharedComponents';

// ─── Constants ─────────────────────────────────────────────────────────────────
const SUBJ_LABEL = { math: 'Math', reading_writing: 'Reading & Writing' };
const SUBJ_STYLE = { math: 'bg-purple-100 text-purple-700', reading_writing: 'bg-blue-100 text-blue-700' };
const TYPE_STYLE = { mock: 'bg-emerald-100 text-emerald-700', diagnostic: 'bg-orange-100 text-orange-700' };

// ─── Question data normaliser ──────────────────────────────────────────────────
// Converts the raw API question shape to the shape expected by SplitContentArea /
// QuestionView. Supports both "adaptive" questions (with separate description +
// title fields) and "practice" questions (with a single stem field).
function normalizeQuestion(q) {
  return {
    ...q,
    _id: q._id || q.id,
    // If a passage / description exists use it; otherwise the stem IS the left-panel content.
    description: q.description || q.stem || null,
    title:       q.title       || null,
    choices: q.choices || {
      A: q.option_a || '',
      B: q.option_b || '',
      C: q.option_c || '',
      D: q.option_d || '',
    },
    format: q.format || 'multiple_choice',
  };
}

// Build answer array for API submission.
const buildAns = (qs, ans) =>
  qs.map(q => ({ question_id: q._id, selected: ans[q._id] || null }));

// ─── Shared full-screen loading / error states ─────────────────────────────────
function FullScreenLoader({ text, spinner = false }) {
  return (
    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: C.bg2 }}>
      {spinner && (
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      )}
      <p className="text-sm font-semibold" style={{ color: C.textMuted }}>{text}</p>
    </div>
  );
}

function FullScreenError({ error, onBack }) {
  return (
    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-4 p-6"
      style={{ backgroundColor: C.bg2 }}>
      <p className="text-sm font-semibold text-center" style={{ color: C.red }}>{error}</p>
      <button onClick={onBack}
        className="px-6 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
        style={{ backgroundColor: C.text, color: '#FFFFFF' }}>
        ← Back to Tests
      </button>
    </div>
  );
}

// ─── Module 1 → 2 transition screen ───────────────────────────────────────────
function ModuleTransition({ m1Result, onContinue, busy }) {
  const pct    = m1Result?.percentage ?? 0;
  const isHard = m1Result?.tier === 'hard';
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6"
      style={{ backgroundColor: C.bg1 }}>
      <div className="rounded-2xl p-8 max-w-sm w-full text-center shadow-sm"
        style={{ backgroundColor: C.bg2, border: `1px solid ${C.border}` }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
          style={{ backgroundColor: C.accentLight }}>
          ✅
        </div>
        <h2 className="text-lg font-extrabold mb-1" style={{ color: C.text }}>Module 1 Complete</h2>
        <p className="text-[12px] mb-6" style={{ color: C.textMuted }}>
          Your Module 2 difficulty has been set based on your score.
        </p>
        <div className="flex justify-center gap-8 mb-5">
          <div>
            <p className="text-2xl font-extrabold" style={{ color: C.text }}>{pct}%</p>
            <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>Score</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold" style={{ color: C.text }}>
              {m1Result?.score}/{m1Result?.max_score}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>Points</p>
          </div>
        </div>
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-6"
          style={isHard
            ? { backgroundColor: '#EFF6FF', color: '#1D4ED8' }
            : { backgroundColor: C.accentLight, color: C.accent }}>
          {isHard ? '📈 Advanced Module 2' : '📊 Standard Module 2'}
        </div>
        <button onClick={onContinue} disabled={busy}
          className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60 transition-all hover:opacity-90"
          style={{ backgroundColor: C.accent }}>
          {busy ? 'Loading…' : 'Begin Module 2 →'}
        </button>
      </div>
    </div>
  );
}

// ─── Adaptive test results ─────────────────────────────────────────────────────
function Section({ label, data, expanded, onToggle }) {
  if (!data) return null;
  const pct = data.max_score > 0 ? Math.round((data.score / data.max_score) * 100) : 0;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}`, backgroundColor: C.bg2 }}>
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold" style={{ color: C.text }}>{label}</p>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${pct >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {data.score}/{data.max_score} ({pct}%)
          </span>
        </div>
        <span className="text-[11px]" style={{ color: C.textMuted }}>{expanded ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-3">
          {(data.breakdown || []).map((b, i) => (
            <div key={i} className={`rounded-xl border p-4 ${b.is_correct ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
              <div className="flex items-start gap-2 mb-2">
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${b.is_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {b.is_correct ? '✓' : '✗'}
                </span>
                <MathContent html={b.stem} className="text-[11px] leading-relaxed [&_p]:m-0" style={{ color: C.text }} />
              </div>
              <div className="flex gap-3 text-[10px] pl-7" style={{ color: C.textMuted }}>
                <span>Your: <strong>{b.selected || '—'}</strong></span>
                <span>Correct: <strong className="text-green-700">{b.correct_answer}</strong></span>
                {b.topic && <span className="ml-auto">{b.topic}</span>}
              </div>
              {b.explanation && (
                <p className="text-[10px] italic mt-2 pl-7 border-t pt-2" style={{ color: C.textMuted, borderColor: C.bg1 }}>
                  {b.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdaptiveResults({ config, results, onDone }) {
  const [expandM1, setExpandM1] = useState(false);
  const [expandM2, setExpandM2] = useState(false);
  const pct    = results.total_max > 0 ? Math.round((results.total_score / results.total_max) * 100) : 0;
  const passed = pct >= 60;
  return (
    <div className="page-content flex flex-col gap-5 max-w-2xl mx-auto">
      <div className="rounded-2xl p-6 flex flex-col items-center gap-3"
        style={{ backgroundColor: C.bg2, border: `1px solid ${C.border}` }}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-black ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {pct}%
        </div>
        <div className="text-center">
          <p className="text-base font-bold" style={{ color: C.text }}>{config.name}</p>
          <p className="text-sm mt-1" style={{ color: C.textMuted }}>
            {results.total_score} / {results.total_max} correct across both modules
          </p>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {passed ? 'Well done!' : 'Keep practicing!'}
        </div>
      </div>
      <Section label="Module 1" data={results.m1} expanded={expandM1} onToggle={() => setExpandM1(v => !v)} />
      <Section label="Module 2" data={results.m2} expanded={expandM2} onToggle={() => setExpandM2(v => !v)} />
      <button onClick={onDone}
        className="w-full py-3 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: C.accent }}>
        Back to Tests
      </button>
    </div>
  );
}

// ─── Practice test results ─────────────────────────────────────────────────────
function PracticeResults({ config, results, onDone }) {
  const pct     = results.percentage || 0;
  const passed  = pct >= 60;
  const correct = results.breakdown?.filter(b => b.is_correct).length || 0;
  const total   = results.breakdown?.length || 0;
  return (
    <div className="page-content flex flex-col gap-5">
      <div className="rounded-2xl p-6 flex flex-col items-center gap-3"
        style={{ backgroundColor: C.bg2, border: `1px solid ${C.border}` }}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {pct}%
        </div>
        <div className="text-center">
          <p className="text-base font-bold" style={{ color: C.text }}>{config.name}</p>
          <p className="text-sm mt-0.5" style={{ color: C.textMuted }}>
            {correct} / {total} correct · {config.topic} → {config.sub_topic}
          </p>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {passed ? 'Great work!' : 'Keep practicing!'}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {(results.breakdown || []).map((b, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${b.is_correct ? 'border-green-200' : 'border-red-200'}`}
            style={{ backgroundColor: C.bg2 }}>
            <div className="flex items-start gap-3 mb-3">
              <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${b.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {b.is_correct ? '✓' : '✗'}
              </span>
              <MathContent html={b.stem} className="text-sm leading-relaxed [&_p]:m-0" style={{ color: C.text }} />
            </div>
            <div className="flex flex-col gap-1.5 pl-9">
              {['A','B','C','D'].map(opt => {
                const text = b['option_' + opt.toLowerCase()]; if (!text) return null;
                const isSel    = b.selected      === opt;
                const isCorrect = b.correct_answer === opt;
                return (
                  <div key={opt}
                    className={`flex items-start gap-2 px-3 py-2 rounded-xl text-[12px] ${isCorrect ? 'bg-green-50 text-green-800 font-semibold' : isSel ? 'bg-red-50 text-red-700' : ''}`}
                    style={!isCorrect && !isSel ? { color: C.textMuted } : {}}>
                    <span className="font-bold shrink-0">{opt}.</span>
                    <MathContent html={text} className="[&_p]:m-0" />
                    {isCorrect && <span className="ml-auto shrink-0 text-green-600">✓ Correct</span>}
                    {isSel && !isCorrect && <span className="ml-auto shrink-0 text-red-500">Your answer</span>}
                  </div>
                );
              })}
              {b.explanation && (
                <p className="text-[11px] italic mt-1.5 border-t pt-1.5"
                  style={{ color: C.textMuted, borderColor: C.bg1 }}>
                  {b.explanation}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <button onClick={onDone}
        className="w-full py-3 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: C.accent }}>
        Back to Practice Tests
      </button>
    </div>
  );
}

// ─── Adaptive test taker (Mock / Diagnostic) ───────────────────────────────────
// Full-screen two-module adaptive UI matching Image #1 / #3.
function AdaptiveTaker({ config, onFinish }) {
  const subject     = config.subject || 'reading_writing';
  const sectionName = subject === 'math' ? 'Mathematics' : 'Reading and Writing';

  // ── Core test state ──
  const [phase,       setPhase]       = useState('loading');
  // 'loading' | 'module1' | 'm1_done' | 'module2' | 'submitting' | 'results' | 'error'
  const [sessionId,   setSessionId]   = useState(null);
  const [questions,   setQuestions]   = useState([]);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [m1Result,    setM1Result]    = useState(null);
  const [results,     setResults]     = useState(null);
  const [error,       setError]       = useState('');

  // ── UI state ──
  const [showCalc,        setShowCalc]        = useState(false);
  const [showMathRef,     setShowMathRef]     = useState(false);
  const [showTimer,       setShowTimer]       = useState(true);
  const [showMore,        setShowMore]        = useState(false);
  const [showPicker,      setShowPicker]      = useState(false);
  const [showNotes,       setShowNotes]       = useState(false);
  const [notes,           setNotes]           = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());

  // ── Refs ──
  const submittingRef  = useRef(false);
  const sessionRef     = useRef(null);
  const questionsRef   = useRef([]);
  const answersRef     = useRef({});
  const m1SavedRef     = useRef(null);
  sessionRef.current   = sessionId;
  questionsRef.current = questions;
  answersRef.current   = answers;

  // ── Notes helpers ──
  const addNote    = (qid, text) => setNotes(p => ({ ...p, [qid]: [...(p[qid] || []), text] }));
  const deleteNote = (qid, i)    => setNotes(p => ({ ...p, [qid]: (p[qid] || []).filter((_, j) => j !== i) }));
  const toggleMark = (qid)       => setMarkedForReview(p => {
    const s = new Set(p); s.has(qid) ? s.delete(qid) : s.add(qid); return s;
  });

  // ── Submit handlers (declared before useEffects that depend on them to avoid TDZ) ──

  const submitM1 = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const res = await satService.submitModule1(
        sessionRef.current, buildAns(questionsRef.current, answersRef.current)
      );
      m1SavedRef.current = {
        score: res.module_1.score, max_score: res.module_1.max_score,
        breakdown: res.breakdown,  questions: [...questionsRef.current],
      };
      setM1Result({ ...res.module_1, tier: res.adaptive?.tier });
      setPhase('m1_done');
    } catch (e) { setError(e.message); }
    finally { submittingRef.current = false; }
  }, []);

  const loadModule2 = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const res = await satService.getModule2(sessionRef.current);
      setQuestions((res.module_2.questions || []).map(normalizeQuestion));
      setTimeLeft(res.module_2.time_limit_minutes * 60);
      setQuestionIdx(0); setAnswers({}); setPhase('module2');
    } catch (e) { setError(e.message); }
    finally { submittingRef.current = false; }
  }, []);

  const submitM2 = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPhase('submitting');
    try {
      const res = await satService.submitModule2(
        sessionRef.current, buildAns(questionsRef.current, answersRef.current)
      );
      const m1 = m1SavedRef.current || {};
      setResults({
        m1,
        m2: { score: res.module_2.score, max_score: res.module_2.max_score, breakdown: res.breakdown, questions: [...questionsRef.current] },
        total_score: (m1.score || 0) + (res.module_2.score || 0),
        total_max:   (m1.max_score || 0) + (res.module_2.max_score || 0),
      });
      setPhase('results');
    } catch (e) { setError(e.message); setPhase('module2'); }
    finally { submittingRef.current = false; }
  }, []);

  // ── Init: start session ──
  useEffect(() => {
    satService.startSessionDirect(config._id)
      .then(res => {
        setSessionId(res.session_id);
        setQuestions((res.module_1.questions || []).map(normalizeQuestion));
        const elapsed = res.module_1.started_at
          ? Math.floor((Date.now() - new Date(res.module_1.started_at).getTime()) / 1000) : 0;
        setTimeLeft(Math.max(0, res.module_1.time_limit_minutes * 60 - elapsed));
        setPhase('module1');
      })
      .catch(e => { setError(e.message); setPhase('error'); });
  }, [config._id]);

  // ── Timer countdown ──
  useEffect(() => {
    if (phase !== 'module1' && phase !== 'module2') return;
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // ── Auto-submit on time-out ──
  useEffect(() => {
    if (timeLeft !== 0) return;
    if (phase === 'module1') submitM1();
    else if (phase === 'module2') submitM2();
  }, [timeLeft, phase, submitM1, submitM2]);

  const handleAnswer = (qid, choice) => setAnswers(p => ({ ...p, [qid]: choice }));
  const handleNext   = () => {
    if (questionIdx < questions.length - 1) setQuestionIdx(i => i + 1);
    else if (phase === 'module1') submitM1();
    else submitM2();
  };

  const moduleLabel    = phase === 'module1' ? 'Module 1' : 'Module 2';
  const currentQuestion = questions[questionIdx];

  // ── Phase renders ──────────────────────────────────────────────────────────
  if (phase === 'loading')    return <FullScreenLoader text="Starting test…" />;
  if (phase === 'submitting') return <FullScreenLoader text="Submitting your test…" spinner />;
  if (phase === 'error')      return <FullScreenError  error={error} onBack={onFinish} />;
  if (phase === 'results')    return <AdaptiveResults  config={config} results={results} onDone={onFinish} />;
  if (phase === 'm1_done')    return (
    <ModuleTransition
      m1Result={m1Result}
      onContinue={loadModule2}
      busy={submittingRef.current}
    />
  );
  if (!currentQuestion) return null;

  // ── Active test UI ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col select-none overflow-hidden z-[110]"
      style={{ backgroundColor: C.bg2 }}>

      {/* Floating math tools */}
      {showCalc    && subject === 'math' && <DesmosCalculator    onClose={() => setShowCalc(false)}    />}
      {showMathRef && subject === 'math' && <MathReferencesPanel onClose={() => setShowMathRef(false)} />}

      {/* More-menu backdrop */}
      {showMore && <div className="fixed inset-0 z-[100]" onClick={() => setShowMore(false)} />}

      {/* Question picker */}
      {showPicker && (
        <QuestionPicker
          questions={questions}
          currentIdx={questionIdx}
          answers={answers}
          markedIds={markedForReview}
          onSelect={i => setQuestionIdx(i)}
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

      {/* Top bar */}
      <TestTopBar
        sectionName={sectionName}
        moduleLabel={moduleLabel}
        subject={subject}
        timeLeft={timeLeft}
        showTimer={showTimer}
        onToggleTimer={() => setShowTimer(p => !p)}
        showCalc={showCalc}
        onToggleCalc={() => setShowCalc(p => !p)}
        showMathRef={showMathRef}
        onToggleMathRef={() => setShowMathRef(p => !p)}
        showMore={showMore}
        onToggleMore={() => setShowMore(p => !p)}
        onOpenNotes={() => { setShowMore(false); setShowNotes(true); }}
        onSubmit={() => { setShowMore(false); if (phase === 'module1') submitM1(); else submitM2(); }}
        onExit={() => { if (window.confirm('Exit the test? Your progress may be lost.')) onFinish(); }}
      />

      {/* Split content: passage (left) · question + choices (right) */}
      <SplitContentArea
        question={currentQuestion}
        answers={answers}
        onAnswer={handleAnswer}
        questionIdx={questionIdx}
        markedIds={markedForReview}
        onToggleMark={toggleMark}
        onOpenNotes={() => setShowNotes(true)}
        notes={notes}
      />

      {/* Bottom bar */}
      <TestBottomBar
        currentIdx={questionIdx}
        totalQuestions={questions.length}
        onBack={() => setQuestionIdx(i => i - 1)}
        onNext={handleNext}
        onOpenPicker={() => setShowPicker(true)}
        isLastQuestion={questionIdx === questions.length - 1}
        nextLabel={
          questionIdx === questions.length - 1
            ? (phase === 'module1' ? 'Submit Module 1' : 'Submit Test')
            : 'Next'
        }
      />

      {/* Inline error toast */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-white text-[12px] font-bold px-5 py-3 rounded-xl shadow-xl z-[300]"
          style={{ backgroundColor: C.red }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Practice test taker ───────────────────────────────────────────────────────
// Full-screen single-module UI — identical layout to AdaptiveTaker.
function PracticeTaker({ config, onFinish }) {
  const subject     = config.subject || 'reading_writing';
  const sectionName = subject === 'math' ? 'Mathematics' : 'Reading and Writing';

  // ── Core test state ──
  const [phase,       setPhase]       = useState('loading');
  // 'loading' | 'taking' | 'submitting' | 'results' | 'error'
  const [sessionId,   setSessionId]   = useState(null);
  const [questions,   setQuestions]   = useState([]);
  const [answers,     setAnswers]     = useState({});
  const [timeLeft,    setTimeLeft]    = useState(null);
  const [results,     setResults]     = useState(null);
  const [error,       setError]       = useState('');
  const [questionIdx, setQuestionIdx] = useState(0);

  // ── UI state ──
  const [showCalc,        setShowCalc]        = useState(false);
  const [showMathRef,     setShowMathRef]     = useState(false);
  const [showTimer,       setShowTimer]       = useState(true);
  const [showMore,        setShowMore]        = useState(false);
  const [showPicker,      setShowPicker]      = useState(false);
  const [showNotes,       setShowNotes]       = useState(false);
  const [notes,           setNotes]           = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());

  // ── Refs ──
  const submittingRef   = useRef(false);
  const questionsRef    = useRef([]);
  const answersRef      = useRef({});
  const sessionRef      = useRef(null);
  const timerRef        = useRef(null);
  const handleSubmitRef = useRef(null);
  questionsRef.current  = questions;
  answersRef.current    = answers;
  sessionRef.current    = sessionId;

  // ── Notes helpers ──
  const addNote    = (qid, text) => setNotes(p => ({ ...p, [qid]: [...(p[qid] || []), text] }));
  const deleteNote = (qid, i)    => setNotes(p => ({ ...p, [qid]: (p[qid] || []).filter((_, j) => j !== i) }));
  const toggleMark = (qid)       => setMarkedForReview(p => {
    const s = new Set(p); s.has(qid) ? s.delete(qid) : s.add(qid); return s;
  });

  // ── Init: start practice session ──
  useEffect(() => {
    satService.startPractice(config._id)
      .then(res => {
        setSessionId(res.session_id);
        setQuestions((res.questions || []).map(normalizeQuestion));
        const elapsed = res.started_at
          ? Math.floor((Date.now() - new Date(res.started_at).getTime()) / 1000) : 0;
        setTimeLeft(Math.max(0, (config.time_limit_minutes || 15) * 60 - elapsed));
        setPhase('taking');
      })
      .catch(e => { setError(e.message); setPhase('error'); });
  }, [config._id, config.time_limit_minutes]);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    clearTimeout(timerRef.current);
    setPhase('submitting');
    const payload = questionsRef.current.map(q => ({
      question_id: q._id,
      selected:    answersRef.current[q._id] || null,
    }));
    try {
      const res = await satService.submitPractice(sessionRef.current, payload);
      setResults(res); setPhase('results');
    } catch (e) { setError(e.message); setPhase('taking'); }
    finally { submittingRef.current = false; }
  }, []);

  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  // ── Timer ──
  useEffect(() => {
    if (phase !== 'taking' || timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmitRef.current(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  });

  const handleAnswer = (qid, choice) => setAnswers(p => ({ ...p, [qid]: choice }));
  const handleNext   = () => {
    if (questionIdx < questions.length - 1) setQuestionIdx(i => i + 1);
    else handleSubmit();
  };

  const currentQuestion = questions[questionIdx];

  // ── Phase renders ──────────────────────────────────────────────────────────
  if (phase === 'loading')    return <FullScreenLoader text="Starting practice test…" />;
  if (phase === 'submitting') return <FullScreenLoader text="Submitting your test…" spinner />;
  if (phase === 'error')      return <FullScreenError  error={error} onBack={onFinish} />;
  if (phase === 'results')    return <PracticeResults  config={config} results={results} onDone={onFinish} />;
  if (!currentQuestion) return null;

  // ── Active test UI ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col select-none overflow-hidden z-[110]"
      style={{ backgroundColor: C.bg2 }}>

      {/* Floating math tools */}
      {showCalc    && subject === 'math' && <DesmosCalculator    onClose={() => setShowCalc(false)}    />}
      {showMathRef && subject === 'math' && <MathReferencesPanel onClose={() => setShowMathRef(false)} />}

      {/* More-menu backdrop */}
      {showMore && <div className="fixed inset-0 z-[100]" onClick={() => setShowMore(false)} />}

      {/* Question picker */}
      {showPicker && (
        <QuestionPicker
          questions={questions}
          currentIdx={questionIdx}
          answers={answers}
          markedIds={markedForReview}
          onSelect={i => setQuestionIdx(i)}
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

      {/* Top bar */}
      <TestTopBar
        sectionName={sectionName}
        moduleLabel="Practice Test"
        subject={subject}
        timeLeft={timeLeft}
        showTimer={showTimer}
        onToggleTimer={() => setShowTimer(p => !p)}
        showCalc={showCalc}
        onToggleCalc={() => setShowCalc(p => !p)}
        showMathRef={showMathRef}
        onToggleMathRef={() => setShowMathRef(p => !p)}
        showMore={showMore}
        onToggleMore={() => setShowMore(p => !p)}
        onOpenNotes={() => { setShowMore(false); setShowNotes(true); }}
        onSubmit={() => { setShowMore(false); handleSubmit(); }}
        onExit={() => { if (window.confirm('Exit the test? Your progress may be lost.')) onFinish(); }}
      />

      {/* Split content: passage (left) · question + choices (right) */}
      <SplitContentArea
        question={currentQuestion}
        answers={answers}
        onAnswer={handleAnswer}
        questionIdx={questionIdx}
        markedIds={markedForReview}
        onToggleMark={toggleMark}
        onOpenNotes={() => setShowNotes(true)}
        notes={notes}
      />

      {/* Bottom bar */}
      <TestBottomBar
        currentIdx={questionIdx}
        totalQuestions={questions.length}
        onBack={() => setQuestionIdx(i => i - 1)}
        onNext={handleNext}
        onOpenPicker={() => setShowPicker(true)}
        isLastQuestion={questionIdx === questions.length - 1}
        nextLabel={questionIdx === questions.length - 1 ? 'Submit Test' : 'Next'}
      />

      {/* Inline error toast */}
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-white text-[12px] font-bold px-5 py-3 rounded-xl shadow-xl z-[300]"
          style={{ backgroundColor: C.red }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Browse lists (unchanged from original) ────────────────────────────────────
function AdaptiveConfigList({ onStart, defaultFilter = 'all', isGuest = false }) {
  const [configs,  setConfigs]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [filter,   setFilter]   = useState(defaultFilter);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await satService.listExamConfigs();
      setConfigs(res.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const applyGuestLimit = list => {
    if (!isGuest) return list;
    const diagnostics = list.filter(c => c.type === 'diagnostic');
    const others      = list.filter(c => c.type !== 'diagnostic');
    return [...others, ...diagnostics.slice(0, 1)];
  };

  const base     = applyGuestLimit(configs);
  const filtered = filter === 'all' ? base : base.filter(c => c.type === filter || c.subject === filter);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading tests…</div>
  );

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="font-bold underline ml-3">Retry</button>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">Adaptive two-module format · Start anytime</p>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { key: 'all', label: 'All' }, { key: 'mock', label: 'Mock' },
            { key: 'diagnostic', label: 'Diagnostic' }, { key: 'math', label: 'Math' },
            { key: 'reading_writing', label: 'R&W' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-[10px] text-xs font-bold transition-all ${filter === f.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-3">📋</span>
          <h3 className="text-base font-extrabold text-slate-700 mb-1">No tests available</h3>
          <p className="text-sm text-slate-400">Check back once your operations team adds tests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(cfg => (
            <div key={cfg._id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all p-5 flex flex-col gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900 leading-snug">{cfg.name}</p>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SUBJ_STYLE[cfg.subject]}`}>{SUBJ_LABEL[cfg.subject]}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${TYPE_STYLE[cfg.type] || 'bg-gray-100 text-gray-600'}`}>{cfg.type}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-4 text-xs text-slate-500">
                <span>{cfg.module_1?.total_questions}Q / module</span>
                <span>·</span><span>{cfg.module_1?.time_limit_minutes} min / module</span>
                <span>·</span><span>2 modules</span>
              </div>
              <button onClick={() => onStart(cfg)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                Start Test →
              </button>
            </div>
          ))}
          {isGuest && filter === 'diagnostic' && configs.filter(c => c.type === 'diagnostic').length > 1 && (
            <div className="sm:col-span-2 flex items-center gap-4 px-5 py-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50">
              <span className="text-2xl shrink-0">🔒</span>
              <div>
                <p className="text-sm font-bold text-indigo-800">More diagnostic tests available</p>
                <p className="text-xs text-indigo-600 mt-0.5">Upgrade to a full account to unlock all tests.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Practice config list ──────────────────────────────────────────────────────
// onStart:       starts a new practice session for the given config
// onViewResults: shows the results of the latest completed session (session id passed as 2nd arg)
function PracticeConfigList({ onStart, onViewResults }) {
  const [configs,  setConfigs]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [subject,  setSubject]  = useState('all');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [configRes, historyRes] = await Promise.all([
        satService.listPractice(), satService.getPracticeHistory(),
      ]);
      setConfigs(configRes.data || []);
      setHistory(historyRes.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build a map of best score and latest session ID per config from completed sessions
  const bestScores    = {};
  const latestSession = {};
  history.filter(s => s.status === 'complete').forEach(s => {
    const id = s.practice_config_id?._id || s.practice_config_id;
    if (!bestScores[id] || s.percentage > bestScores[id]) {
      bestScores[id]    = s.percentage;
      latestSession[id] = s._id; // session id used to fetch results
    }
  });

  const filtered = subject === 'all' ? configs : configs.filter(c => c.subject === subject);

  if (loading) return <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading practice tests…</div>;

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="font-bold underline ml-3">Retry</button>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">10 questions per test · Topic-focused · Instant results</p>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {['all', 'math', 'reading_writing'].map(s => (
            <button key={s} onClick={() => setSubject(s)}
              className={`px-3 py-1 rounded-[10px] text-xs font-bold transition-all ${subject === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {s === 'all' ? 'All' : SUBJ_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-3">📚</span>
          <h3 className="text-base font-extrabold text-slate-700 mb-1">No practice tests available</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(cfg => {
            const best = bestScores[cfg._id];
            return (
              <div key={cfg._id}
                className="bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-all p-5 flex flex-col gap-3"
                style={{ borderColor: C.border }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 leading-snug">{cfg.name}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SUBJ_STYLE[cfg.subject]}`}>{SUBJ_LABEL[cfg.subject]}</span>
                      {cfg.is_demo_accessible && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Free</span>}
                    </div>
                  </div>
                  {best !== undefined && (
                    <div className={`shrink-0 text-center px-2.5 py-1 rounded-xl ${best >= 70 ? 'bg-green-50' : best >= 50 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                      <p className={`text-xs font-bold ${best >= 70 ? 'text-green-700' : best >= 50 ? 'text-yellow-700' : 'text-red-600'}`}>{best}%</p>
                      <p className="text-[9px] text-slate-400">best</p>
                    </div>
                  )}
                </div>
                <div className="rounded-xl p-3 flex flex-col gap-1" style={{ backgroundColor: C.bg1 }}>
                  <div className="flex gap-2 text-xs"><span className="w-14" style={{ color: C.textMuted }}>Topic</span><span className="font-medium" style={{ color: C.text }}>{cfg.topic}</span></div>
                  <div className="flex gap-2 text-xs"><span className="w-14" style={{ color: C.textMuted }}>Sub-Topic</span><span className="font-medium" style={{ color: C.text }}>{cfg.sub_topic}</span></div>
                  <div className="flex gap-4 mt-1 text-[11px]" style={{ color: C.textMuted }}>
                    <span>{cfg.total_questions} questions</span><span>·</span><span>{cfg.time_limit_minutes} min</span>
                  </div>
                </div>
                {/* Show "View Results" after completion, "Start Practice" for new attempts */}
                {best !== undefined ? (
                  <button
                    onClick={() => onViewResults(cfg, latestSession[cfg._id])}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                    View Results →
                  </button>
                ) : (
                  <button
                    onClick={() => onStart(cfg)}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-all"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                    Start Practice →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Past practice results viewer ─────────────────────────────────────────────
// Fetches the results of a previously completed practice session and renders them.
function PracticeResultsViewer({ config, sessionId, onDone }) {
  const [results, setResults] = useState(null);
  const [error,   setError]   = useState('');

  useEffect(() => {
    satService.getPracticeResults(sessionId)
      .then(res => setResults(res))
      .catch(e  => setError(e.message));
  }, [sessionId]);

  if (error)   return <FullScreenError error={error} onBack={onDone} />;
  if (!results) return <FullScreenLoader text="Loading results…" spinner />;

  return <PracticeResults config={config} results={results} onDone={onDone} />;
}

// ─── Main page ─────────────────────────────────────────────────────────────────
// defaultTab: 'mock' | 'diagnostic' | 'practice' — driven by the sidebar selection.
export default function SATTests({ student, onTestStart, onTestEnd, defaultTab = 'mock' }) {
  const isGuest = student?.role === 'guest' || student?.accountType === 'guest';
  const [tab,        setTab]        = useState(defaultTab);
  const [activeTest, setActiveTest] = useState(null);
  // activeTest: { type: 'adaptive' | 'practice' | 'practiceView', config, sessionId? }

  // Sync the active tab whenever the sidebar navigates to a different sub-page.
  useEffect(() => { setTab(defaultTab); }, [defaultTab]);

  const handleStart = (type, config) => {
    onTestStart?.();
    setActiveTest({ type, config });
  };

  // Called from PracticeConfigList when "View Results →" is clicked
  const handleViewResults = (config, sessionId) => {
    setActiveTest({ type: 'practiceView', config, sessionId });
  };

  const handleFinish = () => {
    setActiveTest(null);
    onTestEnd?.();
  };

  // ── Full-screen test takers and result viewers ──
  if (activeTest?.type === 'adaptive') {
    return <AdaptiveTaker config={activeTest.config} onFinish={handleFinish} />;
  }
  if (activeTest?.type === 'practice') {
    return <PracticeTaker config={activeTest.config} onFinish={handleFinish} />;
  }
  if (activeTest?.type === 'practiceView') {
    return (
      <PracticeResultsViewer
        config={activeTest.config}
        sessionId={activeTest.sessionId}
        onDone={handleFinish}
      />
    );
  }

  // ── Browse / landing page ──
  // No heading or tab switcher — navigation is handled exclusively via the sidebar.
  return (
    <div className="page-content">

      {tab === 'practice' ? (
        <PracticeConfigList
          onStart={cfg => handleStart('practice', cfg)}
          onViewResults={handleViewResults}
        />
      ) : (
        <AdaptiveConfigList
          key={tab}
          defaultFilter={tab}
          isGuest={isGuest}
          onStart={cfg => handleStart('adaptive', cfg)}
        />
      )}
    </div>
  );
}
