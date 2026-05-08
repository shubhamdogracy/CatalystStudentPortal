import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Clock } from 'lucide-react';
import { satService } from '../../services/api';
import { StudentReportModal } from './StudentReportModal';
import MathContent from '../../components/common/MathContent';

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

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

  const toChoices = (q) => ({
    A: q.option_a || q.choices?.A || '',
    B: q.option_b || q.choices?.B || '',
    C: q.option_c || q.choices?.C || '',
    D: q.option_d || q.choices?.D || '',
  });

  const buildQuestions = (questions, breakdown) => {
    if (!questions || questions.length === 0) {
      return (breakdown || []).map((b) => ({
        qid:           b.question_id?.toString(),
        id:            b.question_id?.toString(),
        title:         stripHtml(b.stem || b.title || ''),
        description:   '',
        choices:       toChoices(b),
        correctAnswer: b.correct_answer,
        topic:         b.topic,
        score:         b.points || 1,
        explanation:   b.explanation,
      }));
    }
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
        title:         stripHtml(q.stem || q.title || ''),
        description:   '',
        choices:       toChoices(q),
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
function QuestionView({ question, answers, onAnswer, index, total }) {
  const selected = answers[question._id];
  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <span>Question {index + 1} of {total}</span>
        {question.topic && (
          <span className="ml-2 px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-600 font-semibold">
            {question.topic}
          </span>
        )}
      </div>

      <MathContent html={question.stem} className="text-[15px] text-gray-900 font-medium leading-relaxed" />

      {question.format === 'grid_in' ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Your Answer</label>
          <input
            type="text"
            value={selected || ''}
            onChange={e => onAnswer(question._id, e.target.value)}
            placeholder="Type your answer…"
            className="w-40 h-11 px-4 rounded-xl border-2 border-gray-200 text-sm font-mono focus:outline-none focus:border-indigo-400"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {['A', 'B', 'C', 'D'].map((opt) => {
            const label = question['option_' + opt.toLowerCase()];
            if (!label) return null;
            const isSelected = selected === opt;
            return (
              <button
                key={opt}
                onClick={() => onAnswer(question._id, opt)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {opt}
                </span>
                <MathContent html={label} className={`text-sm flex-1 [&_p]:m-0 ${isSelected ? 'text-indigo-900 font-medium' : 'text-gray-700'}`} />
              </button>
            );
          })}
        </div>
      )}
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

  const isLastQuestion = questionIdx === questions.length - 1;
  const timerCls =
    timeLeft <= 120 ? 'text-red-600 animate-pulse' :
    timeLeft <= 300 ? 'text-amber-600' : 'text-slate-600';

  return (
    <div className="page-content">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <button
          onClick={() => { if (window.confirm('Exit the test? Your progress will be lost.')) onBack(); }}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft size={16} /> Exit
        </button>

        <div className="text-center">
          <p className="text-xs font-bold text-indigo-600 truncate max-w-[180px]">
            {testName} · {phase === 'module1' ? 'Module 1' : 'Module 2'}
          </p>
          <div className={`flex items-center justify-center gap-1.5 text-sm font-bold mt-0.5 ${timerCls}`}>
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="text-xs font-semibold text-gray-400">
          {questionIdx + 1} / {questions.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${((questionIdx + 1) / questions.length) * 100}%`,
            background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
          }}
        />
      </div>

      {/* Question */}
      <QuestionView
        question={currentQuestion}
        answers={answers}
        onAnswer={handleAnswer}
        index={questionIdx}
        total={questions.length}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
        <button
          onClick={() => setQuestionIdx((i) => i - 1)}
          disabled={questionIdx === 0}
          className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 disabled:opacity-40 transition-colors hover:border-gray-300"
        >
          ← Back
        </button>

        <button
          onClick={handleNext}
          disabled={submittingRef.current}
          className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          {isLastQuestion
            ? phase === 'module1' ? 'Submit Module 1 →' : 'Submit Test ✓'
            : 'Next →'}
        </button>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
