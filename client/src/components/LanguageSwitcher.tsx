import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const LANGS = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LANGS.find(l => l.code === i18n.language) || LANGS[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-brand-light hover:bg-brand-terracotta-light/40 border border-brand-terracotta-light/20 text-brand-brown-dark text-sm font-medium transition cursor-pointer"
      >
        <Globe size={15} className="text-brand-brown-light" />
        <span className="hidden sm:inline">{current.flag} {!compact && current.label}</span>
        <span className="sm:hidden">{current.flag}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-brand-terracotta-light/20 overflow-hidden z-[100] min-w-[150px]">
          {LANGS.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition cursor-pointer hover:bg-brand-light text-left ${
                lang.code === i18n.language
                  ? 'bg-brand-terracotta/10 text-brand-terracotta font-bold'
                  : 'text-brand-brown-dark'
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              {lang.label}
              {lang.code === i18n.language && <span className="ml-auto text-brand-terracotta text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
