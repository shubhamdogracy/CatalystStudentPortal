// Student portal version of the mentor's StudentReportModal.
// Mirrors admin AssignmentProgressPage.jsx > StudentReportModal visually.
// Uses inline SVG charts (no recharts dependency).

import { useState, useMemo, useEffect } from 'react';

const SECTION_META = {
  rw:   { id: 'rw',   label: 'Reading and Writing', icon: '📖', accent: '#4f46e5', bg: '#eef2ff' },
  math: { id: 'math', label: 'Math',                icon: '📐', accent: '#7c3aed', bg: '#f5f3ff' },
};

function getMasteryLevel(pct) {
  if (pct >= 85) return { label: 'MASTER',       color: '#2563eb', bg: '#dbeafe', bar: '#10b981' };
  if (pct >= 70) return { label: 'ELITE',        color: '#0891b2', bg: '#cffafe', bar: '#06b6d4' };
  if (pct >= 55) return { label: 'EXPERT',       color: '#7c3aed', bg: '#ede9fe', bar: '#8b5cf6' };
  if (pct >= 40) return { label: 'ADVANCED',     color: '#d97706', bg: '#fef3c7', bar: '#f59e0b' };
  if (pct >= 25) return { label: 'INTERMEDIATE', color: '#ea580c', bg: '#ffedd5', bar: '#f97316' };
  return           { label: 'NOVICE',            color: '#ef4444', bg: '#fee2e2', bar: '#ef4444' };
}

const CHART_PALETTE = [
  '#4472C4', '#70AD47', '#ED7D31', '#FF69B4', '#FFC000', '#00B0F0',
];

const MASTERY_CHART_COLORS = {
  MASTER: '#4472C4', ELITE: '#70AD47', EXPERT: '#ED7D31',
  ADVANCED: '#FFC000', INTERMEDIATE: '#FF69B4', NOVICE: '#A5A5A5',
};

function getTopicGroupName(section, moduleNum) {
  const name = (section.name || '').toLowerCase();
  const isRW = name.includes('reading') || name.includes('writing') || section.id === 'rw';
  if (isRW) return moduleNum === 1 ? 'Writing Mastery' : 'Reading Mastery';
  return 'Mathematics Mastery';
}

function computeTopicMastery(assignment, attempt) {
  const result = {};
  (assignment.sections || []).forEach((section) => {
    const sectionId = section.id || section.sid;
    const sectionResult = attempt.sectionResults?.find(
      (sr) => sr.sectionId === sectionId || sr.sectionId === section.sid || sr.sectionId === section.id,
    );
    (section.modules || []).forEach((mod) => {
      const groupName = getTopicGroupName(section, mod.number);
      const moduleResult = sectionResult?.modules?.find((m) => m.moduleNumber === mod.number);
      if (!result[groupName]) result[groupName] = {};
      (mod.questions || []).forEach((q) => {
        const topic = (q.topic || '').trim() || null;
        if (!topic) return;
        if (!result[groupName][topic]) result[groupName][topic] = { correct: 0, total: 0, score: 0, maxScore: 0 };
        // Try qid first (student portal keys answers by qid), fall back to id.
        const primaryKey  = q.qid || q.id;
        const fallbackKey = q.id  || q.qid;
        const studentAnswer =
          moduleResult?.answers?.[primaryKey] ??
          moduleResult?.answers?.[fallbackKey];
        const isCorrect = studentAnswer && studentAnswer === q.correctAnswer;
        result[groupName][topic].total++;
        result[groupName][topic].maxScore += (q.score || 1);
        if (isCorrect) {
          result[groupName][topic].correct++;
          result[groupName][topic].score += (q.score || 1);
        }
      });
      if (Object.keys(result[groupName]).length === 0) delete result[groupName];
    });
  });
  return result;
}

