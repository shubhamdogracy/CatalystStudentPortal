import { useState } from 'react';
import { C } from '../../pages/Assignments/testConstants';

export default function NotesModal({ qid, notes, onAdd, onDelete, onClose }) {
  const [draft, setDraft] = useState('');
  const myNotes = notes[qid] || [];

  const handleAdd = () => {
    if (!draft.trim()) return;
    onAdd(qid, draft.trim());
    setDraft('');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" style={{ backgroundColor: C.bg2 }}>
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: C.bg1, background: 'linear-gradient(135deg, #f0f7f0, #f9fdf9)' }}
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

        <div className="p-5 space-y-2 max-h-56 overflow-y-auto" style={{ backgroundColor: C.bg2 }}>
          {myNotes.length === 0 ? (
            <p className="text-[12px] text-center py-4" style={{ color: `${C.text}66` }}>
              No notes yet. Add your first note below.
            </p>
          ) : myNotes.map((note, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ backgroundColor: C.accentLight, border: `1px solid ${C.accentBorder}` }}>
              <p className="flex-1 text-[12px] leading-relaxed" style={{ color: C.text }}>{note}</p>
              <button onClick={() => onDelete(qid, i)} className="text-[11px] shrink-0 mt-0.5 hover:opacity-70 transition-opacity" style={{ color: C.textMuted }}>
                ✕
              </button>
            </div>
          ))}
        </div>

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
