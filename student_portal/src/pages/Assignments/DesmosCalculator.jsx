import { useEffect, useRef, useState } from 'react';

const DESMOS_SRC =
  'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';

/** Lazily injects the Desmos <script> once and resolves when window.Desmos is ready. */
function ensureDesmos() {
  return new Promise((resolve, reject) => {
    if (window.Desmos) { resolve(window.Desmos); return; }

    let script = document.querySelector('[data-desmos-api]');
    if (!script) {
      script = document.createElement('script');
      script.src = DESMOS_SRC;
      script.setAttribute('data-desmos-api', '1');
      document.head.appendChild(script);
    }

    // Already in flight — wait for it
    script.addEventListener('load',  () => resolve(window.Desmos), { once: true });
    script.addEventListener('error', () => reject(new Error('Desmos failed to load')), { once: true });
  });
}

/**
 * Floating, draggable Desmos Graphing Calculator.
 * Shown at the top-right while a student is attempting a Math practice.
 *
 * Props:
 *   onClose – callback to hide the calculator
 */
export default function DesmosCalculator({ onClose }) {
  const containerRef = useRef(null);
  const calcRef      = useRef(null);
  const [ready,     setReady]     = useState(!!window.Desmos);
  const [loadError, setLoadError] = useState(false);

  // Drag state
  const [pos,   setPos]   = useState({ x: window.innerWidth - 430, y: 70 });
  const dragging  = useRef(false);
  const dragDelta = useRef({ ox: 0, oy: 0 });

  // ── Load Desmos script if not yet available ──────────────────
  useEffect(() => {
    if (window.Desmos) return; // already ready — state was initialised correctly
    ensureDesmos().then(() => setReady(true)).catch(() => setLoadError(true));
  }, []);

  // ── Initialise / destroy calculator instance ─────────────────
  useEffect(() => {
    if (!ready || !containerRef.current || calcRef.current) return;

    calcRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
      keypad:       true,
      expressions:  true,
      settingsMenu: false,
      zoomButtons:  true,
      border:       false,
    });

    return () => {
      calcRef.current?.destroy();
      calcRef.current = null;
    };
  }, [ready]);

  // ── Drag listeners ───────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - dragDelta.current.ox, y: e.clientY - dragDelta.current.oy });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  const onDragStart = (e) => {
    e.preventDefault();
    dragging.current = true;
    dragDelta.current = { ox: e.clientX - pos.x, oy: e.clientY - pos.y };
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div
      style={{
        position:   'fixed',
        top:        pos.y,
        left:       pos.x,
        zIndex:     9999,
        width:      420,
        userSelect: 'none',
      }}
      className="rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-gray-200 overflow-hidden"
    >
      {/* ── Drag handle / title bar ── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 cursor-move select-none"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        onMouseDown={onDragStart}
      >
        <span className="text-xs font-bold text-white flex items-center gap-2">
          📈 <span>Desmos Graphing Calculator</span>
        </span>
        <button
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-[10px] font-black transition-colors"
          title="Close calculator"
        >
          ✕
        </button>
      </div>

      {/* ── Loading / error states ── */}
      {loadError && (
        <div className="flex flex-col items-center justify-center h-80 bg-white text-center px-6 gap-2">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm font-semibold text-gray-600">Could not load Desmos</p>
          <p className="text-xs text-gray-400">Please check your internet connection.</p>
        </div>
      )}

      {!ready && !loadError && (
        <div className="flex items-center justify-center h-80 bg-white">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {/* ── Desmos mount target ── */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: 390, display: loadError ? 'none' : 'block' }}
      />
    </div>
  );
}
