import { getMasteryLevel, CHART_PALETTE, MASTERY_CHART_COLORS } from '../../utils/colorMapping';

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
              <text x={labelX} y={nameY} textAnchor="end" fontSize="9" fill="#64748b"
                    transform={`rotate(-38, ${labelX}, ${nameY})`}>
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
            return { x: padL + (n > 1 ? (i / (n - 1)) * chartW : chartW / 2), y: padT + (1 - val / 100) * chartH, val };
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

export default function TopicCharts({ topicMastery }) {
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
      name: topic.length > 18 ? topic.slice(0, 16) + '…' : topic,
      fullName: topic,
      pct: d.maxScore > 0 ? Math.round((d.score / d.maxScore) * 100) : 0,
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

  const headerStyle = { background: 'linear-gradient(90deg,#1e293b,#334155)' };

  return (
    <div className="p-5 space-y-6">
      {columnGroups.map(({ group, data }) => (
        <div key={group} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100" style={headerStyle}>
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

      {pieData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100" style={headerStyle}>
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
                    <p className="text-[11px] text-gray-400">{entry.value} topic{entry.value !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {lineData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100" style={headerStyle}>
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
