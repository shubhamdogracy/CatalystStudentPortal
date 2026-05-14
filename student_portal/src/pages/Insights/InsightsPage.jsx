import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, FileText } from 'lucide-react';
import { satService } from '../../services/api';
import { buildEnrichedHistory, filterSessions } from './insightsUtils';
import InsightsFilter from './InsightsFilter';
import InsightsCharts from './InsightsCharts';
import InsightsSummary from './InsightsSummary';

const TABS = [
  { key: 'charts',  label: 'Charts',  Icon: BarChart2 },
  { key: 'summary', label: 'Summary', Icon: FileText   },
];

export default function InsightsPage() {
  const navigate = useNavigate();
  const [enriched, setEnriched] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [tab,      setTab]      = useState('charts');
  const [filter,   setFilter]   = useState({ subject: 'all', topic: '', subtopic: '' });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [historyRes, configRes] = await Promise.all([
        satService.getPracticeHistory(),
        satService.listPractice(),
      ]);
      setEnriched(buildEnrichedHistory(historyRes.data || [], configRes.data || []));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredSessions = filterSessions(enriched, filter.subject, filter.topic, filter.subtopic);

  return (
    <div className="page-content flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors shrink-0">
          <ArrowLeft size={16} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900">Practice Insights</h1>
          <p className="text-xs text-slate-500">Track your progress and identify areas to improve</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="font-bold underline ml-3">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading insights…</div>
      ) : (
        <>
          <InsightsFilter
            enriched={enriched}
            subject={filter.subject}
            topic={filter.topic}
            subtopic={filter.subtopic}
            onChange={setFilter}
          />

          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
            {TABS.map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-[10px] text-xs font-bold transition-all ${
                  tab === key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          {tab === 'charts' ? (
            <InsightsCharts sessions={filteredSessions} subtopicSelected={!!filter.subtopic} />
          ) : (
            <InsightsSummary enriched={enriched} />
          )}
        </>
      )}
    </div>
  );
}
