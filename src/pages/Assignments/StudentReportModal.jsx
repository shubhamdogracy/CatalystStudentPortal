import { useState, useMemo, useEffect } from 'react';
import { subjects as SECTION_META } from '../../theme/tokens';
import { getMasteryLevel } from '../../utils/colorMapping';
import { computeTopicMastery, generateAISummary, downloadReport } from './reportUtils';
import TopicCharts from './ReportCharts';
import AISummaryView from './AISummaryView';
import QuestionReview from './QuestionReview';

export function StudentReportModal({ attempt, assignment, onClose, isStudentView = true }) {
  const [view,          setView]          = useState('questions');
  const [activeSection, setActiveSection] = useState(
    attempt.sectionResults?.[0]?.sectionId || 'rw',
  );
  const [activeModule, setActiveModule] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const topicMastery = useMemo(() => computeTopicMastery(assignment, attempt), [assignment, attempt]);
  const hasTopics    = Object.keys(topicMastery).length > 0;
  const aiData       = useMemo(
    () => (hasTopics ? generateAISummary(topicMastery, attempt) : null),
    [topicMastery, attempt, hasTopics],
  );

  const sectionResult = attempt.sectionResults?.find((s) => s.sectionId === activeSection);
  const moduleResult  = sectionResult?.modules?.find((m) => m.moduleNumber === activeModule);
  const assignSection = assignment.sections?.find((s) => (s.id || s.sid) === activeSection);
  const assignModule  = assignSection?.modules?.find((m) => m.number === activeModule);
  const meta          = SECTION_META[activeSection] || SECTION_META.rw;

  const handleDownload = () => downloadReport(attempt, assignment, topicMastery, aiData);

  const TABS = [
    { key: 'questions', label: 'Questions' },
    ...(hasTopics ? [{ key: 'topics', label: 'Topic Mastery' }] : []),
    ...(hasTopics ? [{ key: 'charts', label: 'Charts'        }] : []),
    { key: 'summary', label: 'AI Summary' },
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100]">
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4"
             style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.3)' }}>
          <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <p className="text-sm font-bold text-gray-700">Loading report…</p>
          <p className="text-xs text-gray-400">Analysing performance data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
           style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0"
             style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                 style={{ background: 'rgba(255,255,255,0.2)' }}>
              {attempt.avatar || (attempt.studentName || 'S').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {isStudentView ? 'My Score Report' : attempt.studentName}
              </h3>
              <p className="text-xs text-indigo-300 mt-0.5">
                {isStudentView ? assignment.title : `${attempt.batchName} · Score report`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-white">
              <span className="text-sm font-extrabold">{attempt.score}/{attempt.maxScore}</span>
              <span className="text-[11px] opacity-70">({attempt.percentage}%)</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                attempt.passed ? 'bg-emerald-400 text-white' : 'bg-red-400 text-white'
              }`}>
                {attempt.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <button onClick={handleDownload} title="Download report as HTML"
                    className="w-8 h-8 rounded-xl bg-white/15 text-white hover:bg-emerald-500 flex items-center justify-center text-sm transition-colors">
              ⬇
            </button>
            <button onClick={onClose}
                    className="w-8 h-8 rounded-xl bg-white/15 text-white hover:bg-white/30 flex items-center justify-center text-sm font-bold transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="shrink-0 border-b border-gray-100 bg-white px-5 pt-3 flex gap-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setView(t.key)}
                    className="px-4 py-1.5 rounded-t-lg text-[12px] font-bold border-b-2 transition-all"
                    style={view === t.key
                      ? { borderColor: '#4f46e5', color: '#4f46e5', background: '#fff' }
                      : { borderColor: 'transparent', color: '#9ca3af' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Section + module tabs (questions view only) */}
        <div className={`shrink-0 border-b border-gray-100 bg-gray-50 ${view !== 'questions' ? 'hidden' : ''}`}>
          <div className="flex gap-1 px-5 pt-3">
            {attempt.sectionResults?.map((sr) => {
              const m      = SECTION_META[sr.sectionId] || {};
              const sScore = sr.modules.reduce((a, mod) => a + mod.score, 0);
              const sMax   = sr.modules.reduce((a, mod) => a + mod.maxScore, 0);
              const active = activeSection === sr.sectionId;
              return (
                <button key={sr.sectionId}
                        onClick={() => { setActiveSection(sr.sectionId); setActiveModule(1); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all"
                        style={active
                          ? { borderColor: m.accent, color: m.accent, background: '#fff' }
                          : { borderColor: 'transparent', color: '#9ca3af', background: 'transparent' }}>
                  <span>{m.icon}</span>
                  <span>{sr.sectionName}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                        style={{ background: m.bg, color: m.accent }}>
                    {sScore}/{sMax}
                  </span>
                </button>
              );
            })}
          </div>
          {sectionResult && (
            <div className="flex gap-1 px-5 py-2">
              {sectionResult.modules.map((mod) => {
                const active = activeModule === mod.moduleNumber;
                return (
                  <button key={mod.moduleNumber} onClick={() => setActiveModule(mod.moduleNumber)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all"
                          style={active
                            ? { background: meta.accent, color: '#fff' }
                            : { background: '#f3f4f6', color: '#9ca3af' }}>
                    Module {mod.moduleNumber}
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold"
                          style={active
                            ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                            : { background: '#e5e7eb', color: '#6b7280' }}>
                      {mod.score}/{mod.maxScore}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Topic Mastery view */}
        {view === 'topics' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {Object.entries(topicMastery).map(([groupName, topics]) => (
              <div key={groupName} className="rounded-xl overflow-hidden border border-gray-200">
                <div className="bg-gray-800 px-4 py-3">
                  <p className="text-sm font-bold text-white">{groupName}</p>
                </div>
                <div className="grid grid-cols-[1fr_auto_160px] bg-gray-700 px-4 py-2">
                  <span className="text-[10px] font-extrabold text-gray-300 uppercase tracking-widest">Topics</span>
                  <span className="text-[10px] font-extrabold text-gray-300 uppercase tracking-widest text-center px-6">Mastery Level</span>
                  <span className="text-[10px] font-extrabold text-gray-300 uppercase tracking-widest text-right">Score</span>
                </div>
                {Object.entries(topics).map(([topic, data]) => {
                  const pct     = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
                  const mastery = getMasteryLevel(pct);
                  return (
                    <div key={topic} className="grid grid-cols-[1fr_auto_160px] items-center px-4 py-3 border-t border-gray-100 bg-white">
                      <div>
                        <p className="text-[13px] text-gray-700">{topic}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{data.correct}/{data.total} correct</p>
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mx-6"
                            style={{ background: mastery.bg, color: mastery.color }}>
                        {mastery.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                               style={{ width: `${pct}%`, background: mastery.bar }} />
                        </div>
                        <span className="text-[10px] font-bold shrink-0 w-8 text-right" style={{ color: mastery.bar }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {view === 'charts'  && <div className="flex-1 overflow-y-auto"><TopicCharts topicMastery={topicMastery} /></div>}
        {view === 'summary' && <div className="flex-1 overflow-y-auto"><AISummaryView aiData={aiData} onDownload={handleDownload} /></div>}

        {/* Questions view */}
        <div className={`flex-1 overflow-y-auto ${view !== 'questions' ? 'hidden' : ''}`}>
          <QuestionReview
            assignModule={assignModule}
            moduleResult={moduleResult}
            activeModule={activeModule}
            meta={meta}
          />
        </div>

      </div>
    </div>
  );
}

export default StudentReportModal;
