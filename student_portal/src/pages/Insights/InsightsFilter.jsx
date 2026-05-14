import { taxonomyTopics, taxonomySubtopics } from '../../data/satTaxonomy';

const SUBJ_LABEL = { all: 'All', math: 'Math', reading_writing: 'Reading & Writing' };

export default function InsightsFilter({ enriched, subject, topic, subtopic, onChange }) {
  const topics    = taxonomyTopics(subject);
  const subtopics = topic ? taxonomySubtopics(subject, topic) : [];

  // Which topics / subtopics have at least one completed attempt
  const topicsWithData    = new Set(enriched.map(s => s.topic));
  const subtopicsWithData = new Set(enriched.map(s => s.subtopic));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filter: Subject → Topic → Sub-topic</p>

      {/* Subject */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-slate-500">Subject</p>
        <div className="flex gap-2 flex-wrap">
          {['all', 'math', 'reading_writing'].map(s => (
            <button key={s} onClick={() => onChange({ subject: s, topic: '', subtopic: '' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                subject === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}>
              {SUBJ_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-slate-500">Topic</p>
        <div className="flex gap-2 flex-wrap">
          {topics.map(t => (
            <button key={t} onClick={() => onChange({ subject, topic: t, subtopic: '' })}
              className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                topic === t
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600'
              }`}>
              {t}
              {topicsWithData.has(t) && (
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white ${topic === t ? 'bg-green-300' : 'bg-green-500'}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-topic */}
      {topic && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-slate-500">Sub-topic</p>
          {subtopics.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No sub-topics found for this topic.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {subtopics.map(st => {
                const hasData = subtopicsWithData.has(st);
                return (
                  <button key={st} onClick={() => onChange({ subject, topic, subtopic: st })}
                    className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      subtopic === st
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}>
                    {st}
                    {hasData && (
                      <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white ${subtopic === st ? 'bg-green-300' : 'bg-green-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {topic && subtopics.length > 0 && !subtopic && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> = you have attempts
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