function generateAISummary(topicMastery, attempt) {
  const overall = attempt.percentage ?? 0;
  const passed  = attempt.passed;

  const allTopics = [];
  for (const [group, topics] of Object.entries(topicMastery)) {
    for (const [topic, data] of Object.entries(topics)) {
      const pct = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
      allTopics.push({ group, topic, pct, masteryLabel: getMasteryLevel(pct).label });
    }
  }

  const strong        = allTopics.filter(t => t.pct >= 70).sort((a, b) => b.pct - a.pct);
  const needsPractice = allTopics.filter(t => t.pct < 40).sort((a, b) => a.pct - b.pct);
  const developing    = allTopics.filter(t => t.pct >= 40 && t.pct < 70).sort((a, b) => b.pct - a.pct);

  let overallMsg;
  if (overall >= 85)      overallMsg = `Outstanding performance! A score of ${overall}% places you at mastery level — exceptional command of this material.`;
  else if (overall >= 70) overallMsg = `Great work! Scoring ${overall}% reflects strong understanding. You're well on your way to mastering this content.`;
  else if (overall >= 55) overallMsg = `Good effort! A score of ${overall}% shows solid progress. Targeted practice can push you into the advanced tier.`;
  else if (overall >= 40) overallMsg = `You scored ${overall}%, showing foundational understanding. Focused practice on weaker areas will yield quick improvements.`;
  else                    overallMsg = `You scored ${overall}%. This is your starting point — every expert begins here. Targeted study makes a significant difference.`;

  const strengthMsg = strong.length > 0
    ? `You excelled in: ${strong.slice(0, 4).map(t => `${t.topic} (${t.pct}%)`).join(', ')}. These are your power areas — keep leveraging them in the test.`
    : `No topic reached the 70%+ threshold yet, but growth is happening. Every practice session moves the needle.`;

  let improveMsg;
  if (needsPractice.length > 0) {
    improveMsg = `Prioritise: ${needsPractice.slice(0, 4).map(t => `${t.topic} (${t.pct}%)`).join(', ')}. These topics need the most focused attention and regular practice to build confidence.`;
  } else if (developing.length > 0) {
    improveMsg = `Keep working on: ${developing.slice(0, 3).map(t => `${t.topic} (${t.pct}%)`).join(', ')}. A little more practice will unlock the next mastery tier.`;
  } else {
    improveMsg = `All topics are performing well. Challenge yourself with harder problems to push toward mastery in every area.`;
  }

  const devMsg = (developing.length > 0 && needsPractice.length > 0)
    ? `Good momentum in: ${developing.slice(0, 3).map(t => `${t.topic} (${t.pct}%)`).join(', ')}. A few more sessions here can move these into your strength zone.`
    : '';

  const nextMsg = passed
    ? `Great achievement — you passed! To keep improving: drill your developing topics to push them into your strong zone, and attempt progressively harder questions to extend your mastery.`
    : `Review every wrong answer carefully, paying close attention to the explanations. Schedule focused practice on your lowest-scoring topics. Even 20 minutes daily on weak areas compounds quickly.`;

  return { overallMsg, strengthMsg, improveMsg, devMsg, nextMsg, strong, needsPractice, developing, allTopics, overall, passed };
}

