import { useState, useEffect, useCallback, useRef } from 'react';
import { satService } from '../../services/api';
import MathContent from '../../components/common/MathContent';

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ResultsView({ config, results, onBack }) {
  const pct     = results.percentage || 0;
  const passed  = pct >= 60;
  const correct = results.breakdown?.filter(b => b.is_correct).length || 0;
  const total   = results.breakdown?.length || 0;

  return (
    <div className="page-content flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-3">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black ${
          passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
          {pct}%
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-slate-900">{config.name}</p>
          <p className="text-sm text-slate-500 mt-0.5">{correct} / {total} correct · {config.topic} → {config.sub_topic}</p>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {passed ? 'Great work!' : 'Keep practicing!'}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-bold text-slate-700">Question Breakdown</p>
        {(results.breakdown || []).map((b, idx) => (
          <div key={idx} className={`bg-white rounded-2xl border p-4 ${b.is_correct ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-start gap-3 mb-3">
              <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                b.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                {b.is_correct ? '✓' : '✗'}
              </span>
              <MathContent html={b.stem} className="text-sm text-slate-900 leading-relaxed [&_p]:m-0" />
            </div>
            <div className="flex flex-col gap-1.5 pl-9">
              {['A', 'B', 'C', 'D'].map(opt => {
                const text = b['option_' + opt.toLowerCase()];
                if (!text) return null;
                const isSelected = b.selected === opt;
                const isCorrect  = b.correct_answer === opt;
                return (
                  <div key={opt} className={`flex items-start gap-2 px-3 py-2 rounded-xl text-xs ${
                    isCorrect  ? 'bg-green-50 text-green-800 font-semibold' :
                    isSelected ? 'bg-red-50 text-red-700' : 'text-slate-500'
                  }`}>
                    <span className="font-bold shrink-0">{opt}.</span>
                    <MathContent html={text} className="[&_p]:m-0" />
                    {isCorrect  && <span className="ml-auto shrink-0 text-green-600">✓ Correct</span>}
                    {isSelected && !isCorrect && <span className="ml-auto shrink-0 text-red-500">Your answer</span>}
                  </div>
                );
              })}
              {b.explanation && (
                <p className="text-xs text-slate-500 italic mt-1.5 border-t border-slate-100 pt-1.5">{b.explanation}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <button onClick={onBack}
        className="w-full py-3 rounded-2xl text-sm font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
        ← Back to Assignments
      </button>
    </div>
  );
}

export default function PracticeAssignmentTaker({ assignment, onBack }) {
  const config = assignment.practice_config_id;

  const [phase,     setPhase]     = useState('loading');
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers,   setAnswers]   = useState({});
  const [timeLeft,  setTimeLeft]  = useState(null);
  const [results,   setResults]   = useState(null);
  const [error,     setError]     = useState('');
  const timerRef = useRef(null);
  const handleSubmitRef = useRef(null);

  useEffect(() => {
    satService.startPractice(config._id, assignment._id)
      .then(res => {
        setSessionId(res.session_id);
        setQuestions(res.questions || []);
        const elapsed = res.started_at
          ? Math.floor((Date.now() - new Date(res.started_at).getTime()) / 1000)
          : 0;
        setTimeLeft(Math.max(0, (config.time_limit_minutes || 15) * 60 - elapsed));
        setPhase('taking');
      })
      .catch(e => { setError(e.message); setPhase('error'); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = useCallback(async () => {
    clearTimeout(timerRef.current);
    setPhase('submitting');
    const payload = questions.map(q => ({ question_id: q._id || q.id, selected: answers[q._id || q.id] || null }));
    try {
      const res = await satService.submitPractice(sessionId, payload);
      setResults(res);
      setPhase('results');
    } catch (e) { setError(e.message); setPhase('error'); }
  }, [questions, sessionId, answers]);

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (phase !== 'taking' || timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmitRef.current(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  });

  if (phase === 'loading')    return <div className="page-content flex items-center justify-center py-32 text-slate-400 text-sm">Starting practice test…</div>;
  if (phase === 'submitting') return <div className="page-content flex items-center justify-center py-32 text-slate-400 text-sm">Submitting…</div>;
  if (phase === 'error')      return (
    <div className="page-content flex flex-col items-center justify-center py-32 gap-4">
      <p className="text-red-600 text-sm">{error}</p>
      <button onClick={onBack} className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">← Back</button>
    </div>
  );
  if (phase === 'results')    return <ResultsView config={config} results={results} onBack={onBack} />;

  const answered = Object.keys(answers).length;

  return (
    <div className="page-content flex flex-col gap-4">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-2xl border border-slate-200 px-5 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{config.name}</p>
          <p className="text-xs text-slate-500">{answered}/{questions.length} answered</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
            <span className="text-base">⏱</span>
            {formatTime(timeLeft)}
          </div>
          <button onClick={handleSubmit}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }}>
            Submit
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((q, idx) => {
          const qId     = q._id || q.id;
          const selected = answers[qId];
          return (
            <div key={qId} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="shrink-0 w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                <MathContent html={q.stem} className="text-sm text-slate-900 leading-relaxed" />
              </div>
              {q.format === 'grid_in' ? (
                <div className="pl-9 flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">Your Answer</label>
                  <input
                    type="text"
                    value={selected || ''}
                    onChange={e => setAnswers(a => ({ ...a, [qId]: e.target.value }))}
                    placeholder="Type your answer…"
                    className="w-36 h-10 px-3 rounded-xl border-2 border-slate-200 text-sm font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2 pl-9">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const text = q['option_' + opt.toLowerCase()];
                    if (!text) return null;
                    const isSelected = selected === opt;
                    return (
                      <button key={opt} onClick={() => setAnswers(a => ({ ...a, [qId]: opt }))}
                        className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${
                          isSelected
                            ? 'border-teal-400 bg-teal-50 text-teal-800'
                            : 'border-slate-200 hover:border-teal-200 hover:bg-teal-50/30 text-slate-700'
                        }`}>
                        <span className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 text-slate-400'
                        }`}>{opt}</span>
                        <MathContent html={text} className="leading-snug [&_p]:m-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={handleSubmit}
        className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
        style={{ background: 'linear-gradient(135deg, #0d9488, #0891b2)' }}>
        Submit Test ({answered}/{questions.length} answered)
      </button>
    </div>
  );
}
