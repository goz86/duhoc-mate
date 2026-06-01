
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type RoomThemeKey = 'cream' | 'midnight' | 'garden' | 'ocean';

interface RoomThemeOption {
  key: RoomThemeKey;
  label: string;
  description: string;
  swatches: readonly string[];
}

interface ThemeModalProps {
  open: boolean;
  onClose: () => void;
  currentTheme: RoomThemeKey;
  themeOptions: readonly RoomThemeOption[];
  onSelectTheme: (themeKey: RoomThemeKey) => void;
}

export default function ThemeModal({
  open,
  onClose,
  currentTheme,
  themeOptions,
  onSelectTheme,
}: ThemeModalProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-md">
      <div className="w-full max-w-[460px] rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_28px_80px_rgba(52,39,33,0.26)] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-black text-brand-brown-dark">{t('theme.title')}</h2>
            <p className="mt-1.5 text-sm font-semibold leading-relaxed text-brand-brown-light">
              {t('theme.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/[0.06] bg-brand-light text-sm font-black text-brand-brown-light transition hover:bg-white"
            aria-label={t('theme.cancel')}
          >
            ×
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {themeOptions.map((theme) => {
            const isSelected = currentTheme === theme.key;
            return (
              <button
                key={theme.key}
                type="button"
                onClick={() => {
                  onSelectTheme(theme.key);
                }}
                className={`group relative min-h-[104px] overflow-hidden rounded-2xl border p-4 text-left transition cursor-pointer active:scale-[0.99] ${
                  isSelected
                    ? 'border-brand-terracotta bg-brand-light shadow-[0_16px_36px_rgba(166,111,92,0.18)]'
                    : 'border-black/[0.07] bg-white hover:border-brand-terracotta-light/60 hover:bg-brand-light/35'
                }`}
              >
                <span className="mb-4 flex items-center gap-1.5">
                  {theme.swatches.map((color) => (
                    <span
                      key={color}
                      className="h-6 w-6 rounded-full border border-white shadow-sm ring-1 ring-black/[0.04]"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
                <span className="block text-sm font-black text-brand-brown-dark">{theme.label}</span>
                <span className="mt-1 block text-xs font-bold leading-snug text-brand-brown-light">{theme.description}</span>
                {isSelected && (
                  <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-brand-terracotta text-white shadow-sm">
                    <Check size={15} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl border border-black/[0.08] bg-white py-3 text-sm font-black text-brand-brown-light transition hover:bg-brand-light cursor-pointer"
        >
          {t('theme.cancel')}
        </button>
      </div>
    </div>
  );
}
