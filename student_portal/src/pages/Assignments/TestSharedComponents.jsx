/**
 * TestSharedComponents.jsx
 *
 * Shared UI components for the SAT test-taking experience.
 * Used by AdaptiveSATTestTaker and PracticeAssignmentTaker.
 *
 * Design system (Image #2):
 *   Accent       : #80AF81
 *   Typography   : #2A2A2A
 *   Background 1 : #F2F2F2
 *   Background 2 : #FFFFFF
 */

import { useState } from 'react';
import { Bookmark, ChevronDown, ChevronUp, Calculator as CalcIcon, Maximize2, Minimize2 } from 'lucide-react';
import MathContent from '../../components/common/MathContent';

// ─── Design tokens ─────────────────────────────────────────────────────────────
export const C = {
  accent:       '#80AF81',
  accentLight:  '#80AF8115',
  accentBorder: '#80AF8140',
  text:         '#2A2A2A',
  textMuted:    '#2A2A2A99',
  bg1:          '#F2F2F2',
  bg2:          '#FFFFFF',
  border:       '#e5e7eb',
  red:          '#ef4444',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
export function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Colorful dashed SAT-style divider ─────────────────────────────────────────
export function SATDivider() {
  const segments = [
    '#2A2A2A', '#80AF81', '#22d3ee', '#fbbf24',
    '#2A2A2A', '#80AF81', '#22d3ee', '#fbbf24',
    '#2A2A2A',
  ];
  return (
    <div className="flex h-[3px]">
      {segments.map((color, i) => (
        <div
          key={i}
          className="flex-1 border-t-2 border-dashed"
          style={{ borderColor: color }}
        />
      ))}
    </div>
  );
}

// ─── Directions dropdown ───────────────────────────────────────────────────────
export function DirectionsDropdown({ subject }) {
  const [open, setOpen] = useState(false);

  const directionText = subject === 'math'
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
          {/* Backdrop */}
          <div className="fixed inset-0 z-[120]" onClick={() => setOpen(false)} />
          {/* Popover */}
          <div
            className="absolute left-0 top-9 z-[130] rounded-2xl shadow-xl p-5 w-80"
            style={{ backgroundColor: C.bg2, border: `1px solid ${C.border}` }}
          >
            <p className="text-[13px] font-bold mb-2" style={{ color: C.text }}>Directions</p>
            <p className="text-[12px] leading-relaxed" style={{ color: C.textMuted }}>{directionText}</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Top navigation bar ────────────────────────────────────────────────────────
//
// Layout (matching Image #1 / #3):
//   LEFT  : Section name + module label + Directions button
//   CENTER: Large countdown timer + Hide/Show toggle
//   RIGHT : Calculator + References (math only) + More (⋮) with dropdown
//
export function TestTopBar({
  sectionName,
  moduleLabel,
  subject,
  timeLeft,
  showTimer,
  onToggleTimer,
  showCalc,
  onToggleCalc,
  showMathRef,
  onToggleMathRef,
  showMore,
  onToggleMore,
  onOpenNotes,
  onSubmit,
  onExit,
}) {
  const timerColor = timeLeft <= 120 ? C.red : timeLeft <= 300 ? '#d97706' : C.text;
  const timerPulse = timeLeft <= 120 ? 'animate-pulse' : '';

  return (
    <div className="shrink-0" style={{ backgroundColor: C.bg2 }}>
      <div className="flex items-start justify-between px-6 py-3 gap-4">

        {/* ── Left: section name + module + Directions ── */}
        <div className="flex flex-col gap-1 min-w-[200px]">
          <p className="text-[18px] font-extrabold leading-tight" style={{ color: C.text }}>
            {sectionName}
          </p>
          <p className="text-[12px] font-medium" style={{ color: C.textMuted }}>
            {moduleLabel}
          </p>
          <div className="mt-1">
            <DirectionsDropdown subject={subject} />
          </div>
        </div>

        {/* ── Center: timer ── */}
        <div className="flex flex-col items-center flex-1 pt-1">
          {showTimer ? (
            <span
              className={`text-[32px] font-extrabold tracking-tight leading-none ${timerPulse}`}
              style={{ color: timerColor }}
            >
              {formatTime(timeLeft)}
            </span>
          ) : (
            <span className="text-[14px] font-semibold" style={{ color: C.textMuted }}>
              Timer hidden
            </span>
          )}
          <button
            onClick={onToggleTimer}
            className="mt-2 px-5 py-0.5 rounded-full border text-[12px] font-semibold transition-colors hover:bg-gray-50"
            style={{ borderColor: C.border, color: C.text }}
          >
            {showTimer ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* ── Right: tool buttons ── */}
        <div className="flex items-center gap-1 min-w-[200px] justify-end pt-1">

          {/* Calculator — math only */}
          {subject === 'math' && (
            <button
              onClick={onToggleCalc}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                showCalc
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'hover:bg-gray-100'
              }`}
              style={showCalc ? {} : { color: C.text }}
            >
              <CalcIcon size={18} />
              <span className="text-[11px] font-semibold leading-none">Calculator</span>
            </button>
          )}

          {/* References — math only */}
          {subject === 'math' && (
            <button
              onClick={onToggleMathRef}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                showMathRef
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'hover:bg-gray-100'
              }`}
              style={showMathRef ? {} : { color: C.text }}
            >
              <span
                className="font-bold italic leading-none"
                style={{ fontFamily: 'Georgia, serif', fontSize: 18 }}
              >
                f<span style={{ fontSize: 12, verticalAlign: 'sub' }}>x</span>
              </span>
              <span className="text-[11px] font-semibold leading-none">References</span>
            </button>
          )}

          {/* More ⋮ */}
          <div className="relative z-[110]">
            <button
              onClick={onToggleMore}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all hover:bg-gray-100"
              style={{ color: C.text }}
            >
              <span
                className="font-black leading-none"
                style={{ fontSize: 22, letterSpacing: 2 }}
              >
                ⋮
              </span>
              <span className="text-[11px] font-semibold leading-none">More</span>
            </button>

            {/* More dropdown */}
            {showMore && (
              <div
                className="absolute right-0 top-12 z-[110] rounded-2xl shadow-2xl overflow-hidden w-52"
                style={{ backgroundColor: C.bg2, border: `1px solid ${C.border}` }}
              >
                <button
                  onClick={onOpenNotes}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-gray-50"
                  style={{ color: C.text }}
                >
                  <span className="text-base">📝</span>
                  <span className="font-semibold">Notes</span>
                </button>
                <div style={{ borderTop: `1px solid ${C.bg1}` }} />
                <button
                  onClick={onSubmit}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm transition-colors hover:bg-red-50"
                  style={{ color: C.red }}
                >
                  <span className="text-base">✅</span>
                  <span className="font-semibold">Submit Test</span>
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

// ─── Bottom navigation bar ─────────────────────────────────────────────────────
//
// Layout (matching Image #1):
//   LEFT  : Round green brand button (↑)
//   CENTER: Green "Question X of Y ▼" pill → opens question picker
//   RIGHT : Back + Next buttons
//
export function TestBottomBar({
  currentIdx,
  totalQuestions,
  onBack,
  onNext,
  onOpenPicker,
  isLastQuestion,
  nextLabel,
}) {
  return (
    <div className="shrink-0" style={{ backgroundColor: C.bg2 }}>
      <SATDivider />
      <div className="flex items-center justify-between px-4 py-3 gap-2">

        {/* Left: brand / home button */}
        <div className="flex-1 flex justify-start">
          <button
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: C.accent }}
          >
            <ChevronUp size={22} color="#FFFFFF" strokeWidth={2.5} />
          </button>
        </div>

        {/* Center: question picker pill */}
        <button
          onClick={onOpenPicker}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: C.accent, color: '#FFFFFF' }}
        >
          Question {currentIdx + 1} of {totalQuestions}
          <ChevronDown size={14} strokeWidth={2.5} />
        </button>

        {/* Right: Back + Next */}
        <div className="flex-1 flex justify-end items-center gap-2">
          <button
            onClick={onBack}
            disabled={currentIdx === 0}
            className="px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: C.text, color: '#FFFFFF' }}
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="px-6 py-3 rounded-xl text-sm font-bold shadow-sm transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: isLastQuestion ? C.accent : C.text,
              color: '#FFFFFF',
            }}
          >
            {nextLabel || (isLastQuestion ? 'Submit' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Question view (right panel) ──────────────────────────────────────────────
//
// Renders:
//   • Header row  : question number badge | Mark for Review | Report Issue | ABC
//   • Topic tag   : optional
//   • Question title (showTitle = true when description/passage is on the left)
//   • Answer choices or grid-in text input
//
export function QuestionView({
  question,
  answers,
  onAnswer,
  index,
  markedIds,
  onToggleMark,
  onOpenNotes,
  noteCount,
  showTitle,
}) {
  const selected = answers[question._id];
  const isMarked = markedIds?.has(question._id);

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header row ── */}
      <div
        className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
        style={{ backgroundColor: C.bg1 }}
      >
        {/* Question number */}
        <span
          className="w-8 h-8 text-[13px] font-extrabold rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: C.text, color: '#FFFFFF' }}
        >
          {index + 1}
        </span>

        {/* Mark for review */}
        <button
          onClick={() => onToggleMark?.(question._id)}
          className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
          style={{ color: isMarked ? C.accent : C.textMuted }}
        >
          <Bookmark
            size={13}
            fill={isMarked ? C.accent : 'none'}
            stroke={isMarked ? C.accent : 'currentColor'}
            strokeWidth={2}
          />
          Mark for Review
        </button>

        <div className="flex-1" />

        {/* Report issue */}
        <button
          className="text-[12px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: C.red }}
        >
          Report Issue
        </button>

        {/* ABC — notes button */}
        <button
          onClick={() => onOpenNotes?.()}
          className="px-2.5 py-1 rounded border text-[11px] font-bold tracking-wide transition-colors"
          style={
            noteCount > 0
              ? { borderColor: C.accent, backgroundColor: C.accentLight, color: C.accent }
              : { borderColor: C.border, color: C.textMuted, backgroundColor: C.bg2 }
          }
        >
          {noteCount > 0 ? `📝 ${noteCount}` : 'ABC'}
        </button>
      </div>

      {/* ── Topic tag ── */}
      {question.topic && (
        <span
          className="self-start text-[10px] font-semibold rounded-full px-2.5 py-0.5"
          style={{ color: C.accent, backgroundColor: C.accentLight, border: `1px solid ${C.accentBorder}` }}
        >
          {question.topic}
        </span>
      )}

      {/* ── Question title (when description/passage is on the left panel) ── */}
      {showTitle && question.title && (
        <MathContent
          html={question.title}
          className="text-[14px] font-medium leading-relaxed [&_p]:m-0"
          style={{ color: C.text }}
        />
      )}

      {/* ── Grid-in answer input ── */}
      {question.format === 'grid_in' ? (
        <div className="flex flex-col gap-2 mt-1">
          <label className="text-[12px] font-semibold" style={{ color: C.textMuted }}>
            Your Answer
          </label>
          <input
            type="text"
            value={selected || ''}
            onChange={e => onAnswer(question._id, e.target.value)}
            placeholder="Type your answer…"
            className="w-40 h-11 px-3 rounded-xl border-2 text-sm font-mono focus:outline-none transition-colors"
            style={{
              borderColor: selected ? C.accent : C.border,
              backgroundColor: C.bg2,
              color: C.text,
            }}
          />
        </div>
      ) : (
        /* ── Multiple-choice options ── */
        <div className="flex flex-col gap-3 mt-1">
          {['A', 'B', 'C', 'D'].map(opt => {
            const label = question.choices?.[opt];
            if (!label) return null;
            const isSelected = selected === opt;
            return (
              <button
                key={opt}
                onClick={() => onAnswer(question._id, opt)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all hover:shadow-sm"
                style={
                  isSelected
                    ? { borderColor: C.accent, backgroundColor: C.accentLight }
                    : { borderColor: C.border, backgroundColor: C.bg2 }
                }
              >
                {/* Letter circle */}
                <span
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[13px] font-bold shrink-0 transition-all"
                  style={
                    isSelected
                      ? { backgroundColor: C.accent, borderColor: C.accent, color: '#FFFFFF' }
                      : { borderColor: '#d1d5db', color: C.text, backgroundColor: C.bg2 }
                  }
                >
                  {opt}
                </span>
                {/* Choice text — supports HTML / MathJax */}
                <MathContent
                  html={label}
                  className="text-sm flex-1 leading-relaxed text-left [&_p]:m-0"
                  style={{ color: C.text, fontWeight: isSelected ? 600 : 400 }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Split content area ────────────────────────────────────────────────────────
//
// Left panel  : description / passage (HTML) or question title (text)
// Right panel : QuestionView (header + choices / input)
//
// Each panel has an expand icon so the student can read in full width.
//
export function SplitContentArea({
  question,
  answers,
  onAnswer,
  questionIdx,
  markedIds,
  onToggleMark,
  onOpenNotes,
  notes,
}) {
  const [panelMode, setPanelMode] = useState('split'); // 'split' | 'left' | 'right'

  const hasDescription = !!question.description;
  const noteCount      = (notes[question._id] || []).length;

  const leftVisible  = panelMode !== 'right';
  const rightVisible = panelMode !== 'left';
  const leftWidth    = panelMode === 'left' ? '100%' : panelMode === 'right' ? '0%' : '50%';
  const rightWidth   = panelMode === 'right' ? '100%' : panelMode === 'left' ? '0%' : '50%';

  return (
    <div
      className="flex-1 overflow-hidden flex flex-row"
      style={{ backgroundColor: C.bg1 }}
    >
      {/* ── Left panel: passage / description ── */}
      {leftVisible && (
        <div
          className="h-full overflow-y-auto border-r relative transition-all duration-200"
          style={{ width: leftWidth, backgroundColor: C.bg2, borderColor: C.border }}
        >
          {/* Expand / collapse icon */}
          <button
            onClick={() => setPanelMode(m => m === 'left' ? 'split' : 'left')}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: C.textMuted }}
            title={panelMode === 'left' ? 'Show both panels' : 'Expand this panel'}
          >
            {panelMode === 'left' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <div className="p-8 pr-10">
            {hasDescription ? (
              /* Passage / description — processed through KaTeX for LaTeX rendering */
              <MathContent
                html={question.description}
                className="text-[14px] leading-7 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-gray-200 [&_th]:px-2 [&_th]:py-1.5 [&_th]:bg-gray-50 [&_th]:font-semibold [&_p]:mb-3"
                style={{ color: C.text }}
              />
            ) : (
              /* Plain question title without a passage */
              <MathContent
                html={question.title || ''}
                className="text-[15px] font-medium leading-relaxed [&_p]:m-0"
                style={{ color: C.text }}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Right panel: question header + choices ── */}
      {rightVisible && (
        <div
          className="h-full overflow-y-auto relative transition-all duration-200"
          style={{ width: rightWidth, backgroundColor: C.bg2 }}
        >
          {/* Expand / collapse icon */}
          <button
            onClick={() => setPanelMode(m => m === 'right' ? 'split' : 'right')}
            className="absolute top-3 left-3 z-10 p-1.5 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: C.textMuted }}
            title={panelMode === 'right' ? 'Show both panels' : 'Expand this panel'}
          >
            {panelMode === 'right' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <div className="p-6 pt-5 pl-10">
            <QuestionView
              question={question}
              answers={answers}
              onAnswer={onAnswer}
              index={questionIdx}
              markedIds={markedIds}
              onToggleMark={onToggleMark}
              showTitle={hasDescription}
              onOpenNotes={onOpenNotes}
              noteCount={noteCount}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notes modal ───────────────────────────────────────────────────────────────
export function NotesModal({ qid, notes, onAdd, onDelete, onClose }) {
  const [draft, setDraft] = useState('');
  const myNotes = notes[qid] || [];

  const handleAdd = () => {
    if (!draft.trim()) return;
    onAdd(qid, draft.trim());
    setDraft('');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ backgroundColor: C.bg2 }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: C.bg1, background: `linear-gradient(135deg, #f0f7f0, #f9fdf9)` }}
        >
          <div>
            <h3 className="text-[13px] font-bold" style={{ color: C.text }}>Notes for this question</h3>
            <p className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>Ctrl+Enter to save quickly</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold hover:bg-gray-100 transition-colors"
            style={{ color: C.textMuted, backgroundColor: C.bg1 }}
          >
            ✕
          </button>
        </div>

        {/* Existing notes */}
        <div className="p-5 space-y-2 max-h-56 overflow-y-auto" style={{ backgroundColor: C.bg2 }}>
          {myNotes.length === 0 ? (
            <p className="text-[12px] text-center py-4" style={{ color: `${C.text}66` }}>
              No notes yet. Add your first note below.
            </p>
          ) : myNotes.map((note, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-xl px-3 py-2.5"
              style={{ backgroundColor: C.accentLight, border: `1px solid ${C.accentBorder}` }}
            >
              <p className="flex-1 text-[12px] leading-relaxed" style={{ color: C.text }}>{note}</p>
              <button
                onClick={() => onDelete(qid, i)}
                className="text-[11px] shrink-0 mt-0.5 hover:opacity-70 transition-opacity"
                style={{ color: C.textMuted }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="px-5 pb-5 space-y-2" style={{ backgroundColor: C.bg2 }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAdd(); }}
            placeholder="Write a note for this question…"
            className="w-full rounded-xl px-3 py-2 text-[12px] resize-none focus:outline-none transition-colors"
            style={{ border: `1.5px solid ${C.border}`, color: C.text, backgroundColor: C.bg1 }}
            rows={3}
          />
          <button
            onClick={handleAdd}
            disabled={!draft.trim()}
            className="w-full py-2.5 rounded-xl text-[12px] font-bold transition-opacity disabled:opacity-40"
            style={{ backgroundColor: C.accent, color: '#FFFFFF' }}
          >
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Question picker bottom sheet ──────────────────────────────────────────────
export function QuestionPicker({ questions, currentIdx, answers, markedIds, onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[150] bg-black/40 flex items-end justify-center pb-6"
      onClick={onClose}
    >
      <div
        className="rounded-3xl w-full max-w-2xl mx-4 p-5 shadow-2xl"
        style={{ backgroundColor: C.bg2 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: C.bg1 }} />

        <p
          className="text-[11px] font-extrabold uppercase tracking-widest mb-3"
          style={{ color: C.accent }}
        >
          Jump to Question
        </p>

        {/* Grid of question buttons */}
        <div className="grid grid-cols-8 gap-2 mb-5">
          {questions.map((q, i) => {
            const qid       = q._id;
            const answered  = !!answers[qid];
            const marked    = markedIds?.has(qid);
            const isCurrent = i === currentIdx;
            return (
              <button
                key={qid}
                onClick={() => { onSelect(i); onClose(); }}
                className="aspect-square rounded-xl text-[12px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all hover:opacity-80"
                style={
                  isCurrent
                    ? { backgroundColor: C.accent, color: '#FFFFFF' }
                    : answered
                      ? { backgroundColor: C.accentLight, color: C.accent, border: `1px solid ${C.accentBorder}` }
                      : { backgroundColor: C.bg1, color: C.text, border: `1px solid ${C.border}` }
                }
              >
                <span>{i + 1}</span>
                {marked && <span className="text-[8px] leading-none">🔖</span>}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-[11px] font-semibold mb-5" style={{ color: C.textMuted }}>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: C.accentLight, border: `1px solid ${C.accentBorder}` }} />
            Answered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: C.bg1, border: `1px solid ${C.border}` }} />
            Unanswered
          </span>
          <span className="flex items-center gap-1.5">🔖 Marked for Review</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors hover:opacity-90"
          style={{ backgroundColor: C.bg1, color: C.text }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
