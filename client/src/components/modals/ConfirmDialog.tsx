
interface ConfirmDialogProps {
  open: boolean;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  message,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Huỷ',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-[0_24px_64px_rgba(76,55,49,0.18)] overflow-hidden animate-fade-in-up border border-brand-terracotta-light/10">
        <div className="h-1 w-full bg-gradient-to-r from-brand-terracotta to-brand-brown-dark" />
        <div className="px-6 pt-5 pb-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </div>
          <p className="text-[15px] font-bold text-brand-brown-dark leading-snug">{message}</p>
          {description && (
            <p className="mt-1.5 text-xs text-brand-brown-light leading-normal">{description}</p>
          )}
          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-10 rounded-xl border border-brand-terracotta-light/30 bg-brand-light text-sm font-black text-brand-brown-dark hover:bg-brand-terracotta-light/20 transition active:scale-95 cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 h-10 rounded-xl bg-red-500 text-sm font-black text-white hover:bg-red-600 transition active:scale-95 shadow-md shadow-red-500/20 cursor-pointer"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
