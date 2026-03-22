// src/components/Modal.jsx
export default function Modal({ open, onClose, title, children, footer }) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50">
        {/* backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        {/* dialog */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#243044]  bg-[#1a2536]  shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#243044] ">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#141c27]"
                aria-label="Chiudi"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4">{children}</div>
            {footer && (
              <div className="px-5 py-3 border-t border-[#243044]  flex justify-end gap-2">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }