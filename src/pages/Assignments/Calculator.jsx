import { useState, useEffect, useRef } from 'react';
import { evaluate } from 'mathjs';

const ROWS = [
  ['C', '⌫', '%',  '÷'],
  ['7', '8', '9',  '×'],
  ['4', '5', '6',  '−'],
  ['1', '2', '3',  '+'],
  ['±', '0', '.',  '='],
];

function btnStyle(btn) {
  if (btn === '=')   return 'bg-indigo-500 hover:bg-indigo-400 text-white';
  if (['÷','×','−','+'].includes(btn)) return 'bg-amber-500 hover:bg-amber-400 text-white';
  if (['C','⌫','%','±'].includes(btn)) return 'bg-slate-600 hover:bg-slate-500 text-slate-100';
  return 'bg-slate-700 hover:bg-slate-600 text-white';
}

export default function Calculator({ onClose }) {
  const [display,    setDisplay]    = useState('0');
  const [expression, setExpression] = useState('');
  const [justEvaled, setJustEvaled] = useState(false);

  // Drag
  const [pos, setPos] = useState(() => ({ x: window.innerWidth - 260, y: 76 }));
  const dragging  = useRef(false);
  const dragDelta = useRef({ ox: 0, oy: 0 });

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - dragDelta.current.ox, y: e.clientY - dragDelta.current.oy });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const onDragStart = (e) => {
    e.preventDefault();
    dragging.current = true;
    dragDelta.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y };
  };

  const press = (btn) => {
    switch (btn) {
      case 'C':
        setDisplay('0'); setExpression(''); setJustEvaled(false);
        break;

      case '⌫':
        setDisplay((p) => (p.length > 1 ? p.slice(0, -1) : '0'));
        break;

      case '=': {
        try {
          const raw = (expression + display)
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-');
          const val = evaluate(raw);
          const str = typeof val === 'number'
            ? parseFloat(val.toFixed(10)).toString()
            : String(val);
          setDisplay(str);
          setExpression('');
          setJustEvaled(true);
        } catch {
          setDisplay('Error');
          setExpression('');
          setJustEvaled(false);
        }
        break;
      }

      case '+':
      case '−':
      case '×':
      case '÷':
        setExpression((p) => (justEvaled ? display : p + display) + btn);
        setDisplay('0');
        setJustEvaled(false);
        break;

      case '%':
        setDisplay((p) => String(parseFloat(p) / 100));
        break;

      case '±':
        setDisplay((p) => (p.startsWith('-') ? p.slice(1) : p === '0' ? '0' : '-' + p));
        break;

      case '.':
        if (!display.includes('.')) {
          setDisplay((p) => (justEvaled ? '0.' : p + '.'));
          setJustEvaled(false);
        }
        break;

      default: // digits 0–9
        setDisplay((p) => (justEvaled || p === '0' ? btn : p + btn));
        setJustEvaled(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', top: pos.y, left: pos.x, zIndex: 9999, width: 228, userSelect: 'none' }}
      className="bg-slate-900 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-slate-700 overflow-hidden"
    >
      {/* ── Title bar (drag handle) ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-slate-800 cursor-move select-none"
        onMouseDown={onDragStart}
      >
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          🧮 <span>Calculator</span>
        </span>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white text-[10px] font-black transition-colors"
          title="Close calculator"
        >
          ✕
        </button>
      </div>

      {/* ── Expression + Display ── */}
      <div className="px-4 pt-3 pb-2 bg-slate-900">
        <div className="text-right text-slate-500 text-[11px] h-4 overflow-hidden leading-none">
          {expression || ' '}
        </div>
        <div
          className="text-right text-white font-bold mt-1.5 leading-none overflow-hidden"
          style={{ fontSize: display.length > 10 ? 16 : display.length > 7 ? 20 : 26 }}
        >
          {display}
        </div>
      </div>

      {/* ── Button grid ── */}
      <div className="px-3 pb-3 pt-1 grid grid-cols-4 gap-1.5">
        {ROWS.flat().map((btn, i) => (
          <button
            key={i}
            onMouseDown={(e) => e.stopPropagation()} // prevent drag when clicking buttons
            onClick={() => press(btn)}
            className={`h-12 rounded-xl text-sm font-bold transition-all active:scale-90 ${btnStyle(btn)}`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
