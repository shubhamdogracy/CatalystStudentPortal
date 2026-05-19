import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import { formatDate } from './insightsUtils';

const PASS_COLOR    = '#10b981';
const FAIL_COLOR    = '#ef4444';
const PRIMARY_COLOR = '#4f46e5';
const TOOLTIP_STYLE = { borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 };

function ScoreTrendChart({ sessions }) {
  const data = sessions.map((s, i) => ({
    label: sessions.length > 1 ? formatDate(s.submittedAt) : `Attempt ${i + 1}`,
    score: s.percentage,
  }));
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-sm font-bold text-slate-700 mb-4">Score Trend Over Time</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
          <Tooltip formatter={v => [`${v}%`, 'Score']} contentStyle={TOOLTIP_STYLE} />
          <ReferenceLine y={60} stroke={PASS_COLOR} strokeDasharray="4 2"
            label={{ value: 'Pass', position: 'insideTopRight', fontSize: 10, fill: PASS_COLOR }} />
          <Line type="monotone" dataKey="score" stroke={PRIMARY_COLOR} strokeWidth={2.5}
            dot={{ r: 5, fill: PRIMARY_COLOR, strokeWidth: 0 }} activeDot={{ r: 7 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AttemptsBarChart({ sessions }) {
  const data = sessions.map((s, i) => ({
    name: `#${i + 1}`,
    score: s.percentage,
    fill: s.percentage >= 60 ? PASS_COLOR : FAIL_COLOR,
  }));
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-sm font-bold text-slate-700 mb-4">Individual Attempt Scores</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `${v}%`} />
          <Tooltip formatter={v => [`${v}%`, 'Score']} contentStyle={TOOLTIP_STYLE} />
          <ReferenceLine y={60} stroke={PASS_COLOR} strokeDasharray="4 2" />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function PassFailPieChart({ sessions }) {
  const passed = sessions.filter(s => s.percentage >= 60).length;
  const failed = sessions.length - passed;
  const data = [
    { name: 'Passed (≥60%)', value: passed, color: PASS_COLOR },
    { name: 'Failed (<60%)',  value: failed, color: FAIL_COLOR },
  ].filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <p className="text-sm font-bold text-slate-700 mb-4">Pass / Fail Ratio</p>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={130} height={130}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={58}
              dataKey="value" paddingAngle={3}>
              {data.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-sm text-slate-700">{d.value} {d.name.split(' ')[0].toLowerCase()}</span>
            </div>
          ))}
          <p className="text-xs text-slate-400 mt-1">{sessions.length} total attempt{sessions.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  );
}

export default function InsightsCharts({ sessions, subtopicSelected }) {
  if (!subtopicSelected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-sm font-semibold text-slate-600">Select a sub-topic above to view charts.</p>
        <p className="text-xs text-slate-400 mt-1">Use the filter to drill down to a specific sub-topic.</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-sm font-semibold text-slate-600">No completed attempts for this sub-topic yet.</p>
        <p className="text-xs text-slate-400 mt-1">Start practising to see your progress here!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ScoreTrendChart sessions={sessions} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AttemptsBarChart sessions={sessions} />
        <PassFailPieChart sessions={sessions} />
      </div>
    </div>
  );
}
