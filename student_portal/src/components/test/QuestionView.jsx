import { Bookmark } from 'lucide-react';
import MathContent from '../common/MathContent';
import { C } from '../../pages/Assignments/testConstants';

export default function QuestionView({ question, answers, onAnswer, index, markedIds, onToggleMark, onOpenNotes, noteCount, showTitle }) {
  const selected = answers[question._id];
  const isMarked = markedIds?.has(question._id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ backgroundColor: C.bg1 }}>
        <span className="w-8 h-8 text-[13px] font-extrabold rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: C.text, color: '#FFFFFF' }}>
          {index + 1}
        </span>
        <button
          onClick={() => onToggleMark?.(question._id)}
          className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
          style={{ color: isMarked ? C.accent : C.textMuted }}
        >
          <Bookmark size={13} fill={isMarked ? C.accent : 'none'} stroke={isMarked ? C.accent : 'currentColor'} strokeWidth={2} />
          Mark for Review
        </button>
        <div className="flex-1" />
        <button className="text-[12px] font-semibold transition-opacity hover:opacity-70" style={{ color: C.red }}>
          Report Issue
        </button>
        <button
          onClick={() => onOpenNotes?.()}
          className="px-2.5 py-1 rounded border text-[11px] font-bold tracking-wide transition-colors"
          style={noteCount > 0
            ? { borderColor: C.accent, backgroundColor: C.accentLight, color: C.accent }
            : { borderColor: C.border, color: C.textMuted, backgroundColor: C.bg2 }
          }
        >
          {noteCount > 0 ? `📝 ${noteCount}` : 'ABC'}
        </button>
      </div>

      {question.topic && (
        <span
          className="self-start text-[10px] font-semibold rounded-full px-2.5 py-0.5"
          style={{ color: C.accent, backgroundColor: C.accentLight, border: `1px solid ${C.accentBorder}` }}
        >
          {question.topic}
        </span>
      )}

      {showTitle && question.title && (
        <MathContent html={question.title} className="text-[14px] font-medium leading-relaxed [&_p]:m-0" style={{ color: C.text }} />
      )}

      {question.format === 'grid_in' ? (
        <div className="flex flex-col gap-2 mt-1">
          <label className="text-[12px] font-semibold" style={{ color: C.textMuted }}>Your Answer</label>
          <input
            type="text"
            value={selected || ''}
            onChange={e => onAnswer(question._id, e.target.value)}
            placeholder="Type your answer…"
            className="w-40 h-11 px-3 rounded-xl border-2 text-sm font-mono focus:outline-none transition-colors"
            style={{ borderColor: selected ? C.accent : C.border, backgroundColor: C.bg2, color: C.text }}
          />
        </div>
      ) : (
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
                style={isSelected ? { borderColor: C.accent, backgroundColor: C.accentLight } : { borderColor: C.border, backgroundColor: C.bg2 }}
              >
                <span
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[13px] font-bold shrink-0 transition-all"
                  style={isSelected
                    ? { backgroundColor: C.accent, borderColor: C.accent, color: '#FFFFFF' }
                    : { borderColor: '#d1d5db', color: C.text, backgroundColor: C.bg2 }
                  }
                >
                  {opt}
                </span>
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
