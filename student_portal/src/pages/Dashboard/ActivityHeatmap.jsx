import { Activity } from 'lucide-react';

const WEEKS     = 13;
const CELL      = 13;
const GAP       = 3;
const TZ        = Intl.DateTimeFormat().resolvedOptions().timeZone;
const MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_ABBR  = ['S','M','T','W','T','F','S']; // Sun–Sat

function buildCells(activityDates) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay(); // 0=Sun … 6=Sat

  // Start from the Sunday of the oldest week so columns align cleanly
  const start = new Date(today);
  start.setDate(today.getDate() - dow - (WEEKS - 1) * 7);

  const cells = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: TZ });
    const isFuture = d > today;
    cells.push({
      dateStr,
      month:    d.getMonth(),
      day:      d.getDate(),
      dow:      d.getDay(),
      active:   !isFuture && !!activityDates?.has(dateStr),
      isFuture,
      isToday:  d.getTime() === today.getTime(),
    });
  }

  // Slice into columns (weeks), each column = 7 days Sun–Sat
  const weeks = [];
  for (let w = 0; w < WEEKS; w++) weeks.push(cells.slice(w * 7, (w + 1) * 7));
  return { cells, weeks };
}

function buildMonthLabels(weeks) {
  const labels = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const m = week[0].month;
    if (m !== lastMonth) { labels.push({ col: wi, label: MONTHS[m] }); lastMonth = m; }
  });
  return labels;
}

export default function ActivityHeatmap({ activityDates }) {
  const { cells, weeks } = buildCells(activityDates);
  const monthLabels      = buildMonthLabels(weeks);

  const activeDays   = cells.filter(c => c.active).length;
  const thisMonth    = cells.filter(c => c.active && c.month === new Date().getMonth() && !c.isFuture).length;
  const lastSevenDays = cells.filter((c, i) => c.active && i >= cells.length - 7).length;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title"><Activity size={16} color="#4f46e5" /> Study Activity</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e' }} />
            <span className="text-[11px] text-slate-400">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: '#e2e8f0' }} />
            <span className="text-[11px] text-slate-400">Inactive</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, minWidth: 'max-content' }}>

          {/* Month labels row */}
          <div style={{ display: 'flex', gap: GAP, paddingLeft: 20 }}>
            {weeks.map((_, wi) => {
              const lbl = monthLabels.find(m => m.col === wi);
              return (
                <div key={wi} style={{ width: CELL, fontSize: 9, color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'visible' }}>
                  {lbl ? lbl.label : ''}
                </div>
              );
            })}
          </div>

          {/* Grid rows (Sun=0 … Sat=6) */}
          {[0,1,2,3,4,5,6].map(rowDow => (
            <div key={rowDow} style={{ display: 'flex', alignItems: 'center', gap: GAP }}>
              {/* Day-of-week label */}
              <div style={{ width: 14, fontSize: 9, color: '#cbd5e1', fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>
                {rowDow % 2 === 1 ? DAY_ABBR[rowDow] : ''}
              </div>
              {/* Cells for this day-of-week across all weeks */}
              {weeks.map((week, wi) => {
                const cell = week[rowDow];
                return (
                  <div
                    key={wi}
                    title={cell.isFuture ? '' : `${cell.dateStr}${cell.active ? ' — Active' : ' — No activity'}`}
                    style={{
                      width:      CELL,
                      height:     CELL,
                      borderRadius: 3,
                      background:  cell.isFuture ? 'transparent' : cell.active ? '#22c55e' : '#e2e8f0',
                      opacity:     cell.isFuture ? 0 : cell.active ? 0.85 : 0.55,
                      outline:     cell.isToday ? '2px solid #4f46e5' : 'none',
                      outlineOffset: 1,
                      cursor:      'default',
                      transition:  'transform 0.1s',
                      flexShrink:  0,
                    }}
                    onMouseEnter={e => { if (!cell.isFuture) { e.currentTarget.style.transform = 'scale(1.3)'; e.currentTarget.style.zIndex = 10; }}}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = ''; }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
        {[
          { value: activeDays,    label: 'Total Active Days' },
          { value: thisMonth,     label: 'This Month'        },
          { value: lastSevenDays, label: 'Last 7 Days'       },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <p className="text-[20px] font-black text-slate-800 leading-none">{value}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
