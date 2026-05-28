import React, { useState, useEffect } from 'react';

interface GuestJoinModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  defaultName: string;
  onOpenAuthModal: () => void;
}

export default function GuestJoinModal({
  open,
  onClose,
  onSubmit,
  defaultName,
  onOpenAuthModal,
}: GuestJoinModalProps) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (open) {
      setName(defaultName);
    }
  }, [open, defaultName]);

  if (!open) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl border border-brand-terracotta-light/10 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="font-display text-xl font-black text-brand-brown-dark">Vào phòng học</h2>
        <p className="mt-1.5 text-sm font-semibold text-brand-brown-light">
          Nhập tên hiển thị của bạn để tham gia phòng
        </p>
        <form onSubmit={handleFormSubmit} className="mt-5 flex flex-col gap-3">
          <input
            autoFocus
            type="text"
            placeholder="Tên của bạn..."
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            className="w-full rounded-2xl border border-black/[0.1] bg-brand-light px-4 py-3 text-sm font-bold text-brand-brown-dark outline-none focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-black/[0.08] bg-white py-3 text-sm font-black text-brand-brown-light transition hover:bg-brand-light cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 rounded-2xl bg-brand-terracotta py-3 text-sm font-black text-white shadow-md shadow-brand-terracotta/20 transition hover:bg-brand-brown-dark cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
            >
              Vào phòng →
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-xs font-semibold text-brand-brown-light">
          Hoặc{' '}
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="font-black text-brand-terracotta underline underline-offset-2 cursor-pointer"
          >
            đăng nhập
          </button>
          {' '}để lưu lịch sử phòng
        </p>
      </div>
    </div>
  );
}
