import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ChevronDown, ChevronUp, Clock, MapPin, Phone, Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { HelpPost } from '../lib/supabase'
import { repairHelpPostText } from '../lib/textEncoding'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = ['housing', 'job', 'food', 'transport', 'study', 'emergency', 'social', 'other'] as const
type Category = typeof CATEGORIES[number] | 'all'

const KOREAN_CITIES = ['Seoul', 'Busan', 'Daegu', 'Incheon', 'Gwangju', 'Daejeon', 'Suwon', 'Jeonju', 'Gyeonggi', 'Gyeongnam', 'Khác']

const CAT_COLORS: Record<string, string> = {
  housing: 'bg-blue-50 text-blue-700 border-blue-200',
  job: 'bg-violet-50 text-violet-700 border-violet-200',
  food: 'bg-orange-50 text-orange-700 border-orange-200',
  transport: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  study: 'bg-amber-50 text-amber-700 border-amber-200',
  emergency: 'bg-red-50 text-red-700 border-red-200',
  social: 'bg-pink-50 text-pink-700 border-pink-200',
  other: 'bg-gray-50 text-gray-600 border-gray-200',
}

const SAMPLE_POSTS: HelpPost[] = [
  {
    id: '1',
    user_id: 'demo',
    username: 'Minh Anh',
    title: 'Cần người đi cùng lên Cục XNC Suwon',
    content: 'Mình cần gia hạn visa lần đầu, không quen đường. Ai cũng cần thì đi chung cho vui nhé, mình biết đường 방향 sơ sơ thôi',
    category: 'transport',
    city: 'Suwon',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    contact: 'Zalo: 0912345678',
  },
  {
    id: '2',
    user_id: 'demo',
    username: 'Goz',
    title: 'Tìm bạn mua chung gia vị Việt ở Itaewon',
    content: 'Cuối tháng mình lên Itaewon mua mắm ruốc, sả, lá chanh... Ai cần gì thì nhắn mình, mình mua chung cho rẻ shipping',
    category: 'food',
    city: 'Seoul',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    contact: 'KakaoTalk: goz_kr',
  },
  {
    id: '3',
    user_id: 'demo',
    username: 'Thu Trang',
    title: 'Job làm thêm cuối tuần tại nhà hàng',
    content: 'Quán ăn Việt ở Ansan cần người phụ bàn cuối tuần. Lương 10,000원/h, chủ người Việt, thân thiện. DM mình để biết thêm',
    category: 'job',
    city: 'Gyeonggi',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    contact: 'Zalo: 0987654321',
  },
]

type QuickHelpBoardProps = {
  initialExpandedPostId?: string | null
}

