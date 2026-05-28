import { X, Share2 } from 'lucide-react';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  qrCodeUrl: string;
  onCopySuccess: () => void;
}

export default function InviteModal({
  open,
  onClose,
  roomId,
  qrCodeUrl,
  onCopySuccess,
}: InviteModalProps) {
  if (!open) return null;

  const getInviteUrl = () => {
    return `${window.location.origin}${window.location.pathname}#room/${roomId}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getInviteUrl());
    onCopySuccess();
  };

  const handleShareLink = () => {
    navigator.share?.({
      title: 'Duhoc Mate',
      text: `Vào phòng học ${roomId}`,
      url: getInviteUrl(),
    }).catch(err => {
      console.warn('Share API not supported or failed:', err);
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-brand-terracotta-light/10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black text-brand-brown-dark">Mới bạn bè</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-brand-brown-light transition hover:bg-brand-light cursor-pointer"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 rounded-3xl border border-brand-terracotta-light/25 bg-brand-light/35 p-5 text-center">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt="QR mời vào phòng"
              className="mx-auto h-56 w-56 rounded-2xl bg-white p-3 shadow-sm border border-brand-terracotta-light/10"
            />
          ) : (
            <div className="mx-auto h-56 w-56 rounded-2xl bg-white p-3 flex items-center justify-center text-brand-brown-light text-xs font-bold animate-pulse shadow-sm border border-brand-terracotta-light/10">
              Đang tạo mã QR...
            </div>
          )}
        </div>
        <div className="mt-5 text-center">
          <p className="text-xs font-bold text-brand-brown-light">Mã phòng</p>
          <p className="mt-2 font-mono text-3xl font-black tracking-[0.28em] text-brand-brown-dark select-all">{roomId}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 rounded-2xl bg-brand-terracotta py-3 text-sm font-black text-white shadow-md shadow-brand-terracotta/20 transition hover:bg-brand-brown-dark cursor-pointer active:scale-98"
          >
            Copy link
          </button>
          <button
            type="button"
            onClick={handleShareLink}
            className="rounded-2xl border border-brand-terracotta-light/25 bg-white px-4 text-brand-brown-dark transition hover:bg-brand-light cursor-pointer active:scale-98"
            aria-label="Chia sẻ"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
