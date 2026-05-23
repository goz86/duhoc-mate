import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const LANGS = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
] as const

type LangCode = (typeof LANGS)[number]['code']

const normalizeLanguage = (language?: string): LangCode => {
  const code = language?.split('-')[0]
  return LANGS.some(lang => lang.code === code) ? (code as LangCode) : 'vi'
}

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const activeLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language)
  const current = LANGS.find(lang => lang.code === activeLanguage) || LANGS[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const changeLanguage = (code: LangCode) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/[0.08] bg-white px-3 py-2 text-sm font-extrabold text-brand-brown-dark shadow-sm transition hover:border-brand-terracotta-light hover:bg-brand-light cursor-pointer"
      >
        <Globe size={15} className="shrink-0 text-brand-brown-light" />
        <span className="hidden sm:inline">{!compact ? current.label : current.label.slice(0, 2).toUpperCase()}</span>
        <span className="sm:hidden">{current.label.slice(0, 2).toUpperCase()}</span>
        <ChevronDown size={13} className={`text-brand-brown-light transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Chọn ngôn ngữ"
          className="absolute right-0 top-full z-[100] mt-2 min-w-[170px] overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-1.5 shadow-[0_18px_45px_rgba(76,55,49,0.14)]"
        >
          {LANGS.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              role="option"
              aria-selected={lang.code === activeLanguage}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-extrabold transition cursor-pointer ${
                lang.code === activeLanguage
                  ? 'bg-[#fbf6ef] text-brand-terracotta'
                  : 'text-brand-brown-dark'
              }`}
            >
              <Globe size={14} className="text-brand-brown-light" />
              <span className="flex-1">{lang.label}</span>
              {lang.code === activeLanguage && <Check size={14} className="text-brand-terracotta" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
