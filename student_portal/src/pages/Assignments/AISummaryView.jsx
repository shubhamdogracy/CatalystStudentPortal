export default function AISummaryView({ aiData, onDownload }) {
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
