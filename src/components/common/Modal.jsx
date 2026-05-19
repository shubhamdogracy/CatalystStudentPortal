import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, footer, maxWidth = 500 }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-5"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-7 w-full shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] border-none bg-slate-100 rounded-md flex items-center justify-center cursor-pointer text-slate-500 transition-all hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        {children}

        {footer && (
          <div className="flex gap-2.5 justify-end mt-6">{footer}</div>
        )}
      </div>
    </div>
  );
}
