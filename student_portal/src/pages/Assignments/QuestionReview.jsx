const formatTime = (mins) => (!mins && mins !== 0) ? '—' : `${mins}m`;

export default function QuestionReview({ assignModule, moduleResult, activeModule, meta }) {
  if (!assignModule || assignModule.questions.length === 0) {
    return <div className="text-center py-12 text-gray-400 text-sm">No questions in this module.</div>;
  }

  return (
    <div className="p-5 space-y-3">
      {moduleResult && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm" style={{ background: meta.bg }}>
          <span style={{ color: meta.accent }} className="font-bold">Module {activeModule}</span>
          <span className="text-gray-500 text-xs">
            ⏱ {formatTime(moduleResult.timeTaken)} / {formatTime(assignModule.timeLimit)} used
          </span>
          <span className="text-gray-500 text-xs">⭐ {moduleResult.score} / {moduleResult.maxScore} pts</span>
          <span className="text-gray-500 text-xs">{assignModule.questions.length} questions</span>
        </div>
      )}

      {assignModule.questions.map((q, idx) => {
        const primaryKey    = q.qid || q.id;
        const fallbackKey   = q.id  || q.qid;
        const studentAnswer = moduleResult?.answers?.[primaryKey] ?? moduleResult?.answers?.[fallbackKey];
        const isCorrect     = studentAnswer === q.correctAnswer;
        const notAnswered   = !studentAnswer;

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
                  if      (isStudentAnswer && isAnswerKey)  { bg = '#f0fdf4'; border = '#6ee7b7'; color = '#065f46'; }
                  else if (isStudentAnswer && !isAnswerKey) { bg = '#fff1f2'; border = '#fca5a5'; color = '#991b1b'; }
                  else if (!isStudentAnswer && isAnswerKey) { bg = '#f0fdf4'; border = '#a7f3d0'; color = '#065f46'; }
                  return (
                    <div key={letter} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border"
                         style={{ background: bg, borderColor: border }}>
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-extrabold shrink-0"
                           style={{ background: border, color }}>
                        {letter}
                      </div>
                      <span className="text-[13px] flex-1" style={{ color }}>{q.choices?.[letter] || '—'}</span>
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
    </div>
  );
}
