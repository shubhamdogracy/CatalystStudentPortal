import { ChevronDown, ChevronUp } from 'lucide-react';
import { C } from '../../pages/Assignments/testConstants';
import SATDivider from './SATDivider';

export default function TestBottomBar({ currentIdx, totalQuestions, onBack, onNext, onOpenPicker, isLastQuestion, nextLabel }) {
  return (
    <div className="shrink-0" style={{ backgroundColor: C.bg2 }}>
      <SATDivider />
      <div className="flex items-center justify-between px-4 py-3 gap-2">

        <div className="flex-1 flex justify-start">
          <button
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: C.accent }}
          >
            <ChevronUp size={22} color="#FFFFFF" strokeWidth={2.5} />
          </button>
        </div>

        <button
          onClick={onOpenPicker}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: C.accent, color: '#FFFFFF' }}
        >
          Question {currentIdx + 1} of {totalQuestions}
          <ChevronDown size={14} strokeWidth={2.5} />
        </button>

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
            style={{ backgroundColor: isLastQuestion ? C.accent : C.text, color: '#FFFFFF' }}
          >
            {nextLabel || (isLastQuestion ? 'Submit' : 'Next')}
          </button>
        </div>
      </div>
    </div>
  );
}
