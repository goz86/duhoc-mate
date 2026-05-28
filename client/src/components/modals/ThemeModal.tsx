
interface RoomThemeOption {
  key: 'cream' | 'midnight' | 'sakura' | 'ocean' | 'forest' | 'sunset' | 'neon' | 'arctic';
  label: string;
  icon: string;
}

interface ThemeModalProps {
  open: boolean;
  onClose: () => void;
  currentTheme: string;
  themeOptions: readonly RoomThemeOption[];
  onSelectTheme: (themeKey: 'cream' | 'midnight' | 'sakura' | 'ocean' | 'forest' | 'sunset' | 'neon' | 'arctic') => void;
}

export default function ThemeModal({
  open,
  onClose,
  currentTheme,
  themeOptions,
  onSelectTheme,
}: ThemeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-brand-terracotta-light/10">
        <h2 className="font-display text-xl font-black text-brand-brown-dark">Chọn giao diện phòng</h2>
        <p className="mt-1.5 text-sm font-semibold text-brand-brown-light leading-relaxed">
          Lựa chọn tông màu sắc phù hợp với không gian học của bạn.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          {themeOptions.map((theme) => {
            const isSelected = currentTheme === theme.key;
            return (
              <button
                key={theme.key}
                type="button"
                onClick={() => {
                  onSelectTheme(theme.key);
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition text-left cursor-pointer active:scale-98 ${
                  isSelected
                    ? 'border-brand-terracotta bg-brand-light text-brand-brown-dark font-black'
                    : 'border-black/[0.06] hover:border-brand-terracotta-light/40 text-brand-brown-light font-bold bg-white'
                }`}
              >
                <span className="w-8 h-8 rounded-full bg-brand-terracotta-light/30 flex items-center justify-center font-display font-extrabold text-xs text-brand-terracotta uppercase shrink-0">
                  {theme.icon}
                </span>
                <span className="text-sm truncate">{theme.label}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 rounded-2xl border border-black/[0.08] bg-white py-3 text-sm font-black text-brand-brown-light transition hover:bg-brand-light cursor-pointer"
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}