function downloadReport(attempt, assignment, topicMastery, aiData) {
  const date = attempt.completedAt
    ? new Date(attempt.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  let topicRowsHtml = '';
  for (const [group, topics] of Object.entries(topicMastery)) {
    topicRowsHtml += `<tr><td colspan="4" style="background:#1e293b;color:#fff;font-weight:700;padding:8px 12px;font-size:13px;">${group}</td></tr>`;
    for (const [topic, data] of Object.entries(topics)) {
      const pct     = data.maxScore > 0 ? Math.round((data.score / data.maxScore) * 100) : 0;
      const mastery = getMasteryLevel(pct);
      topicRowsHtml += `
        <tr>
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
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Score Report — ${attempt.studentName || 'Student'}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1e293b;padding:32px;max-width:820px;margin:0 auto;}
    .header{background:linear-gradient(135deg,#1e1b4b,#312e81);color:#fff;padding:20px 24px;border-radius:12px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;}
    .score-box{background:rgba(255,255,255,0.18);border-radius:10px;padding:10px 18px;text-align:center;}
    .score-box .score{font-size:26px;font-weight:800;}
    .score-box .pts{font-size:12px;opacity:0.75;margin-top:2px;}
    .pass-badge{display:inline-block;margin-top:6px;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;background:${attempt.passed ? '#10b981' : '#ef4444'};color:#fff;}
    h2{font-size:15px;font-weight:700;margin:24px 0 10px;color:#374151;}
    table{width:100%;border-collapse:collapse;margin-top:6px;}
    th{background:#374151;color:#fff;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;}
    td{border-bottom:1px solid #e5e7eb;vertical-align:middle;}
    tr:last-child td{border-bottom:none;}
    footer{margin-top:36px;font-size:11px;color:#9ca3af;text-align:center;}
    @media print{body{padding:16px;}}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size:10px;opacity:.65;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px;">Score Report</div>
      <div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:2px;">${attempt.studentName || 'Student'}</div>
      <div style="font-size:13px;opacity:.8;">${assignment.title}</div>
      <div style="font-size:11px;opacity:.6;margin-top:4px;">Completed: ${date}</div>
    </div>
    <div class="score-box">
      <div class="score">${attempt.percentage}%</div>
      <div class="pts">${attempt.score} / ${attempt.maxScore} pts</div>
      <div class="pass-badge">${attempt.passed ? 'PASSED' : 'FAILED'}</div>
    </div>
  </div>
  ${aiHtml}
  ${Object.keys(topicMastery).length > 0 ? `
  <h2>Topic Mastery</h2>
  <table>
    <thead><tr><th>Topic</th><th style="text-align:center">Mastery Level</th><th style="text-align:center">Correct</th><th style="text-align:center">Score %</th></tr></thead>
    <tbody>${topicRowsHtml}</tbody>
  </table>` : ''}
  <div class="footer">Generated by Catalyst Learning Platform &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `report-${(attempt.studentName || 'student').replace(/\s+/g, '-')}-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// SVG CHART COMPONENTS (replaces recharts — no external dep)
// ─────────────────────────────────────────────────────────────

function SVGColumnChart({ data }) {
  const padL = 36, padR = 12, padT = 28, padB = 56;
  const n    = data.length || 1;
  const svgW = Math.max(300, n * 72 + padL + padR);
  const svgH = 210;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const barW   = Math.min(48, (chartW / n) * 0.55);
  const gap    = chartW / n;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
      {[0, 25, 50, 75, 100].map((v) => {
        const y = padT + (1 - v / 100) * chartH;
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#f1f5f9" strokeWidth={v === 0 ? 1.5 : 1} />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}%</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const barH  = Math.max(2, (d.pct / 100) * chartH);
        const x     = padL + gap * i + (gap - barW) / 2;
        const y     = padT + chartH - barH;
        const color = CHART_PALETTE[d.paletteIdx % CHART_PALETTE.length];
        const labelX = x + barW / 2;
        const nameY  = svgH - padB + 14;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx="4" fill={color} />
            <text x={labelX} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
              {d.pct}%
            </text>
            {n > 5 ? (
              <text
                x={labelX} y={nameY}
                textAnchor="end" fontSize="9" fill="#64748b"
                transform={`rotate(-38, ${labelX}, ${nameY})`}
              >
                {d.name}
              </text>
            ) : (
              <text x={labelX} y={nameY} textAnchor="middle" fontSize="9" fill="#64748b">
                {d.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function SVGFullPie({ pieData, size = 220 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.42;
  const total = pieData.reduce((a, s) => a + s.value, 0) || 1;
  const slices = pieData.reduce((acc, seg) => {
    const sa = acc.angle;
    const sl = (seg.value / total) * 2 * Math.PI;
    const ea = sa + sl;
    const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
    const la = sl > Math.PI ? 1 : 0;
    const midA = (sa + ea) / 2;
    acc.items.push({
      ...seg,
      pct: Math.round((seg.value / total) * 100),
      path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${la} 1 ${x2} ${y2} Z`,
      lx: cx + r * 0.68 * Math.cos(midA),
      ly: cy + r * 0.68 * Math.sin(midA),
    });
    acc.angle = ea;
    return acc;
  }, { angle: -Math.PI / 2, items: [] }).items;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {slices.map((s, i) => (
        <g key={i}>
          <path d={s.path} fill={s.color} stroke="#fff" strokeWidth="2" />
          {s.pct >= 8 && (
            <text x={s.lx} y={s.ly + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">
              {s.pct}%
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function SVGLineChart({ lineData, groupEntries }) {
  const padL = 36, padR = 16, padT = 24, padB = 38;
  const svgW = 400, svgH = 200;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const n = lineData.length;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full">
      {[0, 25, 50, 75, 100].map((v) => {
        const y = padT + (1 - v / 100) * chartH;
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="#f1f5f9" strokeWidth={1} strokeDasharray="4,3" />
            <text x={padL - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}%</text>
          </g>
        );
      })}
      {groupEntries.map(([group], gi) => {
        const color = CHART_PALETTE[gi % CHART_PALETTE.length];
        const pts = lineData
          .map((d, i) => {
            const val = d[group];
            if (val === undefined) return null;
            return {
              x: padL + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2),
              y: padT + (1 - val / 100) * chartH,
              val,
            };
          })
          .filter(Boolean);
        if (pts.length === 0) return null;
        const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
        return (
          <g key={group}>
            {pts.length > 1 && (
              <polyline points={poly} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="5" fill={color} stroke="white" strokeWidth="2" />
            ))}
          </g>
        );
      })}
      {lineData.map((d, i) => {
        const x = padL + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2);
        return (
          <text key={i} x={x} y={svgH - padB + 14} textAnchor="middle" fontSize="9" fill="#64748b">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

function TopicCharts({ topicMastery }) {
  const groupEntries = Object.entries(topicMastery);

  if (groupEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm">
        <span className="text-4xl mb-3">📊</span>
        <p className="font-semibold">No topic data available to chart.</p>
        <p className="text-xs mt-1">Assign topics to questions to enable charts.</p>
      </div>
    );
  }

  const columnGroups = groupEntries.map(([group, topics]) => ({
    group,
    data: Object.entries(topics).map(([topic, d], idx) => ({
      name:       topic.length > 18 ? topic.slice(0, 16) + '…' : topic,
      fullName:   topic,
      pct:        d.maxScore > 0 ? Math.round((d.score / d.maxScore) * 100) : 0,
      paletteIdx: idx,
    })),
  }));

  const masteryCount = {};
  for (const topics of Object.values(topicMastery)) {
    for (const [, d] of Object.entries(topics)) {
      const pct   = d.maxScore > 0 ? Math.round((d.score / d.maxScore) * 100) : 0;
      const label = getMasteryLevel(pct).label;
      masteryCount[label] = (masteryCount[label] || 0) + 1;
    }
  }
  const pieData = Object.entries(masteryCount).map(([name, value]) => ({
    name, value, color: MASTERY_CHART_COLORS[name] || '#A5A5A5',
  }));

  const maxLen = Math.max(...groupEntries.map(([, t]) => Object.keys(t).length), 1);
  const lineData = Array.from({ length: maxLen }, (_, i) => {
    const entry = { label: `T${i + 1}` };
    groupEntries.forEach(([group, topics]) => {
      const topicArr = Object.entries(topics);
      if (i < topicArr.length) {
        const [, d] = topicArr[i];
        entry[group] = d.maxScore > 0 ? Math.round((d.score / d.maxScore) * 100) : 0;
      }
    });
    return entry;
  });

  return (
    <div className="p-5 space-y-6">

      {/* Column charts per group */}
      {columnGroups.map(({ group, data }) => (
        <div key={group} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100"
               style={{ background: 'linear-gradient(90deg,#1e293b,#334155)' }}>
            <p className="text-sm font-bold text-white">{group}</p>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
              Column Chart
            </span>
          </div>
          <div className="px-4 pt-4 pb-3">
            <SVGColumnChart data={data} />
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {data.map((d, idx) => (
                <div key={d.fullName} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ background: CHART_PALETTE[idx % CHART_PALETTE.length] }} />
                  <span className="text-gray-600">{d.fullName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Pie chart — mastery level distribution */}
      {pieData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100"
               style={{ background: 'linear-gradient(90deg,#1e293b,#334155)' }}>
            <p className="text-sm font-bold text-white">Mastery Level Distribution</p>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
              Pie Chart
            </span>
          </div>
          <div className="p-4 flex flex-col sm:flex-row items-center gap-8">
            <SVGFullPie pieData={pieData} size={220} />
            <div className="flex flex-col gap-3">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded shrink-0" style={{ background: entry.color }} />
                  <div>
                    <p className="text-[13px] font-bold text-gray-800">{entry.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {entry.value} topic{entry.value !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Line chart — performance trend */}
      {lineData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100"
               style={{ background: 'linear-gradient(90deg,#1e293b,#334155)' }}>
            <p className="text-sm font-bold text-white">Performance Trend by Section</p>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
              Line Chart
            </span>
          </div>
          <div className="p-4">
            <SVGLineChart lineData={lineData} groupEntries={groupEntries} />
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {groupEntries.map(([group], gi) => (
                <div key={group} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-5 h-2 rounded-sm shrink-0"
                        style={{ background: CHART_PALETTE[gi % CHART_PALETTE.length] }} />
                  <span className="text-gray-600">{group.replace(' Mastery', '')}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-[11px] text-gray-400 mt-1">
              T1, T2 … = topics within each section in question order
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AI SUMMARY VIEW
// ─────────────────────────────────────────────────────────────
function AISummaryView({ aiData, onDownload }) {
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
      <div
        className="rounded-xl p-4 border"
        style={{ background: aiData.passed ? '#f0fdf4' : '#fff7ed', borderColor: aiData.passed ? '#6ee7b7' : '#fed7aa' }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">{aiData.passed ? '🎯' : '📈'}</span>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5"
               style={{ color: aiData.passed ? '#065f46' : '#9a3412' }}>
              Overall Performance
            </p>
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
                  <span key={t.topic}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
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
                  <span key={t.topic}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
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
                    <span key={t.topic}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
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

      <button
        onClick={onDownload}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
      >
        ⬇ &nbsp;Download Full Report (.html)
      </button>
      <p className="text-center text-[11px] text-gray-400">
        Opens as an HTML file — open in browser and print to save as PDF.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STUDENT REPORT MODAL
// Full-screen overlay. Identical layout to mentor's modal.
// Props:
//   attempt        – { studentName, score, maxScore, percentage, passed,
//                      completedAt, sectionResults: [{sectionId, sectionName,
//                      modules: [{moduleNumber, score, maxScore, timeTaken,
//                      answers: {[qid]: choice}}] }] }
//   assignment     – full assignment with sections/modules/questions + correctAnswer
//   onClose        – callback to dismiss
//   isStudentView  – true → "My Score Report" header (default: true)
// ─────────────────────────────────────────────────────────────
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

  const topicMastery = useMemo(
    () => computeTopicMastery(assignment, attempt),
    [assignment, attempt],
  );
  const hasTopics = Object.keys(topicMastery).length > 0;
  const aiData    = useMemo(
    () => (hasTopics ? generateAISummary(topicMastery, attempt) : null),
    [topicMastery, attempt, hasTopics],
  );

  const sectionResult = attempt.sectionResults?.find((s) => s.sectionId === activeSection);
  const moduleResult  = sectionResult?.modules?.find((m) => m.moduleNumber === activeModule);
  const assignSection = assignment.sections?.find((s) => (s.id || s.sid) === activeSection);
  const assignModule  = assignSection?.modules?.find((m) => m.number === activeModule);
  const meta          = SECTION_META[activeSection] || SECTION_META.rw;

  const formatTime = (mins) => (!mins && mins !== 0) ? '—' : `${mins}m`;
  const handleDownload = () => downloadReport(attempt, assignment, topicMastery, aiData);

  const TABS = [
    { key: 'questions', label: 'Questions' },
    ...(hasTopics ? [{ key: 'topics',  label: 'Topic Mastery' }] : []),
    ...(hasTopics ? [{ key: 'charts',  label: 'Charts'        }] : []),
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
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.3)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0"
          style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shrink-0"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              {attempt.avatar || (attempt.studentName || 'S').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {isStudentView ? 'My Score Report' : attempt.studentName}
              </h3>
              <p className="text-xs text-indigo-300 mt-0.5">
                {isStudentView
                  ? assignment.title
                  : `${attempt.batchName} · Score report`}
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
            <button
              onClick={handleDownload}
              title="Download report as HTML"
              className="w-8 h-8 rounded-xl bg-white/15 text-white hover:bg-emerald-500 flex items-center justify-center text-sm transition-colors"
            >
              ⬇
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/15 text-white hover:bg-white/30 flex items-center justify-center text-sm font-bold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="shrink-0 border-b border-gray-100 bg-white px-5 pt-3 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className="px-4 py-1.5 rounded-t-lg text-[12px] font-bold border-b-2 transition-all"
              style={
                view === t.key
                  ? { borderColor: '#4f46e5', color: '#4f46e5', background: '#fff' }
                  : { borderColor: 'transparent', color: '#9ca3af' }
              }
            >
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
                <button
                  key={sr.sectionId}
                  onClick={() => { setActiveSection(sr.sectionId); setActiveModule(1); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all"
                  style={active
                    ? { borderColor: m.accent, color: m.accent, background: '#fff' }
                    : { borderColor: 'transparent', color: '#9ca3af', background: 'transparent' }}
                >
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
                  <button
                    key={mod.moduleNumber}
                    onClick={() => setActiveModule(mod.moduleNumber)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all"
                    style={active
                      ? { background: meta.accent, color: '#fff' }
                      : { background: '#f3f4f6', color: '#9ca3af' }}
                  >
                    Module {mod.moduleNumber}
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold"
                      style={active
                        ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                        : { background: '#e5e7eb', color: '#6b7280' }}
                    >
                      {mod.score}/{mod.maxScore}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* View: Topic Mastery */}
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
                    <div key={topic}
                         className="grid grid-cols-[1fr_auto_160px] items-center px-4 py-3 border-t border-gray-100 bg-white">
                      <div>
                        <p className="text-[13px] text-gray-700">{topic}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{data.correct}/{data.total} correct</p>
                      </div>
                      <span
                        className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mx-6"
                        style={{ background: mastery.bg, color: mastery.color }}
                      >
                        {mastery.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                               style={{ width: `${pct}%`, background: mastery.bar }} />
                        </div>
                        <span className="text-[10px] font-bold shrink-0 w-8 text-right"
                              style={{ color: mastery.bar }}>
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

        {/* View: Charts */}
        {view === 'charts' && (
          <div className="flex-1 overflow-y-auto">
            <TopicCharts topicMastery={topicMastery} />
          </div>
        )}

        {/* View: AI Summary */}
        {view === 'summary' && (
          <div className="flex-1 overflow-y-auto">
            <AISummaryView aiData={aiData} onDownload={handleDownload} />
          </div>
        )}

        {/* View: Questions */}
        <div className={`flex-1 overflow-y-auto p-5 space-y-3 ${view !== 'questions' ? 'hidden' : ''}`}>
          {moduleResult && assignModule && (
            <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm" style={{ background: meta.bg }}>
              <span style={{ color: meta.accent }} className="font-bold">Module {activeModule}</span>
              <span className="text-gray-500 text-xs">
                ⏱ {formatTime(moduleResult.timeTaken)} / {formatTime(assignModule.timeLimit)} used
              </span>
              <span className="text-gray-500 text-xs">⭐ {moduleResult.score} / {moduleResult.maxScore} pts</span>
              <span className="text-gray-500 text-xs">{assignModule.questions.length} questions</span>
            </div>
          )}

          {assignModule?.questions.map((q, idx) => {
            const primaryKey    = q.qid || q.id;
            const fallbackKey   = q.id  || q.qid;
            const studentAnswer =
              moduleResult?.answers?.[primaryKey] ??
              moduleResult?.answers?.[fallbackKey];
            const isCorrect   = studentAnswer === q.correctAnswer;
            const notAnswered = !studentAnswer;

            return (
              <div
                key={primaryKey}
                className={`rounded-2xl border overflow-hidden ${
                  notAnswered ? 'border-gray-200' : isCorrect ? 'border-emerald-200' : 'border-red-200'
                }`}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ background: notAnswered ? '#f9fafb' : isCorrect ? '#f0fdf4' : '#fff1f2' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold text-white shrink-0"
                    style={{ background: notAnswered ? '#9ca3af' : isCorrect ? '#10b981' : '#ef4444' }}
                  >
                    {q.number || idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate"
                       style={{ color: notAnswered ? '#6b7280' : isCorrect ? '#065f46' : '#991b1b' }}>
                      {q.title || 'Untitled question'}
                    </p>
                    {q.topic && (
                      <span className="inline-flex mt-0.5 text-[10px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                        {q.topic}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {notAnswered ? (
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                        Not attempted
                      </span>
                    ) : isCorrect ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        ✓ Correct · +{q.score || 1} pt{(q.score || 1) !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                        ✗ Wrong · 0 pts
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-4 bg-white space-y-3">
                  {q.description && (
                    <div className="text-[13px] text-gray-700 leading-relaxed border-l-2 pl-3 border-gray-200"
                         dangerouslySetInnerHTML={{ __html: q.description }} />
                  )}

                  <div className="grid grid-cols-1 gap-1.5">
                    {['A', 'B', 'C', 'D'].map((letter) => {
                      const isStudentAnswer = studentAnswer === letter;
                      const isAnswerKey     = q.correctAnswer === letter;
                      let bg = '#f9fafb', border = '#e5e7eb', color = '#374151';
                      if      (isStudentAnswer && isAnswerKey)   { bg = '#f0fdf4'; border = '#6ee7b7'; color = '#065f46'; }
                      else if (isStudentAnswer && !isAnswerKey)  { bg = '#fff1f2'; border = '#fca5a5'; color = '#991b1b'; }
                      else if (!isStudentAnswer && isAnswerKey)  { bg = '#f0fdf4'; border = '#a7f3d0'; color = '#065f46'; }
                      return (
                        <div key={letter} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border"
                             style={{ background: bg, borderColor: border }}>
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-extrabold shrink-0"
                               style={{ background: border, color }}>
                            {letter}
                          </div>
                          <span className="text-[13px] flex-1" style={{ color }}>
                            {q.choices?.[letter] || '—'}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {isStudentAnswer && <span className="text-[10px] font-bold" style={{ color }}>Your answer</span>}
                            {isAnswerKey      && <span className="text-[10px] font-extrabold text-emerald-600">✓ Key</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="flex gap-2.5 p-3.5 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-base shrink-0">💡</span>
                      <div>
                        <p className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wide mb-1">Explanation</p>
                        <div className="text-[12px] text-amber-800 leading-relaxed"
                             dangerouslySetInnerHTML={{ __html: q.explanation }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {(!assignModule || assignModule.questions.length === 0) && (
            <div className="text-center py-12 text-gray-400 text-sm">No questions in this module.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentReportModal;
