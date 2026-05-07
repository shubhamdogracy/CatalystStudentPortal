/**
 * Floating SAT Math Formula Reference panel.
 * Fixed at the right side of the viewport during a math test.
 */
export default function MathReferencesPanel({ onClose }) {
  return (
    <div
      className="fixed right-4 top-[72px] z-[200] w-72 max-h-[calc(100vh-88px)] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{ border: '1px solid #374151' }}
    >
      {/* Dark header */}
      <div className="flex items-start justify-between px-4 py-3 shrink-0" style={{ background: '#111827' }}>
        <div>
          <h3 className="text-sm font-bold text-white">References</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">SAT Math Formula Sheet</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg bg-white/20 text-white hover:bg-white/30 flex items-center justify-center text-xs font-bold transition-colors mt-0.5"
        >
          ✕
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">

        {/* Area */}
        <div>
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Area</p>
          <div className="grid grid-cols-3 gap-2">
            {/* Circle */}
            <div className="text-center bg-white rounded-xl p-2 border border-gray-100">
              <svg viewBox="0 0 40 40" className="w-8 h-8 mx-auto mb-1">
                <circle cx="20" cy="20" r="14" fill="none" stroke="#374151" strokeWidth="1.5"/>
                <line x1="20" y1="20" x2="34" y2="20" stroke="#374151" strokeWidth="1.5"/>
                <text x="28" y="18" fontSize="6" fill="#374151" textAnchor="middle">r</text>
              </svg>
              <p className="text-[9px] font-bold text-gray-700">A = πr²</p>
              <p className="text-[9px] text-gray-500">C = 2πr</p>
            </div>
            {/* Rectangle */}
            <div className="text-center bg-white rounded-xl p-2 border border-gray-100">
              <svg viewBox="0 0 40 40" className="w-8 h-8 mx-auto mb-1">
                <rect x="4" y="12" width="32" height="18" fill="none" stroke="#374151" strokeWidth="1.5"/>
                <text x="20" y="10" fontSize="6" fill="#374151" textAnchor="middle">ℓ</text>
                <text x="37" y="23" fontSize="6" fill="#374151" textAnchor="middle">w</text>
              </svg>
              <p className="text-[9px] font-bold text-gray-700">A = ℓw</p>
            </div>
            {/* Triangle */}
            <div className="text-center bg-white rounded-xl p-2 border border-gray-100">
              <svg viewBox="0 0 40 40" className="w-8 h-8 mx-auto mb-1">
                <polygon points="20,5 4,35 36,35" fill="none" stroke="#374151" strokeWidth="1.5"/>
                <line x1="20" y1="5" x2="20" y2="35" stroke="#374151" strokeWidth="1" strokeDasharray="2,2"/>
                <text x="23" y="22" fontSize="5.5" fill="#374151">h</text>
                <text x="20" y="41" fontSize="6" fill="#374151" textAnchor="middle">b</text>
              </svg>
              <p className="text-[9px] font-bold text-gray-700">A = ½bh</p>
            </div>
          </div>
        </div>

        {/* Pythagorean Theorem */}
        <div>
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Pythagorean Theorem</p>
          <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
            <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0">
              <polygon points="6,38 38,38 6,10" fill="none" stroke="#374151" strokeWidth="1.5"/>
              <rect x="6" y="30" width="8" height="8" fill="none" stroke="#374151" strokeWidth="1"/>
              <text x="22" y="44" fontSize="6" fill="#374151" textAnchor="middle">a</text>
              <text x="2" y="25" fontSize="6" fill="#374151" textAnchor="middle">b</text>
              <text x="25" y="26" fontSize="6" fill="#374151" textAnchor="middle">c</text>
            </svg>
            <p className="text-sm font-bold text-gray-800">c² = a² + b²</p>
          </div>
        </div>

        {/* Special Right Triangles */}
        <div>
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Special Right Triangles</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
              <p className="text-[10px] font-bold text-gray-700 mb-1">30°-60°-90°</p>
              <p className="text-[9px] text-gray-600">x · x√3 · 2x</p>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-gray-100 text-center">
              <p className="text-[10px] font-bold text-gray-700 mb-1">45°-45°-90°</p>
              <p className="text-[9px] text-gray-600">x · x · x√2</p>
            </div>
          </div>
        </div>

        {/* Volume */}
        <div>
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Volume</p>
          <div className="space-y-1.5">
            {[
              { label: 'Rectangular Prism', formula: 'V = ℓwh' },
              { label: 'Cylinder',          formula: 'V = πr²h' },
              { label: 'Sphere',            formula: 'V = ⁴⁄₃πr³' },
              { label: 'Cone',              formula: 'V = ⅓πr²h' },
              { label: 'Pyramid',           formula: 'V = ⅓ℓwh' },
            ].map(({ label, formula }) => (
              <div key={label} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
                <span className="text-[10px] text-gray-500">{label}</span>
                <span className="text-[11px] font-bold text-gray-800">{formula}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Facts */}
        <div>
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Key Facts</p>
          <div className="bg-white rounded-xl p-3 border border-gray-100 space-y-1.5">
            <p className="text-[10px] text-gray-600">• A circle contains 360°</p>
            <p className="text-[10px] text-gray-600">• A circle contains 2π radians</p>
            <p className="text-[10px] text-gray-600">• The angles of a triangle sum to 180°</p>
          </div>
        </div>
      </div>
    </div>
  );
}
