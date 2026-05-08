import { useState, useEffect, useCallback, useRef } from 'react';
import { satService } from '../../services/api';
import MathContent from '../../components/common/MathContent';

const SUBJ_LABEL = { math: 'Math', reading_writing: 'Reading & Writing' };
const SUBJ_STYLE = { math: 'bg-purple-100 text-purple-700', reading_writing: 'bg-blue-100 text-blue-700' };
const TYPE_STYLE = { mock: 'bg-emerald-100 text-emerald-700', diagnostic: 'bg-orange-100 text-orange-700' };

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// MOCK / DIAGNOSTIC
// ─────────────────────────────────────────────────────────────

function AdaptiveConfigList({ onStart, defaultFilter = 'all' }) {
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

  const filtered = filter === 'all' ? configs
    : configs.filter(c => c.type === filter || c.subject === filter);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading tests…</div>
  );

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span><button onClick={load} className="font-bold underline ml-3">Retry</button>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">Adaptive two-module format · Start anytime</p>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { key: 'all',        label: 'All' },
            { key: 'mock',       label: 'Mock' },
            { key: 'diagnostic', label: 'Diagnostic' },
            { key: 'math',       label: 'Math' },
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
                <span>·</span>
                <span>{cfg.module_1?.time_limit_minutes} min / module</span>
                <span>·</span>
                <span>2 modules</span>
              </div>
              <button onClick={() => onStart(cfg)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                Start Test →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdaptiveTaker({ config, onFinish }) {
  const [phase,       setPhase]       = useState('loading');
  const [sessionId,   setSessionId]   = useState(null);
  const [questions,   setQuestions]   = useState([]);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [m1Result,    setM1Result]    = useState(null);
  const [results,     setResults]     = useState(null);
  const [error,       setError]       = useState('');

  const submittingRef  = useRef(false);
  const sessionRef     = useRef(null);
  const questionsRef   = useRef([]);
  const answersRef     = useRef({});
  const m1SavedRef     = useRef(null);
  sessionRef.current   = sessionId;
  questionsRef.current = questions;
  answersRef.current   = answers;

  useEffect(() => {
    satService.startSessionDirect(config._id)
      .then(res => {
        setSessionId(res.session_id);
        setQuestions(res.module_1.questions);
        const elapsed = res.module_1.started_at
          ? Math.floor((Date.now() - new Date(res.module_1.started_at).getTime()) / 1000) : 0;
        setTimeLeft(Math.max(0, res.module_1.time_limit_minutes * 60 - elapsed));
        setPhase('module1');
      })
      .catch(e => { setError(e.message); setPhase('error'); });
  }, [config._id]);

  useEffect(() => {
    if (phase !== 'module1' && phase !== 'module2') return;
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (timeLeft !== 0) return;
    if (phase === 'module1') submitM1();
    else if (phase === 'module2') submitM2();
  }, [timeLeft]); // eslint-disable-line

  const buildAns = (qs, ans) => qs.map(q => ({ question_id: q._id, selected: ans[q._id] || null }));

  const submitM1 = useCallback(async () => {
    if (submittingRef.current) return; submittingRef.current = true;
    try {
      const res = await satService.submitModule1(sessionRef.current, buildAns(questionsRef.current, answersRef.current));
      m1SavedRef.current = { score: res.module_1.score, max_score: res.module_1.max_score, breakdown: res.breakdown, questions: [...questionsRef.current] };
      setM1Result({ ...res.module_1, tier: res.adaptive?.tier });
      setPhase('m1_done');
    } catch (e) { setError(e.message); }
    finally { submittingRef.current = false; }
  }, []);

  const loadModule2 = useCallback(async () => {
    if (submittingRef.current) return; submittingRef.current = true;
    try {
      const res = await satService.getModule2(sessionRef.current);
      setQuestions(res.module_2.questions); setTimeLeft(res.module_2.time_limit_minutes * 60);
      setQuestionIdx(0); setAnswers({}); setPhase('module2');
    } catch (e) { setError(e.message); }
    finally { submittingRef.current = false; }
  }, []);

  const submitM2 = useCallback(async () => {
    if (submittingRef.current) return; submittingRef.current = true;
    setPhase('submitting');
    try {
      const res = await satService.submitModule2(sessionRef.current, buildAns(questionsRef.current, answersRef.current));
      const m1 = m1SavedRef.current || {};
      setResults({ m1, m2: { score: res.module_2.score, max_score: res.module_2.max_score, breakdown: res.breakdown, questions: [...questionsRef.current] }, total_score: (m1.score || 0) + (res.module_2.score || 0), total_max: (m1.max_score || 0) + (res.module_2.max_score || 0) });
      setPhase('results');
    } catch (e) { setError(e.message); setPhase('module2'); }
    finally { submittingRef.current = false; }
  }, []);

  if (phase === 'loading') return <div className="flex items-center justify-center py-32 text-slate-400 text-sm">Starting test…</div>;
  if (phase === 'error')   return <div className="flex flex-col items-center py-32 gap-4"><p className="text-red-600 text-sm">{error}</p><button onClick={onFinish} className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">Back</button></div>;
  if (phase === 'submitting') return <div className="flex items-center justify-center py-32 text-slate-400 text-sm">Submitting…</div>;
  if (phase === 'results') return <AdaptiveResults config={config} results={results} onDone={onFinish} />;

  if (phase === 'm1_done') {
    const pct = m1Result?.percentage ?? 0;
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-black ${pct >= (config.adaptive_threshold ?? 60) ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
          {pct}%
        </div>
        <div>
          <p className="text-base font-bold text-slate-900">Module 1 Complete</p>
          <p className="text-sm text-slate-500 mt-1">{m1Result?.score ?? 0} / {m1Result?.max_score ?? 0} correct</p>
          <p className={`text-sm font-semibold mt-2 ${m1Result?.tier === 'hard' ? 'text-indigo-600' : 'text-orange-600'}`}>
            Module 2 tier: {m1Result?.tier === 'hard' ? 'Hard (2b)' : 'Easy (2a)'}
          </p>
        </div>
        <button onClick={loadModule2} className="px-8 py-3 rounded-2xl text-sm font-bold text-white hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
          Continue to Module 2 →
        </button>
      </div>
    );
  }

  const q        = questions[questionIdx];
  const selected = answers[q?._id];
  const answered = Object.keys(answers).length;
  const modLabel = phase === 'module1' ? 'Module 1' : 'Module 2';

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-2xl border border-slate-200 px-5 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{config.name} — {modLabel}</p>
          <p className="text-xs text-slate-500">{answered}/{questions.length} answered</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
            ⏱ {formatTime(timeLeft)}
          </span>
          <button onClick={phase === 'module1' ? submitM1 : submitM2}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: phase === 'module1' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
            Submit {modLabel}
          </button>
        </div>
      </div>
      {q && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">{questionIdx + 1}</span>
            <span>Question {questionIdx + 1} of {questions.length}</span>
          </div>
          <MathContent html={q.stem} className="text-sm text-slate-900 leading-relaxed" />
          <div className="flex flex-col gap-2">
            {['A','B','C','D'].map(opt => {
              const text = q['option_' + opt.toLowerCase()]; if (!text) return null;
              const isSel = selected === opt;
              return (
                <button key={opt} onClick={() => setAnswers(p => ({ ...p, [q._id]: opt }))}
                  className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${isSel ? 'border-indigo-400 bg-indigo-50 text-indigo-800' : 'border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/30 text-slate-700'}`}>
                  <span className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${isSel ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 text-slate-400'}`}>{opt}</span>
                  <MathContent html={text} className="leading-snug [&_p]:m-0" />
                </button>
              );
            })}
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <button onClick={() => setQuestionIdx(i => i - 1)} disabled={questionIdx === 0}
              className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-30">
              ← Prev
            </button>
            <button onClick={() => { if (questionIdx < questions.length - 1) setQuestionIdx(i => i + 1); else if (phase === 'module1') submitM1(); else submitM2(); }}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              {questionIdx < questions.length - 1 ? 'Next →' : `Submit ${modLabel} →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, data, expanded, onToggle }) {
  if (!data) return null;
  const bdPct = data.max_score > 0 ? Math.round((data.score / data.max_score) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold text-slate-800">{label}</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bdPct >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {data.score}/{data.max_score} ({bdPct}%)
          </span>
        </div>
        <span className="text-slate-400 text-xs">{expanded ? '▲ Hide' : '▼ Show'}</span>
      </button>
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-3">
          {(data.breakdown || []).map((b, idx) => (
            <div key={idx} className={`rounded-xl border p-4 ${b.is_correct ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
              <div className="flex items-start gap-2 mb-2">
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${b.is_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{b.is_correct ? '✓' : '✗'}</span>
                <MathContent html={b.stem} className="text-xs text-slate-800 leading-relaxed [&_p]:m-0" />
              </div>
              <div className="flex gap-3 text-[10px] text-slate-500 pl-7">
                <span>Your: <strong>{b.selected || '—'}</strong></span>
                <span>Correct: <strong className="text-green-700">{b.correct_answer}</strong></span>
                {b.topic && <span className="ml-auto">{b.topic}</span>}
              </div>
              {b.explanation && <p className="text-[11px] text-slate-500 italic mt-2 pl-7 border-t border-slate-100 pt-2">{b.explanation}</p>}
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
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-3">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-black ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{pct}%</div>
        <div className="text-center">
          <p className="text-base font-bold text-slate-900">{config.name}</p>
          <p className="text-sm text-slate-500 mt-1">{results.total_score} / {results.total_max} correct across both modules</p>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{passed ? 'Well done!' : 'Keep practicing!'}</div>
      </div>
      <Section label="Module 1" data={results.m1} expanded={expandM1} onToggle={() => setExpandM1(v => !v)} />
      <Section label="Module 2" data={results.m2} expanded={expandM2} onToggle={() => setExpandM2(v => !v)} />
      <button onClick={onDone} className="w-full py-3 rounded-2xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>Back to Tests</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PRACTICE
// ─────────────────────────────────────────────────────────────

function PracticeConfigList({ onStart }) {
  const [configs,  setConfigs]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [subject,  setSubject]  = useState('all');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [configRes, historyRes] = await Promise.all([satService.listPractice(), satService.getPracticeHistory()]);
      setConfigs(configRes.data || []);
      setHistory(historyRes.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const bestScores = {};
  history.filter(s => s.status === 'complete').forEach(s => {
    const id = s.practice_config_id?._id || s.practice_config_id;
    if (!bestScores[id] || s.percentage > bestScores[id]) bestScores[id] = s.percentage;
  });

  const filtered = subject === 'all' ? configs : configs.filter(c => c.subject === subject);

  if (loading) return <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading practice tests…</div>;

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span><button onClick={load} className="font-bold underline ml-3">Retry</button>
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
          <p className="text-sm text-slate-400">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(cfg => {
            const best = bestScores[cfg._id];
            return (
              <div key={cfg._id} className="bg-white rounded-2xl border border-slate-200 hover:border-teal-200 hover:shadow-md transition-all p-5 flex flex-col gap-3">
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
                <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex gap-2 text-xs text-slate-500"><span className="text-slate-400 w-12">Topic</span><span className="font-medium text-slate-700">{cfg.topic}</span></div>
                  <div className="flex gap-2 text-xs text-slate-500"><span className="text-slate-400 w-12">Sub-Topic</span><span className="font-medium text-slate-700">{cfg.sub_topic}</span></div>
                  <div className="flex gap-4 mt-1 text-[11px] text-slate-500"><span>{cfg.total_questions} questions</span><span>·</span><span>{cfg.time_limit_minutes} min</span></div>
                </div>
                <button onClick={() => onStart(cfg)} className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
                  {best !== undefined ? 'Practice Again →' : 'Start Practice →'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PracticeTaker({ config, onFinish }) {
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
    satService.startPractice(config._id)
      .then(res => {
        setSessionId(res.session_id);
        setQuestions(res.questions || []);
        const elapsed = res.started_at ? Math.floor((Date.now() - new Date(res.started_at).getTime()) / 1000) : 0;
        setTimeLeft(Math.max(0, config.time_limit_minutes * 60 - elapsed));
        setPhase('taking');
      })
      .catch(e => { setError(e.message); setPhase('error'); });
  }, [config]);

  const handleSubmit = useCallback(async () => {
    clearTimeout(timerRef.current); setPhase('submitting');
    const payload = questions.map(q => ({ question_id: q._id || q.id, selected: answers[q._id || q.id] || null }));
    try {
      const res = await satService.submitPractice(sessionId, payload);
      setResults(res); setPhase('results');
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
  }, [phase, timeLeft]);

  if (phase === 'loading') return <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Starting test…</div>;
  if (phase === 'error')   return <div className="flex flex-col items-center py-24 gap-4"><p className="text-red-600 text-sm">{error}</p><button onClick={onFinish} className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">Back</button></div>;
  if (phase === 'submitting') return <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Submitting…</div>;
  if (phase === 'results') return <PracticeResults config={config} results={results} onDone={onFinish} />;

  const answered = Object.keys(answers).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-2xl border border-slate-200 px-5 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{config.name}</p>
          <p className="text-xs text-slate-500">{answered}/{questions.length} answered</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-700'}`}>⏱ {formatTime(timeLeft)}</span>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>Submit</button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {questions.map((q, idx) => {
          const qId = q._id || q.id; const sel = answers[qId];
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
                    value={sel || ''}
                    onChange={e => setAnswers(a => ({ ...a, [qId]: e.target.value }))}
                    placeholder="Type your answer…"
                    className="w-36 h-10 px-3 rounded-xl border-2 border-slate-200 text-sm font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2 pl-9">
                  {['A','B','C','D'].map(opt => {
                    const text = q['option_' + opt.toLowerCase()]; if (!text) return null;
                    const isSel = sel === opt;
                    return (
                      <button key={opt} onClick={() => setAnswers(a => ({ ...a, [qId]: opt }))}
                        className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-all ${isSel ? 'border-teal-400 bg-teal-50 text-teal-800' : 'border-slate-200 hover:border-teal-200 hover:bg-teal-50/30 text-slate-700'}`}>
                        <span className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${isSel ? 'border-teal-500 bg-teal-500 text-white' : 'border-slate-300 text-slate-400'}`}>{opt}</span>
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
      <button onClick={handleSubmit} className="w-full py-3 rounded-2xl text-sm font-bold text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
        Submit Test ({answered}/{questions.length} answered)
      </button>
    </div>
  );
}

function PracticeResults({ config, results, onDone }) {
  const pct = results.percentage || 0; const passed = pct >= 60;
  const correct = results.breakdown?.filter(b => b.is_correct).length || 0;
  const total   = results.breakdown?.length || 0;
  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center gap-3">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{pct}%</div>
        <div className="text-center">
          <p className="text-base font-bold text-slate-900">{config.name}</p>
          <p className="text-sm text-slate-500 mt-0.5">{correct} / {total} correct · {config.topic} → {config.sub_topic}</p>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{passed ? 'Great work!' : 'Keep practicing!'}</div>
      </div>
      <div className="flex flex-col gap-3">
        {(results.breakdown || []).map((b, idx) => (
          <div key={idx} className={`bg-white rounded-2xl border p-4 ${b.is_correct ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-start gap-3 mb-3">
              <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${b.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{b.is_correct ? '✓' : '✗'}</span>
              <MathContent html={b.stem} className="text-sm text-slate-900 leading-relaxed [&_p]:m-0" />
            </div>
            <div className="flex flex-col gap-1.5 pl-9">
              {['A','B','C','D'].map(opt => {
                const text = b['option_' + opt.toLowerCase()]; if (!text) return null;
                const isSel = b.selected === opt; const isCorrect = b.correct_answer === opt;
                return (
                  <div key={opt} className={`flex items-start gap-2 px-3 py-2 rounded-xl text-xs ${isCorrect ? 'bg-green-50 text-green-800 font-semibold' : isSel ? 'bg-red-50 text-red-700' : 'text-slate-500'}`}>
                    <span className="font-bold shrink-0">{opt}.</span>
                    <MathContent html={text} className="[&_p]:m-0" />
                    {isCorrect && <span className="ml-auto shrink-0 text-green-600">✓ Correct</span>}
                    {isSel && !isCorrect && <span className="ml-auto shrink-0 text-red-500">Your answer</span>}
                  </div>
                );
              })}
              {b.explanation && <p className="text-xs text-slate-500 italic mt-1.5 border-t border-slate-100 pt-1.5">{b.explanation}</p>}
            </div>
          </div>
        ))}
      </div>
      <button onClick={onDone} className="w-full py-3 rounded-2xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>Back to Practice Tests</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function SATTests({ student }) {
  const [tab,    setTab]    = useState('mock');
  // activeTest: { type: 'adaptive'|'practice', config }
  const [activeTest, setActiveTest] = useState(null);

  if (activeTest?.type === 'adaptive') {
    return (
      <div className="page-content">
        <button onClick={() => setActiveTest(null)} className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium">
          ← Back to tests
        </button>
        <AdaptiveTaker config={activeTest.config} student={student} onFinish={() => setActiveTest(null)} />
      </div>
    );
  }
  if (activeTest?.type === 'practice') {
    return (
      <div className="page-content">
        <button onClick={() => setActiveTest(null)} className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 font-medium">
          ← Back to tests
        </button>
        <PracticeTaker config={activeTest.config} onFinish={() => setActiveTest(null)} />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">SAT Tests</h2>
        <p className="text-sm text-slate-500 mt-0.5">All available tests — take them anytime at your own pace</p>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit mb-6">
        {[
          { key: 'mock',       label: 'Mock Tests' },
          { key: 'diagnostic', label: 'Diagnostic Tests' },
          { key: 'practice',   label: 'Practice Tests' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'practice' ? (
        <PracticeConfigList onStart={cfg => setActiveTest({ type: 'practice', config: cfg })} />
      ) : (
        <AdaptiveConfigList
          key={tab}
          defaultFilter={tab}
          onStart={cfg => setActiveTest({ type: 'adaptive', config: cfg })}
        />
      )}
    </div>
  );
}
