import { useState, useEffect, useCallback, useRef } from 'react';
import { satService } from '../../services/api';

const SUBJ_LABEL = { math: 'Math', reading_writing: 'Reading & Writing' };
const SUBJ_STYLE = { math: 'bg-purple-100 text-purple-700', reading_writing: 'bg-blue-100 text-blue-700' };

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Practice Test List ────────────────────────────────────────
function TestList({ onStart }) {
  const [configs,  setConfigs]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [subject,  setSubject]  = useState('all');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [configRes, historyRes] = await Promise.all([
        satService.listPractice(),
        satService.getPracticeHistory(),
      ]);
      setConfigs(configRes.data || []);
      setHistory(historyRes.data || []);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build a map of configId → best score from history
  const bestScores = {};
  history.filter(s => s.status === 'complete').forEach(s => {
    const id = s.practice_config_id?._id || s.practice_config_id;
    if (!bestScores[id] || s.percentage > bestScores[id]) bestScores[id] = s.percentage;
  });

  const filtered = subject === 'all' ? configs : configs.filter(c => c.subject === subject);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading practice tests…</div>
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
        <div>
          <h2 className="text-lg font-bold text-slate-900">SAT Practice Tests</h2>
          <p className="text-sm text-slate-500 mt-0.5">10 questions per test · Topic-focused · Instant results</p>
        </div>
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
          <p className="text-sm text-slate-400">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(cfg => {
            const best    = bestScores[cfg._id];
            const hasAttempt = best !== undefined;

            return (
              <div key={cfg._id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 leading-snug">{cfg.name}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SUBJ_STYLE[cfg.subject]}`}>
                        {SUBJ_LABEL[cfg.subject]}
                      </span>
                      {cfg.is_demo_accessible && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Free</span>
                      )}
                    </div>
                  </div>
                  {hasAttempt && (
                    <div className={`shrink-0 text-center px-2.5 py-1 rounded-xl ${best >= 70 ? 'bg-green-50' : best >= 50 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                      <p className={`text-xs font-bold ${best >= 70 ? 'text-green-700' : best >= 50 ? 'text-yellow-700' : 'text-red-600'}`}>{best}%</p>
                      <p className="text-[9px] text-slate-400">best</p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-400 w-12">Topic</span>
                    <span className="font-medium text-slate-700">{cfg.topic}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-400 w-12">Domain</span>
                    <span className="font-medium text-slate-700">{cfg.domain}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500">
                    <span>{cfg.total_questions} questions</span>
                    <span>·</span>
                    <span>{cfg.time_limit_minutes} min</span>
                  </div>
                </div>

                <button onClick={() => onStart(cfg)}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  {hasAttempt ? 'Practice Again →' : 'Start Practice →'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Test Taking View ──────────────────────────────────────────
function TestTaker({ config, onFinish }) {
  const [phase,      setPhase]      = useState('loading'); // loading | taking | submitting | results
  const [sessionId,  setSessionId]  = useState(null);
  const [questions,  setQuestions]  = useState([]);
  const [answers,    setAnswers]    = useState({});
  const [timeLeft,   setTimeLeft]   = useState(null);
  const [results,    setResults]    = useState(null);
  const [error,      setError]      = useState('');
  const timerRef = useRef(null);

  // Start or resume session
  useEffect(() => {
    satService.startPractice(config._id)
      .then(res => {
        setSessionId(res.session_id);
        setQuestions(res.questions || []);
        const elapsed = res.started_at
          ? Math.floor((Date.now() - new Date(res.started_at).getTime()) / 1000)
          : 0;
        setTimeLeft(Math.max(0, config.time_limit_minutes * 60 - elapsed));
        setPhase('taking');
      })
      .catch(e => { setError(e.message); setPhase('error'); });
  }, [config]);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'taking' || timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [phase, timeLeft]);

  const handleSubmit = async () => {
    clearTimeout(timerRef.current);
    setPhase('submitting');
    const payload = questions.map(q => ({ question_id: q._id || q.id, selected: answers[q._id || q.id] || null }));
    try {
      const res = await satService.submitPractice(sessionId, payload);
      setResults(res);
      setPhase('results');
    } catch (e) { setError(e.message); setPhase('error'); }
  };

  const answered = Object.keys(answers).length;

  if (phase === 'loading') return (
    <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Starting test…</div>
  );
  if (phase === 'error') return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <p className="text-red-600 text-sm">{error}</p>
      <button onClick={onFinish} className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">Back</button>
    </div>
  );
  if (phase === 'submitting') return (
    <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Submitting…</div>
  );
  if (phase === 'results') return (
    <ResultsView config={config} results={results} onDone={onFinish} />
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
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

      {/* Questions */}
      <div className="flex flex-col gap-4">
        {questions.map((q, idx) => {
          const qId     = q._id || q.id;
          const selected = answers[qId];
          return (
            <div key={qId} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                <p className="text-sm text-slate-900 leading-relaxed">{q.title}</p>
              </div>
              {q.description && (
                <p className="text-xs text-slate-500 mb-3 pl-9">{q.description}</p>
              )}
              <div className="flex flex-col gap-2 pl-9">
                {['A', 'B', 'C', 'D'].map(opt => {
                  const text = q.choices?.[opt];
                  if (!text) return null;
                  const isSelected = selected === opt;
                  return (
                    <button key={opt} onClick={() => setAnswers(a => ({ ...a, [qId]: opt }))}
                      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-800'
                          : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 text-slate-700'
                      }`}>
                      <span className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 text-slate-400'
                      }`}>{opt}</span>
                      <span className="leading-snug">{text}</span>
                    </button>
                  );
                })}
              </div>
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

// ── Results View ──────────────────────────────────────────────
function ResultsView({ config, results, onDone }) {
  const pct      = results.percentage || 0;
  const passed   = pct >= 60;
  const correct  = results.breakdown?.filter(b => b.is_correct).length || 0;
  const total    = results.breakdown?.length || 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Score card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-3">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black ${
          passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
        }`}>
          {pct}%
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-slate-900">{config.name}</p>
          <p className="text-sm text-slate-500 mt-0.5">{correct} / {total} correct · {config.topic} → {config.domain}</p>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {passed ? 'Great work!' : 'Keep practicing!'}
        </div>
      </div>

      {/* Breakdown */}
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
              <p className="text-sm text-slate-900 leading-relaxed">{b.title}</p>
            </div>
            <div className="flex flex-col gap-1.5 pl-9">
              {['A', 'B', 'C', 'D'].map(opt => {
                const text       = b.choices?.[opt];
                if (!text) return null;
                const isSelected = b.selected === opt;
                const isCorrect  = b.correct_answer === opt;
                return (
                  <div key={opt} className={`flex items-start gap-2 px-3 py-2 rounded-xl text-xs ${
                    isCorrect  ? 'bg-green-50 text-green-800 font-semibold' :
                    isSelected ? 'bg-red-50 text-red-700' : 'text-slate-500'
                  }`}>
                    <span className="font-bold shrink-0">{opt}.</span>
                    <span>{text}</span>
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

      <button onClick={onDone}
        className="w-full py-3 rounded-2xl text-sm font-bold text-white"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
        Back to Practice Tests
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function PracticeTime() {
  const [view,          setView]   = useState('list'); // list | taking
  const [activeConfig,  setConfig] = useState(null);

  const handleStart = (cfg) => {
    setConfig(cfg);
    setView('taking');
  };

  return (
    <div className="page-content">
      {view === 'list' ? (
        <TestList onStart={handleStart} />
      ) : (
        <TestTaker config={activeConfig} onFinish={() => setView('list')} />
      )}
    </div>
  );
}
