import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Mail, Lock, User, MapPin, Coffee, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register'
}

const KOREAN_CITIES = [
  'Seoul (서울)', 'Busan (부산)', 'Daegu (대구)', 'Incheon (인천)',
  'Gwangju (광주)', 'Daejeon (대전)', 'Suwon (수원)', 'Jeonju (전주)',
  'Gyeonggi (경기)', 'Gyeongnam (경남)', 'Khác'
]

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const { t } = useTranslation()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) {
          setError(error.message === 'Invalid login credentials'
            ? 'Email hoặc mật khẩu không đúng.'
            : t('auth.error'))
        } else {
          setSuccess(t('auth.loginSuccess'))
          setTimeout(onClose, 1200)
        }
      } else {
        if (!username.trim()) { setError('Vui lòng nhập tên hiển thị.'); setLoading(false); return }
        const { error } = await signUp(email, password, username.trim(), city)
        if (error) {
          setError(error.message === 'User already registered'
            ? 'Email này đã được đăng ký.'
            : t('auth.error'))
        } else {
          setSuccess(t('auth.registerSuccess'))
          setTimeout(onClose, 1500)
        }
      }
    } catch {
      setError(t('auth.error'))
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-brand-cream rounded-3xl shadow-2xl w-full max-w-md border border-white/80 overflow-hidden">
        {/* Decorative top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-terracotta via-brand-accent to-brand-terracotta-light" />

        <div className="p-8">
          {/* Close */}
          <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-brand-light transition cursor-pointer">
            <X size={18} className="text-brand-brown-light" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-terracotta flex items-center justify-center text-white shadow-md">
              <Coffee size={20} />
            </div>
            <span className="font-display font-extrabold text-xl text-brand-brown-dark">Duhoc Mate</span>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="font-display font-black text-2xl text-brand-brown-dark">
              {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
            </h2>
            <p className="text-sm text-brand-brown-light mt-1">
              {mode === 'login' ? t('auth.loginSubtitle') : t('auth.registerSubtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase text-brand-brown-light mb-1.5">{t('auth.username')}</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown-light/60" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Goz, Minh Anh..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-terracotta-light/40 bg-white focus:outline-none focus:ring-2 focus:ring-brand-terracotta/40 text-brand-brown-dark text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-brand-brown-light mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown-light/60" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-terracotta-light/40 bg-white focus:outline-none focus:ring-2 focus:ring-brand-terracotta/40 text-brand-brown-dark text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-brand-brown-light mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown-light/60" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-terracotta-light/40 bg-white focus:outline-none focus:ring-2 focus:ring-brand-terracotta/40 text-brand-brown-dark text-sm"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase text-brand-brown-light mb-1.5">{t('auth.city')}</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown-light/60" />
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-terracotta-light/40 bg-white focus:outline-none focus:ring-2 focus:ring-brand-terracotta/40 text-brand-brown-dark text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Chọn thành phố...</option>
                    {KOREAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Error/Success messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle size={15} /> {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm text-center font-semibold">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-brand-terracotta hover:bg-brand-brown-dark text-white font-bold text-base transition shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                mode === 'login' ? t('auth.loginBtn') : t('auth.registerBtn')
              )}
            </button>
          </form>

          {/* Switch mode */}
          <div className="mt-5 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
              className="text-sm text-brand-terracotta hover:text-brand-brown-dark font-semibold transition cursor-pointer"
            >
              {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
            </button>
          </div>

          <div className="mt-3 text-center">
            <button onClick={onClose} className="text-xs text-brand-brown-light/70 hover:text-brand-brown-light transition cursor-pointer">
              {t('auth.guestNote')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
