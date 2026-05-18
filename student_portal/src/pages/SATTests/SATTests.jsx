/**
 * SATTests.jsx — SAT test browsing and taking page.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { TrendingUp, ChevronDown } from 'lucide-react';
import MathContent from '../../components/common/MathContent';
import { satService } from '../../services/api';
import DesmosCalculator from '../Assignments/DesmosCalculator';
import MathReferencesPanel from '../Assignments/MathReferencesPanel';
import { C } from '../Assignments/testConstants';
import { getMasteryLevel, CHART_PALETTE, MASTERY_CHART_COLORS } from '../../utils/colorMapping';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell, AreaChart, Area, PieChart, Pie, ReferenceLine,
} from 'recharts';
import {
  SATDivider,
  TestTopBar,
  TestBottomBar,
  SplitContentArea,
  NotesModal,
  QuestionPicker,
} from '../Assignments/TestSharedComponents';
import ProjectedSATScore from './ProjectedSATScore';

// ─── Constants ─────────────────────────────────────────────────────────────────
const SUBJ_LABEL    = { math: 'Math', reading_writing: 'Reading & Writing' };
const SUBJ_STYLE    = { math: 'bg-purple-100 text-purple-700', reading_writing: 'bg-blue-100 text-blue-700' };
const TYPE_STYLE    = { mock: 'bg-emerald-100 text-emerald-700', diagnostic: 'bg-orange-100 text-orange-700' };
const SERIES_SUFFIX = / — (Math|Reading & Writing)$/;
const getSeriesName = (name) => name.replace(SERIES_SUFFIX, '').trim();


function boldChoiceLabels(html) {
  if (!html) return html;
  return html.replace(
    /(Choice\s+[A-D]\s+is\s+(?:the\s+best\s+answer|correct|incorrect)\.?)/gi,
    '<strong>$1</strong>',
  );
}

// ─── Question data normaliser ──────────────────────────────────────────────────
function normalizeQuestion(q) {
  const correctAnswer = q.correct_answer || q.answer || q.correct || q.answer_key || null;
  console.log('[normalizeQuestion] id:', q._id || q.id, '| all keys:', Object.keys(q), '| correct_answer resolved:', correctAnswer);
  return {
    ...q,
    _id: q._id || q.id,
    description: q.description || q.stem || null,
    title: q.title || null,
    choices: q.choices || {
      A: q.option_a || '',
      B: q.option_b || '',
      C: q.option_c || '',
      D: q.option_d || '',
    },
    format: q.format || 'multiple_choice',
    correct_answer: correctAnswer,
  };
}

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
function ModuleTransition({ onContinue, busy }) {
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
        <p className="text-[12px] mb-8" style={{ color: C.textMuted }}>
          Your Module 2 difficulty has been set based on your performance.
        </p>
        <button onClick={onContinue} disabled={busy}
          className="w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60 transition-all hover:opacity-90"
          style={{ backgroundColor: C.accent }}>
          {busy ? 'Loading…' : 'Begin Module 2 →'}
        </button>
      </div>
    </div>
  );
}

// ─── Per-module result section (expandable) ────────────────────────────────────
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
                <MathContent html={boldChoiceLabels(b.explanation)} className="text-[10px] italic mt-2 pl-7 border-t pt-2 [&_p]:m-0 [&_p]:mb-1" style={{ color: C.textMuted, borderColor: C.bg1 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Adaptive test results (single-subject 2-module) ──────────────────────────
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
  const navigate = useNavigate();
  const pct      = results.percentage || 0;

  useEffect(() => {
    if (results?.streak?.justIncremented) {
      setTimeout(() => confetti({ particleCount: 140, spread: 80, origin: { y: 0.55 }, colors: ['#f97316', '#fbbf24', '#ef4444', '#a855f7', '#3b82f6'] }), 400);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
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
              {['A', 'B', 'C', 'D'].some(o => b['option_' + o.toLowerCase()]) ? (
                ['A', 'B', 'C', 'D'].map(opt => {
                  const text = b['option_' + opt.toLowerCase()]; if (!text) return null;
                  const isSel     = b.selected === opt;
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
                })
              ) : (
                <div className="flex gap-6 text-[12px] px-3 py-2 rounded-xl bg-slate-50" style={{ color: C.textMuted }}>
                  <span>Your answer: <strong style={{ color: b.is_correct ? '#16a34a' : '#dc2626' }}>{b.selected ?? '—'}</strong></span>
                  {!b.is_correct && b.correct_answer && (
                    <span>Correct: <strong className="text-green-700">{b.correct_answer}</strong></span>
                  )}
                </div>
              )}
              {b.explanation && (
                <div className="text-[11px] italic mt-1.5 border-t pt-1.5" style={{ color: C.textMuted, borderColor: C.bg1 }}>
                  <MathContent html={boldChoiceLabels(b.explanation)} className="[&_p]:m-0 [&_p]:mb-1" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => { onDone(); navigate('/sat/practice'); }}
        className="w-full py-3 rounded-2xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
        style={{ backgroundColor: C.accent }}>
        Back to Practice Tests
      </button>
    </div>
  );
}

// ─── SAT topic mastery helpers ─────────────────────────────────────────────────
function computeSATTopicMastery(rwM1, rwM2, mathM1, mathM2) {
  const result = {};
  [
    { label: 'R&W Module 1',  data: rwM1   },
    { label: 'R&W Module 2',  data: rwM2   },
    { label: 'Math Module 1', data: mathM1 },
    { label: 'Math Module 2', data: mathM2 },
  ].forEach(({ label, data }) => {
    if (!data?.breakdown?.length) return;
    data.breakdown.forEach(item => {
      const topic = (item.topic || '').trim();
      if (!topic) return;
      if (!result[label]) result[label] = {};
      if (!result[label][topic]) result[label][topic] = { correct: 0, total: 0 };
      result[label][topic].total++;
      if (item.is_correct) result[label][topic].correct++;
    });
  });
  return result;
}

function generateSATAISummary(topicMastery, totalPct, passed) {
  const allTopics = [];
  for (const [group, topics] of Object.entries(topicMastery)) {
    for (const [topic, data] of Object.entries(topics)) {
      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      allTopics.push({ group, topic, pct, masteryLabel: getMasteryLevel(pct).label });
    }
  }
  const strong        = allTopics.filter(t => t.pct >= 70).sort((a, b) => b.pct - a.pct);
  const needsPractice = allTopics.filter(t => t.pct < 40).sort((a, b) => a.pct - b.pct);
  const developing    = allTopics.filter(t => t.pct >= 40 && t.pct < 70).sort((a, b) => b.pct - a.pct);

  let overallMsg;
  if (totalPct >= 85)      overallMsg = `Outstanding performance! A score of ${totalPct}% places you at mastery level — exceptional command of this material.`;
  else if (totalPct >= 70) overallMsg = `Great work! Scoring ${totalPct}% reflects strong understanding. You're well on your way to mastering this content.`;
  else if (totalPct >= 55) overallMsg = `Good effort! A score of ${totalPct}% shows solid progress. Targeted practice can push you into the advanced tier.`;
  else if (totalPct >= 40) overallMsg = `You scored ${totalPct}%, showing foundational understanding. Focused practice on weaker areas will yield quick improvements.`;
  else                     overallMsg = `You scored ${totalPct}%. This is your starting point — every expert begins here. Targeted study makes a significant difference.`;

  const strengthMsg = strong.length > 0
    ? `You excelled in: ${strong.slice(0, 4).map(t => `${t.topic} (${t.pct}%)`).join(', ')}. These are your power areas — keep leveraging them.`
    : `No topic reached the 70%+ threshold yet, but growth is happening. Every practice session moves the needle.`;

  let improveMsg;
  if (needsPractice.length > 0) {
    improveMsg = `Prioritise: ${needsPractice.slice(0, 4).map(t => `${t.topic} (${t.pct}%)`).join(', ')}. These topics need the most focused attention.`;
  } else if (developing.length > 0) {
    improveMsg = `Keep working on: ${developing.slice(0, 3).map(t => `${t.topic} (${t.pct}%)`).join(', ')}. A little more practice will unlock the next mastery tier.`;
  } else {
    improveMsg = `All topics are performing well. Challenge yourself with harder problems to push toward mastery.`;
  }

  const devMsg = (developing.length > 0 && needsPractice.length > 0)
    ? `Good momentum in: ${developing.slice(0, 3).map(t => `${t.topic} (${t.pct}%)`).join(', ')}. A few more sessions can move these into your strength zone.`
    : '';

  const nextMsg = passed
    ? `Great achievement — you passed! Drill your developing topics to push them into your strong zone, and attempt progressively harder questions to extend your mastery.`
    : `Review every wrong answer carefully. Schedule focused practice on your lowest-scoring topics. Even 20 minutes daily on weak areas compounds quickly.`;

  return { overallMsg, strengthMsg, improveMsg, devMsg, nextMsg, strong, needsPractice, developing, allTopics, overall: totalPct, passed };
}

// ─── SAT Charts (Recharts) ─────────────────────────────────────────────────────

const SCORE_COLOR  = pct => pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444';
const SECTION_COLORS = {
  'R&W Module 1':  '#4f46e5',
  'R&W Module 2':  '#818cf8',
  'Math Module 1': '#7c3aed',
  'Math Module 2': '#a78bfa',
};

// ── Shared chart pieces ──────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100"
           style={{ background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)' }}>
        <p className="text-sm font-extrabold text-white">{title}</p>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 min-w-[140px]">
      {label && <p className="text-[12px] font-extrabold text-gray-800 mb-2 border-b border-gray-100 pb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px] mt-1">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: p.color || p.fill }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-extrabold text-gray-800 ml-auto pl-2">{p.value}{p.unit || ''}</span>
        </div>
      ))}
    </div>
  );
}

const axisStyle   = { fontSize: 11, fill: '#94a3b8' };
const labelStyle  = { fontSize: 12, fill: '#64748b' };
const gridProps   = { strokeDasharray: '3 3', stroke: '#f1f5f9' };

// ── Main charts component ────────────────────────────────────────────────────────
function SATTopicCharts({ topicMastery }) {
  const groupEntries = Object.entries(topicMastery);

  if (groupEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm">
        <span className="text-4xl mb-3">📊</span>
        <p className="font-semibold">No topic data available.</p>
        <p className="text-xs mt-1">Assign topics to questions to enable charts.</p>
      </div>
    );
  }

  // ── Data preparation ──────────────────────────────────────────────────────────

  // Section overview: one bar per module showing overall score%
  const sectionOverview = groupEntries.map(([group, topics]) => {
    const correct = Object.values(topics).reduce((s, d) => s + d.correct, 0);
    const total   = Object.values(topics).reduce((s, d) => s + d.total,   0);
    const score   = total > 0 ? Math.round((correct / total) * 100) : 0;
    return {
      name:     group.replace(' Module ', ' M'),
      fullName: group,
      correct,  total,  score,
      color:    SECTION_COLORS[group] || '#6366f1',
    };
  });

  // Per-section topic bars (score % per topic, sorted desc)
  const topicBarGroups = groupEntries.map(([group, topics]) => ({
    group,
    data: Object.entries(topics)
      .map(([name, d]) => ({
        name:     name.length > 16 ? name.slice(0, 14) + '…' : name,
        fullName: name,
        score:    d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
        correct:  d.correct,
        wrong:    d.total - d.correct,
        total:    d.total,
      }))
      .sort((a, b) => b.score - a.score),
  }));

  // All-topics stacked correct/wrong (sorted by score desc)
  const stackedData = groupEntries
    .flatMap(([group, topics]) =>
      Object.entries(topics).map(([name, d]) => ({
        name:     name.length > 16 ? name.slice(0, 14) + '…' : name,
        fullName: name,
        group,
        correct:  d.correct,
        wrong:    d.total - d.correct,
        total:    d.total,
        score:    d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
      }))
    )
    .sort((a, b) => b.score - a.score);

  // Mastery distribution for donut pie
  const masteryCount = {};
  for (const topics of Object.values(topicMastery)) {
    for (const [, d] of Object.entries(topics)) {
      const pct   = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
      const label = getMasteryLevel(pct).label;
      masteryCount[label] = (masteryCount[label] || 0) + 1;
    }
  }
  const pieData = Object.entries(masteryCount)
    .map(([name, value]) => ({ name, value, color: MASTERY_CHART_COLORS[name] || '#A5A5A5' }))
    .sort((a, b) => b.value - a.value);
  const totalTopics = pieData.reduce((s, e) => s + e.value, 0);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 space-y-6 max-w-3xl mx-auto pb-10">

      {/* ── 1. Section Overview Bar Chart ─────────────────────────────────── */}
      <ChartCard
        title="Section Performance Overview"
        subtitle="Overall score % across all four modules — dashed line marks the 60% threshold"
      >
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={sectionOverview} margin={{ top: 14, right: 16, left: -8, bottom: 4 }}
                    barCategoryGap="40%">
            <CartesianGrid {...gridProps} vertical={false} />
            <XAxis dataKey="name" tick={labelStyle} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false}
                   tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 6 }} />
            <ReferenceLine y={60} stroke="#cbd5e1" strokeDasharray="5 3"
                           label={{ value: '60% threshold', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }} />
            <Bar dataKey="score" name="Score" unit="%" radius={[8, 8, 0, 0]}
                 label={{ position: 'top', fontSize: 11, fill: '#64748b', formatter: v => `${v}%` }}>
              {sectionOverview.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-1 justify-center">
          {sectionOverview.map(s => (
            <div key={s.fullName} className="flex items-center gap-1.5 text-[11px]">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="text-gray-500">{s.fullName}:</span>
              <span className="font-extrabold text-gray-700">{s.correct}/{s.total} correct</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* ── 2. Performance Trajectory Area Chart ──────────────────────────── */}
      <ChartCard
        title="Performance Trajectory"
        subtitle="Score % per module in test order — shows momentum shift across the diagnostic"
      >
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={sectionOverview} margin={{ top: 14, right: 16, left: -8, bottom: 4 }}>
            <defs>
              <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="10%"  stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} vertical={false} />
            <XAxis dataKey="name" tick={labelStyle} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={axisStyle} axisLine={false} tickLine={false}
                   tickFormatter={v => `${v}%`} />
            <Tooltip content={({ active, payload, _label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-[12px]">
                  <p className="font-extrabold text-gray-800 mb-1.5">{d.fullName}</p>
                  <p className="text-gray-500">Score: <strong style={{ color: SCORE_COLOR(d.score) }}>{d.score}%</strong></p>
                  <p className="text-gray-500">Correct: <strong className="text-emerald-600">{d.correct}/{d.total}</strong></p>
                </div>
              );
            }} />
            <ReferenceLine y={60} stroke="#cbd5e1" strokeDasharray="5 3" />
            <Area type="monotone" dataKey="score" name="Score" unit="%"
                  stroke="#6366f1" strokeWidth={2.5} fill="url(#areaFill)"
                  dot={{ fill: '#6366f1', r: 5, stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── 3. Per-section topic score bar charts ─────────────────────────── */}
      {topicBarGroups.map(({ group, data }) => (
        <ChartCard key={group}
          title={`${group} — Topic Scores`}
          subtitle="Score % per topic, colour-coded green ≥70 / amber ≥45 / red <45 · dashed line at 60%"
        >
          <ResponsiveContainer width="100%" height={Math.max(200, data.length * 48)}>
            <BarChart data={data} layout="vertical"
                      margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
              <CartesianGrid {...gridProps} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={axisStyle}
                     axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" width={120}
                     tick={labelStyle} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-[12px]">
                    <p className="font-extrabold text-gray-800 mb-1.5">{d.fullName}</p>
                    <p className="text-gray-500">Score: <strong style={{ color: SCORE_COLOR(d.score) }}>{d.score}%</strong></p>
                    <p className="text-gray-500">Correct: <strong className="text-emerald-600">{d.correct}</strong> / {d.total}</p>
                    <p className="text-gray-500">Wrong: <strong className="text-red-500">{d.wrong}</strong></p>
                  </div>
                );
              }} />
              <ReferenceLine x={60} stroke="#cbd5e1" strokeDasharray="5 3" />
              <Bar dataKey="score" name="Score" unit="%" radius={[0, 6, 6, 0]}
                   label={{ position: 'right', fontSize: 11, fill: '#64748b', formatter: v => `${v}%` }}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={SCORE_COLOR(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      ))}

      {/* ── 4. Correct vs Wrong stacked bar ───────────────────────────────── */}
      <ChartCard
        title="Correct vs Incorrect — All Topics"
        subtitle="Stacked bar showing actual question counts · hover for full topic name and section"
      >
        <ResponsiveContainer width="100%" height={Math.max(220, stackedData.length * 30)}>
          <BarChart data={stackedData} layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid {...gridProps} horizontal={false} />
            <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={120}
                   tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-[12px]">
                  <p className="font-extrabold text-gray-800 mb-1.5">{d.fullName}</p>
                  <p className="text-gray-400 text-[11px] mb-1.5">{d.group}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span className="text-gray-500">Correct: <strong className="text-emerald-600">{d.correct}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-400" />
                    <span className="text-gray-500">Wrong: <strong className="text-red-500">{d.wrong}</strong></span>
                  </div>
                  <p className="text-gray-500 mt-1.5 pt-1.5 border-t border-gray-100">
                    Score: <strong style={{ color: SCORE_COLOR(d.score) }}>{d.score}%</strong>
                  </p>
                </div>
              );
            }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="correct" name="Correct" stackId="s" fill="#10b981" />
            <Bar dataKey="wrong"   name="Wrong"   stackId="s" fill="#f87171" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── 5. Mastery distribution donut + legend bars ───────────────────── */}
      {pieData.length > 0 && (
        <ChartCard
          title="Mastery Level Distribution"
          subtitle="How your topics are spread across mastery tiers"
        >
          <div className="flex flex-col sm:flex-row items-center gap-8">
            {/* Donut */}
            <div className="shrink-0" style={{ width: 220, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%"
                       innerRadius={58} outerRadius={92}
                       paddingAngle={3} dataKey="value"
                       label={({ percent }) => `${Math.round(percent * 100)}%`}
                       labelLine={false}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [`${v} topic${v !== 1 ? 's' : ''}`, name]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with mini progress bars */}
            <div className="flex flex-col gap-3.5 flex-1 w-full">
              {pieData.map(entry => {
                const pct = Math.round((entry.value / totalTopics) * 100);
                return (
                  <div key={entry.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: entry.color }} />
                        <span className="text-[13px] font-semibold text-gray-700">{entry.name}</span>
                      </div>
                      <span className="text-[11px] font-extrabold tabular-nums" style={{ color: entry.color }}>
                        {entry.value} topic{entry.value !== 1 ? 's' : ''} &nbsp;·&nbsp; {pct}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                           style={{ width: `${pct}%`, background: entry.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartCard>
      )}

    </div>
  );
}

function SATAISummaryView({ aiData }) {
  if (!aiData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm">
        <span className="text-3xl mb-2">🤖</span>
        <p>No topic data — add topics to questions to enable AI analysis.</p>
      </div>
    );
  }
  return (
    <div className="p-5 space-y-3">
      <div className="rounded-xl p-4 border"
        style={{ background: aiData.passed ? '#f0fdf4' : '#fff7ed', borderColor: aiData.passed ? '#6ee7b7' : '#fed7aa' }}>
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">{aiData.passed ? '🎯' : '📈'}</span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5"
              style={{ color: aiData.passed ? '#065f46' : '#9a3412' }}>Overall Performance</p>
            <p className="text-[13px] leading-relaxed text-gray-700">{aiData.overallMsg}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4 border border-emerald-200 bg-emerald-50">
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0">💪</span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 mb-1.5">Strong Areas</p>
            <p className="text-[13px] leading-relaxed text-gray-700">{aiData.strengthMsg}</p>
            {aiData.strong.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {aiData.strong.slice(0, 5).map(t => (
                  <span key={t.topic} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {t.topic} · {t.pct}%
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl p-4 border border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0">🎯</span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-700 mb-1.5">Focus Areas</p>
            <p className="text-[13px] leading-relaxed text-gray-700">{aiData.improveMsg}</p>
            {aiData.needsPractice.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {aiData.needsPractice.slice(0, 5).map(t => (
                  <span key={t.topic} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                    {t.topic} · {t.pct}%
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {aiData.devMsg && (
        <div className="rounded-xl p-4 border border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <span className="text-xl shrink-0">🔆</span>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 mb-1.5">Developing Areas</p>
              <p className="text-[13px] leading-relaxed text-gray-700">{aiData.devMsg}</p>
              {aiData.developing.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {aiData.developing.slice(0, 4).map(t => (
                    <span key={t.topic} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                      {t.topic} · {t.pct}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl p-4 border border-indigo-200 bg-indigo-50">
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0">🚀</span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 mb-1.5">Next Steps</p>
            <p className="text-[13px] leading-relaxed text-gray-700">{aiData.nextMsg}</p>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-gray-400">Opens as an HTML file — open in browser and print to save as PDF.</p>
    </div>
  );
}

function downloadSATReport(seriesName, totalPct, passed, topicMastery, aiData, totalScore, totalMax) {
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  let topicRowsHtml = '';
  for (const [group, topics] of Object.entries(topicMastery)) {
    topicRowsHtml += `<tr><td colspan="4" style="background:#1e293b;color:#fff;font-weight:700;padding:8px 12px;font-size:13px;">${group}</td></tr>`;
    for (const [topic, data] of Object.entries(topics)) {
      const pct     = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      const mastery = getMasteryLevel(pct);
      topicRowsHtml += `<tr>
        <td style="padding:8px 12px;font-size:13px;">${topic}</td>
        <td style="padding:8px 12px;text-align:center;">
          <span style="background:${mastery.bg};color:${mastery.color};padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;">${mastery.label}</span>
        </td>
        <td style="padding:8px 12px;text-align:center;font-size:13px;">${data.correct}/${data.total}</td>
        <td style="padding:8px 12px;text-align:center;font-size:13px;font-weight:700;color:${mastery.color};">${pct}%</td>
      </tr>`;
    }
  }

  const aiHtml = aiData ? `
    <div style="margin-top:24px;padding:16px;background:#f8fafc;border-radius:12px;border-left:4px solid #4f46e5;">
      <h3 style="margin:0 0 12px;color:#4f46e5;font-size:15px;font-weight:700;">AI Performance Summary</h3>
      <p style="margin:0 0 10px;color:#374151;line-height:1.6;font-size:13px;">${aiData.overallMsg}</p>
      <p style="margin:0 0 10px;color:#065f46;line-height:1.6;font-size:13px;"><strong>Strong Areas:</strong> ${aiData.strengthMsg}</p>
      <p style="margin:0 0 10px;color:#7c2d12;line-height:1.6;font-size:13px;"><strong>Focus Areas:</strong> ${aiData.improveMsg}</p>
      ${aiData.devMsg ? `<p style="margin:0 0 10px;color:#92400e;line-height:1.6;font-size:13px;"><strong>Developing:</strong> ${aiData.devMsg}</p>` : ''}
      <p style="margin:0;color:#374151;line-height:1.6;font-size:13px;"><strong>Next Steps:</strong> ${aiData.nextMsg}</p>
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>SAT Report — ${seriesName}</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1e293b;padding:32px;max-width:820px;margin:0 auto;}.header{background:linear-gradient(135deg,#1e1b4b,#312e81);color:#fff;padding:20px 24px;border-radius:12px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;}.score-box{background:rgba(255,255,255,0.18);border-radius:10px;padding:10px 18px;text-align:center;}.score-box .score{font-size:26px;font-weight:800;}.pass-badge{display:inline-block;margin-top:6px;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;background:${passed ? '#10b981' : '#ef4444'};color:#fff;}h2{font-size:15px;font-weight:700;margin:24px 0 10px;color:#374151;}table{width:100%;border-collapse:collapse;margin-top:6px;}th{background:#374151;color:#fff;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;}td{border-bottom:1px solid #e5e7eb;vertical-align:middle;}footer{margin-top:36px;font-size:11px;color:#9ca3af;text-align:center;}</style>
</head><body>
<div class="header">
  <div>
    <div style="font-size:10px;opacity:.65;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">SAT Score Report</div>
    <div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:2px;">${seriesName}</div>
    <div style="font-size:11px;opacity:.6;margin-top:4px;">Completed: ${date}</div>
  </div>
  <div class="score-box">
    <div class="score">${totalPct}%</div>
    <div style="font-size:12px;opacity:.75;margin-top:2px;">${totalScore} / ${totalMax} correct</div>
    <div class="pass-badge">${passed ? 'PASSED' : 'NEEDS WORK'}</div>
  </div>
</div>
${aiHtml}
${Object.keys(topicMastery).length > 0 ? `
<h2>Topic Mastery</h2>
<table>
  <thead><tr><th>Topic</th><th style="text-align:center">Mastery Level</th><th style="text-align:center">Correct</th><th style="text-align:center">Score %</th></tr></thead>
  <tbody>${topicRowsHtml}</tbody>
</table>` : ''}
<div class="footer">Generated by Catalyst Learning Platform &nbsp;·&nbsp; ${date}</div>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `sat-report-${seriesName.replace(/\s+/g, '-')}-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── SAT Full Test Results — full-screen gamified layout ───────────────────────
function SATResultsModal({ rwM1, rwM2, mathM1, mathM2, seriesName, onClose, isDiagnostic = false }) {
  const [view,         setView]         = useState(isDiagnostic ? 'sat_score' : 'questions');
  const [activeModule, setActiveModule] = useState('rw_m1');

  const rwScore    = (rwM1?.score    || 0) + (rwM2?.score    || 0);
  const rwMax      = (rwM1?.max_score || 0) + (rwM2?.max_score || 0);
  const mathScore  = (mathM1?.score  || 0) + (mathM2?.score  || 0);
  const mathMax    = (mathM1?.max_score || 0) + (mathM2?.max_score || 0);
  const totalScore = rwScore + mathScore;
  const totalMax   = rwMax   + mathMax;
  const totalPct   = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const passed     = totalPct >= 60;

  const topicMastery = useMemo(
    () => computeSATTopicMastery(rwM1, rwM2, mathM1, mathM2),
    [rwM1, rwM2, mathM1, mathM2],
  );
  const hasTopics = Object.keys(topicMastery).length > 0;
  const aiData    = useMemo(
    () => hasTopics ? generateSATAISummary(topicMastery, totalPct, passed) : null,
    [topicMastery, totalPct, passed, hasTopics],
  );

  const modules = [
    { key: 'rw_m1',   label: 'R&W Module 1',  data: rwM1,   color: '#4f46e5' },
    { key: 'rw_m2',   label: 'R&W Module 2',  data: rwM2,   color: '#4f46e5' },
    { key: 'math_m1', label: 'Math Module 1', data: mathM1, color: '#7c3aed' },
    { key: 'math_m2', label: 'Math Module 2', data: mathM2, color: '#7c3aed' },
  ];
  const activeModData = modules.find(m => m.key === activeModule);

  const TABS = [
    ...(isDiagnostic ? [{ key: 'sat_score', label: '🎯 SAT Score' }] : []),
    { key: 'questions', label: '📝 Questions'     },
    ...(hasTopics ? [{ key: 'topics',  label: '📊 Topic Mastery' }] : []),
    ...(hasTopics ? [{ key: 'charts',  label: '📈 Charts'        }] : []),
    { key: 'summary',   label: '🤖 AI Summary'   },
  ];

  const handleDownload = () => downloadSATReport(seriesName, totalPct, passed, topicMastery, aiData, totalScore, totalMax);

  return (
    <div className="fixed inset-0 z-[1100] flex flex-col overflow-hidden" style={{ background: '#f1f5f9' }}>

      {/* ── Gamified Header ──────────────────────────────────────────────── */}
      <div className="shrink-0"
           style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4c1d95 100%)' }}>

        {/* Top row: identity + actions */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-lg"
                 style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
              📋
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white leading-tight">{seriesName}</h2>
              <p className="text-[11px] text-indigo-300 mt-0.5">SAT Diagnostic Report</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Raw score pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-white"
                 style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span className="text-sm font-extrabold">{totalScore}/{totalMax}</span>
              <span className="text-[11px] opacity-60">({totalPct}%)</span>
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${passed ? 'bg-emerald-400' : 'bg-red-400'}`}>
                {passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
            <button onClick={handleDownload} title="Download report"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
              ⬇ Export
            </button>
            <button onClick={onClose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white transition-all"
                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
              ✕
            </button>
          </div>
        </div>

        {/* Score strip */}
        <div className="flex items-center gap-4 px-6 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold"
                  style={{ background: 'rgba(96,165,250,0.25)', color: '#93c5fd' }}>R&W</span>
            <span className="text-sm font-extrabold text-white">{rwScore}/{rwMax}</span>
            <span className="text-[11px] text-blue-300">
              {rwMax > 0 ? Math.round((rwScore / rwMax) * 100) : 0}%
            </span>
          </div>
          <div className="h-5 w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold"
                  style={{ background: 'rgba(167,139,250,0.25)', color: '#c4b5fd' }}>Math</span>
            <span className="text-sm font-extrabold text-white">{mathScore}/{mathMax}</span>
            <span className="text-[11px] text-purple-300">
              {mathMax > 0 ? Math.round((mathScore / mathMax) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-0.5 px-4 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setView(t.key)}
                    className="shrink-0 px-4 py-2.5 rounded-t-xl text-[12px] font-bold transition-all whitespace-nowrap"
                    style={view === t.key
                      ? { background: '#f1f5f9', color: '#4f46e5' }
                      : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Projected SAT Score ──────────────────────────────────────────── */}
      {view === 'sat_score' && (
        <div className="flex-1 overflow-y-auto">
          <ProjectedSATScore rwM1={rwM1} rwM2={rwM2} mathM1={mathM1} mathM2={mathM2} />
        </div>
      )}

      {/* ── Questions view ──────────────────────────────────────────────── */}
      {view === 'questions' && (
        <>
          {/* Module sub-tabs */}
          <div className="shrink-0 border-b border-gray-200 bg-white px-5 py-2 flex gap-1.5 flex-wrap shadow-sm">
            {modules.map(m => (
              <button key={m.key} onClick={() => setActiveModule(m.key)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all"
                      style={activeModule === m.key
                        ? { background: m.color, color: '#fff' }
                        : { background: '#f3f4f6', color: '#9ca3af' }}>
                {m.label}
                {m.data && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold"
                        style={activeModule === m.key
                          ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                          : { background: '#e5e7eb', color: '#6b7280' }}>
                    {m.data.score}/{m.data.max_score}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {(!activeModData?.data?.breakdown || activeModData.data.breakdown.length === 0) ? (
              <div className="text-center py-12 text-gray-400 text-sm">No questions available for this module.</div>
            ) : (
              activeModData.data.breakdown.map((b, idx) => (
                <div key={idx} className={`rounded-2xl border overflow-hidden ${b.is_correct ? 'border-emerald-200' : 'border-red-200'}`}>
                  <div className="flex items-center gap-3 px-4 py-3"
                       style={{ background: b.is_correct ? '#f0fdf4' : '#fff1f2' }}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold text-white shrink-0 ${b.is_correct ? 'bg-emerald-500' : 'bg-red-500'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                      {b.topic && (
                        <span className="inline-flex text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                          {b.topic}
                        </span>
                      )}
                      {b.difficulty && (
                        <span className={`inline-flex text-[10px] font-bold rounded-full px-2 py-0.5 ${
                          b.difficulty === 'hard'   ? 'bg-red-50 text-red-500 border border-red-200' :
                          b.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                                      'bg-green-50 text-green-600 border border-green-200'
                        }`}>
                          {b.difficulty}
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${b.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {b.is_correct ? '✓ Correct' : '✗ Wrong'}
                    </span>
                  </div>
                  <div className="px-4 py-4 bg-white space-y-3">
                    {b.stem && (
                      <MathContent html={b.stem} className="text-[13px] text-gray-700 leading-relaxed [&_p]:m-0" />
                    )}
                    <div className="flex gap-4 text-[12px] px-3 py-2 rounded-xl bg-gray-50">
                      <span className="text-gray-500">Your answer: <strong className={b.is_correct ? 'text-emerald-700' : 'text-red-600'}>{b.selected || '—'}</strong></span>
                      <span className="text-gray-500">Correct: <strong className="text-emerald-700">{b.correct_answer}</strong></span>
                    </div>
                    {b.explanation && (
                      <div className="flex gap-2.5 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                        <span className="text-base shrink-0">💡</span>
                        <div>
                          <p className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wide mb-1">Explanation</p>
                          <MathContent html={boldChoiceLabels(b.explanation)} className="text-[12px] text-amber-800 leading-relaxed [&_p]:m-0 [&_p]:mb-1" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── Topic Mastery view ──────────────────────────────────────────── */}
      {view === 'topics' && (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {Object.entries(topicMastery).map(([groupName, topics]) => (
            <div key={groupName} className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="px-5 py-3.5"
                   style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
                <p className="text-sm font-extrabold text-white">{groupName}</p>
              </div>
              <div className="grid grid-cols-[1fr_auto_160px] bg-slate-700 px-5 py-2">
                <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest">Topic</span>
                <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest text-center px-6">Mastery</span>
                <span className="text-[10px] font-extrabold text-slate-300 uppercase tracking-widest text-right">Score</span>
              </div>
              {Object.entries(topics).map(([topic, data]) => {
                const pct     = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                const mastery = getMasteryLevel(pct);
                return (
                  <div key={topic} className="grid grid-cols-[1fr_auto_160px] items-center px-5 py-3.5 border-t border-gray-100 bg-white hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-[13px] font-medium text-gray-800">{topic}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{data.correct}/{data.total} correct</p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full mx-6"
                          style={{ background: mastery.bg, color: mastery.color }}>
                      {mastery.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                             style={{ width: `${pct}%`, background: mastery.bar }} />
                      </div>
                      <span className="text-[10px] font-extrabold shrink-0 w-8 text-right" style={{ color: mastery.bar }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── Charts view ─────────────────────────────────────────────────── */}
      {view === 'charts' && (
        <div className="flex-1 overflow-y-auto">
          <SATTopicCharts topicMastery={topicMastery} />
        </div>
      )}

      {/* ── AI Summary view ─────────────────────────────────────────────── */}
      {view === 'summary' && (
        <div className="flex-1 overflow-y-auto">
          <SATAISummaryView aiData={aiData} onDownload={handleDownload} />
        </div>
      )}
    </div>
  );
}

// ─── Adaptive test taker (Mock / Diagnostic — single subject) ─────────────────
function AdaptiveTaker({ config, onFinish }) {
  const subject     = config.subject || 'reading_writing';
  const sectionName = subject === 'math' ? 'Mathematics' : 'Reading and Writing';

  const [phase,       setPhase]       = useState('loading');
  const [sessionId,   setSessionId]   = useState(null);
  const [questions,   setQuestions]   = useState([]);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers,     setAnswers]     = useState({});
  const [m1Result,    setM1Result]    = useState(null);
  const [results,     setResults]     = useState(null);
  const [error,       setError]       = useState('');

  const [showCalc,    setShowCalc]    = useState(false);
  const [showMathRef, setShowMathRef] = useState(false);
  const [showTimer,   setShowTimer]   = useState(true);
  const [showMore,    setShowMore]    = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);
  const [showNotes,   setShowNotes]   = useState(false);
  const [notes,       setNotes]       = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());

  const submittingRef = useRef(false);
  const sessionRef    = useRef(null);
  const questionsRef  = useRef([]);
  const answersRef    = useRef({});
  const m1SavedRef    = useRef(null);
  sessionRef.current  = sessionId;
  questionsRef.current = questions;
  answersRef.current   = answers;

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
        breakdown: res.breakdown, questions: [...questionsRef.current],
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

  const moduleLabel     = phase === 'module1' ? 'Module 1' : 'Module 2';
  const currentQuestion = questions[questionIdx];

  if (phase === 'loading')    return <FullScreenLoader text="Starting test…" />;
  if (phase === 'submitting') return <FullScreenLoader text="Submitting your test…" spinner />;
  if (phase === 'error')      return <FullScreenError error={error} onBack={onFinish} />;
  if (phase === 'results')    return <AdaptiveResults config={config} results={results} onDone={onFinish} />;
  if (phase === 'm1_done')    return (
    <ModuleTransition m1Result={m1Result} onContinue={loadModule2} busy={submittingRef.current} />
  );
  if (!currentQuestion) return null;

  return (
    <div className="fixed inset-0 flex flex-col select-none overflow-hidden z-[110]"
      style={{ backgroundColor: C.bg2 }}>
      {showCalc    && subject === 'math' && <DesmosCalculator    onClose={() => setShowCalc(false)}    />}
      {showMathRef && subject === 'math' && <MathReferencesPanel onClose={() => setShowMathRef(false)} />}
      {showMore && <div className="fixed inset-0 z-[100]" onClick={() => setShowMore(false)} />}
      {showPicker && (
        <QuestionPicker questions={questions} currentIdx={questionIdx} answers={answers}
          markedIds={markedForReview} onSelect={i => setQuestionIdx(i)} onClose={() => setShowPicker(false)} />
      )}
      {showNotes && (
        <NotesModal qid={currentQuestion._id} notes={notes} onAdd={addNote} onDelete={deleteNote}
          onClose={() => setShowNotes(false)} />
      )}
      <TestTopBar
        sectionName={sectionName} moduleLabel={moduleLabel} subject={subject}
        timeLeft={timeLeft} showTimer={showTimer} onToggleTimer={() => setShowTimer(p => !p)}
        showCalc={showCalc} onToggleCalc={() => setShowCalc(p => !p)}
        showMathRef={showMathRef} onToggleMathRef={() => setShowMathRef(p => !p)}
        showMore={showMore} onToggleMore={() => setShowMore(p => !p)}
        onOpenNotes={() => { setShowMore(false); setShowNotes(true); }}
        onSubmit={() => { setShowMore(false); if (phase === 'module1') submitM1(); else submitM2(); }}
        onExit={() => { if (window.confirm('Exit the test? Your progress may be lost.')) onFinish(); }}
      />
      <SplitContentArea question={currentQuestion} answers={answers} onAnswer={handleAnswer}
        questionIdx={questionIdx} markedIds={markedForReview} onToggleMark={toggleMark}
        onOpenNotes={() => setShowNotes(true)} notes={notes} />
      <TestBottomBar
        currentIdx={questionIdx} totalQuestions={questions.length}
        onBack={() => setQuestionIdx(i => i - 1)} onNext={handleNext}
        onOpenPicker={() => setShowPicker(true)}
        isLastQuestion={questionIdx === questions.length - 1}
        nextLabel={questionIdx === questions.length - 1 ? (phase === 'module1' ? 'Submit Module 1' : 'Submit Test') : 'Next'}
      />
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-white text-[12px] font-bold px-5 py-3 rounded-xl shadow-xl z-[300]"
          style={{ backgroundColor: C.red }}>
          {error}
        </div>
      )}
    </div>
  );
}

const TIMED = new Set(['rw_m1', 'rw_m2', 'math_m1', 'math_m2']);

// ─── Full 4-module SAT taker (R&W M1 → R&W M2 → Math M1 → Math M2) ───────────
function FullTestTaker({ rwConfig, mathConfig, seriesName, testType, onFinish }) {
  const [phase,       setPhase]       = useState('init');
  const [questions,   setQuestions]   = useState([]);
  const [answers,     setAnswers]     = useState({});
  const [questionIdx, setQuestionIdx] = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [m1Info,      setM1Info]      = useState(null);
  const [results,     setResults]     = useState(null);
  const [error,       setError]       = useState('');

  const [showCalc,    setShowCalc]    = useState(false);
  const [showMathRef, setShowMathRef] = useState(false);
  const [showTimer,   setShowTimer]   = useState(true);
  const [showMore,    setShowMore]    = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);
  const [showNotes,   setShowNotes]   = useState(false);
  const [notes,       setNotes]       = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());

  const submittingRef  = useRef(false);
  const sessionRef     = useRef(null);
  const phaseRef       = useRef('init');
  const questionsRef   = useRef([]);
  const answersRef     = useRef({});
  const rwM1Ref        = useRef(null);
  const rwM2Ref        = useRef(null);
  const mathM1Ref      = useRef(null);

  phaseRef.current     = phase;
  questionsRef.current = questions;
  answersRef.current   = answers;

  useEffect(() => {
    if (!TIMED.has(phase)) return;
    const id = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const submitModule = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    const cur = phaseRef.current;
    try {
      if (cur === 'rw_m1' || cur === 'math_m1') {
        const res = await satService.submitModule1(sessionRef.current, buildAns(questionsRef.current, answersRef.current));
        const m1data = { score: res.module_1.score, max_score: res.module_1.max_score, breakdown: res.breakdown, questions: [...questionsRef.current] };
        if (cur === 'rw_m1') rwM1Ref.current = m1data; else mathM1Ref.current = m1data;
        setM1Info({ ...res.module_1, tier: res.adaptive?.tier });
        setPhase(cur === 'rw_m1' ? 'rw_m1_done' : 'math_m1_done');
      } else if (cur === 'rw_m2' || cur === 'math_m2') {
        const res = await satService.submitModule2(sessionRef.current, buildAns(questionsRef.current, answersRef.current));
        const m2data = { score: res.module_2.score, max_score: res.module_2.max_score, breakdown: res.breakdown, questions: [...questionsRef.current], tier: res.module_2.tier };
        if (cur === 'rw_m2') {
          rwM2Ref.current = m2data;
          setPhase('rw_done');
        } else {
          setResults({ rwM1: rwM1Ref.current || {}, rwM2: rwM2Ref.current || {}, mathM1: mathM1Ref.current || {}, mathM2: m2data });
          setPhase('final');
        }
      }
    } catch (e) { setError(e.message); }
    finally { submittingRef.current = false; }
  }, []);

  useEffect(() => {
    if (timeLeft !== 0 || !TIMED.has(phaseRef.current)) return;
    submitModule();
  }, [timeLeft, submitModule]);

  useEffect(() => {
    (async () => {
      try {
        const res = await satService.startSessionDirect(rwConfig._id);
        sessionRef.current = res.session_id;
        const { status } = res;

        if (!status || status === 'rw_m1_in_progress') {
          setQuestions((res.module_1.questions || []).map(normalizeQuestion));
          const elapsed = res.module_1.started_at
            ? Math.floor((Date.now() - new Date(res.module_1.started_at).getTime()) / 1000) : 0;
          setTimeLeft(Math.max(0, res.module_1.time_limit_minutes * 60 - elapsed));
          setPhase('rw_m1');
        } else if (status === 'rw_m1_complete') {
          setPhase('rw_m1_done');
        } else if (status === 'rw_m2_in_progress') {
          setQuestions((res.module_2.questions || []).map(normalizeQuestion));
          const elapsed = res.module_2.started_at
            ? Math.floor((Date.now() - new Date(res.module_2.started_at).getTime()) / 1000) : 0;
          setTimeLeft(Math.max(0, res.module_2.time_limit_minutes * 60 - elapsed));
          setPhase('rw_m2');
        } else if (status === 'rw_done') {
          setPhase('rw_done');
        } else if (['math_m1_in_progress', 'math_m1_complete', 'math_m2_in_progress'].includes(status)) {
          setPhase('math_loading');
          const mathRes = await satService.startSessionDirect(mathConfig._id);
          applyMathResume(mathRes);
        }
      } catch (e) {
        setError(e.message);
        setPhase('error');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rwConfig._id]);

  const loadModule2 = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    const cur = phaseRef.current;
    try {
      const res = await satService.getModule2(sessionRef.current);
      setQuestions((res.module_2.questions || []).map(normalizeQuestion));
      setTimeLeft(res.module_2.time_limit_minutes * 60);
      setQuestionIdx(0); setAnswers({});
      setPhase(cur === 'rw_m1_done' ? 'rw_m2' : 'math_m2');
    } catch (e) { setError(e.message); }
    finally { submittingRef.current = false; }
  }, []);

  const applyMathResume = useCallback((mathRes) => {
    sessionRef.current = mathRes.session_id;
    if (mathRes.status === 'math_m1_complete') {
      setPhase('math_m1_done');
    } else if (mathRes.status === 'math_m2_in_progress') {
      setQuestions((mathRes.module_2.questions || []).map(normalizeQuestion));
      const elapsed = mathRes.module_2.started_at
        ? Math.floor((Date.now() - new Date(mathRes.module_2.started_at).getTime()) / 1000) : 0;
      setTimeLeft(Math.max(0, mathRes.module_2.time_limit_minutes * 60 - elapsed));
      setQuestionIdx(0); setAnswers({});
      setPhase('math_m2');
    } else {
      // math_m1_in_progress or fresh math_m1 start
      setQuestions((mathRes.module_1.questions || []).map(normalizeQuestion));
      const elapsed = mathRes.module_1.started_at
        ? Math.floor((Date.now() - new Date(mathRes.module_1.started_at).getTime()) / 1000) : 0;
      setTimeLeft(Math.max(0, mathRes.module_1.time_limit_minutes * 60 - elapsed));
      setQuestionIdx(0); setAnswers({});
      setPhase('math_m1');
    }
  }, []);

  const startMath = useCallback(async () => {
    setPhase('math_loading');
    try {
      const mathRes = await satService.startSessionDirect(mathConfig._id);
      applyMathResume(mathRes);
    } catch (e) { setError(e.message); setPhase('error'); }
  }, [mathConfig._id, applyMathResume]);

  const addNote    = (qid, text) => setNotes(p => ({ ...p, [qid]: [...(p[qid] || []), text] }));
  const deleteNote = (qid, i)    => setNotes(p => ({ ...p, [qid]: (p[qid] || []).filter((_, j) => j !== i) }));
  const toggleMark = (qid)       => setMarkedForReview(p => { const s = new Set(p); s.has(qid) ? s.delete(qid) : s.add(qid); return s; });

  const isMathPhase     = phase === 'math_m1' || phase === 'math_m2';
  const subject         = isMathPhase ? 'math' : 'reading_writing';
  const sectionName     = isMathPhase ? 'Mathematics' : 'Reading and Writing';
  const isM1Phase       = phase === 'rw_m1' || phase === 'math_m1';
  const moduleLabel     = isM1Phase ? 'Module 1' : 'Module 2';
  const currentQuestion = questions[questionIdx];

  const DONE_AFTER = {
    rw_m1:   ['rw_m1_done', 'rw_m2', 'rw_done', 'math_loading', 'math_m1', 'math_m1_done', 'math_m2', 'final'],
    rw_m2:   ['rw_done', 'math_loading', 'math_m1', 'math_m1_done', 'math_m2', 'final'],
    math_m1: ['math_m1_done', 'math_m2', 'final'],
    math_m2: ['final'],
  };
  const progressSteps = [
    { label: 'R&W M1',  key: 'rw_m1'   },
    { label: 'R&W M2',  key: 'rw_m2'   },
    { label: 'Math M1', key: 'math_m1' },
    { label: 'Math M2', key: 'math_m2' },
  ].map(s => ({ ...s, done: (DONE_AFTER[s.key] || []).includes(phase), active: phase === s.key }));

  if (phase === 'init' || phase === 'math_loading')
    return <FullScreenLoader text={phase === 'math_loading' ? 'Loading Math section…' : 'Starting test…'} spinner />;
  if (phase === 'error')  return <FullScreenError error={error} onBack={onFinish} />;
  if (phase === 'final')  return (
    <SATResultsModal
      rwM1={results.rwM1} rwM2={results.rwM2}
      mathM1={results.mathM1} mathM2={results.mathM2}
      seriesName={seriesName} onClose={onFinish}
      isDiagnostic={testType === 'diagnostic'}
    />
  );
  if (phase === 'rw_m1_done' || phase === 'math_m1_done')
    return <ModuleTransition m1Result={m1Info} onContinue={loadModule2} busy={submittingRef.current} />;

  if (phase === 'rw_done') {
    const rwScore = (rwM1Ref.current?.score || 0) + (rwM2Ref.current?.score || 0);
    const rwMax   = (rwM1Ref.current?.max_score || 0) + (rwM2Ref.current?.max_score || 0);
    const rwPct   = rwMax > 0 ? Math.round((rwScore / rwMax) * 100) : 0;
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-6" style={{ backgroundColor: C.bg1 }}>
        <div className="rounded-2xl p-8 max-w-sm w-full text-center shadow-sm" style={{ backgroundColor: C.bg2, border: `1px solid ${C.border}` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 bg-blue-50">📝</div>
          <h2 className="text-lg font-extrabold mb-1" style={{ color: C.text }}>Reading &amp; Writing Complete</h2>
          <p className="text-[12px] mb-6" style={{ color: C.textMuted }}>Both R&amp;W modules done. Up next: Math!</p>
          <div className="flex justify-center gap-8 mb-6">
            <div>
              <p className="text-2xl font-extrabold" style={{ color: C.text }}>{rwPct}%</p>
              <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>R&amp;W Score</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold" style={{ color: C.text }}>{rwScore}/{rwMax}</p>
              <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>Points</p>
            </div>
          </div>
          <button onClick={startMath}
            className="w-full py-3 rounded-xl font-bold text-sm text-white hover:opacity-90"
            style={{ backgroundColor: '#7c3aed' }}>
            Continue to Math Section →
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="fixed inset-0 flex flex-col select-none overflow-hidden z-[110]" style={{ backgroundColor: C.bg2 }}>
      {/* Progress strip */}
      <div className="flex items-center justify-center gap-1 px-4 py-1.5 border-b shrink-0"
        style={{ backgroundColor: C.bg1, borderColor: C.border }}>
        {progressSteps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all
              ${s.done ? 'bg-green-100 text-green-700' : s.active ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
              {s.done && '✓ '}{s.label}
            </div>
            {i < 3 && <span className="text-gray-300 text-[10px]">→</span>}
          </div>
        ))}
      </div>

      {showCalc    && subject === 'math' && <DesmosCalculator    onClose={() => setShowCalc(false)}    />}
      {showMathRef && subject === 'math' && <MathReferencesPanel onClose={() => setShowMathRef(false)} />}
      {showMore && <div className="fixed inset-0 z-[100]" onClick={() => setShowMore(false)} />}
      {showPicker && (
        <QuestionPicker questions={questions} currentIdx={questionIdx} answers={answers}
          markedIds={markedForReview} onSelect={i => setQuestionIdx(i)} onClose={() => setShowPicker(false)} />
      )}
      {showNotes && (
        <NotesModal qid={currentQuestion._id} notes={notes} onAdd={addNote} onDelete={deleteNote}
          onClose={() => setShowNotes(false)} />
      )}
      <TestTopBar
        sectionName={sectionName} moduleLabel={moduleLabel} subject={subject}
        timeLeft={timeLeft} showTimer={showTimer} onToggleTimer={() => setShowTimer(p => !p)}
        showCalc={showCalc} onToggleCalc={() => setShowCalc(p => !p)}
        showMathRef={showMathRef} onToggleMathRef={() => setShowMathRef(p => !p)}
        showMore={showMore} onToggleMore={() => setShowMore(p => !p)}
        onOpenNotes={() => { setShowMore(false); setShowNotes(true); }}
        onSubmit={() => { setShowMore(false); submitModule(); }}
        onExit={() => { if (window.confirm('Exit the test? Your progress may be lost.')) onFinish(); }}
      />
      <SplitContentArea question={currentQuestion} answers={answers}
        onAnswer={(qid, choice) => setAnswers(p => ({ ...p, [qid]: choice }))}
        questionIdx={questionIdx} markedIds={markedForReview} onToggleMark={toggleMark}
        onOpenNotes={() => setShowNotes(true)} notes={notes} />
      <TestBottomBar
        currentIdx={questionIdx} totalQuestions={questions.length}
        onBack={() => setQuestionIdx(i => i - 1)}
        onNext={() => { if (questionIdx < questions.length - 1) setQuestionIdx(i => i + 1); else submitModule(); }}
        onOpenPicker={() => setShowPicker(true)}
        isLastQuestion={questionIdx === questions.length - 1}
        nextLabel={questionIdx === questions.length - 1 ? (isM1Phase ? 'Submit Module 1' : 'Submit Test') : 'Next'}
      />
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-white text-[12px] font-bold px-5 py-3 rounded-xl shadow-xl z-[300]"
          style={{ backgroundColor: C.red }}>{error}
        </div>
      )}
    </div>
  );
}

// ─── Practice test taker ───────────────────────────────────────────────────────
function PracticeTaker({ config, onFinish }) {
  const subject     = config.subject || 'reading_writing';
  const sectionName = subject === 'math' ? 'Mathematics' : 'Reading and Writing';

  const [phase,       setPhase]       = useState('loading');
  const [sessionId,   setSessionId]   = useState(null);
  const [questions,   setQuestions]   = useState([]);
  const [answers,     setAnswers]     = useState({});
  const [timeLeft,    setTimeLeft]    = useState(null);
  const [results,     setResults]     = useState(null);
  const [error,       setError]       = useState('');
  const [questionIdx, setQuestionIdx] = useState(0);

  const [showCalc,    setShowCalc]    = useState(false);
  const [showMathRef, setShowMathRef] = useState(false);
  const [showTimer,   setShowTimer]   = useState(true);
  const [showMore,    setShowMore]    = useState(false);
  const [showPicker,  setShowPicker]  = useState(false);
  const [showNotes,   setShowNotes]   = useState(false);
  const [notes,       setNotes]       = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());

  const submittingRef    = useRef(false);
  const questionsRef     = useRef([]);
  const answersRef       = useRef({});
  const sessionRef       = useRef(null);
  const timerRef         = useRef(null);
  const handleSubmitRef  = useRef(null);
  questionsRef.current   = questions;
  answersRef.current     = answers;
  sessionRef.current     = sessionId;

  const addNote    = (qid, text) => setNotes(p => ({ ...p, [qid]: [...(p[qid] || []), text] }));
  const deleteNote = (qid, i)    => setNotes(p => ({ ...p, [qid]: (p[qid] || []).filter((_, j) => j !== i) }));
  const toggleMark = (qid)       => setMarkedForReview(p => {
    const s = new Set(p); s.has(qid) ? s.delete(qid) : s.add(qid); return s;
  });

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
      if (res.streak?.justIncremented && res.streak?.current > 0) {
        sessionStorage.setItem('streakCelebrate', String(res.streak.current));
      }
      setResults(res); setPhase('results');
    } catch (e) { setError(e.message); setPhase('taking'); }
    finally { submittingRef.current = false; }
  }, []);

  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  useEffect(() => {
    if (phase !== 'taking' || timeLeft === null) return;
    if (timeLeft <= 0) { handleSubmitRef.current(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  });

  const handleNext      = () => {
    if (questionIdx < questions.length - 1) setQuestionIdx(i => i + 1);
    else handleSubmit();
  };
  const currentQuestion = questions[questionIdx];

  if (phase === 'loading')    return <FullScreenLoader text="Starting practice test…" />;
  if (phase === 'submitting') return <FullScreenLoader text="Submitting your test…" spinner />;
  if (phase === 'error')      return <FullScreenError error={error} onBack={onFinish} />;
  if (phase === 'results')    return <PracticeResults config={config} results={results} onDone={onFinish} />;
  if (!currentQuestion)       return null;

  return (
    <div className="fixed inset-0 flex flex-col select-none overflow-hidden z-[110]"
      style={{ backgroundColor: C.bg2 }}>
      {showCalc    && subject === 'math' && <DesmosCalculator    onClose={() => setShowCalc(false)}    />}
      {showMathRef && subject === 'math' && <MathReferencesPanel onClose={() => setShowMathRef(false)} />}
      {showMore && <div className="fixed inset-0 z-[100]" onClick={() => setShowMore(false)} />}
      {showPicker && (
        <QuestionPicker questions={questions} currentIdx={questionIdx} answers={answers}
          markedIds={markedForReview} onSelect={i => setQuestionIdx(i)} onClose={() => setShowPicker(false)} />
      )}
      {showNotes && (
        <NotesModal qid={currentQuestion._id} notes={notes} onAdd={addNote} onDelete={deleteNote}
          onClose={() => setShowNotes(false)} />
      )}
      <TestTopBar
        sectionName={sectionName} moduleLabel="Practice Test" subject={subject}
        timeLeft={timeLeft} showTimer={showTimer} onToggleTimer={() => setShowTimer(p => !p)}
        showCalc={showCalc} onToggleCalc={() => setShowCalc(p => !p)}
        showMathRef={showMathRef} onToggleMathRef={() => setShowMathRef(p => !p)}
        showMore={showMore} onToggleMore={() => setShowMore(p => !p)}
        onOpenNotes={() => { setShowMore(false); setShowNotes(true); }}
        onSubmit={() => { setShowMore(false); handleSubmit(); }}
        onExit={() => { if (window.confirm('Exit the test? Your progress may be lost.')) onFinish(); }}
      />
      <SplitContentArea question={currentQuestion} answers={answers} onAnswer={(qid, ch) => setAnswers(p => ({ ...p, [qid]: ch }))}
        questionIdx={questionIdx} markedIds={markedForReview} onToggleMark={toggleMark}
        onOpenNotes={() => setShowNotes(true)} notes={notes} />
      <TestBottomBar
        currentIdx={questionIdx} totalQuestions={questions.length}
        onBack={() => setQuestionIdx(i => i - 1)} onNext={handleNext}
        onOpenPicker={() => setShowPicker(true)}
        isLastQuestion={questionIdx === questions.length - 1}
        nextLabel={questionIdx === questions.length - 1 ? 'Submit Test' : 'Next'}
      />
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 text-white text-[12px] font-bold px-5 py-3 rounded-xl shadow-xl z-[300]"
          style={{ backgroundColor: C.red }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Helpers for session history matching ──────────────────────────────────────
const matchId = (a, b) => {
  const idA = a && typeof a === 'object' ? String(a._id) : String(a || '');
  const idB = b && typeof b === 'object' ? String(b._id) : String(b || '');
  return idA && idB && idA === idB;
};
const getConfigSessions = (sessions, configId) =>
  sessions.filter(s => matchId(s.exam_config_id, configId) && s.status === 'complete');

// ─── Unlock Platform Modal ─────────────────────────────────────────────────────
function UnlockPlatformModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 flex flex-col items-center text-center gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-3xl">
          🔒
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 mb-1">Unlock the Full Platform</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            This test is only available to full platform members. Upgrade your account to access
            all diagnostic tests, practice modules, mock exams, and personalised coaching.
          </p>
        </div>
        <div className="w-full flex flex-col gap-2 mt-1">
          <a
            href="mailto:info@catalystsat.in"
            className="w-full py-3 rounded-xl text-sm font-extrabold text-white text-center transition-all hover:opacity-90 hover:shadow-[0_4px_20px_rgba(245,158,11,0.45)]"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)' }}
          >
            🔓 Contact Us to Upgrade →
          </a>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mock / Diagnostic config list (grouped by series) ────────────────────────
function AdaptiveConfigList({ onStart, defaultFilter = 'all', isGuest = false }) {
  const [configs,      setConfigs]      = useState([]);
  const [sessions,     setSessions]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [filter,       _setFilter]      = useState(defaultFilter);
  const [viewModal,    setViewModal]    = useState(null);
  const [modalLoading, setModalLoading] = useState(null);
  const [showUnlock,   setShowUnlock]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [configRes, historyRes] = await Promise.all([
        satService.listExamConfigs(),
        satService.getHistory().catch(() => ({ data: [] })),
      ]);
      setConfigs(configRes.data || []);
      setSessions(historyRes.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const seriesConfigs     = configs.filter(c => SERIES_SUFFIX.test(c.name));
  const standaloneConfigs = configs.filter(c => !SERIES_SUFFIX.test(c.name));

  const allGroups = Object.values(
    seriesConfigs.reduce((acc, c) => {
      const series = getSeriesName(c.name);
      if (!acc[series]) acc[series] = { seriesName: series, type: c.type || 'mock', math: null, rw: null };
      if (c.subject === 'math') acc[series].math = c;
      else acc[series].rw = c;
      return acc;
    }, {})
  );

  const diagGroups    = allGroups.filter(g => g.type === 'diagnostic');
  const mockGroups    = allGroups.filter(g => g.type !== 'diagnostic');
  const visibleGroups = [...diagGroups, ...mockGroups];

  const bySubject = filter === 'math' || filter === 'reading_writing';
  let groupsToShow = [];
  let flatsToShow  = [];

  if (bySubject) {
    const fromGroups      = visibleGroups.map(g => filter === 'math' ? g.math : g.rw).filter(Boolean);
    const fromStandalones = standaloneConfigs.filter(c => c.subject === filter);
    flatsToShow = [...fromStandalones, ...fromGroups];
  } else if (filter === 'mock') {
    groupsToShow = mockGroups;
    flatsToShow  = standaloneConfigs.filter(c => c.type === 'mock' || !c.type);
  } else if (filter === 'diagnostic') {
    groupsToShow = diagGroups;
    flatsToShow  = standaloneConfigs.filter(c => c.type === 'diagnostic');
  } else {
    groupsToShow = visibleGroups;
    flatsToShow  = standaloneConfigs;
  }

  const isEmpty = groupsToShow.length === 0 && flatsToShow.length === 0;

  const openViewResults = async (g, latestRw, latestMath) => {
    setModalLoading(g.seriesName);
    try {
      // Unified attempt: both entries share the same _id
      const isUnified = latestRw && latestMath && String(latestRw._id) === String(latestMath._id);
      if (isUnified) {
        const res  = await satService.getResults(latestRw._id);
        const data = res.data || res;
        setViewModal({
          rwM1:         data.reading_writing?.module_1 || {},
          rwM2:         data.reading_writing?.module_2 || {},
          mathM1:       data.math?.module_1            || {},
          mathM2:       data.math?.module_2            || {},
          seriesName:   g.seriesName,
          isDiagnostic: g.type === 'diagnostic',
        });
        return;
      }
      // Legacy: two separate session documents
      const [rwRes, mathRes] = await Promise.all([
        satService.getResults(latestRw._id),
        satService.getResults(latestMath._id),
      ]);
      const rwData   = rwRes.data   || rwRes;
      const mathData = mathRes.data || mathRes;
      setViewModal({
        rwM1:         rwData.module_1   || {},
        rwM2:         rwData.module_2   || {},
        mathM1:       mathData.module_1 || {},
        mathM2:       mathData.module_2 || {},
        seriesName:   g.seriesName,
        isDiagnostic: g.type === 'diagnostic',
      });
    } catch (e) { console.error('Failed to load results:', e); }
    finally { setModalLoading(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading tests…</div>;

  return (
    <div className="flex flex-col gap-5">
      {showUnlock && <UnlockPlatformModal onClose={() => setShowUnlock(false)} />}

      {/* View Results modal overlay */}
      {viewModal && (
        <SATResultsModal
          rwM1={viewModal.rwM1} rwM2={viewModal.rwM2}
          mathM1={viewModal.mathM1} mathM2={viewModal.mathM2}
          seriesName={viewModal.seriesName}
          isDiagnostic={viewModal.isDiagnostic}
          onClose={() => setViewModal(null)}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span><button onClick={load} className="font-bold underline ml-3">Retry</button>
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-3">📋</span>
          <h3 className="text-base font-extrabold text-slate-700 mb-1">No tests available</h3>
          <p className="text-sm text-slate-400">Check back once your operations team adds tests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groupsToShow.map(g => {
            const isDiag    = g.type === 'diagnostic';
            const typeBadge = isDiag ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700';
            const typeLabel = isDiag ? 'Diagnostic' : 'Mock';
            const canStart  = !!g.rw && !!g.math;

            const rwSessions   = g.rw   ? getConfigSessions(sessions, g.rw._id)   : [];
            const mathSessions = g.math ? getConfigSessions(sessions, g.math._id) : [];
            const isDone       = rwSessions.length > 0 && mathSessions.length > 0;

            const latest     = arr => [...arr].sort((a, b) => new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at))[0];
            const latestRw   = isDone ? latest(rwSessions)   : null;
            const latestMath = isDone ? latest(mathSessions) : null;
            const isLoadingThis = modalLoading === g.seriesName;

            const presentCfgs = [g.rw, g.math].filter(Boolean);
            const isGuestLocked = isGuest && !(presentCfgs.length > 0 && presentCfgs.every(c => c.is_demo_accessible));

            return (
              <div key={g.seriesName}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col gap-3 ${
                  isGuestLocked
                    ? 'border-slate-200 opacity-75'
                    : isDone
                      ? 'border-green-200 hover:border-green-300 hover:shadow-md'
                      : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 leading-snug">{g.seriesName}</p>
                      {isGuestLocked && <span className="text-base">🔒</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeBadge}`}>{typeLabel}</span>
                      {!isGuestLocked && isGuest && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Free</span>}
                    </div>
                  </div>
                  {isDone && !isGuestLocked && <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">Completed</span>}
                </div>

                <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-400 w-14">R&amp;W</span>
                    <span className="font-medium text-slate-700">
                      {g.rw ? `${g.rw.module_1?.total_questions}Q / module · ${g.rw.module_1?.time_limit_minutes}min` : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-400 w-14">Math</span>
                    <span className="font-medium text-slate-700">
                      {g.math ? `${g.math.module_1?.total_questions}Q / module · ${g.math.module_1?.time_limit_minutes}min` : 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500">
                    <span>4 modules</span><span>·</span><span>Adaptive</span>
                  </div>
                </div>

                {isGuestLocked ? (
                  <button
                    onClick={() => setShowUnlock(true)}
                    className="w-full py-3 rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-[0_4px_20px_rgba(245,158,11,0.45)] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)' }}>
                    🔓 Unlock to Access
                  </button>
                ) : isDone ? (
                  <button
                    onClick={() => openViewResults(g, latestRw, latestMath)}
                    disabled={!!modalLoading}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                    {isLoadingThis ? 'Loading results…' : 'View Results →'}
                  </button>
                ) : (
                  <button onClick={() => onStart({ type: 'full', rw: g.rw, math: g.math, seriesName: g.seriesName, testType: g.type })}
                    disabled={!canStart}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                    {canStart ? `Start ${typeLabel} Test →` : 'Test not fully configured'}
                  </button>
                )}
              </div>
            );
          })}

          {flatsToShow.map(cfg => {
            const flatDone = getConfigSessions(sessions, cfg._id).length > 0;
            const isFlatGuestLocked = isGuest && !cfg.is_demo_accessible;
            return (
              <div key={cfg._id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col gap-3 ${
                  isFlatGuestLocked
                    ? 'border-slate-200 opacity-75'
                    : flatDone
                      ? 'border-green-200 hover:border-green-300 hover:shadow-md'
                      : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'
                }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 leading-snug">{cfg.name}</p>
                      {isFlatGuestLocked && <span className="text-base">🔒</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SUBJ_STYLE[cfg.subject]}`}>{SUBJ_LABEL[cfg.subject]}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${TYPE_STYLE[cfg.type] || 'bg-gray-100 text-gray-600'}`}>{cfg.type}</span>
                      {!isFlatGuestLocked && isGuest && cfg.is_demo_accessible && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Free</span>}
                    </div>
                  </div>
                  {flatDone && !isFlatGuestLocked && <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">Completed</span>}
                </div>
                <div className="bg-slate-50 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-400 w-14">Modules</span>
                    <span className="font-medium text-slate-700">2 · Adaptive</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500">
                    <span>{cfg.module_1?.total_questions}Q / module</span><span>·</span>
                    <span>{cfg.module_1?.time_limit_minutes}min / module</span>
                  </div>
                </div>
                {isFlatGuestLocked ? (
                  <button
                    onClick={() => setShowUnlock(true)}
                    className="w-full py-3 rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:shadow-[0_4px_20px_rgba(245,158,11,0.45)] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)' }}>
                    🔓 Unlock to Access
                  </button>
                ) : !flatDone && (
                  <button onClick={() => onStart({ type: 'adaptive', config: cfg })}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                    Start Test →
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

// ─── Practice config list ──────────────────────────────────────────────────────
// onStart:       starts a new practice session for the given config
// onViewResults: shows the results of the latest completed session (session id passed as 2nd arg)
function PracticeConfigList({ onStart, onViewResults, isGuest = false }) {
  const navigate = useNavigate();
  const [configs,     setConfigs]     = useState([]);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [subject,     setSubject]     = useState('all');
  const [showUnlock,  setShowUnlock]  = useState(false);
  const [collapsed,   setCollapsed]   = useState(new Set());

  const toggleTopic = (t) => setCollapsed(s => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; });

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

  // Build topic → sub_topic → configs hierarchy
  const grouped = {};
  filtered.forEach(cfg => {
    const t = cfg.topic || 'Other';
    const s = cfg.sub_topic || 'General';
    if (!grouped[t]) grouped[t] = {};
    if (!grouped[t][s]) grouped[t][s] = [];
    grouped[t][s].push(cfg);
  });

  if (loading) return <div className="flex items-center justify-center py-24 text-slate-400 text-sm">Loading practice tests…</div>;

  return (
    <div className="flex flex-col gap-5">
      {showUnlock && <UnlockPlatformModal onClose={() => setShowUnlock(false)} />}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="font-bold underline ml-3">Retry</button>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {['all', 'math', 'reading_writing'].map(s => (
            <button key={s} onClick={() => setSubject(s)}
              className={`px-3 py-1 rounded-[10px] text-xs font-bold transition-all ${subject === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {s === 'all' ? 'All' : SUBJ_LABEL[s]}
            </button>
          ))}
        </div>
        <button onClick={() => navigate('/sat/practice/insights')}
          className="btn-insights flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white transition-all hover:-translate-y-px active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
          <TrendingUp size={13} />
          Insights
        </button>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-3">📚</span>
          <h3 className="text-base font-extrabold text-slate-700 mb-1">No practice tests available</h3>
        </div>
      ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(grouped).map(([topic, subtopics]) => {
              const allCfgs  = Object.values(subtopics).flat();
              const doneCount = allCfgs.filter(c => bestScores[c._id] !== undefined).length;
              const isOpen   = !collapsed.has(topic);

              return (
                <div key={topic} className="rounded-2xl border border-slate-200 overflow-hidden">
                  {/* Topic header */}
                  <button
                    onClick={() => toggleTopic(topic)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[14px] font-extrabold text-slate-800">{topic}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{allCfgs.length} test{allCfgs.length !== 1 ? 's' : ''}</span>
                      {doneCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                          {doneCount}/{allCfgs.length} done
                        </span>
                      )}
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ${isOpen ? '' : '-rotate-90'}`} />
                  </button>

                  {/* Sub-topic groups */}
                  {isOpen && (
                    <div className="p-4 flex flex-col gap-5">
                      {Object.entries(subtopics).map(([sub, cfgs]) => (
                        <div key={sub}>
                          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span>{sub}</span>
                            <span className="h-px flex-1 bg-slate-100" />
                            <span className="font-semibold normal-case tracking-normal">{cfgs.length} test{cfgs.length !== 1 ? 's' : ''}</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {cfgs.map(cfg => {
                              const best = bestScores[cfg._id];
                              const isPracticeGuestLocked = isGuest && !cfg.is_demo_accessible;
                              return (
                                <div key={cfg._id}
                                  className={`bg-white rounded-xl border flex flex-col gap-3 p-4 transition-all ${isPracticeGuestLocked ? 'border-slate-200 opacity-75' : 'hover:shadow-md border-slate-200'}`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-[13px] font-bold text-slate-900 leading-snug">{cfg.name}</p>
                                        {isPracticeGuestLocked && <span>🔒</span>}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SUBJ_STYLE[cfg.subject]}`}>{SUBJ_LABEL[cfg.subject]}</span>
                                        {cfg.is_demo_accessible && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Free</span>}
                                      </div>
                                    </div>
                                    {best !== undefined && !isPracticeGuestLocked && (
                                      <div className={`shrink-0 text-center px-2 py-1 rounded-lg ${best >= 70 ? 'bg-green-50' : best >= 50 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                                        <p className={`text-xs font-bold ${best >= 70 ? 'text-green-700' : best >= 50 ? 'text-yellow-700' : 'text-red-600'}`}>{best}%</p>
                                        <p className="text-[9px] text-slate-400">best</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-[11px] flex gap-3" style={{ color: C.textMuted }}>
                                    <span>{cfg.total_questions} questions</span>
                                    <span>·</span>
                                    <span>{cfg.time_limit_minutes} min</span>
                                  </div>
                                  {isPracticeGuestLocked ? (
                                    <button onClick={() => setShowUnlock(true)}
                                      className="w-full py-2 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-1.5 hover:opacity-90 transition-all"
                                      style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)' }}>
                                      🔓 Unlock to Access
                                    </button>
                                  ) : best !== undefined ? (
                                    <button onClick={() => onViewResults(cfg, latestSession[cfg._id])}
                                      className="w-full py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all"
                                      style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                                      View Results →
                                    </button>
                                  ) : (
                                    <button onClick={() => onStart(cfg)}
                                      className="w-full py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all"
                                      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                                      Start Practice →
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
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
      .then(res => setResults(res.data ?? res))
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
  // activeTest: { type: 'full' | 'adaptive' | 'practice' | 'practiceView', config, sessionId? }

  // Sync the active tab whenever the sidebar navigates to a different sub-page.
  useEffect(() => { setTab(defaultTab); }, [defaultTab]);

  const handleStart = (payload) => {
    onTestStart?.();
    setActiveTest(payload);
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
  if (activeTest?.type === 'full') {
    return (
      <FullTestTaker
        rwConfig={activeTest.rw}
        mathConfig={activeTest.math}
        seriesName={activeTest.seriesName}
        testType={activeTest.testType}
        onFinish={handleFinish}
      />
    );
  }
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

  return (
    <div className="page-content">


      {/* Tab switcher — mobile only; desktop uses sidebar sub-links */}
      <div className="md:hidden flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: 'diagnostic', label: '🔬 Diagnostic' },
          { key: 'practice',   label: '📝 Practice'   },
          { key: 'mock',       label: '🏆 Mock'        },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-[10px] text-[13px] font-semibold transition-all whitespace-nowrap
              ${tab === key
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 bg-transparent border-none'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'practice' ? (
        <PracticeConfigList
          onStart={cfg => handleStart({ type: 'practice', config: cfg })}
          onViewResults={handleViewResults}
          isGuest={isGuest}
        />
      ) : (
        <AdaptiveConfigList
          key={tab}
          defaultFilter={tab}
          isGuest={isGuest}
          onStart={handleStart}
        />
      )}
    </div>
  );
}
