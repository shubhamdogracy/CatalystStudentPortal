import { useState } from 'react';
import { ChevronDown, Calculator as CalcIcon } from 'lucide-react';
import { C, formatTime } from '../../pages/Assignments/testConstants';
import SATDivider from './SATDivider';

function DirectionsDropdown({ subject }) {
  const [open, setOpen] = useState(false);
  const text = subject === 'math'
    ? 'The questions in this section address important math skills. Use of a calculator is permitted for all questions. Unless stated otherwise, all variables and expressions represent real numbers.'
    : 'The questions in this section address reading and writing skills. Read each passage and question carefully, then choose the best answer based on the passage. All questions are multiple-choice with four answer choices.';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] font-semibold transition-colors hover:bg-gray-50"
        style={{ borderColor: C.border, color: C.text, backgroundColor: C.bg2 }}
      >
        Directions <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[120]" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-9 z-[130] rounded-2xl shadow-xl p-5 w-80"
            style={{ backgroundColor: C.bg2, border: `1px solid ${C.border}` }}
          >
            <p className="text-[13px] font-bold mb-2" style={{ color: C.text }}>Directions</p>
            <p className="text-[12px] leading-relaxed" style={{ color: C.textMuted }}>{text}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function TestTopBar({
  sectionName, moduleLabel, subject, timeLeft, showTimer, onToggleTimer,
  showCalc, onToggleCalc, showMathRef, onToggleMathRef,
  showMore, onToggleMore, onOpenNotes, onSubmit, onExit,
}) {
  const timerColor = timeLeft <= 120 ? C.red : timeLeft <= 300 ? '#d97706' : C.text;
  const timerPulse = timeLeft <= 120 ? 'animate-pulse' : '';

  return (
    <div className="shrink-0" style={{ backgroundColor: C.bg2 }}>
      <div className="flex items-start justify-between px-6 py-3 gap-4">

        <div className="flex flex-col gap-1 min-w-[200px]">
          <p className="text-[18px] font-extrabold leading-tight" style={{ color: C.text }}>{sectionName}</p>
          <p className="text-[12px] font-medium" style={{ color: C.textMuted }}>{moduleLabel}</p>
          <div className="mt-1"><DirectionsDropdown subject={subject} /></div>
        </div>

        <div className="flex flex-col items-center flex-1 pt-1">
          {showTimer ? (
            <span className={`text-[32px] font-extrabold tracking-tight leading-none ${timerPulse}`} style={{ color: timerColor }}>
              {formatTime(timeLeft)}
            </span>
          ) : (
            <span className="text-[14px] font-semibold" style={{ color: C.textMuted }}>Timer hidden</span>
          )}
          <button
            onClick={onToggleTimer}
            className="mt-2 px-5 py-0.5 rounded-full border text-[12px] font-semibold transition-colors hover:bg-gray-50"
            style={{ borderColor: C.border, color: C.text }}
          >
            {showTimer ? 'Hide' : 'Show'}
          </button>
        </div>

        <div className="flex items-center gap-1 min-w-[200px] justify-end pt-1">
          {subject === 'math' && (
            <button
              onClick={onToggleCalc}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${showCalc ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-gray-100'}`}
              style={showCalc ? {} : { color: C.text }}
            >
              <CalcIcon size={18} />
              <span className="text-[11px] font-semibold leading-none">Calculator</span>
            </button>
          )}
          {subject === 'math' && (
            <button
              onClick={onToggleMathRef}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${showMathRef ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-gray-100'}`}
              style={showMathRef ? {} : { color: C.text }}
            >
              <span className="font-bold italic leading-none" style={{ fontFamily: 'Georgia, serif', fontSize: 18 }}>
                f<span style={{ fontSize: 12, verticalAlign: 'sub' }}>x</span>
              </span>
              <span className="text-[11px] font-semibold leading-none">References</span>
            </button>
          )}
          <div className="relative z-[110]">
            <button
              onClick={onToggleMore}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-gray-100"
              style={{ color: C.text }}
            >
              <span className="font-black leading-none" style={{ fontSize: 22, letterSpacing: 2 }}>⋮</span>
              <span className="text-[11px] font-semibold leading-none">More</span>
            </button>
            {showMore && (
              <div
                className="absolute right-0 top-12 z-[110] rounded-2xl shadow-2xl overflow-hidden w-52"
                style={{ backgroundColor: C.bg2, border: `1px solid ${C.border}` }}
              >
                <button onClick={onOpenNotes} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-gray-50" style={{ color: C.text }}>
                  <span className="text-base">📝</span><span className="font-semibold">Notes</span>
                </button>
                <div style={{ borderTop: `1px solid ${C.bg1}` }} />
                <button onClick={onSubmit} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-red-50" style={{ color: C.red }}>
                  <span className="text-base">✅</span><span className="font-semibold">Submit Test</span>
                </button>
                <div style={{ borderTop: `1px solid ${C.bg1}` }} />
                <button onClick={onExit} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-gray-50" style={{ color: C.textMuted }}>
                  <span className="text-base">🚪</span><span className="font-semibold">Exit Test</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <SATDivider />
    </div>
  );
}
