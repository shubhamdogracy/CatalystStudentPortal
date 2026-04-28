import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, Clock, CheckCircle, XCircle, Calculator as CalcIcon } from 'lucide-react';
import { assignmentService } from '../../services/api';
import Calculator from './Calculator';

const CHOICES = ['A', 'B', 'C', 'D'];

function QuestionCard({ question, selected, onSelect, number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[10px] p-5 mb-3">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-6 h-6 bg-indigo-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">
          {number}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">{question.title}</p>
          {question.description && (
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{question.description}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 pl-9">
        {CHOICES.map((choice) => {
          const label = question.choices?.[choice];
          if (!label) return null;
          const isSelected = selected === choice;
          return (
            <button
              key={choice}
              onClick={() => onSelect(question.qid, choice)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-[1.5px] text-left transition-all text-sm ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full border-[1.5px] flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-500 text-white'
                    : 'border-slate-300 text-slate-500'
                }`}
              >
                {choice}
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Start Screen ─────────────────────────────────────────────
function StartScreen({ assignment, onBegin, onBack, error }) {
  const sections = assignment.sections || [];
  const totalQs  = sections.reduce((a, s) => a + s.modules.reduce((b, m) => b + m.questions.length, 0), 0);
  const totalTime = sections.reduce((a, s) => a + s.modules.reduce((b, m) => b + (m.timeLimit || 0), 0), 0);

  return (
    <div className="page-content">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-indigo-600 font-semibold mb-6 hover:text-indigo-800 transition-colors">
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

          <div className="flex justify-center gap-8 mb-6 text-sm text-slate-600">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl font-extrabold text-indigo-600">{totalQs}</span>
              <span className="text-xs text-slate-400">Questions</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl font-extrabold text-indigo-600">{totalTime}</span>
              <span className="text-xs text-slate-400">Minutes</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xl font-extrabold text-indigo-600">{assignment.passingScore}%</span>
              <span className="text-xs text-slate-400">Pass Mark</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 mb-6 text-left">
            {sections.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 text-sm">
                <span>{s.name.toLowerCase().includes('math') ? '🔢' : '📖'}</span>
                <span className="font-semibold text-slate-700">{s.name}</span>
                <span className="ml-auto text-slate-400">
                  {s.modules.reduce((a, m) => a + m.questions.length, 0)} questions
                  &nbsp;·&nbsp;
                  {s.modules.reduce((a, m) => a + (m.timeLimit || 0), 0)} min
                </span>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <button
            onClick={onBegin}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            Begin Test
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Result Screen ────────────────────────────────────────────
function ResultScreen({ result, assignment, onBack }) {
  const passed = result?.passed;
  const pct    = result?.percentage ?? 0;

  return (
    <div className="page-content">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-indigo-600 font-semibold mb-6 hover:text-indigo-800 transition-colors">
        <ChevronLeft size={16} /> Back to Assignments
      </button>

      <div className="max-w-xl mx-auto">
        <div className="card py-8 px-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl ${passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {passed ? '🎉' : '📚'}
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-1">
            {passed ? 'Test Passed!' : 'Test Completed'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">{assignment.title}</p>

          <div className="flex justify-center gap-10 mb-6">
            <div>
              <p className="text-[36px] font-extrabold text-indigo-600 leading-none">{pct}%</p>
              <p className="text-xs text-slate-400 mt-1">Your Score</p>
            </div>
            <div>
              <p className="text-[36px] font-extrabold text-slate-900 leading-none">
                {result?.overallScore ?? 0}/{result?.maxScore ?? 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">Points</p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold mb-6 ${
            passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {passed ? <CheckCircle size={15} /> : <XCircle size={15} />}
            {passed ? 'Passed' : `Did not pass (pass mark: ${assignment.passingScore}%)`}
          </div>

          {(result?.sectionResponses || []).length > 0 && (
            <div className="flex flex-col gap-2 text-left">
              {result.sectionResponses.map((sr, i) => {
                const sectionName = sr.sid === 'rw' ? 'Reading & Writing' : 'Math';
                return (
                  <div key={i} className="bg-slate-50 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-slate-700 mb-2">{sectionName}</p>
                    {(sr.moduleResponses || []).map((mr, j) => (
                      <div key={j} className="flex justify-between text-xs text-slate-500 py-1 border-b border-slate-100 last:border-b-0">
                        <span>Module {mr.moduleNumber}</span>
                        <span className="font-semibold text-slate-700">
                          {mr.correctAnswers}/{mr.totalQuestions} correct &nbsp;·&nbsp; {mr.score} pts
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Timer helper ─────────────────────────────────────────────
function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Main Test Taker ──────────────────────────────────────────
export default function SATTestTaker({ assignment, student, batchId, initialResponse, onBack }) {
  const alreadySubmitted = initialResponse?.status === 'submitted';
  const inProgress       = initialResponse?.status === 'in_progress';

  const [phase, setPhase]               = useState(alreadySubmitted ? 'result' : inProgress ? 'test' : 'start');
  const [responseId, setResponseId]     = useState(inProgress ? initialResponse._id : null);
  const [answers, setAnswers]           = useState({});
  const [result, setResult]             = useState(alreadySubmitted ? initialResponse : null);
  const [error, setError]               = useState('');
  const [activeSectionIdx, setActiveSection] = useState(0);
  const [showCalc, setShowCalc]             = useState(false);

  const sections    = useMemo(() => assignment.sections || [], [assignment.sections]);
  const allQids     = sections.flatMap((s) => s.modules.flatMap((m) => m.questions.map((q) => q.qid)));
  const totalQs     = allQids.length;
  const answeredQs  = allQids.filter((qid) => answers[qid]).length;

  // ── Timer ────────────────────────────────────────────────────
  const totalSeconds = sections.reduce(
    (a, s) => a + s.modules.reduce((b, m) => b + (m.timeLimit || 0) * 60, 0), 0
  );
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  // Refs always hold the latest state — safe for use inside timer callbacks
  const answersRef    = useRef(answers);
  const responseIdRef = useRef(responseId);
  useEffect(() => { answersRef.current = answers; });
  useEffect(() => { responseIdRef.current = responseId; });

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

  const handleAnswer = (qid, choice) => {
    setAnswers((prev) => ({ ...prev, [qid]: choice }));
  };

  // Core submit — called by manual submit and auto-submit (uses refs for latest state)
  const executeSubmit = useCallback(async () => {
    setPhase('submitting');
    try {
      const sectionResponses = sections.map((s) => ({
        sid: s.sid || s.id,
        moduleResponses: s.modules.map((m) => ({
          mid:          m.mid || m.id,
          moduleNumber: m.number,
          answers:      m.questions
            .filter((q) => answersRef.current[q.qid])
            .map((q) => ({ qid: q.qid, selected: answersRef.current[q.qid] })),
        })),
      }));
      const res = await assignmentService.submit(responseIdRef.current, { sectionResponses });
      setResult(res.data);
      setPhase('result');
    } catch (e) {
      setError(e.message);
      setPhase('test');
    }
  }, [sections]);

  const handleSubmit = () => {
    const unanswered = totalQs - answeredQs;
    const msg = unanswered > 0
      ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`
      : 'Submit your test now?';
    if (!window.confirm(msg)) return;
    executeSubmit();
  };

  // ── Timer effects ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'test') return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'test' || timeLeft !== 0) return;
    const id = setTimeout(executeSubmit, 0);
    return () => clearTimeout(id);
  }, [timeLeft, phase, executeSubmit]);

  if (phase === 'result') {
    return <ResultScreen result={result} assignment={assignment} onBack={onBack} />;
  }

  if (phase === 'start') {
    return <StartScreen assignment={assignment} onBegin={handleBegin} onBack={onBack} error={error} />;
  }

  // test | submitting
  const activeSection = sections[activeSectionIdx] || sections[0];
  const calcAllowed   = (activeSection?.modules || []).some((m) => m.calculatorAllowed);

  return (
    <div className="page-content">
      {/* Floating calculator */}
      {showCalc && calcAllowed && <Calculator onClose={() => setShowCalc(false)} />}

      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { if (window.confirm('Exit test? Your answers will NOT be saved.')) onBack(); }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-semibold transition-colors"
          >
            <ChevronLeft size={16} /> Exit
          </button>
          <span className="text-slate-200">|</span>
          <h2 className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{assignment.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-semibold">
            {answeredQs}/{totalQs} answered
          </span>
          {/* Countdown timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
            timeLeft <= 120
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
              : timeLeft <= 300
              ? 'bg-amber-50 text-amber-600 border-amber-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            <Clock size={12} />
            {formatTime(timeLeft)}
          </div>
          {calcAllowed && (
            <button
              onClick={() => setShowCalc((p) => !p)}
              title="Toggle calculator"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                showCalc
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
              }`}
            >
              <CalcIcon size={13} /> Calculator
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={phase === 'submitting'}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-60"
          >
            {phase === 'submitting' ? 'Submitting…' : 'Submit Test'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-slate-200 rounded-full h-1 mb-5">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all"
          style={{ width: `${totalQs ? (answeredQs / totalQs) * 100 : 0}%` }}
        />
      </div>

      {/* Time warning banners */}
      {timeLeft > 0 && timeLeft <= 300 && (
        <div className={`text-center text-xs font-bold px-4 py-2 rounded-xl mb-4 ${
          timeLeft <= 60
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {timeLeft <= 60
            ? `⚠️ ${timeLeft}s remaining — test will be submitted automatically!`
            : `⏱ ${formatTime(timeLeft)} remaining — please wrap up soon.`}
        </div>
      )}

      {/* Section tabs */}
      {sections.length > 1 && (
        <div className="flex gap-2 mb-5">
          {sections.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveSection(i);
                const sectionAllowsCalc = (s.modules || []).some((m) => m.calculatorAllowed);
                if (!sectionAllowsCalc) setShowCalc(false);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSectionIdx === i
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              <span>{s.name.toLowerCase().includes('math') ? '🔢' : '📖'}</span>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Modules + questions */}
      {(activeSection?.modules || []).map((module, mi) => {
        if (module.questions.length === 0) return null;
        let questionOffset = 0;
        for (let si = 0; si < activeSectionIdx; si++) {
          questionOffset += sections[si].modules.reduce((a, m) => a + m.questions.length, 0);
        }
        for (let i = 0; i < mi; i++) {
          questionOffset += activeSection.modules[i].questions.length;
        }

        return (
          <div key={mi} className="mb-6">
            <div className="flex items-center gap-3 mb-3 px-1">
              <h3 className="text-sm font-bold text-slate-700">Module {module.number}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock size={11} className="inline" /> {module.timeLimit} min
                {module.calculatorAllowed && (
                  <span className="text-emerald-600 ml-1">🧮 Calculator allowed</span>
                )}
              </div>
            </div>
            {module.questions.map((q, qi) => (
              <QuestionCard
                key={q.qid}
                question={q}
                selected={answers[q.qid]}
                onSelect={handleAnswer}
                number={questionOffset + qi + 1}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
