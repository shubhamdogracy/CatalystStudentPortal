import { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import MathContent from '../common/MathContent';
import { C } from '../../pages/Assignments/testConstants';
import QuestionView from './QuestionView';

export default function SplitContentArea({ question, answers, onAnswer, questionIdx, markedIds, onToggleMark, onOpenNotes, notes }) {
  const [panelMode, setPanelMode] = useState('split'); // 'split' | 'left' | 'right'

  const hasDescription = !!question.description;
  const noteCount      = (notes[question._id] || []).length;
  const leftVisible    = panelMode !== 'right';
  const rightVisible   = panelMode !== 'left';
  const leftWidth      = panelMode === 'left' ? '100%' : panelMode === 'right' ? '0%' : '50%';
  const rightWidth     = panelMode === 'right' ? '100%' : panelMode === 'left' ? '0%' : '50%';

  return (
    <div className="flex-1 overflow-hidden flex flex-row" style={{ backgroundColor: C.bg1 }}>
      {leftVisible && (
        <div
          className="h-full overflow-y-auto border-r relative transition-all duration-200"
          style={{ width: leftWidth, backgroundColor: C.bg2, borderColor: C.border }}
        >
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
              <MathContent
                html={question.description}
                className="text-[14px] leading-7 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-2 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-gray-200 [&_th]:px-2 [&_th]:py-1.5 [&_th]:bg-gray-50 [&_th]:font-semibold [&_p]:mb-3"
                style={{ color: C.text }}
              />
            ) : (
              <MathContent
                html={question.title || ''}
                className="text-[15px] font-medium leading-relaxed [&_p]:m-0"
                style={{ color: C.text }}
              />
            )}
          </div>
        </div>
      )}

      {rightVisible && (
        <div
          className="h-full overflow-y-auto relative transition-all duration-200"
          style={{ width: rightWidth, backgroundColor: C.bg2 }}
        >
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