export default function QuickHelpBoard({ initialExpandedPostId }: QuickHelpBoardProps = {}) {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState<HelpPost[]>(SAMPLE_POSTS)
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedPost, setExpandedPost] = useState<string | null>(null)

  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCategory, setFormCategory] = useState<typeof CATEGORIES[number]>('other')
  const [formCity, setFormCity] = useState('Seoul')
  const [formContact, setFormContact] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    if (initialExpandedPostId) {
      setExpandedPost(initialExpandedPostId)
      setTimeout(() => {
        const el = document.getElementById(`post-${initialExpandedPostId}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [initialExpandedPostId])

  const fetchPosts = async () => {
    if (!supabase) return
    try {
      const { data } = await supabase
        .from('help_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data && data.length > 0) setPosts((data as HelpPost[]).map(repairHelpPostText))
    } catch {
      // Sample data stays visible if Supabase is unavailable.
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user || !profile) return
    setLoading(true)

    const newPost: Omit<HelpPost, 'id'> = {
      user_id: user.id,
      username: profile.username,
      title: formTitle,
      content: formContent,
      category: formCategory,
      city: formCity,
      contact: formContact,
      created_at: new Date().toISOString(),
    }

    try {
      if (supabase) {
        const { data, error } = await supabase.from('help_posts').insert(newPost).select().single()
        if (!error && data) {
          setPosts(prev => [repairHelpPostText(data as HelpPost), ...prev])
        } else {
          setPosts(prev => [{ ...newPost, id: Date.now().toString() } as HelpPost, ...prev])
        }
      } else {
        setPosts(prev => [{ ...newPost, id: Date.now().toString() } as HelpPost, ...prev])
      }
    } catch {
      setPosts(prev => [{ ...newPost, id: Date.now().toString() } as HelpPost, ...prev])
    }

    setFormTitle('')
    setFormContent('')
    setFormContact('')
    setShowForm(false)
    setLoading(false)
  }

  const filtered = activeCategory === 'all' ? posts : posts.filter(post => post.category === activeCategory)

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (days > 0) return `${days} ngày ${t('help.ago')}`
    if (hours > 0) return `${hours} giờ ${t('help.ago')}`
    return 'Vừa xong'
  }

  return (
    <div className="w-full overflow-hidden rounded-3xl bg-brand-cream">
      <div className="bg-gradient-to-r from-brand-terracotta to-brand-brown-dark px-4 py-4 sm:px-8 sm:py-6 text-white">
        <h2 className="font-display text-lg sm:text-2xl font-black">{t('help.title')}</h2>
        <p className="mt-1 text-xs sm:text-sm text-white/70">{t('help.subtitle')}</p>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-4 gap-1 sm:flex sm:flex-wrap sm:gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`cursor-pointer rounded-full border px-2 py-1.5 text-[10px] sm:px-3 sm:text-xs font-bold transition ${activeCategory === 'all' ? 'border-brand-terracotta bg-brand-terracotta text-white' : 'border-brand-terracotta-light/20 bg-white text-brand-brown-light hover:bg-brand-light'}`}
            >
              {t('help.cat.all')}
            </button>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`cursor-pointer rounded-full border px-2 py-1.5 text-[10px] sm:px-3 sm:text-xs font-bold transition ${activeCategory === category ? 'border-brand-terracotta bg-brand-terracotta text-white' : 'border-brand-terracotta-light/20 bg-white text-brand-brown-light hover:bg-brand-light'}`}
              >
                {t(`help.cat.${category}`)}
              </button>
            ))}
          </div>

          {user ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full sm:w-auto sm:ml-2 flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-brand-terracotta px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-brand-brown-dark"
            >
              <Plus size={16} /> {t('help.newPost')}
            </button>
          ) : (
            <div className="text-center sm:text-left sm:ml-2 shrink-0 text-xs italic text-brand-brown-light">{t('help.noLogin')}</div>
          )}
        </div>

        {showForm && user && (
          <form onSubmit={handleSubmit} className="mb-5 space-y-2 sm:space-y-3 rounded-2xl border border-brand-terracotta-light/20 bg-white p-3 sm:p-5 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <h4 className="font-display text-sm sm:text-base font-extrabold text-brand-brown-dark">Đăng tin hỗ trợ</h4>
              <button type="button" onClick={() => setShowForm(false)} className="cursor-pointer rounded-lg p-1 hover:bg-brand-light">
                <X size={16} className="text-brand-brown-light" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="mb-1 block text-[11px] sm:text-xs font-bold uppercase text-brand-brown-light">Danh mục</label>
                <select
                  value={formCategory}
                  onChange={event => setFormCategory(event.target.value as typeof CATEGORIES[number])}
                  className="w-full rounded-xl border border-brand-terracotta-light/30 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30"
                >
                  {CATEGORIES.map(category => <option key={category} value={category}>{t(`help.cat.${category}`)}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] sm:text-xs font-bold uppercase text-brand-brown-light">Thành phố</label>
                <select
                  value={formCity}
                  onChange={event => setFormCity(event.target.value)}
                  className="w-full rounded-xl border border-brand-terracotta-light/30 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30"
                >
                  {KOREAN_CITIES.map(city => <option key={city}>{city}</option>)}
                </select>
              </div>
            </div>

            <input
              type="text"
              placeholder={t('help.titleField')}
              value={formTitle}
              onChange={event => setFormTitle(event.target.value)}
              className="w-full rounded-xl border border-brand-terracotta-light/30 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30"
              required
            />
            <textarea
              placeholder={t('help.contentField')}
              value={formContent}
              onChange={event => setFormContent(event.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-brand-terracotta-light/30 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30"
              required
            />
            <input
              type="text"
              placeholder={t('help.contactField')}
              value={formContact}
              onChange={event => setFormContact(event.target.value)}
              className="w-full rounded-xl border border-brand-terracotta-light/30 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/30"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="flex-1 cursor-pointer rounded-xl bg-brand-terracotta py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition hover:bg-brand-brown-dark disabled:opacity-60">
                {loading ? 'Đang đăng...' : t('help.submit')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="cursor-pointer rounded-xl bg-brand-light px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-brand-brown-dark transition hover:bg-brand-terracotta-light/30">
                {t('help.cancel')}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="space-y-2 py-12 text-center text-brand-brown-light">
              <AlertCircle size={32} className="mx-auto text-brand-terracotta-light/40" />
              <p className="text-sm font-semibold">{t('help.noPosts')}</p>
              <p className="text-xs">{t('help.noPostsDesc')}</p>
            </div>
          ) : (
            filtered.map(post => (
              <div key={post.id} id={`post-${post.id}`} className="group rounded-2xl border border-brand-terracotta-light/10 bg-white p-3 sm:p-4 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className={`rounded-full border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase ${CAT_COLORS[post.category] || CAT_COLORS.other}`}>
                        {t(`help.cat.${post.category}`)}
                      </span>
                      <div className="flex items-center gap-0.5 text-[11px] sm:text-xs text-brand-brown-light">
                        <MapPin size={10} /> {post.city}
                      </div>
                      <div className="flex items-center gap-0.5 text-[11px] sm:text-xs text-brand-brown-light">
                        <Clock size={10} /> {timeAgo(post.created_at)}
                      </div>
                    </div>
                    <h4 className="font-display text-xs sm:text-sm font-extrabold text-brand-brown-dark transition group-hover:text-brand-terracotta line-clamp-2">
                      {post.title}
                    </h4>
                    <p className="mt-0.5 text-[11px] sm:text-xs font-medium text-brand-brown-light">bởi {post.username}</p>
                  </div>
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="shrink-0 cursor-pointer rounded-lg p-1 sm:p-1.5 transition hover:bg-brand-light"
                  >
                    {expandedPost === post.id ? <ChevronUp size={14} className="text-brand-brown-light sm:w-4 sm:h-4" /> : <ChevronDown size={14} className="text-brand-brown-light sm:w-4 sm:h-4" />}
                  </button>
                </div>

                {expandedPost === post.id && (
                  <div className="mt-2 sm:mt-3 space-y-2 border-t border-brand-terracotta-light/10 pt-2 sm:pt-3">
                    <p className="text-xs sm:text-sm leading-relaxed text-brand-brown-dark">{post.content}</p>
                    {post.contact && (
                      <div className="flex items-center gap-2 rounded-xl bg-brand-light/50 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold text-brand-terracotta">
                        <Phone size={12} /> {t('help.contact')}: {post.contact}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
