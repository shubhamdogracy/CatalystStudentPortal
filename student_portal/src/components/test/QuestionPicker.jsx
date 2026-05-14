import { C } from '../../pages/Assignments/testConstants';

export default function QuestionPicker({ questions, currentIdx, answers, markedIds, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-[150] bg-black/40 flex items-end justify-center pb-6" onClick={onClose}>
      <div className="rounded-3xl w-full max-w-2xl mx-4 p-5 shadow-2xl" style={{ backgroundColor: C.bg2 }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ backgroundColor: C.bg1 }} />
        <p className="text-[11px] font-extrabold uppercase tracking-widest mb-3" style={{ color: C.accent }}>
          Jump to Question
        </p>

        <div className="grid grid-cols-8 gap-2 mb-5">
          {questions.map((q, i) => {
            const answered  = !!answers[q._id];
            const marked    = markedIds?.has(q._id);
            const isCurrent = i === currentIdx;
            return (
              <button
                key={q._id}
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

        <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors hover:opacity-90" style={{ backgroundColor: C.bg1, color: C.text }}>
          Close
        </button>
      </div>
    </div>
  );
}
