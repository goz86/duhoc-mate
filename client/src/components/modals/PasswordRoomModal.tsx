import React, { useState, useEffect } from 'react';

interface PasswordRoomModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  error: string;
}

export default function PasswordRoomModal({
  open,
  onClose,
  onSubmit,
  error,
}: PasswordRoomModalProps) {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) {
      setPassword('');
    }
  }, [open]);

  if (!open) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-brand-terracotta-light/10">
        <h2 className="font-display text-xl font-black text-brand-brown-dark">Nhập mật khẩu phòng</h2>
        <p className="mt-1.5 text-sm font-semibold text-brand-brown-light">
          Phòng này đã được thiết lập riêng tư. Vui lòng nhập mật khẩu để tham gia.
        </p>
        <form onSubmit={handleFormSubmit} className="mt-5 flex flex-col gap-3">
          <input
            autoFocus
            type="password"
            placeholder="Mật khẩu..."
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-black/[0.1] bg-brand-light px-4 py-3 text-sm font-bold text-brand-brown-dark outline-none focus:border-brand-terracotta focus:ring-2 focus:ring-brand-terracotta/20"
          />
          {error && (
            <p className="text-xs font-bold text-brand-terracotta">{error}</p>
          )}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-black/[0.08] bg-white py-3 text-sm font-black text-brand-brown-light transition hover:bg-brand-light cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={!password.trim()}
              className="flex-1 rounded-2xl bg-brand-terracotta py-3 text-sm font-black text-white shadow-md shadow-brand-terracotta/20 transition hover:bg-brand-brown-dark cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
            >
              Tham gia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
